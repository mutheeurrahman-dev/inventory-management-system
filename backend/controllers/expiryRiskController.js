// ============================================================
//  Expiry Risk Controller
//  GET /api/expiry-risk
//  Computes risk scores dynamically — nothing stored in DB
// ============================================================

const Product = require("../models/Product");

// dailySalesRate is not in the DB yet, so we derive a
// realistic mock from the product category/quantity so the
// feature works end-to-end before the field is back-filled.
// Once `dailySalesRate` is persisted on the product document
// this helper is simply bypassed.
function estimateDailySalesRate(product) {
  if (product.dailySalesRate != null) return product.dailySalesRate;

  // Category-based sensible defaults (units/day)
  const defaults = {
    Dairy:          8,
    Bakery:         6,
    Produce:        5,
    Frozen:         3,
    Beverages:      7,
    Snacks:         10,
    Meat:           4,
    "Personal Care": 2,
    Household:      1,
    Other:          3,
  };
  return defaults[product.category] ?? 3;
}

exports.getExpiryRisk = async (req, res) => {
  try {
    const products = await Product.find({});

    const now = new Date();

    const enriched = products
      .map((p) => {
        const qty           = p.quantity ?? 0;
        const dailySalesRate = estimateDailySalesRate(p);
        const daysToSell    = dailySalesRate > 0 ? qty / dailySalesRate : Infinity;

        const msUntilExpiry   = new Date(p.expiryDate) - now;
        const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24);

        // Expired products get a capped risk score of 999
        const riskScore =
          daysUntilExpiry <= 0
            ? 999
            : isFinite(daysToSell)
            ? Math.round((daysToSell / daysUntilExpiry) * 100)
            : 0;

        let riskLevel, recommendation;
        if (riskScore >= 80) {
          riskLevel       = "At Risk";
          recommendation  = "Apply discount";
        } else if (riskScore >= 40) {
          riskLevel       = "Watch";
          recommendation  = "Monitor";
        } else {
          riskLevel       = "Safe";
          recommendation  = "No action needed";
        }

        return {
          _id:            p._id,
          name:           p.name,
          sku:            p.sku,
          category:       p.category,
          quantity:       qty,
          dailySalesRate,
          daysToSell:     isFinite(daysToSell) ? Math.round(daysToSell * 10) / 10 : null,
          daysUntilExpiry: Math.round(daysUntilExpiry * 10) / 10,
          riskScore,
          riskLevel,
          recommendation,
        };
      })
      // Sort highest risk first
      .sort((a, b) => b.riskScore - a.riskScore);

    // Summary stats
    const atRiskCount    = enriched.filter((p) => p.riskLevel === "At Risk").length;
    const avgRiskScore   = enriched.length
      ? Math.round(enriched.reduce((s, p) => s + Math.min(p.riskScore, 200), 0) / enriched.length)
      : 0;
    const highestRisk    = enriched[0] ?? null;

    res.json({
      success: true,
      data: {
        products: enriched,
        summary: {
          atRiskCount,
          avgRiskScore,
          highestRiskProduct: highestRisk ? highestRisk.name : "—",
          highestRiskScore:   highestRisk ? highestRisk.riskScore : 0,
          total:              enriched.length,
        },
      },
    });
  } catch (err) {
    console.error("Expiry risk error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
