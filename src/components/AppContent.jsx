"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Layout/Navbar";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="ml-64 pt-16 p-8">{children}</main>
    </div>
  );
}

export default function AppContent({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Public pages
  if (pathname === "/login" || pathname === "/unauthorized") {
    return children;
  }

  // Loading spinner while checking cookie
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-black rounded-full" />
      </div>
    );
  }

  // Redirect if not logged in (cookie missing)
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  // Protected layout
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
