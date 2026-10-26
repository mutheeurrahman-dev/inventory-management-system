import { Trash2, AlertTriangle } from "lucide-react";

function stockBadge(qty) {
  if (qty === 0)   return { label: "Out of Stock", bg: "#fff0f0",  color: "#ff4a4a", border: "#ffd5d5" };
  if (qty <= 10)   return { label: "Low Stock",    bg: "#fff3e0",  color: "#ff9f00", border: "#ffe0b2" };
  return                  { label: "In Stock",     bg: "#e8f5e9",  color: "#388e3c", border: "#c8e6c9" };
}

function expiryBadge(dateStr) {
  const now  = new Date();
  const exp  = new Date(dateStr);
  const days = Math.ceil((exp - now) / 86400000);
  if (days < 0)  return { label: "Expired",      color: "#ff4a4a", icon: true };
  if (days <= 7) return { label: `${days}d left`, color: "#ff9f00", icon: true };
  return              { label: exp.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), color: "#878787", icon: false };
}

const CATEGORY_COLORS = {
  Dairy:           { bg: "#e1f5fe", color: "#0288d1" },
  Bakery:          { bg: "#fff3e0", color: "#ff9f00" },
  Produce:         { bg: "#e8f5e9", color: "#388e3c" },
  Frozen:          { bg: "#f3e5f5", color: "#7b1fa2" },
  Beverages:       { bg: "#e3f2fd", color: "#1565c0" },
  Snacks:          { bg: "#fff8e1", color: "#f57f17" },
  Meat:            { bg: "#ffebee", color: "#c62828" },
  "Personal Care": { bg: "#fce4ec", color: "#880e4f" },
  Household:       { bg: "#e0f2f1", color: "#00695c" },
  Other:           { bg: "#f1f3f6", color: "#525252" },
};

export default function ProductRow({ product, onDelete, index }) {
  const stock  = stockBadge(product.quantity);
  const expiry = expiryBadge(product.expiryDate);
  const catC   = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other;

  return (
    <tr
      className="animate-fade-up transition-colors duration-100"
      style={{ animationDelay: `${index * 25}ms`, cursor: "default" }}
      onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Name + SKU */}
      <td className="px-5 py-3.5" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <p className="font-medium text-sm" style={{ color: "#2e2e2e" }}>{product.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "#878787", fontFamily: "Roboto Mono" }}>{product.sku}</p>
      </td>

      {/* Category */}
      <td className="px-4 py-3.5" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <span className="text-xs font-semibold px-2 py-0.5 rounded"
          style={{ background: catC.bg, color: catC.color, letterSpacing: "0.3px" }}>
          {product.category}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3.5 text-sm font-semibold" style={{ borderBottom: "1px solid #f0f0f0", color: "#388e3c", fontFamily: "Roboto Mono" }}>
        ₹{product.price.toLocaleString("en-IN")}
      </td>

      {/* Quantity + status */}
      <td className="px-4 py-3.5" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#2e2e2e", fontFamily: "Roboto Mono" }}>
            {product.quantity}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{ background: stock.bg, color: stock.color, border: `1px solid ${stock.border}` }}>
            {stock.label}
          </span>
        </div>
      </td>

      {/* Expiry */}
      <td className="px-4 py-3.5" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <div className="flex items-center gap-1 text-xs font-medium"
          style={{ color: expiry.color, fontFamily: "Roboto Mono" }}>
          {expiry.icon && <AlertTriangle size={11} />}
          {expiry.label}
        </div>
      </td>

      {/* Supplier */}
      <td className="px-4 py-3.5 text-xs max-w-[140px] truncate"
        style={{ borderBottom: "1px solid #f0f0f0", color: "#878787" }}>
        {product.supplier}
      </td>

      {/* Delete */}
      <td className="px-4 py-3.5 text-right" style={{ borderBottom: "1px solid #f0f0f0" }}>
        <button
          onClick={() => onDelete(product._id, product.name)}
          className="p-1.5 rounded transition-all"
          title="Delete product"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ff4a4a" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fff0f0"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
