import { useLocation, Link } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, User, Bell } from "lucide-react";
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
};

export function TopHeader() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const meta = PAGE_META[location] ?? { title: "Portal", subtitle: "Allied Health Sciences College" };

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => setLocation("/login") });
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PK", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <header className="h-16 bg-white border-b flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-gray-900 truncate leading-tight">{meta.title}</h1>
        <p className="text-xs text-gray-400 truncate">{meta.subtitle} &nbsp;·&nbsp; {dateStr}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 relative">
          <Bell className="h-4.5 w-4.5" />
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-bold text-white" style={{ background: "#01411C" }}>
                    {user.fullName?.charAt(0)?.toUpperCase() ?? "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{user.fullName?.split(" ")[0]}</p>
                  <p className="text-xs text-gray-400 leading-tight">Student</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="end">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/student/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
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
