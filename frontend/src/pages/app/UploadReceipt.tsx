// // src/pages/app/UploadReceipt.tsx
// import React, { useState } from "react";
// import api from "../../api"; // axios instance
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";

// export default function UploadReceipt() {
//   const [file, setFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [progress, setProgress] = useState<number>(0);
//   const [error, setError] = useState<string | null>(null);
//   const nav = useNavigate();
//   const { user } = useAuth();

//   const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0] ?? null;
//     setFile(f);
//     setError(null);
//     if (f) {
//       const url = URL.createObjectURL(f);
//       setPreview(url);
//     } else {
//       setPreview(null);
//     }
//   };

//   const submit = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (!file) return setError("Select a file first");
//     setUploading(true);
//     setProgress(0);
//     try {
//       const fd = new FormData();
//       fd.append("file", file);

//       const res = await api.post("/receipts", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//         onUploadProgress: (ev) => {
//           if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
//         },
//       });

//       // const res = await api.post("/receipts", fd, { ... });
//       const receipt = res.data.receipt;
//       const ocrText = res.data.ocrText;
//       if (ocrText) {
//         // open a review page and pass OCR text via state or fetch it later
//         nav(`/receipts/${receipt.id}/review`, { state: { ocrText } });
//       } else {
//         nav("/dashboard");
//       }

//       // const receipt = res.data.receipt;
//       // // navigate to receipt review page (create later), for now go to dashboard/home
//       // nav("/dashboard");
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.response?.data?.error || "Upload failed");
//     } finally {
//       setUploading(false);
//       setProgress(0);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-6">
//       <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
//       <p className="text-sm text-gray-500 mb-4">Take a photo or upload a receipt image (jpg/png).</p>

//       <form onSubmit={submit} className="space-y-4">
//         <input type="file" accept="image/*" onChange={onFileChange} />
//         {preview && (
//           <div className="mt-2">
//             <img src={preview} alt="preview" className="max-h-56 object-contain border" />
//           </div>
//         )}

//         {uploading && (
//           <div className="w-full bg-gray-100 h-3 rounded overflow-hidden mt-2">
//             <div className="h-3 bg-primary" style={{ width: `${progress}%` }} />
//           </div>
//         )}

//         {error && <div className="text-red-600">{error}</div>}

//         <div className="flex gap-3">
//           <button disabled={uploading} type="submit" className="px-4 py-2 bg-primary text-white rounded">
//             {uploading ? `Uploading ${progress}%` : "Upload"}
//           </button>
//           <button type="button" onClick={() => { setFile(null); setPreview(null); setError(null); }} className="px-4 py-2 bg-gray-100 rounded">
//             Clear
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// frontend/src/pages/app/UploadReceipt.tsx
import React, { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function UploadReceipt() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();
  const { user } = useAuth();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!file) return setError("Select a file first");
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);

      // POST upload (backend now runs OCR + parse synchronously)
      const res = await api.post("/receipts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });

      const receipt = res.data.receipt;
      const parsed = res.data.parsed ?? res.data.receipt?.parsed ?? null;

      // Navigate to review page, passing data via state for immediate display
      nav(`/receipts/${receipt.id}/review`, { state: { receipt, parsed } });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
      <form onSubmit={submit} className="space-y-4">
        <input type="file" accept="image/*" onChange={onFileChange} />
        {preview && (
          <div className="mt-2">
            <img src={preview} alt="preview" className="max-h-56 object-contain border" />
          </div>
        )}

        {uploading && (
          <div className="w-full bg-gray-100 h-3 rounded overflow-hidden mt-2">
            <div className="h-3 bg-primary" style={{ width: `${progress}%` }} />
          </div>
        )}

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button disabled={uploading} type="submit" className="px-4 py-2 bg-primary text-white rounded">
            {uploading ? `Uploading ${progress}%` : "Upload & Parse"}
          </button>
          <button type="button" onClick={() => { setFile(null); setPreview(null); setError(null); }} className="px-4 py-2 bg-gray-100 rounded">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}