export default function StatCard({ label, value, icon: Icon, color = "blue", sub }) {
  const palette = {
    blue:    { text: "#2874f0", bg: "#e8f0fe", border: "#c5d5fc" },
    amber:   { text: "#ff9f00", bg: "#fff3e0", border: "#ffe0b2" },
    crimson: { text: "#ff4a4a", bg: "#fff0f0", border: "#ffd5d5" },
    sky:     { text: "#0288d1", bg: "#e1f5fe", border: "#b3e5fc" },
    violet:  { text: "#7b1fa2", bg: "#f3e5f5", border: "#e1bee7" },
    jade:    { text: "#388e3c", bg: "#e8f5e9", border: "#c8e6c9" },
  }[color] || { text: "#2874f0", bg: "#e8f0fe", border: "#c5d5fc" };

  return (
    <div className="fk-stat-card group transition-all duration-200"
      style={{ borderRadius: "2px" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,.08)"}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#878787" }}>
          {label}
        </p>
        {Icon && (
          <div className="w-9 h-9 rounded flex items-center justify-center"
            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
            <Icon size={16} style={{ color: palette.text }} />
          </div>
        )}
      </div>
      <div>
        <p className="font-bold text-3xl tracking-tight" style={{ color: palette.text }}>
          {value ?? "—"}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: "#878787" }}>{sub}</p>
        )}
      </div>
      {/* Bottom accent */}
      <div className="h-0.5 w-12 rounded-full" style={{ background: palette.text, opacity: 0.3 }} />
    </div>
  );
}
