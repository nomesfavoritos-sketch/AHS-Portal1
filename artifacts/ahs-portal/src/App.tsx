import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StudentLayout } from "@/components/layout/student-layout";

import PublicMeritSearch from "@/pages/merit-search";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPrograms from "@/pages/admin/programs";
import AdminSessions from "@/pages/admin/sessions";
import AdminQuotas from "@/pages/admin/quotas";
import AdminNotices from "@/pages/admin/notices";
import AdminUsers from "@/pages/admin/users";
import AdminApplications from "@/pages/admin/applications";
import AdminChallans from "@/pages/admin/challans";
import AdminMeritLists from "@/pages/admin/merit-lists";
import AdminVerification from "@/pages/admin/verification";
import AdminStudents from "@/pages/admin/students";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminSettings from "@/pages/admin/settings";

import StudentDashboard from "@/pages/student/dashboard";
import StudentProfile from "@/pages/student/profile";
import StudentApplications from "@/pages/student/applications";
import StudentChallans from "@/pages/student/challans";
import StudentDocuments from "@/pages/student/documents";
import StudentMerit from "@/pages/student/merit";
import StudentNotices from "@/pages/student/notices";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/merit-search" component={PublicMeritSearch} />

      {/* Admin Routes */}
      <Route path="/admin/*">
        <ProtectedRoute allowedRoles={["super_admin", "admission_admin", "verification_officer", "finance_verifier"]}>
          <AdminLayout>
            <Switch>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/programs" component={AdminPrograms} />
              <Route path="/admin/sessions" component={AdminSessions} />
              <Route path="/admin/quotas" component={AdminQuotas} />
              <Route path="/admin/notices" component={AdminNotices} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/applications" component={AdminApplications} />
              <Route path="/admin/challans" component={AdminChallans} />
              <Route path="/admin/merit-lists" component={AdminMeritLists} />
              <Route path="/admin/verification" component={AdminVerification} />
              <Route path="/admin/students" component={AdminStudents} />
              <Route path="/admin/audit-logs" component={AdminAuditLogs} />
              <Route path="/admin/settings" component={AdminSettings} />
              
              {/* Fallback for unimplemented admin routes */}
              <Route path="/admin/:page">
                {({ page }) => (
                  <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                    <h2 className="text-xl font-bold mb-2">Page Under Construction</h2>
                    <p>The /admin/{page} page is being built.</p>
                  </div>
                )}
              </Route>
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      {/* Student Routes */}
      <Route path="/student/*">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLayout>
            <Switch>
              <Route path="/student/dashboard" component={StudentDashboard} />
              <Route path="/student/profile" component={StudentProfile} />
              <Route path="/student/applications" component={StudentApplications} />
              <Route path="/student/challans" component={StudentChallans} />
              <Route path="/student/documents" component={StudentDocuments} />
              <Route path="/student/merit" component={StudentMerit} />
              <Route path="/student/notices" component={StudentNotices} />
              
              {/* Fallback for unimplemented student routes */}
              <Route path="/student/:page">
                {({ page }) => (
                  <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                    <h2 className="text-xl font-bold mb-2">Page Under Construction</h2>
                    <p>The /student/{page} page is being built.</p>
                  </div>
                )}
              </Route>
            </Switch>
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
