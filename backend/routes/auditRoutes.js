// ============================================================
//  Audit Log Routes
//  GET /audit      → fetch recent audit logs
// ============================================================

const express  = require("express");
const router   = express.Router();
const AuditLog = require("../models/AuditLog");

router.get("/", async (_req, res) => {
  try {
    const logs = await AuditLog.find().sort({ performedAt: -1 }).limit(50);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
