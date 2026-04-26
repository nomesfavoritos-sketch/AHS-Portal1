import { useLocation, Link } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, LogOut, User, Bell, Search,
  ChevronDown, Shield, CheckCheck, AlertTriangle, XCircle, CheckCircle, Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL;

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/student/dashboard":    { title: "Dashboard",           subtitle: "Your admissions overview at a glance" },
  "/student/profile":      { title: "My Profile",          subtitle: "Manage your personal & academic information" },
  "/student/applications": { title: "Applications",        subtitle: "Track & manage your program applications" },
  "/student/challans":     { title: "Fee Challans",        subtitle: "View and pay your fee challans" },
  "/student/documents":    { title: "Documents",           subtitle: "Upload and manage required documents" },
  "/student/merit":        { title: "Merit Status",        subtitle: "View your merit list position & rank" },
  "/student/notices":      { title: "Notices",             subtitle: "Important announcements from the college" },
  "/admin/dashboard":      { title: "Dashboard",           subtitle: "Administration control center" },
  "/admin/sessions":       { title: "Sessions",            subtitle: "Manage admission sessions & milestones" },
  "/admin/programs":       { title: "Programs",            subtitle: "Manage AHS degree programs & seats" },
  "/admin/quotas":         { title: "Quota Categories",    subtitle: "Configure admission quota categories" },
  "/admin/applications":   { title: "Applications",        subtitle: "Review & manage student applications" },
  "/admin/challans":       { title: "Payment Verification",subtitle: "Verify student fee challans & payments" },
  "/admin/merit-lists":    { title: "Merit Lists",         subtitle: "Generate, publish & manage merit lists" },
  "/admin/verification":   { title: "Verification Desk",  subtitle: "Physical document verification queue" },
  "/admin/students":       { title: "Joined Students",     subtitle: "Students who have confirmed joining" },
  "/admin/notices":        { title: "Notices",             subtitle: "Publish announcements to students" },
  "/admin/reports":        { title: "Reports & Analytics", subtitle: "Admission statistics and KPI insights" },
  "/admin/audit-logs":     { title: "Audit Logs",          subtitle: "System activity and change history" },
  "/admin/users":          { title: "User Management",     subtitle: "Manage admin and staff accounts" },
  "/admin/settings":       { title: "Settings",            subtitle: "Configure merit formula & system settings" },
};

const ROLE_SHORT: Record<string, string> = {
  super_admin: "Super Admin",
  admission_admin: "Admission Admin",
  verification_officer: "Verification Officer",
  finance_verifier: "Finance Verifier",
  student: "Student",
};

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  createdAt: string;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "success") return <CheckCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />;
  if (type === "danger") return <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
  if (type === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
  return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationBell({ isStudent }: { isStudent: boolean }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}api/notifications`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
    enabled: isStudent,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch(`${BASE_URL}api/notifications/read-all`, {
        method: "PUT",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE_URL}api/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!isStudent) {
    return (
      <button
        className="h-9 w-9 rounded-xl flex items-center justify-center relative hover:bg-[#F8FAFC] transition-colors"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <Bell className="h-4 w-4 text-[#64748B]" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-9 w-9 rounded-xl flex items-center justify-center relative hover:bg-[#F8FAFC] transition-colors"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <Bell className="h-4 w-4 text-[#64748B]" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: "#dc2626", boxShadow: "0 0 0 2px white" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0"
        align="end"
        style={{ borderRadius: "14px", overflow: "hidden" }}
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="text-[13px] font-semibold text-[#0F172A]">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-[11px] text-[#64748B]">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-[11px] text-[#01411C] font-medium hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="h-7 w-7 text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-[12px] text-[#94A3B8]">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y divide-[#F1F5F9]">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    "w-full text-left px-4 py-3 flex gap-3 hover:bg-[#F8FAFC] transition-colors",
                    !n.isRead && "bg-yellow-50"
                  )}
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                >
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[12px] leading-snug", !n.isRead ? "font-semibold text-[#0F172A]" : "font-medium text-[#374151]")}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopHeader() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const meta = PAGE_META[location] ?? { title: "Portal", subtitle: "Allied Health Sciences · NMU" };

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/login") });
  };

  const isStudent = user?.role === "student";
  const profileHref = isStudent ? "/student/profile" : "/admin/dashboard";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const TITLES = ["Dr.", "Mr.", "Ms.", "Mrs.", "Prof.", "Engr."];
  const nameParts = user?.fullName?.split(" ") ?? [];
  const hasTitle = nameParts.length > 0 && TITLES.includes(nameParts[0]);
  const displayName = hasTitle
    ? nameParts.slice(0, 3).join(" ")
    : nameParts.slice(0, 2).join(" ");
  const initials = hasTitle
    ? (nameParts[1]?.[0] ?? "") + (nameParts[2]?.[0] ?? "")
    : nameParts.slice(0, 2).map((w: string) => w[0]).join("");
  const initialsUpper = (initials || "U").toUpperCase();

  return (
    <header
      className="h-[60px] bg-white shrink-0 flex items-center px-5 gap-4"
      style={{ borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[15px] font-bold text-[#0F172A] truncate leading-tight">{meta.title}</h1>
          <span className="text-[11px] text-[#64748B] hidden sm:block truncate">&mdash; {meta.subtitle}</span>
        </div>
        <p className="text-[11px] text-[#94A3B8] leading-tight">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div
          className="hidden lg:flex items-center gap-2 rounded-xl px-3 py-2 h-9 cursor-text"
          style={{ background: "#F8FAFC", border: "1px solid #E5E7EB" }}
        >
          <Search className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
          <span className="text-[12px] text-[#94A3B8]">Search...</span>
          <kbd className="text-[10px] text-[#CBD5E1] font-mono ml-4">⌘K</kbd>
        </div>

        <div
          className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 h-8"
          style={{ background: "rgba(1,65,28,0.07)", border: "1px solid rgba(1,65,28,0.15)" }}
        >
          <Shield className="h-3 w-3 shrink-0" style={{ color: "#01411C" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#01411C" }}>2025–26</span>
        </div>

        <NotificationBell isStudent={isStudent ?? false} />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-[#F8FAFC] transition-colors"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #01411C, #F0B429)" }}
                >
                  {initialsUpper}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[12px] font-semibold text-[#0F172A] leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] leading-tight" style={{ color: "#64748B" }}>
                    {ROLE_SHORT[user.role] ?? "User"}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8] hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" style={{ borderRadius: "14px" }}>
              <DropdownMenuLabel className="font-normal py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #01411C, #F0B429)" }}
                  >
                    {initialsUpper}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#0F172A]">{user.fullName}</p>
                    <p className="text-[11px] text-[#64748B]">{user.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profileHref} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {isStudent ? "My Profile" : "Dashboard"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                {logout.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <LogOut className="mr-2 h-4 w-4" />
                }
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
