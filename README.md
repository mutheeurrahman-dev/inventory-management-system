# 🛒 EMart — Full-Stack Inventory Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

A production-grade, full-stack inventory management web application developed as an end-to-end Database Management System (DBMS) project. Features real-time stock monitoring, automated expiry-risk alerts, dynamic inventory audits, and an interactive React dashboard.

*(Includes legacy Python desktop prototype `inventory_app.py` preserved from initial development phase).*

```mermaid
flowchart TD
    User["Store Manager / Inventory Auditor"] -->|Browser Interface| Frontend

    subgraph "Frontend Layer (React 18 + Vite)"
        Frontend["React SPA (Tailwind CSS)"]
        Dashboard["Dashboard View (KPIs, Charts)"]
        InventoryView["Inventory Grid (Search, Filter, Stock Levels)"]
        AuditView["Audit Trail Log Viewer"]
        Frontend --> Dashboard
        Frontend --> InventoryView
        Frontend --> AuditView
    end

    Frontend -->|Axios REST Client (:5000)| API

    subgraph "Backend API Layer (Express.js)"
        API["Express.js Server"]
        ProdController["Product Controller (CRUD, SKU generation)"]
        StatsController["Stats Controller (Aggregation pipelines)"]
        AuditController["Audit Controller (Action tracking)"]
        API --> ProdController
        API --> StatsController
        API --> AuditController
    end

    subgraph "Database Layer (MongoDB)"
        ProdController --> ProductsCol[("Products Collection")]
        AuditController --> AuditCol[("AuditLogs Collection")]
        StatsController --> ProductsCol
    end
```

## 📁 Project Structure

```
emart/
├── backend/
│   ├── models/
│   │   ├── Product.js          ← Mongoose schema (name, price, qty, expiry, supplier, SKU)
│   │   └── AuditLog.js         ← Audit logging schema
│   ├── controllers/
│   │   ├── productController.js ← Business logic for CRUD
│   │   └── statsController.js   ← Dashboard aggregation queries
│   ├── routes/
│   │   ├── productRoutes.js    ← GET /products, POST /add, DELETE /delete/:id
│   │   ├── auditRoutes.js      ← GET /audit
│   │   └── statsRoutes.js      ← GET /stats
│   ├── server.js               ← Express app + MongoDB connection
│   ├── seed.js                 ← Sample data seeder
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/index.js         ← Axios API calls
    │   ├── components/
    │   │   ├── Sidebar.jsx      ← Navigation + DB status
    │   │   ├── StatCard.jsx     ← Reusable stat card
    │   │   ├── ProductRow.jsx   ← Table row with badges
    │   │   └── AddProductModal.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx    ← Stats + expiry risk + audit activity
    │   │   ├── Inventory.jsx    ← Full product table + search/filter
    │   │   └── AuditLog.jsx     ← Complete audit trail
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017

### 1. Start MongoDB
```bash
# macOS / Linux
mongod

# Windows
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
```

### 2. Backend
```bash
cd backend
npm install
node seed.js        # Optional: loads 10 sample products
npm start           # or: npm run dev (with nodemon)
```

**Terminal output you'll see:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  MongoDB connected successfully
  📦  Database : emart_inventory
  🌐  Host     : 127.0.0.1:27017
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀  Server running at http://localhost:5000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev         # Opens at http://localhost:5173
```

---

## 🔌 API Reference

| Method   | Endpoint              | Description                          |
|----------|-----------------------|--------------------------------------|
| `GET`    | `/products`           | Fetch all products                   |
| `POST`   | `/products/add`       | Add a new product                    |
| `DELETE` | `/products/delete/:id`| Delete product by MongoDB `_id`      |
| `GET`    | `/stats`              | Dashboard aggregation (MongoDB pipeline) |
| `GET`    | `/audit`              | Fetch audit log (last 50 entries)    |
| `GET`    | `/`                   | Health check                         |

### POST /products/add — Request Body
```json
{
  "name":       "Amul Full Cream Milk 1L",
  "sku":        "DAIRY-001",
  "price":      62,
  "quantity":   120,
  "category":   "Dairy",
  "supplier":   "Amul India",
  "expiryDate": "2025-03-10"
}
```

---

## 🗄️ MongoDB Schemas

### Product Collection
| Field       | Type   | Required | Notes                    |
|-------------|--------|----------|--------------------------|
| name        | String | ✅        |                          |
| sku         | String | ✅        | Unique, uppercase        |
| price       | Number | ✅        | In INR                   |
| quantity    | Number | ✅        | Units in stock           |
| category    | String | —         | Enum of 10 categories    |
| supplier    | String | ✅        |                          |
| expiryDate  | Date   | ✅        |                          |
| createdAt   | Date   | auto      | Mongoose timestamps      |
| updatedAt   | Date   | auto      | Mongoose timestamps      |

### AuditLog Collection
| Field           | Type   | Notes                               |
|-----------------|--------|-------------------------------------|
| action          | String | `ADD_PRODUCT` or `DELETE_PRODUCT`   |
| productSnapshot | Mixed  | Full product object at time of action |
| description     | String | Human-readable log message          |
| performedAt     | Date   | Timestamp of action                 |

---

## ✨ Features

- **Dashboard** — total products, inventory value, low/out-of-stock count, expiry risk, category chart, recent audit activity
- **Inventory** — sortable/filterable/searchable product table with status badges
- **Audit Log** — every add/delete action logged with product snapshot
- **Real-time DB indicator** — sidebar shows MongoDB connection status
- **Dark SaaS UI** — Syne + DM Sans fonts, carbon color palette, animated transitions
