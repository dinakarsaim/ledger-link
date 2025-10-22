// frontend/src/pages/app/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

type Expense = {
  id: string;
  description: string | null;
  totalAmount: number;
  currency: string;
  createdAt: string;
  receipt?: {
    id: string;
    imageUrl: string | null;
    parsed?: any;
  };
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expenses");
      setExpenses(res.data.expenses || []);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  if (loading) return <div className="p-8 text-gray-600">Loading expenses...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Expenses</h1>
        <button
          onClick={() => nav("/upload")}
          className="px-4 py-2 bg-primary text-white rounded hover:opacity-90"
        >
          + New Receipt
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-gray-500 text-center mt-20">
          <p>No expenses yet.</p>
          <p className="mt-2">Upload a receipt to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((ex) => (
            <Link
              key={ex.id}
              to={`/receipts/${ex.receipt?.id}/review`}
              state={{ receipt: ex.receipt, parsed: ex.receipt?.parsed }}
              className="block bg-white rounded-xl shadow hover:shadow-md transition p-4"
            >
              {ex.receipt?.imageUrl ? (
                <img
                  src={ex.receipt.imageUrl}
                  alt="receipt"
                  className="h-40 w-full object-contain border rounded mb-3"
                />
              ) : (
                <div className="h-40 w-full flex items-center justify-center bg-gray-50 border rounded mb-3 text-gray-400 text-sm">
                  No image
                </div>
              )}
              <h3 className="font-semibold text-lg truncate">
                {ex.description || ex.receipt?.parsed?.merchant || "Untitled Expense"}
              </h3>
              <p className="text-gray-600 text-sm">
                {new Date(ex.createdAt).toLocaleDateString()} —{" "}
                <span className="font-medium">
                  {ex.currency} {Number(ex.totalAmount).toFixed(2)}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}