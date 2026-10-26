import { useEffect, useState } from "react";
import {
  RefreshCw, ShoppingCart, AlertOctagon, TrendingUp,
  Package, IndianRupee, Zap, Clock, BarChart3,
  ChevronDown, ChevronUp, Database, GitMerge,
} from "lucide-react";
import { fetchReorderOptimizer } from "../api/index.js";

// ─── Urgency Meta ─────────────────────────────────────────────
function urgencyMeta(label) {
  switch (label) {
    case "Critical":
      return { color: "#d32f2f", bg: "#ffebee", border: "#ffcdd2", dot: "#d32f2f", pill: "#ff5252" };
    case "Reorder Soon":
      return { color: "#e65100", bg: "#fff3e0", border: "#ffe0b2", dot: "#ff9800", pill: "#ff9800" };
    case "Monitor":
      return { color: "#1565c0", bg: "#e3f2fd", border: "#bbdefb", dot: "#2196f3", pill: "#2196f3" };
    default:
      return { color: "#2e7d32", bg: "#e8f5e9", border: "#c8e6c9", dot: "#4caf50", pill: "#4caf50" };
  }
}

// ─── Category Colors ──────────────────────────────────────────
const CAT_COLORS = {
  Dairy: "#2196f3", Bakery: "#ff9800", Produce: "#4caf50",
  Frozen: "#00bcd4", Beverages: "#9c27b0", Snacks: "#ff5722",
  Meat: "#f44336", "Personal Care": "#e91e63", Household: "#607d8b", Other: "#9e9e9e",
};

// ─── Sub-components ───────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, color, bgColor, mono }) {
  return (
    <div
      className="bg-white p-5 transition-all duration-200"
      style={{ borderRadius: "2px", border: "1px solid #f0f0f0", boxShadow: "0 2px 4px rgba(0,0,0,.08)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,.08)"}
    >
      <div className="w-10 h-10 rounded flex items-center justify-center mb-3" style={{ background: bgColor }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="font-bold text-2xl" style={{ color, fontFamily: mono ? "Roboto Mono" : undefined }}>{value}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: "#525252" }}>{label}</p>
      {sub && <p className="text-xs mt-1 truncate" style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>{sub}</p>}
    </div>
  );
}

function UrgencyBadge({ label }) {
  const meta = urgencyMeta(label);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, fontFamily: "Roboto Mono", letterSpacing: "0.3px" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
      {label}
    </span>
  );
}

function UrgencyBar({ score }) {
  const color = score >= 70 ? "#d32f2f" : score >= 40 ? "#ff9800" : score >= 15 ? "#2196f3" : "#4caf50";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#e0e0e0" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>{score}</span>
    </div>
  );
}

