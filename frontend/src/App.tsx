// // src/App.tsx
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
// import Login from "./pages/auth/Login";
// import Register from "./pages/auth/Register";
// import Home from "./pages/app/Home";
// import Dashboard from "./pages/app/Dashboard";
// import UploadReceipt from "./pages/app/UploadReceipt";
// import ReceiptReview from "./pages/app/ReceiptReview";
// import Groups from "./pages/app/Groups";


// function ProtectedRoute({ children }: { children: JSX.Element }) {
//   const { user, loading } = useAuth();
//   if (loading) return <div className="p-8">Loading...</div>;
//   if (!user) return <Navigate to="/login" replace />;
//   return children;
// }

// export default function App() {
//   const { user, loading } = useAuth();

//   return (
//     <Router>
//       <div className="min-h-screen bg-gray-50 text-gray-800">
//         <Routes>
//           {/* Home (Protected) */}
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <Home />
//               </ProtectedRoute>
//             }
//           />

//           {/* Dashboard (Protected) */}
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />

//           {/* Auth Routes */}
//           <Route
//             path="/login"
//             element={loading ? <div className="p-8">Loading...</div> : user ? <Navigate to="/" replace /> : <Login />}
//           />
//           <Route
//             path="/register"
//             element={loading ? <div className="p-8">Loading...</div> : user ? <Navigate to="/" replace /> : <Register />}
//           />

//           <Route
//             path="/receipts/upload"
//             element={
//               <ProtectedRoute>
//                 <UploadReceipt />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/receipts/:id/review"
//             element={
//               <ProtectedRoute>
//                 <ReceiptReview />
//               </ProtectedRoute>
//             }
//           />
          
//           <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />

//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/app/Home";
import Dashboard from "./pages/app/Dashboard";
import UploadReceipt from "./pages/app/UploadReceipt";
import ReceiptReview from "./pages/app/ReceiptReview";
import Groups from "./pages/app/Groups";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const hideNavbar = ["/login", "/register"].includes(loc.pathname);
  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="min-h-screen bg-gray-50 text-gray-800">{children}</div>
    </>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Home (Protected) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Dashboard (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Auth Routes (No Navbar) */}
          <Route
            path="/login"
            element={
              loading ? (
                <div className="p-8">Loading...</div>
              ) : user ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/register"
            element={
              loading ? (
                <div className="p-8">Loading...</div>
              ) : user ? (
                <Navigate to="/" replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Receipts */}
          <Route
            path="/receipts/upload"
            element={
              <ProtectedRoute>
                <UploadReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts/:id/review"
            element={
              <ProtectedRoute>
                <ReceiptReview />
              </ProtectedRoute>
            }
          />

          {/* Groups */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}