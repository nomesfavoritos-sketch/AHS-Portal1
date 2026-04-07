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
  const { data: user, isLoading, isError } = useGetMe({
    query: { retry: false },
  } as any);

  useEffect(() => {
    if (isLoading) return;

    if (isError || !user) {
      setLocation("/login");
      return;
    }

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
