import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import SmartExpiryPredictor from "./pages/SmartExpiryPredictor.jsx";
import SmartReorderOptimizer from "./pages/SmartReorderOptimizer.jsx";
import AddProductModal from "./components/AddProductModal.jsx";
import { fetchProducts, fetchStats, addProduct, deleteProduct } from "./api/index.js";

export default function App() {
  const [page,       setPage]       = useState("dashboard");
  const [products,   setProducts]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes] = await Promise.all([fetchProducts(), fetchStats()]);
      setProducts(prodRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      toast.error("Cannot reach backend. Is the server running on port 5000?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (formData) => {
    setSubmitting(true);
    try {
      await addProduct(formData);
      toast.success(`"${formData.name}" added to inventory!`);
      setShowModal(false);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add product";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from inventory?`)) return;
    try {
      await deleteProduct(id);
      toast.success(`"${name}" removed`);
      await loadData();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f1f3f6" }}>

      {/* Flipkart Top Header Bar */}
      <header style={{
        background: "linear-gradient(135deg, #2874f0 0%, #1a5dc8 100%)",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "#fff",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2874f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: "20px", color: "#fff", fontStyle: "italic", letterSpacing: "-0.5px" }}>
            E<span style={{ color: "#ffe01b" }}>Mart</span>
          </span>
          <span style={{ fontFamily: "Roboto", fontSize: "11px", color: "rgba(255,255,255,0.6)", marginLeft: "4px", fontStyle: "italic", paddingTop: "2px" }}>
            Inventory OS
          </span>
        </div>

        {/* Right side info */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {stats && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>
                <span style={{ color: "#ffe01b", fontWeight: 700 }}>{stats.totalProducts}</span> Products
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>
                <span style={{ color: "#ffe01b", fontWeight: 700 }}>
                  ₹{((stats.inventoryValue ?? 0) / 1000).toFixed(1)}k
                </span> Value
              </span>
            </div>
          )}
          <div style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "4px",
            padding: "4px 12px",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.3px",
          }}>
            ADMIN
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          currentPage={page}
          onNavigate={setPage}
          onAddProduct={() => setShowModal(true)}
          stats={stats}
        />

        <main style={{ flex: 1, overflowY: "auto" }}>
          {page === "dashboard" && (
            <Dashboard stats={stats} loading={loading} onNavigate={setPage} products={products} />
          )}
          {page === "inventory" && (
            <Inventory
              products={products}
              loading={loading}
              onDelete={handleDelete}
              onAdd={() => setShowModal(true)}
            />
          )}
          {page === "auditlog" && <AuditLog />}
          {page === "smart-expiry" && <SmartExpiryPredictor />}
          {page === "reorder-optimizer" && <SmartReorderOptimizer />}
        </main>
      </div>

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
          submitting={submitting}
        />
      )}
    </div>
  );
}
