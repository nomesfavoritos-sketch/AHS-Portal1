import { useGetAdminDashboardSummary, useGetRecentActivity, useGetApplicationStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, FileText, CheckCircle, Clock, CreditCard, Trophy, TrendingUp, AlertCircle, LogIn } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  submitted: "#3b82f6",
  under_review: "#f59e0b",
  verified: "#10b981",
  merit_listed: "#8b5cf6",
  admitted: "#059669",
  rejected: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  verified: "Verified",
  merit_listed: "Merit Listed",
  admitted: "Admitted",
  rejected: "Rejected",
};

const CHART_COLORS = ["#1e3a5f", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"];

function StatCard({ title, value, sub, icon: Icon, accent }: { title: string; value: number | string; sub?: string; icon: any; accent?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

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

  const byStatusFiltered = (stats?.byStatus ?? []).filter((s) => s.count > 0);
  const byProgram = (stats?.byProgram ?? []).filter((p) => p.count > 0).slice(0, 8);
  const totalApps = stats?.byStatus?.reduce((a, s) => a + s.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {summary?.activeSession
            ? <>Active session: <span className="font-medium text-foreground">{summary.activeSession}</span></>
            : "No active session"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Applications" value={summary?.totalApplications ?? 0} sub={`${summary?.pendingApplications ?? 0} pending review`} icon={FileText} />
        <StatCard title="Registered Students" value={summary?.totalStudents ?? 0} sub={`Across ${summary?.totalPrograms ?? 0} programs`} icon={Users} accent="text-primary" />
        <StatCard title="Pending Payments" value={summary?.pendingPayments ?? 0} sub="Awaiting challan verification" icon={CreditCard} accent="text-amber-500" />
        <StatCard title="Joining Intents" value={(summary as any)?.joiningIntents ?? 0} sub="Students who confirmed intent" icon={LogIn} accent="text-green-600" />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Verifications" value={summary?.pendingVerifications ?? 0} sub="Documents to review" icon={AlertCircle} accent="text-amber-500" />
        <StatCard title="Merit Listed" value={(summary as any)?.meritListedCount ?? 0} sub="In active merit lists" icon={Trophy} accent="text-violet-500" />
        <StatCard title="Admitted" value={summary?.approvedApplications ?? 0} sub="Fully admitted" icon={CheckCircle} accent="text-green-600" />
        <StatCard title="Rejected" value={summary?.rejectedApplications ?? 0} sub="Applications rejected" icon={AlertCircle} accent="text-red-500" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar Chart — Applications by Program */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Applications by Program</CardTitle>
            <CardDescription>{totalApps} total applications across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            {byProgram.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded border-dashed text-sm">No application data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byProgram} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="programCode" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: any, name: string) => [v, name === "count" ? "Total" : "Admitted"]} />
                  <Bar dataKey="count" fill="#1e3a5f" name="Total" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="approved" fill="#10b981" name="Admitted" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart — Application Status Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Applications by current stage</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatusFiltered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded border-dashed text-sm">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={byStatusFiltered} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {byStatusFiltered.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v, STATUS_LABELS[name] ?? name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {byStatusFiltered.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#94a3b8" }} />
                        <span className="text-muted-foreground">{STATUS_LABELS[s.status] ?? s.status}</span>
                      </div>
                      <span className="font-medium">{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across the portal</CardDescription>
        </CardHeader>
        <CardContent>
          {!activity?.length ? (
            <div className="text-sm text-muted-foreground py-6 text-center border rounded border-dashed">No recent activity</div>
          ) : (
            <div className="space-y-0 divide-y">
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5 flex-shrink-0">
                    <Clock className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.userName ?? "System"} · {format(new Date(item.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
