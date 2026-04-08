import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  User,
  FileText,
  CreditCard,
  FileUp,
  Award,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const G = "#01411C";
const GA = "#16a34a";

interface StudentLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "My Profile", href: "/student/profile", icon: User },
  { name: "Applications", href: "/student/applications", icon: FileText },
  { name: "Fee Challans", href: "/student/challans", icon: CreditCard },
  { name: "Documents", href: "/student/documents", icon: FileUp },
  { name: "Merit Status", href: "/student/merit", icon: Award },
  { name: "Notices", href: "/student/notices", icon: Bell },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  return (
    <div className="flex flex-col h-full" style={{ background: G }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base leading-tight">Allied Health Sciences</p>
            <p className="text-white/60 text-xs mt-0.5">Nishtar Medical University</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/60 hover:text-white md:hidden">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-3 inline-block rounded px-2 py-0.5 text-xs font-semibold tracking-wider" style={{ background: "rgba(255,255,255,0.12)", color: "#86efac" }}>
          STUDENT PORTAL
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group",
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
                style={isActive ? { background: "rgba(255,255,255,0.15)" } : {}}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-green-300" : "text-white/50 group-hover:text-white/80")} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-green-300 shrink-0" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs font-bold" style={{ background: GA, color: "white" }}>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? "S"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.fullName ?? "Student"}</p>
            <p className="text-white/50 text-xs truncate">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/login") })}
            className="text-white/40 hover:text-red-400 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = navigation.find(n => location === n.href || location.startsWith(n.href + "/"))?.name ?? "Portal";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="w-60 shrink-0 hidden md:flex flex-col shadow-lg" style={{ background: G }}>
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-60 flex flex-col shadow-2xl" style={{ background: G }}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b bg-white flex items-center px-4 gap-3 shadow-sm shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">Student Portal</span>
            <span className="text-gray-300 hidden sm:block">/</span>
            <span className="text-sm font-semibold text-gray-800">{currentPage}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
