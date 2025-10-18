import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <Routes>
          <Route path="/" element={<div className="p-10 text-3xl font-bold">LedgerLink</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;