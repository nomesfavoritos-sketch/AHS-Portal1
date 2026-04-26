import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
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
  Menu,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useLogout();
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

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full gov-gradient select-none">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
            <Shield className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white leading-tight truncate">AHS Portal</p>
            <p className="text-[11px] text-white/50 leading-tight font-medium">Administration Panel</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold text-white/40 tracking-widest uppercase">Main Menu</p>
        {filteredNav.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/admin/verification" && location.startsWith(item.href + "/")) ||
            (item.href === "/admin/verification" && location.startsWith("/admin/verification"));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-lg shadow-black/10 backdrop-blur-sm"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-gold" : "")} />
              <span className="truncate">{item.name}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout + Footer */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={() => { handleLogout(); onClose?.(); }}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all duration-200"
        >
          {logout.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Logout
        </button>
      </div>
      <div className="px-4 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/50 font-medium">System Online</span>
          <span className="ml-auto text-[10px] text-white/30">v1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="w-[270px] shrink-0 hidden md:flex flex-col shadow-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[270px] h-full shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
