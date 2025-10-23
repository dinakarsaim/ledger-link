// // frontend/src/pages/app/ReceiptReview.tsx
// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import api from "../../api";

// type Item = {
//   description?: string;
//   quantity?: number | null;
//   unit_price?: number | null;
//   total_price?: number | null;
//   line?: string;
//   confidence?: number | null;
//   id?: string; // local-only id for React key
// };

// type ParsedSchema = {
//   merchant?: string | null;
//   date?: string | null;
//   currency?: string | null;
//   total?: number | null;
//   subtotal?: number | null;
//   tax?: number | null;
//   items?: Item[];
//   raw_text?: string;
//   confidence?: number | null;
// };

// export default function ReceiptReview() {
//   const { id } = useParams<{ id: string }>();
//   const loc = useLocation();
//   const nav = useNavigate();

//   const [receipt, setReceipt] = useState<any>(loc.state?.receipt ?? null);
//   const [parsed, setParsed] = useState<ParsedSchema | null>(loc.state?.parsed ?? null);

//   const [loading, setLoading] = useState(false);
//   const [retrying, setRetrying] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // helper to ensure items have local ids
//   const ensureItems = (items?: Item[] | null) =>
//     (items ?? []).map((it, i) => ({ id: it.id ?? `local-${i}-${Date.now()}`, ...it }));

//   useEffect(() => {
//     // If state not passed, fetch the receipt
//     const fetch = async () => {
//       if (id && !receipt) {
//         setLoading(true);
//         try {
//           const r = await api.get(`/receipts/${id}`);
//           setReceipt(r.data.receipt);
//           setParsed((r.data.receipt?.parsed as ParsedSchema) ?? null);
//         } catch (e) {
//           setError("Failed to load receipt");
//         } finally {
//           setLoading(false);
//         }
//       }
//     };
//     fetch();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   useEffect(() => {
//     // normalize parsed.items shape on first load
//     if (parsed && parsed.items) {
//       setParsed((p) => ({ ...(p ?? {}), items: ensureItems(p?.items) }));
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Utility: normalize numeric strings -> numbers, or null
//   const normNumber = (v: any): number | null => {
//     if (v === null || v === undefined || v === "") return null;
//     if (typeof v === "number") return Number(v);
//     const s = String(v).replace(/[^\d.-]/g, "");
//     const n = Number(s);
//     return Number.isFinite(n) ? n : null;
//   };

//   const updateParsedField = (patch: Partial<ParsedSchema>) => {
//     setParsed((p) => ({ ...(p ?? {}), ...patch }));
//   };

//   // Item handlers
//   const updateItem = (idx: number, patch: Partial<Item>) => {
//     setParsed((p) => {
//       const items = ensureItems(p?.items);
//       items[idx] = { ...items[idx], ...patch };
//       return { ...(p ?? {}), items };
//     });
//   };

//   const addItem = () => {
//     setParsed((p) => {
//       const items = ensureItems(p?.items);
//       items.push({ id: `local-${items.length}-${Date.now()}`, description: "", quantity: 1, unit_price: null, total_price: null, confidence: 0.8 });
//       return { ...(p ?? {}), items };
//     });
//   };

//   const removeItem = (idx: number) => {
//     setParsed((p) => {
//       const items = ensureItems(p?.items).filter((_, i) => i !== idx);
//       return { ...(p ?? {}), items };
//     });
//   };

//   // Retry parse by calling POST /api/receipts/:id/parse (server runs Gemini/OCR)
//   const retryParse = async () => {
//     if (!id) return;
//     setRetrying(true);
//     setError(null);
//     try {
//       const res = await api.post(`/receipts/${id}/parse`);
//       const newParsed = res.data.parsed ?? res.data.receipt?.parsed ?? null;
//       setParsed(newParsed ? ensureItems(newParsed.items) ? { ...newParsed, items: ensureItems(newParsed.items) } : newParsed : null);
//     } catch (e: any) {
//       setError(e?.response?.data?.error || e?.message || "Parse failed");
//     } finally {
//       setRetrying(false);
//     }
//   };

