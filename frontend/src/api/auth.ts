// frontend/src/api/auth.ts
import api from "./index";

export const register = (payload: { email: string; password: string; name?: string }) =>
  api.post("/auth/register", payload);

export const login = (payload: { email: string; password: string }) =>
  api.post("/auth/login", payload);

export const me = () => api.get("/me");