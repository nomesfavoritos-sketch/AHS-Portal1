import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { TopHeader } from "./top-header";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  CreditCard, 
  FileUp, 
  Award, 
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/student/profile", icon: User },
    { name: "Applications", href: "/student/applications", icon: FileText },
    { name: "Fee Challans", href: "/student/challans", icon: CreditCard },
    { name: "Documents", href: "/student/documents", icon: FileUp },
    { name: "Merit Status", href: "/student/merit", icon: Award },
    { name: "Notices", href: "/student/notices", icon: Bell },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <TopHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-background shrink-0 hidden md:block">
          <nav className="flex flex-col gap-1 p-4 h-full overflow-y-auto">
            <div className="mb-6 px-2">
              <h2 className="text-lg font-bold text-primary">AHS Portal</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Student Portal</p>
            </div>
            {navigation.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
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
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
