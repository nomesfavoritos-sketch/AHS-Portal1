import { useLocation, Link } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, User, Bell, Search, Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/student/dashboard":   { title: "Dashboard",    subtitle: "Your admissions overview at a glance" },
  "/student/profile":     { title: "My Profile",   subtitle: "Manage your personal & academic information" },
  "/student/applications":{ title: "Applications", subtitle: "Track & manage your program applications" },
  "/student/challans":    { title: "Fee Challans",  subtitle: "View and pay your fee challans" },
  "/student/documents":   { title: "Documents",     subtitle: "Upload and manage required documents" },
  "/student/merit":       { title: "Merit Status",  subtitle: "View your merit list position" },
  "/student/notices":     { title: "Notices",       subtitle: "Important announcements from the college" },
  "/admin/dashboard":     { title: "Dashboard",     subtitle: "Administrative overview & analytics" },
  "/admin/sessions":      { title: "Sessions",      subtitle: "Manage admission sessions" },
  "/admin/programs":      { title: "Programs",      subtitle: "Manage academic programs" },
  "/admin/quotas":        { title: "Quotas",        subtitle: "Manage admission quotas" },
  "/admin/applications":  { title: "Applications",  subtitle: "Review student applications" },
  "/admin/challans":      { title: "Payments",      subtitle: "Verify payment challans" },
  "/admin/merit-lists":   { title: "Merit Lists",   subtitle: "Generate & publish merit lists" },
  "/admin/verification":  { title: "Verification",  subtitle: "Document verification desk" },
  "/admin/students":      { title: "Students",      subtitle: "Joined students management" },
  "/admin/notices":       { title: "Notices",        subtitle: "Manage announcements" },
  "/admin/reports":       { title: "Reports",        subtitle: "Analytics & reports" },
  "/admin/audit-logs":    { title: "Audit Logs",     subtitle: "System activity logs" },
  "/admin/users":         { title: "Users",          subtitle: "Manage system users" },
  "/admin/settings":      { title: "Settings",       subtitle: "System configuration" },
};

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const meta = PAGE_META[location] ?? { title: "Portal", subtitle: "Allied Health Sciences College" };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
      onError: () => setLocation("/login"),
    });
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <header className="h-16 bg-white border-b border-border/60 flex items-center px-4 lg:px-8 gap-4 shrink-0 sticky top-0 z-10 shadow-sm">
      {/* Mobile menu button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-muted/60 text-muted-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-foreground truncate leading-tight">{meta.title}</h1>
        <p className="text-xs text-muted-foreground truncate">{meta.subtitle}</p>
      </div>

      {/* Search bar - hidden on small screens */}
      <div className="hidden lg:flex items-center relative max-w-xs w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Search..."
          className="pl-10 h-9 bg-muted/30 border-border/40 rounded-xl text-sm"
        />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Session badge */}
        <Badge variant="gold" className="hidden sm:flex text-[11px] px-3 py-1">
          2025-26 Admissions
        </Badge>

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground relative rounded-xl">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User profile dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border/40">
                <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                  <AvatarFallback className="text-xs font-bold text-white bg-pakistan-green">
                    {user.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-foreground leading-tight">{user.fullName?.split(" ")[0]}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight capitalize">{user.role?.replace(/_/g, " ")}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl shadow-lg border-border/60" align="end">
              <DropdownMenuLabel className="font-normal px-4 py-3">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg mx-1 px-3">
                <Link href="/student/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer rounded-lg mx-1 px-3"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                {logout.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
