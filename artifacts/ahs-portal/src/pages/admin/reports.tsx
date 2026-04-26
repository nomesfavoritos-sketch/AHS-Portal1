import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, Download, TrendingUp, Users, CreditCard, GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface ReportsSummary {
  applicationsByProgram: Array<{ programId: number; programName: string; programCode: string; total: number; admitted: number; rejected: number; merit_listed: number; submitted: number; under_review: number }>;
  applicationsByStatus: Array<{ status: string; count: number }>;
  applicationsByQuota: Array<{ quotaName: string; count: number }>;
  challanSummary: { total: number; paid: number; pending: number; rejected: number; totalRevenue: number };
  joinedByProgram: Array<{ programId: number; programName: string; count: number }>;
  sessionSummary: Array<{ sessionId: number; sessionName: string; total: number }>;
  totals: { total: number; admitted: number; rejected: number; meritListed: number; totalJoined: number; totalRevenue: number };
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  challan_generated: "#f59e0b",
  slip_uploaded: "#3b82f6",
  submitted: "#2563eb",
  under_review: "#f59e0b",
  verified: "#10b981",
  merit_listed: "#8b5cf6",
  selected_for_verification: "#0ea5e9",
  clarification_required: "#f97316",
  admitted: "#F0B429",
  rejected: "#ef4444",
};

const PIE_COLORS = ["#2563eb", "#F0B429", "#8b5cf6", "#f59e0b", "#ef4444", "#0ea5e9", "#f97316", "#10b981", "#94a3b8", "#ec4899"];

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const { data, isLoading } = useQuery<ReportsSummary>({
    queryKey: ["reports-summary"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}api/reports/summary`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load reports");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Failed to load report data. Please try again.
      </div>
    );
  }

  const { totals, applicationsByProgram, applicationsByStatus, applicationsByQuota, challanSummary, joinedByProgram, sessionSummary } = data;

  const chartData = applicationsByProgram.map(p => ({
    name: p.programCode,
    fullName: p.programName,
    Total: p.total,
    Admitted: p.admitted,
    Rejected: p.rejected,
  }));

  const paymentPieData = [
    { name: "Paid", value: challanSummary.paid },
    { name: "Pending", value: challanSummary.pending },
    { name: "Rejected", value: challanSummary.rejected },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground">Comprehensive admission data and statistics.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => exportCSV(applicationsByProgram, "applications-by-program.csv")}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Applications", value: totals.total, icon: BarChart3, color: "text-blue-600" },
          { label: "Admitted", value: totals.admitted, icon: GraduationCap, color: "text-yellow-600" },
          { label: "Rejected", value: totals.rejected, icon: TrendingUp, color: "text-red-600" },
          { label: "Merit Listed", value: totals.meritListed, icon: TrendingUp, color: "text-purple-600" },
          { label: "Joined Students", value: totals.totalJoined, icon: Users, color: "text-sky-600" },
          { label: "Revenue (PKR)", value: `${(totals.totalRevenue / 1000).toFixed(0)}K`, icon: CreditCard, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by Program</CardTitle>
            <CardDescription>Total, admitted, and rejected per program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(label) => {
                      const p = applicationsByProgram.find(p => p.programCode === label);
                      return p?.programName ?? label;
                    }}
                  />
                  <Bar dataKey="Total" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Admitted" fill="#F0B429" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Rejected" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                      {paymentPieData.map((_, i) => (
                        <Cell key={i} fill={["#F0B429", "#f59e0b", "#ef4444"][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} formatter={(v) => <span className="text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div>
                  <p className="text-lg font-bold text-yellow-600">{challanSummary.paid}</p>
                  <p className="text-xs text-muted-foreground">Paid</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{challanSummary.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{challanSummary.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Applications by Quota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {applicationsByQuota.slice(0, 5).map((q, i) => (
                  <div key={q.quotaName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground truncate max-w-[140px]">{q.quotaName === "open_merit" ? "Open Merit" : q.quotaName}</span>
                    </div>
                    <span className="font-medium">{q.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Program Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Program-wise Breakdown</CardTitle>
              <CardDescription>Detailed application pipeline per program</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => exportCSV(applicationsByProgram, "program-breakdown.csv")} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Submitted</TableHead>
                  <TableHead className="text-center">Under Review</TableHead>
                  <TableHead className="text-center">Merit Listed</TableHead>
                  <TableHead className="text-center">Admitted</TableHead>
                  <TableHead className="text-center">Rejected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationsByProgram.map(p => (
                  <TableRow key={p.programId}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{p.programName}</span>
                        <span className="ml-2 text-xs font-mono text-primary">{p.programCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{p.total}</TableCell>
                    <TableCell className="text-center text-blue-600">{(p as any).submitted ?? 0}</TableCell>
                    <TableCell className="text-center text-amber-600">{(p as any).under_review ?? 0}</TableCell>
                    <TableCell className="text-center text-purple-600">{p.merit_listed ?? 0}</TableCell>
                    <TableCell className="text-center text-yellow-600 font-medium">{p.admitted ?? 0}</TableCell>
                    <TableCell className="text-center text-red-600">{p.rejected ?? 0}</TableCell>
                  </TableRow>
                ))}
                {applicationsByProgram.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Joined Students + Session Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Joined Students by Program</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(joinedByProgram, "joined-by-program.csv")} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {joinedByProgram.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students have joined yet.</p>
            ) : (
              <div className="space-y-3">
                {joinedByProgram.map((j, i) => (
                  <div key={j.programId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate max-w-[200px]">{j.programName}</span>
                    </div>
                    <Badge variant="secondary">{j.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Session-wise Summary</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(sessionSummary, "session-summary.csv")} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessionSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No session data available.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Applications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionSummary.map(s => (
                      <TableRow key={s.sessionId}>
                        <TableCell className="text-sm">{s.sessionName}</TableCell>
                        <TableCell className="text-right font-medium">{s.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Status Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Application Status Distribution</CardTitle>
              <CardDescription>Count of applications at each pipeline stage</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => exportCSV(applicationsByStatus, "status-distribution.csv")} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {applicationsByStatus.map(s => (
              <div key={s.status} className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: STATUS_COLORS[s.status] ?? "#64748b" }}>{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{s.status.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
