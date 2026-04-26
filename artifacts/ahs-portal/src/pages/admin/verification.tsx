import { useState } from "react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ClipboardList, ChevronRight, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CandidateRow {
  applicationId: number;
  applicationNumber: string;
  status: string;
  submittedAt: string | null;
  meritScore: number | null;
  joiningIntentAt: string | null;
  user: { fullName?: string; email?: string } | null;
  program: { name?: string; code?: string } | null;
  cnic: string | null;
  verifiedCount: number;
  totalItems: number;
  latestDecision: string | null;
}

function getStatusBadge(status: string) {
  const map: Record<string, JSX.Element> = {
    submitted: <Badge variant="secondary">Submitted</Badge>,
    under_review: <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Under Review</Badge>,
    verified: <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Verified</Badge>,
    merit_listed: <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Merit Listed</Badge>,
    admitted: <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">Admitted</Badge>,
    selected_for_verification: <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white">For Verification</Badge>,
    clarification_required: <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Clarification Reqd.</Badge>,
    rejected: <Badge variant="destructive">Rejected</Badge>,
  };
  return map[status] ?? <Badge variant="outline">{status}</Badge>;
}

function getDecisionBadge(decision: string | null) {
  if (!decision) return null;
  const map: Record<string, JSX.Element> = {
    accept_joining: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Accepted</Badge>,
    reject_joining: <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>,
    send_back: <Badge className="bg-amber-100 text-amber-800 border-amber-200">Sent Back</Badge>,
  };
  return map[decision] ?? null;
}

function ChecklistProgress({ verified, total }: { verified: number; total: number }) {
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct === 100 ? "bg-yellow-500" : pct >= 50 ? "bg-amber-500" : "bg-muted-foreground/30"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {verified}/{total}
      </span>
    </div>
  );
}

export default function AdminVerification() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (search) params.set("search", search);

  const { data, isLoading, error } = useQuery<CandidateRow[]>({
    queryKey: ["verification-desk", statusFilter, search],
    queryFn: async () => {
      const res = await fetch(`/api/verification-desk?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load verification queue");
      return res.json();
    },
    staleTime: 15_000,
  });

  const candidates = data ?? [];
  const pendingCount = candidates.filter((c) => !c.latestDecision).length;
  const acceptedCount = candidates.filter((c) => c.latestDecision === "accept_joining").length;
  const rejectedCount = candidates.filter((c) => c.latestDecision === "reject_joining").length;
  const sentBackCount = candidates.filter((c) => c.latestDecision === "send_back").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification Desk</h1>
        <p className="text-muted-foreground">
          Review applicant documents, verify checklist items, and issue joining decisions.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Awaiting Decision", count: pendingCount, icon: Clock, cls: "text-amber-600" },
          { label: "Accepted", count: acceptedCount, icon: CheckCircle, cls: "text-yellow-600" },
          { label: "Rejected", count: rejectedCount, icon: XCircle, cls: "text-red-600" },
          { label: "Sent Back", count: sentBackCount, icon: AlertCircle, cls: "text-orange-600" },
        ].map(({ label, count, icon: Icon, cls }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${cls}`} />
              <div>
                <div className={`text-2xl font-bold ${cls}`}>{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Verification Queue
          </CardTitle>
          <CardDescription>
            All applications eligible for joining verification. Click a candidate to open the full verification desk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, CNIC, or application number..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Eligible</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="merit_listed">Merit Listed</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="selected_for_verification">For Verification</SelectItem>
                <SelectItem value="clarification_required">Clarification Reqd.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive text-sm border rounded border-dashed border-destructive/30">
              Failed to load verification queue.
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border rounded border-dashed">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No candidates found
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => (
                <Link key={c.applicationId} href={`/admin/verification/${c.applicationId}`}>
                  <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{c.user?.fullName ?? "—"}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {c.applicationNumber}
                          </span>
                          {getStatusBadge(c.status)}
                          {getDecisionBadge(c.latestDecision)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-3">
                          {c.program?.name && <span>{c.program.name}</span>}
                          {c.cnic && <span>CNIC: {c.cnic}</span>}
                          {c.meritScore != null && (
                            <span>Merit Score: {Number(c.meritScore).toFixed(2)}</span>
                          )}
                          {c.joiningIntentAt && (
                            <span className="text-yellow-600">Intent confirmed</span>
                          )}
                        </div>
                        <div className="mt-2 max-w-xs">
                          <ChecklistProgress verified={c.verifiedCount} total={c.totalItems} />
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 group-hover:text-foreground transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