//   // Save edited parsed JSON to backend. Uses PATCH /api/receipts/:id
//   const saveEdits = async () => {
//     if (!id) return;
//     setSaving(true);
//     setError(null);

//     try {
//       // Normalize numbers before sending
//       const normalized: ParsedSchema = {
//         ...(parsed ?? {}),
//         total: normNumber(parsed?.total),
//         subtotal: normNumber(parsed?.subtotal),
//         tax: normNumber(parsed?.tax),
//         items: (parsed?.items ?? []).map((it) => ({
//           description: it.description?.trim() ?? "",
//           quantity: normNumber(it.quantity) ?? 1,
//           unit_price: normNumber(it.unit_price),
//           total_price: normNumber(it.total_price),
//           line: it.line ?? undefined,
//           confidence: typeof it.confidence === "number" ? Math.min(1, Math.max(0, Number(it.confidence))) : undefined,
//           id: it.id,
//         })),
//       };

//       // Prefer PATCH. If backend doesn't support PATCH, this will return error.
//       await api.patch(`/receipts/${id}`, { parsed: normalized });
//       // Optionally navigate to create expense page or dashboard
//       nav("/dashboard");
//     } catch (e: any) {
//       console.error("saveEdits error", e);
//       setError(e?.response?.data?.error || e?.message || "Failed to save parsed receipt");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Create expense from parsed (simple POST to /api/expenses) — optional
//   const createExpenseFromParsed = async () => {
//     if (!id || !parsed) return;
//     setSaving(true);
//     setError(null);
//     try {
//       // Build expense payload from parsed
//       const payload = {
//         receiptId: id,
//         payerId: undefined, // optionally set to current user from context
//         totalAmount: normNumber(parsed.total) ?? 0,
//         currency: parsed.currency ?? "INR",
//         description: parsed.merchant ?? "Receipt expense",
//         splits: [], // you can implement splits creation UI separately
//         parsed,
//       };
//       // Example endpoint; implement on backend if not present
//       await api.post("/expenses", payload);
//       nav("/dashboard");
//     } catch (e: any) {
//       setError(e?.response?.data?.error || "Failed to create expense");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <div className="p-8">Loading receipt...</div>;

//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-6">
//       <h2 className="text-xl font-semibold mb-4">Review Receipt</h2>

//       {receipt && (
//         <div className="mb-4">
//           <img src={receipt.imageUrl} alt="receipt" className="max-h-96 object-contain border" />
//         </div>
//       )}

//       <div className="mb-4">
//         <label className="block font-medium mb-1">Merchant</label>
//         <input
//           className="w-full p-2 border rounded"
//           value={parsed?.merchant ?? ""}
//           onChange={(e) => updateParsedField({ merchant: e.target.value })}
//         />
//       </div>

//       <div className="grid grid-cols-3 gap-4 mb-4">
//         <div>
//           <label className="block font-medium mb-1">Date</label>
//           <input
//             className="w-full p-2 border rounded"
//             value={parsed?.date ?? ""}
//             onChange={(e) => updateParsedField({ date: e.target.value })}
//           />
//         </div>
//         <div>
//           <label className="block font-medium mb-1">Currency</label>
//           <input
//             className="w-full p-2 border rounded"
//             value={parsed?.currency ?? ""}
//             onChange={(e) => updateParsedField({ currency: e.target.value })}
//           />
//         </div>
//         <div>
//           <label className="block font-medium mb-1">Total</label>
//           <input
//             className="w-full p-2 border rounded"
//             value={parsed?.total ?? ""}
//             onChange={(e) => updateParsedField({ total: normNumber(e.target.value) })}
//           />
//         </div>
//       </div>

