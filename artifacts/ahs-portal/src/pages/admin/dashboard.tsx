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
  verified: "#F0B429",
  merit_listed: "#8b5cf6",
  admitted: "#01411C",
  rejected: "#ef4444",
  challan_generated: "#f97316",
  slip_uploaded: "#06b6d4",
  selected_for_verification: "#0ea5e9",
  clarification_required: "#f59e0b",
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

const CHART_COLORS = ["#01411C", "#006C35", "#F0B429", "#22c55e", "#F0B429", "#86efac", "#bbf7d0", "#dcfce7"];

function StatCard({ title, value, sub, icon: Icon, accent, iconBg }: { title: string; value: number | string; sub?: string; icon: any; accent?: string; iconBg?: string }) {
  return (
    <Card className="card-hover" style={{ border: "1px solid #E5E7EB" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">{title}</CardTitle>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ background: iconBg ?? "rgba(1,65,28,0.08)" }}
        >
          <Icon className={`h-4.5 w-4.5 ${accent ?? "text-[#01411C]"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-[#0F172A]">{value}</div>
        {sub && <p className="text-[11px] text-[#94A3B8] mt-1">{sub}</p>}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Administration Dashboard</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            {summary?.activeSession
              ? <>Active Session: <span className="font-semibold" style={{ color: "#01411C" }}>{summary.activeSession}</span></>
              : "No active admission session"}
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 rounded-xl px-4 py-2"
          style={{ background: "rgba(1,65,28,0.08)", border: "1px solid rgba(1,65,28,0.15)" }}
        >
          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-[12px] font-semibold" style={{ color: "#01411C" }}>Portal Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Applications" value={summary?.totalApplications ?? 0} sub={`${summary?.pendingApplications ?? 0} pending review`} icon={FileText} />
        <StatCard title="Registered Students" value={summary?.totalStudents ?? 0} sub={`Across ${summary?.totalPrograms ?? 0} programs`} icon={Users} accent="text-primary" />
        <StatCard title="Pending Payments" value={summary?.pendingPayments ?? 0} sub="Awaiting challan verification" icon={CreditCard} accent="text-amber-500" />
        <StatCard title="Joining Intents" value={(summary as any)?.joiningIntents ?? 0} sub="Students who confirmed intent" icon={LogIn} accent="text-yellow-600" />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Verifications" value={summary?.pendingVerifications ?? 0} sub="Documents to review" icon={AlertCircle} accent="text-amber-500" />
        <StatCard title="Merit Listed" value={(summary as any)?.meritListedCount ?? 0} sub="In active merit lists" icon={Trophy} accent="text-violet-500" />
        <StatCard title="Admitted" value={summary?.approvedApplications ?? 0} sub="Fully admitted" icon={CheckCircle} accent="text-yellow-600" />
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
                  <Bar dataKey="count" fill="#006C35" name="Total" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="approved" fill="#D4AF37" name="Admitted" radius={[3, 3, 0, 0]} />
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
