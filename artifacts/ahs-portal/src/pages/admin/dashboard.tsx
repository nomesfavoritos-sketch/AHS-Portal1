import { useGetAdminDashboardSummary, useGetRecentActivity, useGetApplicationStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, CheckCircle, Clock, FileWarning, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetAdminDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { data: stats, isLoading: isLoadingStats } = useGetApplicationStats();

  if (isLoadingSummary || isLoadingActivity || isLoadingStats) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the AHS Portal administration.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active Session: {summary?.activeSession || "None"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingApplications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.approvedApplications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for merit list
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Applications by Program</CardTitle>
            <CardDescription>
              Distribution of applications across all active programs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.byProgram?.length ? (
                stats.byProgram.map((prog, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{prog.programName}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="text-green-600 font-medium mr-2">{prog.approved} approved</span>
                        <span>{prog.count - prog.approved} pending/other</span>
                      </div>
                    </div>
                    <div className="font-medium">{prog.count}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded border-dashed">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.length ? (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <Clock className="h-3 w-3 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.userName || 'System'} • {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded border-dashed">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
