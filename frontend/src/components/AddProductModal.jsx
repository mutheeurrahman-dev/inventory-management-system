import { useState } from "react";
import { X, Loader2, ShoppingCart } from "lucide-react";

const CATEGORIES = [
  "Dairy","Bakery","Produce","Frozen","Beverages",
  "Snacks","Meat","Personal Care","Household","Other",
];

const EMPTY = {
  name: "", sku: "", price: "", quantity: "",
  category: "Other", supplier: "", expiryDate: "",
};

export default function AddProductModal({ onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Required";
    if (!form.sku.trim())      e.sku      = "Required";
    if (!form.supplier.trim()) e.supplier = "Required";
    if (!form.expiryDate)      e.expiryDate = "Required";
    if (isNaN(form.price) || form.price === "") e.price = "Must be a number";
    if (isNaN(form.quantity) || form.quantity === "") e.quantity = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      price:    parseFloat(form.price),
      quantity: parseInt(form.quantity),
    });
  };

  const Field = ({ label, name, type = "text", placeholder }) => (
    <div>
      <label className="fk-label">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        className="fk-input"
        style={errors[name] ? { borderColor: "#ff4a4a" } : {}}
      />
      {errors[name] && (
        <p className="text-xs mt-1" style={{ color: "#ff4a4a" }}>{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white animate-fade-up"
        style={{ borderRadius: "2px", boxShadow: "0 4px 24px rgba(0,0,0,.20)" }}>

        {/* Header — Flipkart blue */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: "linear-gradient(135deg, #2874f0 0%, #1a5dc8 100%)", borderRadius: "2px 2px 0 0" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center"
              style={{ flexShrink: 0 }}>
              <ShoppingCart size={16} style={{ color: "#2874f0" }} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white tracking-tight">Add New Product</h2>
              <p className="text-xs text-blue-200 mt-0.5">Fill in the product details below</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-white hover:bg-white/20 transition-colors p-1.5 rounded"
            style={{ cursor: "pointer", background: "transparent", border: "none" }}>
            <X size={18} />
          </button>
        </div>

        {/* Flipkart yellow accent bar */}
        <div className="h-1" style={{ background: "#ffe01b" }} />

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4" style={{ background: "#f1f3f6" }}>
          <div className="col-span-2 bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <Field label="Product Name" name="name" placeholder="e.g. Amul Full Cream Milk 1L" />
          </div>
          <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <Field label="SKU" name="sku" placeholder="e.g. DAIRY-001" />
          </div>
          <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <label className="fk-label">Category</label>
            <select value={form.category} onChange={set("category")} className="fk-input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <Field label="Price (₹)" name="price" type="number" placeholder="0.00" />
          </div>
          <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <Field label="Quantity (units)" name="quantity" type="number" placeholder="0" />
          </div>
          <div className="col-span-2 bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <Field label="Supplier" name="supplier" placeholder="e.g. Amul India Ltd." />
          </div>
          <div className="col-span-2 bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: "2px" }}>
            <Field label="Expiry Date" name="expiryDate" type="date" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "#e0e0e0", background: "#fff" }}>
          <button onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium transition-all rounded"
            style={{
              color: "#2874f0",
              background: "transparent",
              border: "1px solid #2874f0",
              cursor: "pointer",
              borderRadius: "2px",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#e8f0fe"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all uppercase"
            style={{
              background: submitting ? "#c2c2c2" : "#ffe01b",
              color: "#2e2e2e",
              border: "none",
              borderRadius: "2px",
              cursor: submitting ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              boxShadow: "0 1px 2px rgba(0,0,0,.12)",
            }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = "#f5d500"; }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = "#ffe01b"; }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
            {submitting ? "Saving…" : "Add to Inventory"}
          </button>
        </div>
      </div>
    </div>
  );
}
