import { useGetAdminDashboardSummary, useGetRecentActivity, useGetApplicationStats } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, FileText, CheckCircle, Clock, CreditCard, Trophy, TrendingUp, AlertCircle, LogIn, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

const CHART_COLORS = ["#01411C", "#16A34A", "#D4AF37", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

function StatCard({ title, value, sub, icon: Icon, accent, trend }: { title: string; value: number | string; sub?: string; icon: React.ElementType; accent?: string; trend?: "up" | "down" }) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
              {trend && (
                <span className={`inline-flex items-center text-xs font-semibold ${trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                  {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                </span>
              )}
            </div>
            {sub && <p className="text-xs text-muted-foreground leading-relaxed">{sub}</p>}
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${accent ?? "bg-primary/8"}`}>
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}

export default function AdminDashboard() {
  // MOCK FOR PREVIEW MODE
  const summary = { totalApplications: 150, pendingApplications: 20, totalStudents: 300, totalPrograms: 8, activeSession: "2025-26 Fall Session", pendingPayments: 5, joiningIntents: 200, pendingVerifications: 12, meritListedCount: 120, approvedApplications: 280, rejectedApplications: 15 };
  const activity = [{id: 1, description: "Preview Mode initialized", userName: "Admin", createdAt: new Date().toISOString()}];
  const stats = { byProgram: [{ programCode: "CS", count: 120, approved: 100 }, { programCode: "BBA", count: 80, approved: 70 }], byStatus: [{ status: "draft", count: 10 }, { status: "admitted", count: 150 }] };
  const isLoadingSummary = false;
  const isLoadingActivity = false;
  const isLoadingStats = false;

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {summary?.activeSession
              ? <>Active session: <Badge variant="gold" className="ml-1">{summary.activeSession}</Badge></>
              : "No active session"}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Applications" value={summary?.totalApplications ?? 0} sub={`${summary?.pendingApplications ?? 0} pending review`} icon={FileText} trend="up" />
        <StatCard title="Registered Students" value={summary?.totalStudents ?? 0} sub={`Across ${summary?.totalPrograms ?? 0} programs`} icon={Users} trend="up" accent="bg-emerald-500/8" />
        <StatCard title="Pending Payments" value={summary?.pendingPayments ?? 0} sub="Awaiting challan verification" icon={CreditCard} accent="bg-amber-500/8" />
        <StatCard title="Joining Intents" value={(summary as any)?.joiningIntents ?? 0} sub="Students who confirmed intent" icon={LogIn} trend="up" accent="bg-blue-500/8" />
      </div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Verifications" value={summary?.pendingVerifications ?? 0} sub="Documents to review" icon={AlertCircle} accent="bg-orange-500/8" />
        <StatCard title="Merit Listed" value={(summary as any)?.meritListedCount ?? 0} sub="In active merit lists" icon={Trophy} accent="bg-violet-500/8" />
        <StatCard title="Admitted" value={summary?.approvedApplications ?? 0} sub="Fully admitted" icon={CheckCircle} trend="up" accent="bg-emerald-500/8" />
        <StatCard title="Rejected" value={summary?.rejectedApplications ?? 0} sub="Applications rejected" icon={AlertCircle} accent="bg-red-500/8" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Applications by Program</CardTitle>
                <CardDescription>{totalApps} total applications across all programs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {byProgram.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl text-sm bg-muted/20">No application data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byProgram} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="programCode" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number, name: string) => [v, name === "count" ? "Total" : "Admitted"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="count" fill="#01411C" name="Total" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="approved" fill="#16A34A" name="Admitted" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>Applications by current stage</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatusFiltered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl text-sm bg-muted/20">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={byStatusFiltered} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {byStatusFiltered.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [v, STATUS_LABELS[name] ?? name]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {byStatusFiltered.map((s) => (
                    <div key={s.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#94a3b8" }} />
                        <span className="text-muted-foreground font-medium">{STATUS_LABELS[s.status] ?? s.status}</span>
                      </div>
                      <span className="font-semibold text-foreground">{s.count}</span>
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
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest actions across the portal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!activity?.length ? (
            <div className="text-sm text-muted-foreground py-10 text-center border border-dashed border-border/60 rounded-2xl bg-muted/20">No recent activity</div>
          ) : (
            <div className="space-y-0 divide-y divide-border/40">
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3.5">
                  <div className="rounded-xl bg-primary/8 p-2 mt-0.5 flex-shrink-0">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
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
