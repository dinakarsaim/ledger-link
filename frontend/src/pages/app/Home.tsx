// src/pages/app/Home.tsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || user?.email}</h1>
      <p className="text-gray-600">This is your LedgerLink home page.</p>

      <div className="mt-6 space-x-3">
        <button
          onClick={() => nav("/dashboard")}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Go to Dashboard
        </button>

        <button onClick={() => nav("/receipts/upload")} className="px-4 py-2 bg-primary text-white rounded">Upload receipt</button>

        <button
          onClick={logout}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}