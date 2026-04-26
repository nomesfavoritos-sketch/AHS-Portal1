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
  const { data: user, isLoading, isError } = useGetMe();

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
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-[13px] text-white"
            style={{ background: "linear-gradient(135deg, #01411C, #F0B429)" }}
          >
            AHS
          </div>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#01411C" }} />
        </div>
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
