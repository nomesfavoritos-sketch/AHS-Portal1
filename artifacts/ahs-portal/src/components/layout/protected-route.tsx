import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  // MOCK USER FOR PREVIEW MODE (Backend is offline)
  const user = { id: 1, email: "superadmin@ahscollege.edu.pk", fullName: "Dr. Muhammad Tariq", role: "super_admin" };
  const isLoading = false;
  const isError = false;

  useEffect(() => {
    if (isLoading) return;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "student") {
        setLocation("/student/dashboard");
      } else {
        setLocation("/admin/dashboard");
      }
    }
  }, [isLoading, isError, user, allowedRoles, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
