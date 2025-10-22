import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Groups", path: "/groups" },
    { name: "Upload", path: "/upload" },
  ];

  const isActive = (path: string) =>
    loc.pathname.startsWith(path)
      ? "text-primary font-semibold"
      : "text-gray-600 hover:text-primary";

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Left: Logo / App name */}
        <Link to="/dashboard" className="text-2xl font-bold text-primary">
          LedgerLink
        </Link>

        {/* Center: Nav links */}
        <div className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} className={`text-sm ${isActive(item.path)}`}>
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right: User info */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-gray-700 text-sm">Hi, {user.name || "User"}</span>
              <button
                onClick={() => {
                  logout();
                  nav("/login");
                }}
                className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}