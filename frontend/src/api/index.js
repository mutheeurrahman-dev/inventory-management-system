// ============================================================
//  API Service — All backend calls in one place
//  Base URL proxied to http://localhost:5000 via Vite
// ============================================================

import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000" });

export const fetchProducts        = ()     => api.get("/products");
export const addProduct           = (data) => api.post("/products/add", data);
export const deleteProduct        = (id)   => api.delete(`/products/delete/${id}`);
export const fetchStats           = ()     => api.get("/stats");
export const fetchAuditLog        = ()     => api.get("/audit");
export const fetchExpiryRisk      = ()     => api.get("/api/expiry-risk");
export const fetchReorderOptimizer= ()     => api.get("/api/reorder-optimizer");
