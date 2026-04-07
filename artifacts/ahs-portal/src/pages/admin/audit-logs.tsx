import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Search, History, Download, RefreshCw } from "lucide-react";

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "register", label: "Register" },
  { value: "profile_update", label: "Profile Update" },
  { value: "application_created", label: "Application Created" },
  { value: "application_submitted", label: "Application Submitted" },
  { value: "application_status_updated", label: "Status Updated" },
  { value: "challan_generated", label: "Challan Generated" },
  { value: "paid_slip_uploaded", label: "Slip Uploaded" },
  { value: "payment_verified", label: "Payment Verified" },
  { value: "payment_rejected", label: "Payment Rejected" },
  { value: "merit_list_generated", label: "Merit List Generated" },
  { value: "merit_list_published", label: "Merit List Published" },
  { value: "merit_list_frozen", label: "Merit List Frozen" },
  { value: "joining_intent_confirmed", label: "Joining Intent" },
  { value: "verification_decision", label: "Verification Decision" },
  { value: "student_removed", label: "Student Removed" },
  { value: "notice_created", label: "Notice Created" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

const ENTITY_OPTIONS = [
  { value: "all", label: "All Entities" },
  { value: "application", label: "Application" },
  { value: "user", label: "User" },
  { value: "challan", label: "Challan" },
  { value: "merit_list", label: "Merit List" },
  { value: "notice", label: "Notice" },
  { value: "program", label: "Program" },
  { value: "session", label: "Session" },
  { value: "joined_student", label: "Joined Student" },
  { value: "verification", label: "Verification" },
];

function ActionBadge({ action }: { action: string }) {
  if (action.includes("login") || action === "register") {
    return <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">{action}</Badge>;
  }
  if (action.includes("reject") || action.includes("removed") || action.includes("delete")) {
    return <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">{action.replace(/_/g, " ")}</Badge>;
  }
  if (action.includes("verified") || action.includes("admitted") || action.includes("joined") || action.includes("published")) {
    return <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">{action.replace(/_/g, " ")}</Badge>;
  }
  if (action.includes("merit") || action.includes("generated")) {
    return <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">{action.replace(/_/g, " ")}</Badge>;
  }
  return <Badge variant="outline" className="text-xs">{action.replace(/_/g, " ")}</Badge>;
}

function exportCSV(logs: any[]) {
  if (!logs.length) return;
  const rows = logs.map(l => [
    l.createdAt,
    l.userFullName || l.userId || "System",
    l.action,
    l.entityType || "",
    l.entityId || "",
    l.details || "",
    l.ipAddress || "",
  ].map(v => JSON.stringify(v)).join(","));
  const csv = ["Timestamp,User,Action,Entity,Entity ID,Details,IP"].concat(rows).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditLogs() {
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const queryParams: any = { limit, page };
  if (actionFilter !== "all") queryParams.action = actionFilter;
  if (entityFilter !== "all") queryParams.entityType = entityFilter;
  if (dateFrom) queryParams.dateFrom = dateFrom;
  if (dateTo) queryParams.dateTo = dateTo;

  const { data: logsData, isLoading, refetch } = useListAuditLogs(queryParams);

  const total = (logsData as any)?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System-wide activity log, security events, and change history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCSV(logsData?.logs ?? [])} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Activity History
            {total > 0 && <span className="text-muted-foreground font-normal">({total} records)</span>}
          </CardTitle>
          <CardDescription>
            Filter by action type, entity, or date range. Newest entries shown first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Action Type</Label>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Entity Type</Label>
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input type="date" className="h-8 text-xs" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input type="date" className="h-8 text-xs" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !logsData?.logs.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No audit logs match the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="max-w-[250px]">Details</TableHead>
                      <TableHead className="w-[100px]">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.logs.map((log: any) => (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="font-mono text-muted-foreground">
                          {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          {log.userFullName ? (
                            <div>
                              <span className="font-medium text-xs">{log.userFullName}</span>
                              <span className="block text-muted-foreground text-[10px]">{log.userEmail}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">System</span>
                          )}
                        </TableCell>
                        <TableCell><ActionBadge action={log.action} /></TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.entityType}
                          {log.entityId ? <span className="text-primary ml-1">#{log.entityId}</span> : ""}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <span className="truncate block" title={log.details || ""}>{log.details || "—"}</span>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-[10px]">
                          {log.ipAddress || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
