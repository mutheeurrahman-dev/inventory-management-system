// ============================================================
//  Stats Controller
//  Handles: GET /stats  →  Dashboard summary data
// ============================================================

const Product  = require("../models/Product");
const AuditLog = require("../models/AuditLog");

const getStats = async (_req, res) => {
  try {
    const now       = new Date();
    const in7Days   = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
    const in30Days  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      expiredCount,
      expiringSoonCount,
      expiringIn30Count,
      recentAuditLogs,
      categoryBreakdown,
    ] = await Promise.all([
      // Total distinct products
      Product.countDocuments(),

      // Sum of all stock units
      Product.aggregate([
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),

      // Low stock (1–10 units)
      Product.countDocuments({ quantity: { $gt: 0, $lte: 10 } }),

      // Out of stock
      Product.countDocuments({ quantity: 0 }),

      // Already expired
      Product.countDocuments({ expiryDate: { $lt: now } }),

      // Expiring within 7 days
      Product.countDocuments({ expiryDate: { $gte: now, $lte: in7Days } }),

      // Expiring within 30 days
      Product.countDocuments({ expiryDate: { $gte: now, $lte: in30Days } }),

      // Last 10 audit log entries
      AuditLog.find().sort({ performedAt: -1 }).limit(10),

      // Products per category
      Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, totalQty: { $sum: "$quantity" } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalInventoryValue = await Product.aggregate([
      { $group: { _id: null, value: { $sum: { $multiply: ["$price", "$quantity"] } } } },
    ]);

    console.log("  📊  Dashboard stats fetched");

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalUnits:      totalQuantity[0]?.total ?? 0,
        inventoryValue:  totalInventoryValue[0]?.value ?? 0,
        lowStockCount,
        outOfStockCount,
        expiredCount,
        expiringSoonCount,
        expiringIn30Days: expiringIn30Count,
        categoryBreakdown,
        recentActivity: recentAuditLogs,
      },
    });
  } catch (err) {
    console.error("  ❌  getStats error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { getStats };
