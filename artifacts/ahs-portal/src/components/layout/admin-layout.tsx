import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { TopHeader } from "./top-header";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  PieChart,
  FileText,
  CreditCard,
  ListOrdered,
  ClipboardList,
  Users,
  Bell,
  History,
  Settings,
  UserCog,
  Loader2,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  // MOCK FOR PREVIEW MODE
  const user = { id: 1, email: "superadmin@ahscollege.edu.pk", fullName: "Dr. Muhammad Tariq", role: "super_admin" };
  const isLoading = false;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
      onError: () => setLocation("/login"),
    });
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admission_admin", "verification_officer", "finance_verifier"],
    },
    {
      name: "Sessions",
      href: "/admin/sessions",
      icon: CalendarDays,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Programs",
      href: "/admin/programs",
      icon: GraduationCap,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Quotas",
      href: "/admin/quotas",
      icon: PieChart,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Applications",
      href: "/admin/applications",
      icon: FileText,
      roles: ["super_admin", "admission_admin", "verification_officer"],
    },
    {
      name: "Payment Verification",
      href: "/admin/challans",
      icon: CreditCard,
      roles: ["super_admin", "finance_verifier"],
    },
    {
      name: "Merit Lists",
      href: "/admin/merit-lists",
      icon: ListOrdered,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Verification Desk",
      href: "/admin/verification",
      icon: ClipboardList,
      roles: ["super_admin", "admission_admin", "verification_officer"],
    },
    {
      name: "Joined Students",
      href: "/admin/students",
      icon: Users,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Notices",
      href: "/admin/notices",
      icon: Bell,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: BarChart3,
      roles: ["super_admin", "admission_admin"],
    },
    {
      name: "Audit Logs",
      href: "/admin/audit-logs",
      icon: History,
      roles: ["super_admin"],
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: UserCog,
      roles: ["super_admin"],
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      roles: ["super_admin", "admission_admin"],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <TopHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-background shrink-0 hidden md:block">
          <nav className="flex flex-col gap-1 p-4 h-full overflow-y-auto">
            <div className="mb-6 px-2">
              <h2 className="text-lg font-bold text-primary">AHS Portal</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                Administration
              </p>
            </div>
            {filteredNav.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/admin/verification" && location.startsWith(item.href + "/")) ||
                (item.href === "/admin/verification" && location.startsWith("/admin/verification"));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            <div className="mt-auto pt-4 border-t">
              <button
                onClick={handleLogout}
                disabled={logout.isPending}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                {logout.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Logout
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
