// ============================================================
//  Reorder Optimizer Routes
//  GET /api/reorder-optimizer
// ============================================================

const express = require("express");
const router  = express.Router();
const { getReorderOptimizer } = require("../controllers/reorderOptimizerController");

router.get("/", getReorderOptimizer);

module.exports = router;
