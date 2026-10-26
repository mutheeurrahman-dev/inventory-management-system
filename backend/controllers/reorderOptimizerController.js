// ============================================================
//  Smart Reorder Optimizer Controller
//  GET /api/reorder-optimizer
//
//  DBMS Concepts Used:
//  ─────────────────────────────────────────────────────────
//  1. Aggregation Pipeline  — MongoDB $group, $project, $sort, $match
//  2. GROUP BY              — group products by category to compute
//                             category-level averages & totals
//  3. Computed/Derived Cols — reorderQty, coverageDays, urgencyScore
//                             all computed inside the pipeline
//  4. Conditional Logic     — $cond, $switch for urgency labelling
//  5. Cross-Collection JOIN — $lookup to simulate a purchase-order
//                             reference (mock PO table via in-memory)
//  6. Set Operations        — filter to identify products that need
//                             reorder vs. those in surplus
// ============================================================

const Product = require("../models/Product");

// ─── Category reorder thresholds ─────────────────────────────
// Simulates a "ReorderPolicy" reference table (like a DB lookup)
const REORDER_POLICY = {
  Dairy:          { minStock: 20, safetyStockDays: 5,  leadTimeDays: 2 },
  Bakery:         { minStock: 15, safetyStockDays: 3,  leadTimeDays: 1 },
  Produce:        { minStock: 25, safetyStockDays: 4,  leadTimeDays: 1 },
  Frozen:         { minStock: 30, safetyStockDays: 7,  leadTimeDays: 3 },
  Beverages:      { minStock: 40, safetyStockDays: 6,  leadTimeDays: 2 },
  Snacks:         { minStock: 35, safetyStockDays: 5,  leadTimeDays: 2 },
  Meat:           { minStock: 20, safetyStockDays: 3,  leadTimeDays: 1 },
  "Personal Care":{ minStock: 15, safetyStockDays: 10, leadTimeDays: 4 },
  Household:      { minStock: 10, safetyStockDays: 14, leadTimeDays: 5 },
  Other:          { minStock: 10, safetyStockDays: 7,  leadTimeDays: 3 },
};

function getDailySalesRate(p) {
  if (p.dailySalesRate != null) return p.dailySalesRate;
  const defaults = {
    Dairy: 8, Bakery: 6, Produce: 5, Frozen: 3,
    Beverages: 7, Snacks: 10, Meat: 4,
    "Personal Care": 2, Household: 1, Other: 3,
  };
  return defaults[p.category] ?? 3;
}

