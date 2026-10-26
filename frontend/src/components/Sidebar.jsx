import {
  LayoutDashboard, Package, ClipboardList, Plus,
  ShoppingCart, Wifi, WifiOff, Timer, ChevronRight, TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { id: "dashboard",         label: "Dashboard",               icon: LayoutDashboard },
  { id: "inventory",         label: "Inventory",               icon: Package },
  { id: "auditlog",          label: "Audit Log",               icon: ClipboardList },
  { id: "smart-expiry",      label: "Smart Expiry Predictor",  icon: Timer },
  { id: "reorder-optimizer", label: "Smart Reorder Optimizer", icon: TrendingUp },
];

export default function Sidebar({ currentPage, onNavigate, onAddProduct, stats }) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://localhost:5000/");
        setOnline(res.ok);
      } catch {
        setOnline(false);
      }
    };
    check();
    const t = setInterval(check, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-white"
      style={{ boxShadow: "2px 0 8px rgba(0,0,0,.06)" }}>

      {/* Flipkart-style Header */}
      <div className="px-5 py-4"
        style={{ background: "linear-gradient(135deg, #2874f0 0%, #1a5dc8 100%)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
            <ShoppingCart size={18} style={{ color: "#2874f0" }} />
          </div>
          <div>
            <p className="font-bold text-xl leading-none text-white tracking-tight"
              style={{ fontFamily: "Roboto", fontStyle: "italic" }}>
              E<span style={{ color: "#ffe01b" }}>Mart</span>
            </p>
            <p className="text-xs text-blue-200 mt-0.5 font-medium tracking-wide">
              Inventory Management
            </p>
          </div>
        </div>

        <button
          onClick={onAddProduct}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded font-semibold text-sm transition-all"
          style={{
            background: "#ffe01b",
            color: "#2e2e2e",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.4px",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f5d500"}
          onMouseLeave={e => e.currentTarget.style.background = "#ffe01b"}
        >
          <Plus size={16} />
          ADD PRODUCT
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-150 relative"
              style={{
                background: active ? "#e8f0fe" : "transparent",
                color: active ? "#2874f0" : "#525252",
                borderLeft: active ? "3px solid #2874f0" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f1f3f6"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={17} style={{ color: active ? "#2874f0" : "#878787" }} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} style={{ color: "#2874f0" }} />}
            </button>
          );
        })}
      </nav>

      {/* Quick Stats */}
      {stats && (
        <div className="mx-4 mb-3 p-4 rounded" style={{ background: "#f1f3f6", border: "1px solid #e0e0e0" }}>
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider" style={{ color: "#878787" }}>
            Quick Stats
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-2.5 rounded" style={{ border: "1px solid #e0e0e0" }}>
              <p className="text-xs" style={{ color: "#878787" }}>Products</p>
              <p className="font-bold text-lg" style={{ color: "#2874f0" }}>{stats.totalProducts}</p>
            </div>
            <div className="bg-white p-2.5 rounded" style={{ border: "1px solid #e0e0e0" }}>
              <p className="text-xs" style={{ color: "#878787" }}>Low Stock</p>
              <p className="font-bold text-lg" style={{ color: "#ff9f00" }}>{stats.lowStockCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection status */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className={`flex items-center gap-2 text-xs font-medium`}
          style={{ color: online ? "#388e3c" : "#ff4a4a" }}>
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{online ? "Connected" : "Offline"}</span>
          <span className="w-2 h-2 rounded-full ml-auto animate-pulse-dot"
            style={{ background: online ? "#388e3c" : "#ff4a4a" }} />
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>
          Port 5000 · MongoDB
        </p>
      </div>
    </aside>
  );
}
