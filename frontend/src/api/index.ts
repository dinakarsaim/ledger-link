// frontend/src/api/index.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ll_token");
  if (token && cfg.headers) {
    cfg.headers.set?.("Authorization", `Bearer ${token}`);
  } else if (token) {
    cfg.headers = { Authorization: `Bearer ${token}` } as any;
  }
  return cfg;
});

export default api;