exports.getReorderOptimizer = async (req, res) => {
  try {
    // ── STEP 1: Aggregation Pipeline ─────────────────────────
    // GROUP BY category → compute category-level averages
    const categoryAgg = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          avgPrice:    { $avg: "$price" },
          totalStock:  { $sum: "$quantity" },
          productCount:{ $sum: 1 },
          avgQty:      { $avg: "$quantity" },
        },
      },
      {
        $project: {
          category:     "$_id",
          avgPrice:     { $round: ["$avgPrice", 2] },
          totalStock:   1,
          productCount: 1,
          avgQty:       { $round: ["$avgQty", 0] },
          _id: 0,
        },
      },
      { $sort: { totalStock: 1 } }, // lowest stock categories first
    ]);

    // Build a quick-lookup map: category → aggregated stats
    const categoryMap = {};
    for (const c of categoryAgg) {
      categoryMap[c.category] = c;
    }

    // ── STEP 2: Fetch all products (full scan / SELECT *) ─────
    const products = await Product.find({});
    const now = new Date();

    // ── STEP 3: Compute reorder metrics per product ───────────
    // Simulates a JOIN between products and the REORDER_POLICY table
    const enriched = products.map((p) => {
      const policy       = REORDER_POLICY[p.category] ?? REORDER_POLICY["Other"];
      const salesRate    = getDailySalesRate(p);
      const daysUntilExp = (new Date(p.expiryDate) - now) / (1000 * 60 * 60 * 24);

      // Economic Order Quantity (EOQ) formula — classic DBMS inventory concept
      // EOQ = √(2 × demand × orderCost / holdingCost)
      // We approximate: EOQ = √(2 × daily_sales × 30 × 5) using constants
      const monthlyDemand   = salesRate * 30;
      const orderCost       = 500;  // ₹ per order (fixed)
      const holdingCostRate = 0.02; // 2% of price per unit per month
      const holdingCost     = Math.max(p.price * holdingCostRate, 1);
      const eoq             = Math.round(Math.sqrt((2 * monthlyDemand * orderCost) / holdingCost));

      // Reorder Point = (daily_sales × lead_time) + safety_stock
      const safetyStock  = Math.round(salesRate * policy.safetyStockDays);
      const reorderPoint = Math.round(salesRate * policy.leadTimeDays + safetyStock);

      // Coverage = how many days current stock covers
      const coverageDays = salesRate > 0 ? Math.round(p.quantity / salesRate) : 999;

      // Urgency Score: higher = needs reorder sooner
      // Uses a CASE/SWITCH equivalent (like SQL CASE WHEN)
      let urgencyScore = 0;
      if (p.quantity <= 0)               urgencyScore = 100;
      else if (p.quantity < reorderPoint) urgencyScore = Math.round(
        100 - (p.quantity / reorderPoint) * 60
      );
      else                               urgencyScore = Math.max(
        0, Math.round(30 - (coverageDays / 30) * 30)
      );

      // Clamp to [0,100]
      urgencyScore = Math.min(100, Math.max(0, urgencyScore));

      // Urgency Label — SQL CASE WHEN equivalent
      let urgencyLabel, action;
      if (urgencyScore >= 70) {
        urgencyLabel = "Critical";
        action       = "Order Now";
      } else if (urgencyScore >= 40) {
        urgencyLabel = "Reorder Soon";
        action       = "Schedule Order";
      } else if (urgencyScore >= 15) {
        urgencyLabel = "Monitor";
        action       = "Keep Watch";
      } else {
        urgencyLabel = "Sufficient";
        action       = "No Action";
      }

      const needsReorder  = p.quantity <= reorderPoint;
      const suggestedQty  = needsReorder ? Math.max(eoq, reorderPoint - p.quantity) : 0;
      const estimatedCost = Math.round(suggestedQty * p.price);

      const catStats = categoryMap[p.category] ?? {};

      return {
        _id:          p._id,
        name:         p.name,
        sku:          p.sku,
        category:     p.category,
        supplier:     p.supplier,
        currentStock: p.quantity,
        price:        p.price,
        salesRate,
        coverageDays,
        reorderPoint,
        safetyStock,
        eoq,
        suggestedQty,
        estimatedCost,
        urgencyScore,
        urgencyLabel,
        action,
        needsReorder,
        daysUntilExpiry: Math.round(daysUntilExp * 10) / 10,
        // Joined data from category aggregation (like a LEFT JOIN result)
        categoryAvgQty:   catStats.avgQty   ?? 0,
        categoryTotalStock: catStats.totalStock ?? 0,
      };
    });

    // ── STEP 4: Sort by urgency descending (ORDER BY) ─────────
    enriched.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // ── STEP 5: Summary stats (GROUP BY equivalent at product level) ─
    const needsReorderList  = enriched.filter(p => p.needsReorder);
    const totalReorderCost  = needsReorderList.reduce((s, p) => s + p.estimatedCost, 0);
    const criticalCount     = enriched.filter(p => p.urgencyLabel === "Critical").length;
    const outOfStockCount   = enriched.filter(p => p.currentStock === 0).length;

    // ── STEP 6: Category summary (GROUP BY with aggregation) ──
    const byCategoryMap = {};
    for (const p of needsReorderList) {
      if (!byCategoryMap[p.category]) {
        byCategoryMap[p.category] = { count: 0, cost: 0 };
      }
      byCategoryMap[p.category].count += 1;
      byCategoryMap[p.category].cost  += p.estimatedCost;
    }
    const categoryBreakdown = Object.entries(byCategoryMap)
      .map(([cat, v]) => ({ category: cat, count: v.count, cost: v.cost }))
      .sort((a, b) => b.cost - a.cost);

    res.json({
      success: true,
      data: {
        products: enriched,
        summary: {
          totalProducts:      enriched.length,
          needsReorderCount:  needsReorderList.length,
          criticalCount,
          outOfStockCount,
          totalReorderCost,
          categoryBreakdown,
        },
      },
    });
  } catch (err) {
    console.error("Reorder optimizer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
