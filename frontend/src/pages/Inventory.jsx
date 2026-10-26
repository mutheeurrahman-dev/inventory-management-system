import { useState } from "react";
import { Search, Plus, Package, ChevronUp, ChevronDown, SlidersHorizontal } from "lucide-react";
import ProductRow from "../components/ProductRow.jsx";

const FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock", "Expiring Soon", "Expired"];

export default function Inventory({ products, loading, onDelete, onAdd }) {
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const now = new Date();

  const filtered = products
    .filter((p) => {
      const q   = search.toLowerCase();
      const hit = p.name.toLowerCase().includes(q) ||
                  p.sku.toLowerCase().includes(q)   ||
                  p.supplier.toLowerCase().includes(q);
      if (!hit) return false;
      const days = (new Date(p.expiryDate) - now) / 86400000;
      if (filter === "In Stock")      return p.quantity > 10;
      if (filter === "Low Stock")     return p.quantity > 0 && p.quantity <= 10;
      if (filter === "Out of Stock")  return p.quantity === 0;
      if (filter === "Expiring Soon") return days >= 0 && days <= 7;
      if (filter === "Expired")       return days < 0;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const TH = ({ label, k }) => (
    <th
      onClick={() => k && toggleSort(k)}
      className="px-4 py-3 text-left"
      style={{
        background: "#f1f3f6",
        fontSize: "11px",
        fontWeight: 700,
        color: "#878787",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: "2px solid #e0e0e0",
        cursor: k ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <div className="flex items-center gap-1">
        {label}
        {k && sortKey === k && (
          sortDir === "asc"
            ? <ChevronUp size={12} style={{ color: "#2874f0" }} />
            : <ChevronDown size={12} style={{ color: "#2874f0" }} />
        )}
      </div>
    </th>
  );

  const filterColors = {
    "All":           { active: { bg: "#2874f0", color: "#fff", border: "#2874f0" } },
    "In Stock":      { active: { bg: "#388e3c", color: "#fff", border: "#388e3c" } },
    "Low Stock":     { active: { bg: "#ff9f00", color: "#fff", border: "#ff9f00" } },
    "Out of Stock":  { active: { bg: "#ff4a4a", color: "#fff", border: "#ff4a4a" } },
    "Expiring Soon": { active: { bg: "#ff6161", color: "#fff", border: "#ff6161" } },
    "Expired":       { active: { bg: "#525252", color: "#fff", border: "#525252" } },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "#2e2e2e" }}>Inventory</h1>
          <p className="text-sm mt-0.5" style={{ color: "#878787" }}>
            {products.length} products in stock
          </p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 font-bold text-sm uppercase transition-all"
          style={{
            background: "#2874f0",
            color: "#fff",
            border: "none",
            borderRadius: "2px",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1a5dc8"}
          onMouseLeave={e => e.currentTarget.style.background = "#2874f0"}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white p-4 space-y-3"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#c2c2c2" }} />
          <input
            type="text"
            placeholder="Search by product name, SKU or supplier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="fk-input pl-9"
            style={{ fontSize: "14px" }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={13} style={{ color: "#878787" }} />
          {FILTERS.map(f => {
            const active = filter === f;
            const ac = filterColors[f]?.active || { bg: "#2874f0", color: "#fff", border: "#2874f0" };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1.5 font-semibold transition-all duration-150 uppercase"
                style={{
                  background: active ? ac.bg : "#f1f3f6",
                  color: active ? ac.color : "#878787",
                  border: `1px solid ${active ? ac.border : "#e0e0e0"}`,
                  borderRadius: "2px",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#e8f0fe"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "#f1f3f6"; }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <TH label="Product / SKU"  k="name" />
                <TH label="Category"       k="category" />
                <TH label="Price"          k="price" />
                <TH label="Stock"          k="quantity" />
                <TH label="Expiry"         k="expiryDate" />
                <TH label="Supplier"       k="supplier" />
                <TH label="" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <div className="h-4 rounded animate-pulse" style={{ background: "#e0e0e0" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded flex items-center justify-center"
                        style={{ background: "#f1f3f6" }}>
                        <Package size={24} style={{ color: "#c2c2c2" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#878787" }}>No products found</p>
                      <p className="text-xs" style={{ color: "#c2c2c2" }}>Try a different search or filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <ProductRow key={p._id} product={p} onDelete={onDelete} index={i} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid #f0f0f0", background: "#f9f9f9" }}>
            <span className="text-xs font-medium" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
              Showing <strong style={{ color: "#2874f0" }}>{filtered.length}</strong> of {products.length} products
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
