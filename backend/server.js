// ============================================================
//  EMart Inventory Management System — Backend Server
//  University DBMS Project
//  Stack: Node.js + Express + MongoDB (Mongoose)
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const productRoutes    = require("./routes/productRoutes");
const auditRoutes      = require("./routes/auditRoutes");
const statsRoutes      = require("./routes/statsRoutes");
const expiryRiskRoutes        = require("./routes/expiryRiskRoutes");
const reorderOptimizerRoutes  = require("./routes/reorderOptimizerRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Request Logger (visible in terminal) ────────────────────
app.use((req, _res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}]  ${req.method.padEnd(6)} ${req.originalUrl}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────
app.use("/products",    productRoutes);
app.use("/audit",       auditRoutes);
app.use("/stats",       statsRoutes);
app.use("/api/expiry-risk",        expiryRiskRoutes);
app.use("/api/reorder-optimizer", reorderOptimizerRoutes);

// Health check
app.get("/", (_req, res) =>
  res.json({ message: "EMart Inventory API is running 🚀", status: "ok" })
);

// ─── MongoDB Connection ───────────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/emart_inventory";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  ✅  MongoDB connected successfully");
    console.log(`  📦  Database : emart_inventory`);
    console.log(`  🌐  Host     : 127.0.0.1:27017`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    app.listen(PORT, () => {
      console.log(`  🚀  Server running at http://localhost:${PORT}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });

mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected")
);
