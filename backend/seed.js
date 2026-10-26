// ============================================================
//  Seed Script — Populates DB with sample EMart products
//  Run: node seed.js
// ============================================================

const mongoose = require("mongoose");
const Product  = require("./models/Product");

const MONGO_URI = "mongodb://127.0.0.1:27017/emart_inventory";

const sampleProducts = [
  { name: "Amul Full Cream Milk 1L",      sku: "DAIRY-001", price: 62,  quantity: 120, category: "Dairy",         supplier: "Amul India",           dailySalesRate: 25,  expiryDate: new Date(Date.now() + 5   * 86400000) },
  { name: "Britannia Bread Wholegrain",   sku: "BKRY-001",  price: 45,  quantity: 8,   category: "Bakery",        supplier: "Britannia Industries",  dailySalesRate: 4,   expiryDate: new Date(Date.now() + 3   * 86400000) },
  { name: "Coca-Cola 2L PET",             sku: "BEV-001",   price: 95,  quantity: 60,  category: "Beverages",     supplier: "Hindustan Coca-Cola",   dailySalesRate: 7,   expiryDate: new Date(Date.now() + 90  * 86400000) },
  { name: "Lay's Classic Salted 90g",     sku: "SNCK-001",  price: 30,  quantity: 5,   category: "Snacks",        supplier: "PepsiCo India",         dailySalesRate: 10,  expiryDate: new Date(Date.now() + 60  * 86400000) },
  { name: "Fresh Tomatoes 1kg",           sku: "PROD-001",  price: 40,  quantity: 0,   category: "Produce",       supplier: "Local Farm Co-op",      dailySalesRate: 5,   expiryDate: new Date(Date.now() + 4   * 86400000) },
  { name: "Chicken Breast Boneless 500g", sku: "MEAT-001",  price: 180, quantity: 25,  category: "Meat",          supplier: "Venky's Foods",         dailySalesRate: 4,   expiryDate: new Date(Date.now() + 2   * 86400000) },
  { name: "Colgate MaxFresh 150g",        sku: "PC-001",    price: 99,  quantity: 45,  category: "Personal Care", supplier: "Colgate-Palmolive",     dailySalesRate: 2,   expiryDate: new Date(Date.now() + 730 * 86400000) },
  { name: "Surf Excel 1kg",               sku: "HH-001",    price: 220, quantity: 30,  category: "Household",     supplier: "HUL",                   dailySalesRate: 1,   expiryDate: new Date(Date.now() + 1095 * 86400000) },
  { name: "Cornetto Chocobar",            sku: "FRZ-001",   price: 40,  quantity: 9,   category: "Frozen",        supplier: "HUL Ice Cream Div",     dailySalesRate: 3,   expiryDate: new Date(Date.now() + 180 * 86400000) },
  { name: "Parle-G Biscuits 200g",        sku: "SNCK-002",  price: 15,  quantity: 200, category: "Snacks",        supplier: "Parle Products",        dailySalesRate: 10,  expiryDate: new Date(Date.now() + 120 * 86400000) },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB");

  await Product.deleteMany({});
  console.log("🧹  Cleared existing products");

  await Product.insertMany(sampleProducts);
  console.log(`🌱  Inserted ${sampleProducts.length} sample products`);

  await mongoose.disconnect();
  console.log("✅  Seeding complete. Run the server with: npm start");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