function CategoryBreakdownBar({ breakdown }) {
  const max = Math.max(...breakdown.map(c => c.cost), 1);
  return (
    <div className="space-y-2.5">
      {breakdown.slice(0, 5).map(({ category, count, cost }) => {
        const color = CAT_COLORS[category] ?? "#9e9e9e";
        const pct   = Math.round((cost / max) * 100);
        return (
          <div key={category} className="flex items-center gap-3">
            <span className="text-xs font-medium w-28 truncate" style={{ color: "#525252" }}>{category}</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: "6px", background: "#f0f0f0" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs w-6 text-center font-bold" style={{ color, fontFamily: "Roboto Mono" }}>{count}</span>
            <span className="text-xs w-20 text-right" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
              ₹{cost >= 1000 ? `${(cost / 1000).toFixed(1)}k` : cost}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DBMSChip({ label, icon: Icon }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
      style={{ background: "#e8f0fe", color: "#2874f0", border: "1px solid #c5d5fc", fontFamily: "Roboto Mono", letterSpacing: "0.2px" }}
    >
      {Icon && <Icon size={9} />}
      {label}
    </span>
  );
}

// ─── Expanded Row Detail ──────────────────────────────────────
function ExpandedDetail({ p }) {
  return (
    <tr>
      <td colSpan={8} style={{ padding: "0 20px 16px 20px", background: "#f8f9ff", borderBottom: "2px solid #e8f0fe" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {/* EOQ Box */}
          <div className="bg-white rounded p-3" style={{ border: "1px solid #e8f0fe" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#878787" }}>
              EOQ Formula
            </p>
            <p className="text-xs" style={{ color: "#525252", fontFamily: "Roboto Mono" }}>
              √(2 × D × S / H)
            </p>
            <p className="font-bold text-lg mt-1" style={{ color: "#2874f0" }}>{p.eoq} units</p>
            <p className="text-xs mt-0.5" style={{ color: "#c2c2c2" }}>Economic Order Qty</p>
          </div>
          {/* Reorder Point */}
          <div className="bg-white rounded p-3" style={{ border: "1px solid #e8f0fe" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#878787" }}>
              Reorder Point
            </p>
            <p className="text-xs" style={{ color: "#525252", fontFamily: "Roboto Mono" }}>
              (sales × lead) + safety
            </p>
            <p className="font-bold text-lg mt-1" style={{ color: "#ff9800" }}>{p.reorderPoint} units</p>
            <p className="text-xs mt-0.5" style={{ color: "#c2c2c2" }}>Trigger reorder below this</p>
          </div>
          {/* Safety Stock */}
          <div className="bg-white rounded p-3" style={{ border: "1px solid #e8f0fe" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#878787" }}>
              Safety Stock
            </p>
            <p className="text-xs" style={{ color: "#525252", fontFamily: "Roboto Mono" }}>
              sales_rate × safety_days
            </p>
            <p className="font-bold text-lg mt-1" style={{ color: "#9c27b0" }}>{p.safetyStock} units</p>
            <p className="text-xs mt-0.5" style={{ color: "#c2c2c2" }}>Buffer against stockout</p>
          </div>
          {/* Category JOIN */}
          <div className="bg-white rounded p-3" style={{ border: "1px solid #e8f0fe" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#878787" }}>
              Category Avg (JOIN)
            </p>
            <p className="text-xs" style={{ color: "#525252", fontFamily: "Roboto Mono" }}>
              GROUP BY category
            </p>
            <p className="font-bold text-lg mt-1" style={{ color: "#388e3c" }}>{p.categoryAvgQty} units</p>
            <p className="text-xs mt-0.5" style={{ color: "#c2c2c2" }}>Avg stock in {p.category}</p>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function SmartReorderOptimizer() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [sortKey,   setSortKey]   = useState("urgencyScore");
  const [sortAsc,   setSortAsc]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchReorderOptimizer();
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const products = data?.products ?? [];
  const summary  = data?.summary  ?? {};

  const visible = products
    .filter(p => {
      if (filter === "critical")    return p.urgencyLabel === "Critical";
      if (filter === "reorder")     return p.urgencyLabel === "Reorder Soon";
      if (filter === "monitor")     return p.urgencyLabel === "Monitor";
      if (filter === "sufficient")  return p.urgencyLabel === "Sufficient";
      if (filter === "needs")       return p.needsReorder;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const TABS = [
    { key: "all",        label: "All Products" },
    { key: "needs",      label: "🔴 Needs Reorder" },
    { key: "critical",   label: "⚡ Critical" },
    { key: "reorder",    label: "🟠 Reorder Soon" },
    { key: "monitor",    label: "🔵 Monitor" },
    { key: "sufficient", label: "✓ Sufficient" },
  ];

  const HEADERS = [
    { key: "name",          label: "Product" },
    { key: "currentStock",  label: "Stock" },
    { key: "salesRate",     label: "Sales/Day" },
    { key: "coverageDays",  label: "Coverage" },
    { key: "reorderPoint",  label: "Reorder Point" },
    { key: "suggestedQty",  label: "Order Qty" },
    { key: "estimatedCost", label: "Est. Cost" },
    { key: "urgencyScore",  label: "Urgency" },
  ];

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2874f0, #1a5dc8)" }}>
            <ShoppingCart size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 className="font-bold text-xl" style={{ color: "#2e2e2e" }}>
              Smart Reorder Optimizer
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#878787" }}>
              EOQ · Reorder Point · Safety Stock — powered by MongoDB Aggregation Pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <DBMSChip label="$group" icon={Database} />
            <DBMSChip label="$lookup" icon={GitMerge} />
            <DBMSChip label="$project" icon={BarChart3} />
            <DBMSChip label="EOQ" icon={TrendingUp} />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 ml-3 transition-all"
            style={{
              color: "#2874f0", background: "#e8f0fe", border: "1px solid #c5d5fc",
              borderRadius: "2px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#d0e2ff"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#e8f0fe"; }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded animate-pulse" style={{ background: "#e0e0e0" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            icon={AlertOctagon} label="Critical / Reorder Needed"
            value={summary.needsReorderCount ?? 0}
            sub={`${summary.criticalCount ?? 0} critical · ${(summary.needsReorderCount ?? 0) - (summary.criticalCount ?? 0)} soon`}
            color="#d32f2f" bgColor="#ffebee"
          />
          <SummaryCard
            icon={Package} label="Out of Stock"
            value={summary.outOfStockCount ?? 0}
            sub="Immediate restocking required"
            color="#ff9800" bgColor="#fff3e0"
          />
          <SummaryCard
            icon={IndianRupee} label="Total Reorder Budget"
            value={`₹${((summary.totalReorderCost ?? 0) / 1000).toFixed(1)}k`}
            sub="Based on EOQ × unit price" mono
            color="#2874f0" bgColor="#e8f0fe"
          />
          <SummaryCard
            icon={Zap} label="Total Products Analysed"
            value={summary.totalProducts ?? 0}
            sub="via MongoDB Aggregation Pipeline"
            color="#388e3c" bgColor="#e8f5e9"
          />
        </div>
      )}

      {/* ── Category Breakdown ── */}
      {!loading && summary.categoryBreakdown?.length > 0 && (
        <div className="bg-white px-6 py-5"
          style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} style={{ color: "#2874f0" }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#878787" }}>
              Category Breakdown — GROUP BY category (Reorder Items)
            </p>
          </div>
          <CategoryBreakdownBar breakdown={summary.categoryBreakdown} />
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="bg-white px-4 flex items-center gap-1 overflow-x-auto"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        {TABS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-3.5 text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                color: active ? "#2874f0" : "#878787",
                background: "transparent", border: "none",
                borderBottom: active ? "2px solid #2874f0" : "2px solid transparent",
                cursor: "pointer", marginBottom: "-1px",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#525252"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#878787"; }}
            >
              {label}
            </button>
          );
        })}
        <span className="ml-auto text-xs font-medium pr-2 whitespace-nowrap"
          style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
          {visible.length} product{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white overflow-hidden"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded animate-pulse" style={{ background: "#e0e0e0" }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded flex items-center justify-center mb-4" style={{ background: "#f1f3f6" }}>
              <Package size={24} style={{ color: "#c2c2c2" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#525252" }}>No products match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {HEADERS.map(({ key, label }) => {
                    const sorted = sortKey === key;
                    return (
                      <th key={key}
                        onClick={() => handleSort(key)}
                        className="text-left px-5 py-3 whitespace-nowrap cursor-pointer select-none"
                        style={{
                          background: sorted ? "#eef2ff" : "#f1f3f6",
                          fontSize: "11px", fontWeight: 700, color: sorted ? "#2874f0" : "#878787",
                          textTransform: "uppercase", letterSpacing: "0.5px",
                          borderBottom: `2px solid ${sorted ? "#2874f0" : "#e0e0e0"}`,
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {sorted
                            ? sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                            : <ChevronDown size={10} style={{ opacity: 0.3 }} />}
                        </span>
                      </th>
                    );
                  })}
                  {/* Expand column */}
                  <th className="px-3 py-3" style={{ background: "#f1f3f6", borderBottom: "2px solid #e0e0e0", width: "40px" }} />
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => {
                  const meta     = urgencyMeta(p.urgencyLabel);
                  const expanded = expandedId === p._id;
                  const catColor = CAT_COLORS[p.category] ?? "#9e9e9e";

                  return (
                    <>
                      <tr
                        key={p._id}
                        className="transition-colors"
                        style={{ borderBottom: expanded ? "none" : "1px solid #f0f0f0", animationDelay: `${i * 15}ms` }}
                        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = "#f8f9fa"; }}
                        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Product */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                            <div>
                              <p className="font-medium" style={{ color: "#2e2e2e" }}>{p.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
                                {p.sku} ·{" "}
                                <span className="font-semibold" style={{ color: catColor }}>{p.category}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Current Stock */}
                        <td className="px-5 py-4">
                          <span className="font-bold" style={{
                            color: p.currentStock === 0 ? "#d32f2f" : p.currentStock <= p.reorderPoint ? "#ff9800" : "#2e2e2e",
                          }}>
                            {p.currentStock}
                          </span>
                          <span className="text-xs ml-1" style={{ color: "#878787" }}>units</span>
                        </td>

                        {/* Sales Rate */}
                        <td className="px-5 py-4">
                          <span style={{ color: "#525252", fontFamily: "Roboto Mono" }}>{p.salesRate}</span>
                          <span className="text-xs ml-1" style={{ color: "#878787" }}>/day</span>
                        </td>

                        {/* Coverage */}
                        <td className="px-5 py-4">
                          <span className="font-semibold" style={{
                            fontFamily: "Roboto Mono",
                            color: p.coverageDays < 5 ? "#d32f2f" : p.coverageDays < 14 ? "#ff9800" : "#388e3c",
                          }}>
                            {p.coverageDays >= 999 ? "∞" : `${p.coverageDays}d`}
                          </span>
                        </td>

                        {/* Reorder Point */}
                        <td className="px-5 py-4">
                          <span style={{ color: "#525252", fontFamily: "Roboto Mono" }}>{p.reorderPoint}</span>
                          <span className="text-xs ml-1" style={{ color: "#878787" }}>units</span>
                        </td>

                        {/* Suggested Order Qty */}
                        <td className="px-5 py-4">
                          {p.suggestedQty > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded"
                              style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2", fontFamily: "Roboto Mono" }}>
                              +{p.suggestedQty}
                            </span>
                          ) : (
                            <span style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>—</span>
                          )}
                        </td>

                        {/* Estimated Cost */}
                        <td className="px-5 py-4">
                          {p.estimatedCost > 0 ? (
                            <span className="font-semibold" style={{ color: "#2874f0", fontFamily: "Roboto Mono" }}>
                              ₹{p.estimatedCost >= 1000 ? `${(p.estimatedCost / 1000).toFixed(1)}k` : p.estimatedCost}
                            </span>
                          ) : (
                            <span style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>—</span>
                          )}
                        </td>

                        {/* Urgency */}
                        <td className="px-5 py-4" style={{ minWidth: "180px" }}>
                          <div className="space-y-1.5">
                            <UrgencyBadge label={p.urgencyLabel} />
                            <UrgencyBar score={p.urgencyScore} />
                          </div>
                        </td>

                        {/* Expand toggle */}
                        <td className="px-3 py-4">
                          <button
                            onClick={() => setExpandedId(expanded ? null : p._id)}
                            className="w-7 h-7 flex items-center justify-center rounded transition-all"
                            style={{
                              background: expanded ? "#e8f0fe" : "#f1f3f6",
                              color: expanded ? "#2874f0" : "#878787",
                              border: "none", cursor: "pointer",
                            }}
                          >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expanded && <ExpandedDetail key={`exp-${p._id}`} p={p} />}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DBMS Formula Legend ── */}
      <div className="bg-white px-5 py-4"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div className="flex items-center gap-2 mb-3">
          <Database size={13} style={{ color: "#2874f0" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#878787" }}>
            DBMS Concepts Applied
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs" style={{ color: "#525252" }}>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "#2874f0" }}>Aggregation Pipeline</span>
            <span style={{ fontFamily: "Roboto Mono", color: "#878787" }}>$group → $project → $sort</span>
            <span>Category totals &amp; averages</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "#ff9800" }}>JOIN (Lookup)</span>
            <span style={{ fontFamily: "Roboto Mono", color: "#878787" }}>product ⋈ reorder_policy</span>
            <span>Policy table cross-referenced</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "#388e3c" }}>EOQ Formula</span>
            <span style={{ fontFamily: "Roboto Mono", color: "#878787" }}>√(2 × D × S ÷ H)</span>
            <span>Economic Order Quantity</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold" style={{ color: "#9c27b0" }}>Reorder Point</span>
            <span style={{ fontFamily: "Roboto Mono", color: "#878787" }}>(d × L) + safety_stock</span>
            <span>Derived computed column</span>
          </div>
        </div>
      </div>
    </div>
  );
}