//       <div className="mb-4">
//         <label className="block font-medium mb-2">Items</label>
//         <div className="space-y-3">
//           {(parsed?.items ?? []).map((it, idx) => (
//             <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
//               <input
//                 className="col-span-6 p-2 border rounded"
//                 value={it.description ?? ""}
//                 onChange={(e) => updateItem(idx, { description: e.target.value })}
//                 placeholder="Description"
//               />
//               <input
//                 className="col-span-2 p-2 border rounded"
//                 value={it.quantity ?? ""}
//                 onChange={(e) => updateItem(idx, { quantity: normNumber(e.target.value) })}
//                 placeholder="Qty"
//               />
//               <input
//                 className="col-span-2 p-2 border rounded"
//                 value={it.unit_price ?? ""}
//                 onChange={(e) => updateItem(idx, { unit_price: normNumber(e.target.value) })}
//                 placeholder="Unit"
//               />
//               <input
//                 className="col-span-2 p-2 border rounded"
//                 value={it.total_price ?? ""}
//                 onChange={(e) => updateItem(idx, { total_price: normNumber(e.target.value) })}
//                 placeholder="Total"
//               />
//               <div className="col-span-12 text-xs text-gray-500">{it.line ?? null}</div>
//               <div className="col-span-12 flex gap-2 mt-1">
//                 <button type="button" onClick={() => removeItem(idx)} className="px-2 py-1 bg-red-100 rounded text-sm">Remove</button>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="mt-3 flex gap-3">
//           <button onClick={addItem} className="px-3 py-2 bg-gray-100 rounded">Add item</button>
//           <button onClick={retryParse} disabled={retrying} className="px-3 py-2 bg-yellow-100 rounded">
//             {retrying ? "Retrying..." : "Retry Parse"}
//           </button>
//         </div>
//       </div>

//       <div className="mb-4">
//         <label className="block font-medium mb-1">Raw OCR Text</label>
//         <textarea
//           className="w-full p-2 border rounded"
//           rows={6}
//           value={parsed?.raw_text ?? ""}
//           onChange={(e) => updateParsedField({ raw_text: e.target.value })}
//         />
//       </div>

//       {error && <div className="text-red-600 mb-2">{error}</div>}

//       <div className="flex gap-3">
//         <button onClick={saveEdits} disabled={saving} className="px-4 py-2 bg-primary text-white rounded">
//           {saving ? "Saving..." : "Save"}
//         </button>

//         <button onClick={createExpenseFromParsed} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
//           {saving ? "..." : "Save & Create Expense"}
//         </button>

//         <button onClick={() => nav("/dashboard")} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../api";

type Item = {
  id?: string;
  description?: string;
  quantity?: number | null;
  unit_price?: number | null;
  total_price?: number | null;
  confidence?: number | null;
};

type ParsedSchema = {
  merchant?: string | null;
  date?: string | null;
  currency?: string | null;
  total?: number | null;
  subtotal?: number | null;
  tax?: number | null;
  items?: Item[];
};

type Group = {
  id: string;
  name: string;
};

