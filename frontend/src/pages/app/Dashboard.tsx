// src/pages/app/Dashboard.tsx
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600">
        Hi {user?.name || user?.email}, here’s where your receipts and spending summary will appear.
      </p>

      <div className="mt-8 border-t pt-6">
        <p className="text-gray-500 italic">
          (In the next steps we’ll add upload, receipts, and expense tracking here.)
        </p>
      </div>
    </div>
  );
}