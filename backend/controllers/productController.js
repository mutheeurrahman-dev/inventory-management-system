// ============================================================
//  Product Controller
//  Handles: GET /products  |  POST /add  |  DELETE /delete/:id
// ============================================================

const Product  = require("../models/Product");
const AuditLog = require("../models/AuditLog");

// ─── GET /products ────────────────────────────────────────────
// Returns all products sorted newest-first
const getAllProducts = async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    console.log(`  📋  Fetched ${products.length} products from DB`);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    console.error("  ❌  getAllProducts error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── POST /add ────────────────────────────────────────────────
// Inserts a new product and writes an audit log
const addProduct = async (req, res) => {
  try {
    const { name, sku, price, quantity, category, supplier, expiryDate } = req.body;

    // Validation
    if (!name || !sku || price == null || quantity == null || !supplier || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, sku, price, quantity, supplier, expiryDate",
      });
    }

    const product = await Product.create({
      name,
      sku,
      price,
      quantity,
      category: category || "Other",
      supplier,
      expiryDate,
    });

    // ── Audit log entry ──
    await AuditLog.create({
      action: "ADD_PRODUCT",
      productSnapshot: product.toObject(),
      description: `Product "${product.name}" (SKU: ${product.sku}) added to inventory. Qty: ${product.quantity}, Price: ₹${product.price}`,
    });

    console.log(`  ✅  Product ADDED  → ${product.name} (${product.sku})`);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "SKU already exists" });
    }
    console.error("  ❌  addProduct error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ─── DELETE /delete/:id ───────────────────────────────────────
// Removes a product by MongoDB _id and writes an audit log
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ── Audit log BEFORE deletion (to preserve snapshot) ──
    await AuditLog.create({
      action: "DELETE_PRODUCT",
      productSnapshot: product.toObject(),
      description: `Product "${product.name}" (SKU: ${product.sku}) deleted from inventory.`,
    });

    await Product.findByIdAndDelete(id);

    console.log(`  🗑️   Product DELETED → ${product.name} (${product.sku})`);

    res.status(200).json({
      success: true,
      message: `Product "${product.name}" deleted successfully`,
    });
  } catch (err) {
    console.error("  ❌  deleteProduct error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { getAllProducts, addProduct, deleteProduct };