export default function ReceiptReview() {
  const { id } = useParams<{ id: string }>();
  const loc = useLocation();
  const nav = useNavigate();

  const [receipt, setReceipt] = useState<any>(loc.state?.receipt ?? null);
  const [parsed, setParsed] = useState<ParsedSchema | null>(loc.state?.parsed ?? null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | "">("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure local item IDs
  const ensureItems = (items?: Item[] | null) =>
    (items ?? []).map((it, i) => ({ id: it.id ?? `local-${i}-${Date.now()}`, ...it }));

  // Load receipt if not passed
  useEffect(() => {
    if (!receipt && id) {
      setLoading(true);
      api
        .get(`/receipts/${id}`)
        .then((r) => {
          setReceipt(r.data.receipt);
          setParsed(r.data.receipt?.parsed ?? null);
        })
        .catch(() => setError("Failed to load receipt"))
        .finally(() => setLoading(false));
    }
  }, [id, receipt]);

  // Fetch user's groups
  useEffect(() => {
    api
      .get("/groups")
      .then((r) => setGroups(r.data.groups || []))
      .catch(() => setGroups([]));
  }, []);

  // Utility: normalize numeric input
  const normNumber = (v: any): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v).replace(/[^\d.-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const updateParsedField = (patch: Partial<ParsedSchema>) =>
    setParsed((p) => ({ ...(p ?? {}), ...patch }));

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setParsed((p) => {
      const items = ensureItems(p?.items);
      items[idx] = { ...items[idx], ...patch };
      return { ...(p ?? {}), items };
    });
  };

  const addItem = () =>
    setParsed((p) => {
      const items = ensureItems(p?.items);
      items.push({
        id: `local-${items.length}-${Date.now()}`,
        description: "",
        quantity: 1,
        unit_price: null,
        total_price: null,
      });
      return { ...(p ?? {}), items };
    });

  const removeItem = (idx: number) =>
    setParsed((p) => {
      const items = ensureItems(p?.items).filter((_, i) => i !== idx);
      return { ...(p ?? {}), items };
    });

  const saveExpense = async () => {
    if (!id || !parsed) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/expenses", {
        receiptId: id,
        groupId: selectedGroupId || null,
        totalAmount: parsed.total ?? 0,
        currency: parsed.currency ?? "INR",
        description: parsed.merchant ?? "Receipt expense",
        parsed,
      });
      nav("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading receipt...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Review Receipt</h2>

      {receipt && (
        <div className="mb-4">
          <img src={receipt.imageUrl} alt="receipt" className="max-h-96 object-contain border" />
        </div>
      )}

      {/* Merchant */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Merchant</label>
        <input
          className="w-full p-2 border rounded"
          value={parsed?.merchant ?? ""}
          onChange={(e) => updateParsedField({ merchant: e.target.value })}
        />
      </div>

      {/* Date / Currency / Total */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block font-medium mb-1">Date</label>
          <input
            className="w-full p-2 border rounded"
            value={parsed?.date ?? ""}
            onChange={(e) => updateParsedField({ date: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Currency</label>
          <input
            className="w-full p-2 border rounded"
            value={parsed?.currency ?? ""}
            onChange={(e) => updateParsedField({ currency: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Total</label>
          <input
            className="w-full p-2 border rounded"
            type="number"
            value={parsed?.total ?? ""}
            onChange={(e) => updateParsedField({ total: normNumber(e.target.value) })}
          />
        </div>
      </div>

      {/* 🧑‍🤝‍🧑 Group Selector */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Assign to Group</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
        >
          <option value="">Personal (no group)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items table */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Items</label>
        <div className="space-y-3">
          {(parsed?.items ?? []).map((it, idx) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-6 p-2 border rounded"
                value={it.description ?? ""}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                placeholder="Description"
              />
              <input
                className="col-span-2 p-2 border rounded"
                value={it.quantity ?? ""}
                onChange={(e) => updateItem(idx, { quantity: normNumber(e.target.value) })}
                placeholder="Qty"
              />
              <input
                className="col-span-2 p-2 border rounded"
                value={it.unit_price ?? ""}
                onChange={(e) => updateItem(idx, { unit_price: normNumber(e.target.value) })}
                placeholder="Unit"
              />
              <input
                className="col-span-2 p-2 border rounded"
                value={it.total_price ?? ""}
                onChange={(e) => updateItem(idx, { total_price: normNumber(e.target.value) })}
                placeholder="Total"
              />
              <div className="col-span-12 flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="px-2 py-1 bg-red-100 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <button onClick={addItem} className="px-3 py-2 bg-gray-100 rounded">
            Add item
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={saveExpense}
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          {saving ? "Saving..." : "Save & Create Expense"}
        </button>

        <button
          onClick={() => nav("/dashboard")}
          className="px-4 py-2 bg-gray-100 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}