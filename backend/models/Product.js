// ============================================================
//  Product Model — Mongoose Schema
//  Collection: products
// ============================================================

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Human-readable product name
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    // Unique Stock Keeping Unit identifier
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Selling price in INR
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Units currently in stock
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },

    // Product category for grouping
    category: {
      type: String,
      enum: [
        "Dairy",
        "Bakery",
        "Produce",
        "Frozen",
        "Beverages",
        "Snacks",
        "Meat",
        "Personal Care",
        "Household",
        "Other",
      ],
      default: "Other",
    },

    // Supplier / vendor name
    supplier: {
      type: String,
      required: [true, "Supplier is required"],
      trim: true,
    },

    // Date after which product must not be sold
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },

    // Average units sold per day — used by Smart Expiry Predictor
    // Optional: controller falls back to category defaults if absent
    dailySalesRate: {
      type: Number,
      min: [0, "Daily sales rate cannot be negative"],
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
    versionKey: false,
  }
);

// ─── Virtual: stock status ────────────────────────────────────
productSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out_of_stock";
  if (this.quantity <= 10) return "low_stock";
  return "in_stock";
});

// ─── Virtual: expiry status ───────────────────────────────────
productSchema.virtual("expiryStatus").get(function () {
  const now  = new Date();
  const diff = (this.expiryDate - now) / (1000 * 60 * 60 * 24); // days
  if (diff < 0)  return "expired";
  if (diff <= 7) return "expiring_soon";
  return "ok";
});

productSchema.set("toJSON",   { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
