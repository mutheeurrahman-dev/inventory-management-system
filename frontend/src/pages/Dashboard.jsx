import {
  Package, AlertTriangle, TrendingDown, DollarSign,
  ShoppingBag, Clock, ArrowRight, Activity, BarChart2,
} from "lucide-react";
import StatCard from "../components/StatCard.jsx";

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: "#e0e0e0" }} />;
}

function ActivityItem({ log }) {
  const isAdd = log.action === "ADD_PRODUCT";
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
      <div className="mt-0.5 w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{
          background: isAdd ? "#e8f5e9" : "#fff0f0",
          color: isAdd ? "#388e3c" : "#ff4a4a",
        }}>
        {isAdd ? <Package size={13} /> : <AlertTriangle size={13} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm" style={{ color: "#2e2e2e" }}>{log.description}</p>
        <p className="text-xs mt-0.5" style={{ color: "#c2c2c2", fontFamily: "Roboto Mono" }}>
          {new Date(log.performedAt).toLocaleString("en-IN")}
        </p>
      </div>
      <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
        style={{
          background: isAdd ? "#e8f5e9" : "#fff0f0",
          color: isAdd ? "#388e3c" : "#ff4a4a",
          letterSpacing: "0.3px",
        }}>
        {isAdd ? "ADD" : "DEL"}
      </span>
    </div>
  );
}

export default function Dashboard({ stats, loading, onNavigate, products }) {
  const now = new Date();

  const riskItems = products
    .filter(p => {
      const d = (new Date(p.expiryDate) - now) / 86400000;
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Flipkart-style page header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "#2e2e2e" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#878787" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded"
          style={{ background: "#e8f5e9", color: "#388e3c", border: "1px solid #c8e6c9" }}>
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "#388e3c" }} />
          Live · MongoDB
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Products"
            value={stats?.totalProducts ?? 0}
            icon={ShoppingBag}
            color="blue"
            sub={`${stats?.totalUnits ?? 0} total units`}
          />
          <StatCard
            label="Inventory Value"
            value={`₹${((stats?.inventoryValue ?? 0) / 1000).toFixed(1)}k`}
            icon={DollarSign}
            color="jade"
            sub="at selling price"
          />
          <StatCard
            label="Low / Out of Stock"
            value={`${stats?.lowStockCount ?? 0} / ${stats?.outOfStockCount ?? 0}`}
            icon={TrendingDown}
            color="amber"
            sub="needs restocking"
          />
          <StatCard
            label="Expiry Risk"
            value={stats?.expiringSoonCount ?? 0}
            icon={Clock}
            color="crimson"
            sub={`${stats?.expiredCount ?? 0} already expired`}
          />
        </div>
      )}

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category breakdown */}
        <div className="bg-white p-5 lg:col-span-1"
          style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#2e2e2e" }}>
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#e8f0fe" }}>
              <BarChart2 size={13} style={{ color: "#2874f0" }} />
            </div>
            Stock by Category
          </h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
          ) : (
            <div className="space-y-3">
              {(stats?.categoryBreakdown ?? []).map((cat) => {
                const total = stats.categoryBreakdown.reduce((s, c) => s + c.count, 0);
                const pct   = total ? Math.round((cat.count / total) * 100) : 0;
                return (
                  <div key={cat._id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium" style={{ color: "#525252" }}>{cat._id}</span>
                      <span style={{ color: "#878787", fontFamily: "Roboto Mono" }}>
                        {cat.count} SKU · {cat.totalQty} units
                      </span>
                    </div>
                    <div className="fk-progress-bar">
                      <div className="fk-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expiry risk table */}
        <div className="bg-white p-5 lg:col-span-2"
          style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "#2e2e2e" }}>
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#fff3e0" }}>
                <Clock size={13} style={{ color: "#ff9f00" }} />
              </div>
              Expiring Within 7 Days
            </h3>
            <button
              onClick={() => onNavigate("inventory")}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: "#2874f0", background: "transparent", border: "none", cursor: "pointer" }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : riskItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded flex items-center justify-center mb-3"
                style={{ background: "#e8f5e9" }}>
                <Package size={20} style={{ color: "#388e3c" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#525252" }}>No products expiring soon</p>
              <p className="text-xs mt-1" style={{ color: "#c2c2c2" }}>You're all clear!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {riskItems.map((p) => {
                const days = Math.ceil((new Date(p.expiryDate) - now) / 86400000);
                const urgent = days <= 2;
                return (
                  <div key={p._id}
                    className="flex items-center justify-between px-4 py-3 rounded"
                    style={{
                      background: urgent ? "#fff0f0" : "#fff3e0",
                      border: `1px solid ${urgent ? "#ffd5d5" : "#ffe0b2"}`,
                    }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#2e2e2e" }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>{p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: urgent ? "#ff4a4a" : "#ff9f00", fontFamily: "Roboto Mono" }}>
                        {days === 0 ? "Today" : `${days}d`}
                      </p>
                      <p className="text-xs" style={{ color: "#878787" }}>{p.quantity} units</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent audit activity */}
      <div className="bg-white p-5"
        style={{ borderRadius: "2px", boxShadow: "0 2px 4px rgba(0,0,0,.08)", border: "1px solid #f0f0f0" }}>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#2e2e2e" }}>
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#f3e5f5" }}>
            <Activity size={13} style={{ color: "#7b1fa2" }} />
          </div>
          Recent Audit Activity
        </h3>
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !stats?.recentActivity?.length ? (
          <p className="text-sm text-center py-6" style={{ color: "#c2c2c2" }}>No activity yet</p>
        ) : (
          <div>
            {stats.recentActivity.map((log) => <ActivityItem key={log._id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  );
}
