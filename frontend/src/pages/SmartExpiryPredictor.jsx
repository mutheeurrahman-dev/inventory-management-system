import { useEffect, useState } from "react";
import {
  AlertTriangle, Eye, CheckCircle2, RefreshCw,
  Clock, TrendingUp, ShieldAlert, Flame, Timer,
} from "lucide-react";
import { fetchExpiryRisk } from "../api/index.js";

// ─── Risk Helpers ─────────────────────────────────────────────
function riskMeta(level) {
  switch (level) {
    case "At Risk":
      return { color: "#ff4a4a", bg: "#fff0f0", border: "#ffd5d5", dot: "#ff4a4a", Icon: AlertTriangle };
    case "Watch":
      return { color: "#ff9f00", bg: "#fff3e0", border: "#ffe0b2", dot: "#ff9f00", Icon: Eye };
    default:
      return { color: "#388e3c", bg: "#e8f5e9", border: "#c8e6c9", dot: "#388e3c", Icon: CheckCircle2 };
  }
}

function RiskBadge({ level, score }) {
  const meta = riskMeta(level);
  const Icon = meta.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded"
      style={{
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        fontFamily: "Roboto Mono",
        letterSpacing: "0.3px",
      }}
    >
      <Icon size={11} />
      {level}
      <span style={{ opacity: 0.5 }}>·</span>
      <span>{Math.min(score, 999)}</span>
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color, bgColor }) {
  return (
    <div className="bg-white p-5 transition-all duration-200"
      style={{ borderRadius: "2px", border: "1px solid #f0f0f0", boxShadow: "0 2px 4px rgba(0,0,0,.08)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,.08)"}
    >
      <div className="w-10 h-10 rounded flex items-center justify-center mb-3"
        style={{ background: bgColor }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="font-bold text-2xl" style={{ color }}>{value}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: "#525252" }}>{label}</p>
      {sub && <p className="text-xs mt-1 truncate" style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>{sub}</p>}
    </div>
  );
}

function ScoreBar({ score }) {
  const capped = Math.min(score, 200);
  const pct    = Math.min((capped / 200) * 100, 100);
  const fill   = score >= 80 ? "#ff4a4a" : score >= 40 ? "#ff9f00" : "#388e3c";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "#e0e0e0" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fill }} />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
        {Math.min(score, 999)}
      </span>
    </div>
  );
}

