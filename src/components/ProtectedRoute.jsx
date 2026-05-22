"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }

    if (
      !loading &&
      user &&
      allowedRoles.length &&
      !user.role?.some(userRole => allowedRoles.includes(userRole))
    ) {
      router.replace("/unauthorized");
    }
  }, [user, loading, router, allowedRoles]);

  if (loading || !user) return null;

  if (allowedRoles.length && !user.role?.some(userRole => allowedRoles.includes(userRole))) {
    return null;
  }

  return children;
}
