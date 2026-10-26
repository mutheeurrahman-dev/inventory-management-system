import { useEffect, useState } from "react";
import { ClipboardList, Package, Trash2, RefreshCw } from "lucide-react";
import { fetchAuditLog } from "../api/index.js";

export default function AuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLog();
      setLogs(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const actionMeta = (action) => {
    if (action === "ADD_PRODUCT")    return { label: "ADD",    bg: "#e8f5e9", color: "#388e3c", border: "#c8e6c9",    icon: Package };
    if (action === "DELETE_PRODUCT") return { label: "DELETE", bg: "#fff0f0", color: "#ff4a4a", border: "#ffd5d5",    icon: Trash2 };
    return                                  { label: action,   bg: "#f1f3f6", color: "#525252", border: "#e0e0e0",    icon: Package };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "#2e2e2e" }}>Audit Log</h1>
          <p className="text-sm mt-0.5" style={{ color: "#878787" }}>
            Last 50 actions · Activity history
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 transition-all"
          style={{
            color: "#2874f0",
            background: "#e8f0fe",
            border: "1px solid #c5d5fc",
            borderRadius: "2px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#d0e2ff"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#e8f0fe"; }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Flipkart info banner */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ background: "#fff7e0", border: "1px solid #ffe0b2", borderRadius: "2px" }}>
        <ClipboardList size={16} style={{ color: "#ff9f00", flexShrink: 0 }} />
        <p className="text-sm" style={{ color: "#525252" }}>
          All product additions and deletions are recorded here for accountability.
        </p>
      </div>

      {/* Log entries */}
      <div className="bg-white overflow-hidden"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded animate-pulse" style={{ background: "#e0e0e0" }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded flex items-center justify-center mb-4"
              style={{ background: "#f1f3f6" }}>
              <ClipboardList size={24} style={{ color: "#c2c2c2" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#525252" }}>No audit entries yet</p>
            <p className="text-xs mt-1" style={{ color: "#c2c2c2" }}>Add or delete products to generate logs.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid gap-4 px-5 py-3 text-xs font-bold uppercase"
              style={{
                gridTemplateColumns: "40px 80px 1fr auto 120px",
                background: "#f1f3f6",
                borderBottom: "2px solid #e0e0e0",
                color: "#878787",
                letterSpacing: "0.5px",
              }}>
              <span></span>
              <span>Action</span>
              <span>Description</span>
              <span>Details</span>
              <span className="text-right">Time</span>
            </div>

            {logs.map((log, i) => {
              const meta = actionMeta(log.action);
              const Icon = meta.icon;
              const snap = log.productSnapshot;
              return (
                <div
                  key={log._id}
                  className="grid gap-4 px-5 py-4 items-start animate-fade-up transition-colors"
                  style={{
                    gridTemplateColumns: "40px 80px 1fr auto 120px",
                    borderBottom: i < logs.length - 1 ? "1px solid #f0f0f0" : "none",
                    animationDelay: `${i * 20}ms`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                    <Icon size={13} style={{ color: meta.color }} />
                  </div>

                  {/* Badge */}
                  <div className="flex items-start pt-0.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                        letterSpacing: "0.3px",
                      }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="min-w-0">
                    <p className="text-sm" style={{ color: "#2e2e2e" }}>{log.description}</p>
                  </div>

                  {/* Snapshot */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {snap?.sku      && <span className="text-xs" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>SKU: {snap.sku}</span>}
                    {snap?.price    != null && <span className="text-xs" style={{ color: "#388e3c", fontFamily: "Roboto Mono" }}>₹{snap.price}</span>}
                    {snap?.quantity != null && <span className="text-xs" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>Qty: {snap.quantity}</span>}
                    {snap?.supplier && <span className="text-xs" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>{snap.supplier}</span>}
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: "#525252", fontFamily: "Roboto Mono" }}>
                      {new Date(log.performedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs" style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>
                      {new Date(log.performedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
