// ============================================================
//  AuditLog Model — Mongoose Schema
//  Collection: auditlogs
//  Records every add / delete action for accountability
// ============================================================

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Which action was performed
    action: {
      type: String,
      enum: ["ADD_PRODUCT", "DELETE_PRODUCT", "UPDATE_PRODUCT"],
      required: true,
    },

    // Snapshot of the product at the time of the action
    productSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Human-readable summary
    description: {
      type: String,
      required: true,
    },

    // ISO timestamp (also captured by 'timestamps' below)
    performedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
