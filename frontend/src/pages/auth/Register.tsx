// src/pages/auth/Register.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const { register, user, loading } = useAuth();
  const nav = useNavigate();

  // Redirect to home if already logged in (but only after loading completes)
  useEffect(() => {
    if (!loading && user) {
      nav("/");
    }
  }, [loading, user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await register(email, password, name);
      // register auto-logs in in our AuthContext — navigate to home
      nav("/");
    } catch (error: any) {
      setErr(error?.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
          minLength={6}
          required
        />
        <button type="submit" className="w-full py-2 bg-primary text-white rounded">
          Register
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{" "}
        <button
          className="text-primary underline"
          onClick={() => nav("/login")}
          type="button"
        >
          Log in
        </button>
      </p>
    </div>
  );
}