export default function SmartExpiryPredictor() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchExpiryRisk();
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const products = data?.products ?? [];
  const summary  = data?.summary  ?? {};

  const visible = products.filter((p) => {
    if (filter === "at-risk") return p.riskLevel === "At Risk";
    if (filter === "watch")   return p.riskLevel === "Watch";
    if (filter === "safe")    return p.riskLevel === "Safe";
    return true;
  });

  const TABS = [
    { key: "all",     label: "All Products" },
    { key: "at-risk", label: "⚠ At Risk" },
    { key: "watch",   label: "👁 Watch" },
    { key: "safe",    label: "✓ Safe" },
  ];

  const TABLE_HEADERS = [
    "Product Name", "Stock Qty", "Daily Sales Rate",
    "Days to Sell", "Days Until Expiry", "Risk Score", "Recommendation",
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2874f0, #1a5dc8)" }}>
            <Timer size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 className="font-bold text-xl" style={{ color: "#2e2e2e" }}>
              Smart Expiry Predictor
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#878787" }}>
              Risk scores computed from stock &amp; expiry data
            </p>
          </div>
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

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded animate-pulse" style={{ background: "#e0e0e0" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            icon={ShieldAlert}
            label="Total At Risk Products"
            value={summary.atRiskCount ?? 0}
            sub={`of ${summary.total ?? 0} products analysed`}
            color="#ff4a4a"
            bgColor="#fff0f0"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Average Risk Score"
            value={summary.avgRiskScore ?? 0}
            sub="risk_score = (days_to_sell / days_until_expiry) × 100"
            color="#ff9f00"
            bgColor="#fff3e0"
          />
          <SummaryCard
            icon={Flame}
            label="Highest Risk Product"
            value={summary.highestRiskScore ?? 0}
            sub={summary.highestRiskProduct ?? "—"}
            color="#ff4a4a"
            bgColor="#fff0f0"
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white px-4 flex items-center gap-1"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        {TABS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-3.5 text-sm font-semibold transition-all"
              style={{
                color: active ? "#2874f0" : "#878787",
                borderBottom: active ? "2px solid #2874f0" : "2px solid transparent",
                background: "transparent",
                border: "none",
                borderBottom: active ? "2px solid #2874f0" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#525252"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#878787"; }}
            >
              {label}
            </button>
          );
        })}
        <span className="ml-auto text-xs font-medium pr-2" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
          {visible.length} product{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white overflow-hidden"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-14 rounded animate-pulse" style={{ background: "#e0e0e0" }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded flex items-center justify-center mb-4"
              style={{ background: "#f1f3f6" }}>
              <Clock size={24} style={{ color: "#c2c2c2" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#525252" }}>No products match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h} className="text-left px-5 py-3 whitespace-nowrap"
                      style={{
                        background: "#f1f3f6",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#878787",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "2px solid #e0e0e0",
                      }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => {
                  const meta = riskMeta(p.riskLevel);
                  return (
                    <tr
                      key={p._id}
                      className="animate-fade-up transition-colors"
                      style={{ animationDelay: `${i * 15}ms`, borderBottom: "1px solid #f0f0f0" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Product Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: meta.dot }} />
                          <div>
                            <p className="font-medium" style={{ color: "#2e2e2e" }}>{p.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
                              {p.sku} · {p.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Stock Qty */}
                      <td className="px-5 py-4">
                        <span className="font-bold" style={{ color: "#2e2e2e" }}>{p.quantity}</span>
                        <span className="text-xs ml-1" style={{ color: "#878787" }}>units</span>
                      </td>

                      {/* Daily Sales Rate */}
                      <td className="px-5 py-4">
                        <span style={{ color: "#525252", fontFamily: "Roboto Mono" }}>{p.dailySalesRate}</span>
                        <span className="text-xs ml-1" style={{ color: "#878787" }}>/ day</span>
                      </td>

                      {/* Days to Sell */}
                      <td className="px-5 py-4">
                        {p.daysToSell === null ? (
                          <span style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>∞</span>
                        ) : (
                          <span className="font-semibold" style={{
                            color: p.daysToSell > (p.daysUntilExpiry * 0.8) ? "#ff4a4a" : "#525252",
                            fontFamily: "Roboto Mono",
                          }}>
                            {p.daysToSell}d
                          </span>
                        )}
                      </td>

                      {/* Days Until Expiry */}
                      <td className="px-5 py-4">
                        <span className="font-semibold" style={{
                          fontFamily: "Roboto Mono",
                          color: p.daysUntilExpiry <= 0 ? "#ff4a4a" : p.daysUntilExpiry <= 7 ? "#ff9f00" : "#525252",
                        }}>
                          {p.daysUntilExpiry <= 0 ? "Expired" : `${p.daysUntilExpiry}d`}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="px-5 py-4" style={{ minWidth: "160px" }}>
                        <div className="space-y-1.5">
                          <RiskBadge level={p.riskLevel} score={p.riskScore} />
                          <ScoreBar score={p.riskScore} />
                        </div>
                      </td>

                      {/* Recommendation */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium" style={{ color: meta.color }}>
                          {p.recommendation}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formula Legend */}
      <div className="bg-white px-5 py-4 flex flex-wrap items-center gap-5"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#878787" }}>Formula</span>
        <span className="text-xs" style={{ color: "#525252", fontFamily: "Roboto Mono" }}>
          risk_score = (days_to_sell ÷ days_until_expiry) × 100
        </span>
        <div className="flex items-center gap-4 text-xs" style={{ color: "#525252" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#ff4a4a" }} />
            ≥ 80 → At Risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#ff9f00" }} />
            40–79 → Watch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#388e3c" }} />
            &lt;40 → Safe
          </span>
        </div>
      </div>
    </div>
  );
}
