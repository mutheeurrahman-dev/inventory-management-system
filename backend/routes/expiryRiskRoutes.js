// ============================================================
//  Expiry Risk Routes
// ============================================================

const express = require("express");
const router  = express.Router();
const { getExpiryRisk } = require("../controllers/expiryRiskController");

router.get("/", getExpiryRisk);

module.exports = router;
