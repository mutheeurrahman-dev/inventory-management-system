// ============================================================
//  Product Routes
//  GET  /products      → list all products
//  POST /add           → add new product
//  DELETE /delete/:id  → remove product by id
// ============================================================

const express = require("express");
const router  = express.Router();
const {
  getAllProducts,
  addProduct,
  deleteProduct,
} = require("../controllers/productController");

router.get("/",          getAllProducts);
router.post("/add",      addProduct);       // also reachable as POST /products/add
router.delete("/delete/:id", deleteProduct);

// Convenience alias so POST /add also works at root level (mounted separately)
module.exports = router;
