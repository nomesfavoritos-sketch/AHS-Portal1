import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  User,
  BookOpen,
  CreditCard,
  FileText,
  ListOrdered,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  History,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ChecklistStatus = "pending" | "verified" | "missing" | "mismatch";

interface ChecklistItem {
  key: string;
  label: string;
  status: ChecklistStatus;
  remarks: string;
}

interface CandidateDetail {
  application: {
    id: number;
    applicationNumber: string;
    status: string;
    submittedAt: string | null;
    meritScore: number | null;
    meritScoreRaw: number | null;
    meritBreakdown: any;
    joiningIntentAt: string | null;
    remarks: string | null;
  };
  user: { id: number; email: string; fullName?: string; phone?: string } | null;
  program: { id: number; name: string; code: string; duration: string } | null;
  session: { id: number; name: string } | null;
  quota: { id: number; name: string; code: string } | null;
  profile: {
    fatherName?: string; cnic?: string; dateOfBirth?: string;
    gender?: string; domicileDistrict?: string; domicileProvince?: string;
    matricYear?: number; matricBoard?: string; matricMarks?: number; matricTotalMarks?: number;
    fscYear?: number; fscBoard?: string; fscMarks?: number; fscTotalMarks?: number;
  } | null;
  documents: { id: number; docType: string; fileName: string | null; filePath: string | null; fileUrl: string | null; mimeType: string | null; status: string; uploadedAt: string }[];
  challans: { id: number; challanNumber: string; amount: number; dueDate: string; status: string; bankName: string | null; transactionRef: string | null; paidSlipPath: string | null; paidAt: string | null; remarks: string | null }[];
  meritEntries: { id: number; rank: number; meritScore: number; meritListName: string; status: string }[];
  latestDecision: { id: number; decision: string; remarks: string | null; verifiedCount: number; totalCount: number; decidedAt: string } | null;
  checklistItems: ChecklistItem[];
}

interface DecisionHistory {
  id: number;
  decision: string;
  remarks: string | null;
  verifiedCount: number;
  totalCount: number;
  officerName: string;
  decidedAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  verified: "bg-yellow-500 hover:bg-yellow-500 text-white",
  missing: "bg-red-500 hover:bg-red-600 text-white",
  mismatch: "bg-amber-500 hover:bg-amber-600 text-white",
  pending: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<ChecklistStatus, JSX.Element> = {
  verified: <CheckCircle className="h-4 w-4 text-yellow-600" />,
  missing: <XCircle className="h-4 w-4 text-red-500" />,
  mismatch: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
};

function getAppStatusBadge(status: string) {
  const map: Record<string, JSX.Element> = {
    submitted: <Badge variant="secondary">Submitted</Badge>,
    under_review: <Badge className="bg-amber-500 text-white">Under Review</Badge>,
    verified: <Badge className="bg-blue-500 text-white">Verified</Badge>,
    merit_listed: <Badge className="bg-purple-500 text-white">Merit Listed</Badge>,
    admitted: <Badge className="bg-yellow-500 text-white">Admitted</Badge>,
    rejected: <Badge variant="destructive">Rejected</Badge>,
    clarification_required: <Badge className="bg-orange-500 text-white">Clarification Reqd.</Badge>,
    selected_for_verification: <Badge className="bg-cyan-500 text-white">For Verification</Badge>,
  };
  return map[status] ?? <Badge variant="outline">{status}</Badge>;
}

function getDecisionLabel(decision: string) {
  const map: Record<string, string> = {
    accept_joining: "Accepted Joining",
    reject_joining: "Rejected Joining",
    send_back: "Sent Back for Clarification",
  };
  return map[decision] ?? decision;
}

function getChallanStatusBadge(status: string) {
  const map: Record<string, JSX.Element> = {
    pending: <Badge variant="secondary">Pending</Badge>,
    slip_uploaded: <Badge className="bg-blue-500 text-white">Slip Uploaded</Badge>,
    paid: <Badge className="bg-blue-500 text-white">Paid</Badge>,
    verified: <Badge className="bg-yellow-500 text-white">Verified</Badge>,
    rejected: <Badge variant="destructive">Rejected</Badge>,
  };
  return map[status] ?? <Badge variant="outline">{status}</Badge>;
}

export default function AdminVerificationDesk() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = Number(params.applicationId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[] | null>(null);
  const [editingRemarks, setEditingRemarks] = useState<string | null>(null);
  const [decisionDialog, setDecisionDialog] = useState(false);
  const [decisionType, setDecisionType] = useState<"accept_joining" | "reject_joining" | "send_back">("accept_joining");
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [historyDialog, setHistoryDialog] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<CandidateDetail>({
    queryKey: ["verification-desk-detail", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/verification-desk/${applicationId}`);
      if (!res.ok) throw new Error("Failed to load candidate");
      const d = await res.json();
      setChecklistItems(d.checklistItems);
      return d;
    },
    staleTime: 10_000,
  });

  const { data: history } = useQuery<DecisionHistory[]>({
    queryKey: ["verification-desk-decisions", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/verification-desk/${applicationId}/decisions`);
      if (!res.ok) throw new Error("Failed to load history");
      return res.json();
    },
    enabled: historyDialog,
  });

  const saveChecklist = async (silent = false) => {
    if (!checklistItems) return;
    if (!silent) setSavingChecklist(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/verification-desk/${applicationId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: checklistItems }),
      });
      if (!res.ok) throw new Error("Failed to save");
      if (!silent) {
        toast({ title: "Checklist saved" });
        queryClient.invalidateQueries({ queryKey: ["verification-desk", applicationId] });
      }
    } catch {
      if (!silent) toast({ title: "Failed to save checklist", variant: "destructive" });
    } finally {
      if (!silent) setSavingChecklist(false);
    }
  };

  const submitDecision = async () => {
    try {
      // Always persist latest checklist state before evaluating the decision
      await saveChecklist(true);
      const res = await fetch(`${import.meta.env.BASE_URL}api/verification-desk/${applicationId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decision: decisionType, remarks: decisionRemarks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Decision failed");
      toast({
        title: "Decision submitted",
        description: `Application status updated to: ${json.newStatus}`,
      });
      setDecisionDialog(false);
      setDecisionRemarks("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["verification-desk"] });
    } catch (e: any) {
      toast({ title: "Decision failed", description: e.message, variant: "destructive" });
    }
  };

  const updateItem = (key: string, field: "status" | "remarks", value: string) => {
    setChecklistItems((prev) =>
      prev
        ? prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
        : prev
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/verification">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Verification Desk
          </Button>
        </Link>
        <div className="text-center py-12 text-destructive border rounded border-destructive/30">
          Failed to load candidate details.
        </div>
      </div>
    );
  }

  const items = checklistItems ?? data.checklistItems;
  const verifiedCount = items.filter((i) => i.status === "verified").length;
  const mandatoryItems = items.filter((i) => i.key !== "quota_valid");
  const mandatoryVerified = mandatoryItems.filter((i) => i.status === "verified").length;
  const allMandatoryVerified = mandatoryVerified === mandatoryItems.length;
  const challanPaid = data.challans.some((c) => ["paid", "verified"].includes(c.status));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/verification">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Verification Desk
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {data.user?.fullName ?? "Candidate"}
            </h1>
            {getAppStatusBadge(data.application.status)}
            {data.application.joiningIntentAt && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Intent Confirmed
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">
            {data.application.applicationNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistoryDialog(true)}>
            <History className="h-4 w-4 mr-2" />
            Decision History
          </Button>
          <Button
            size="sm"
            onClick={() => setDecisionDialog(true)}
            disabled={!!data.latestDecision?.decision && ["accept_joining", "reject_joining"].includes(data.latestDecision.decision)}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Submit Decision
          </Button>
        </div>
      </div>

      {/* Last decision banner */}
      {data.latestDecision && (
        <div
          className={`rounded-lg border p-3 text-sm flex items-center gap-3 ${
            data.latestDecision.decision === "accept_joining"
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : data.latestDecision.decision === "reject_joining"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {data.latestDecision.decision === "accept_joining" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : data.latestDecision.decision === "reject_joining" ? (
            <XCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <div>
            <strong>{getDecisionLabel(data.latestDecision.decision)}</strong>
            {data.latestDecision.remarks && (
              <span className="ml-2 opacity-80">&mdash; {data.latestDecision.remarks}</span>
            )}
            <span className="ml-2 opacity-60 text-xs">
              {format(new Date(data.latestDecision.decidedAt), "MMM d, yyyy HH:mm")}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: profile + program + payment */}
        <div className="space-y-4 lg:col-span-1">
          {/* Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {data.profile ? (
                <>
                  <Row label="Father's Name" value={data.profile.fatherName} />
                  <Row label="CNIC / B-Form" value={data.profile.cnic} mono />
                  <Row label="Date of Birth" value={data.profile.dateOfBirth} />
                  <Row label="Gender" value={data.profile.gender} />
                  <Row label="Domicile" value={data.profile.domicileDistrict && data.profile.domicileProvince
                    ? `${data.profile.domicileDistrict}, ${data.profile.domicileProvince}`
                    : data.profile.domicileDistrict ?? undefined} />
                  <Separator />
                  <div className="text-xs font-semibold uppercase text-muted-foreground pt-1">Academic</div>
                  <Row label="Matric" value={data.profile.matricMarks != null && data.profile.matricTotalMarks != null
                    ? `${data.profile.matricMarks}/${data.profile.matricTotalMarks} (${data.profile.matricYear})`
                    : undefined} />
                  <Row label="Board" value={data.profile.matricBoard} />
                  <Row label="FSc" value={data.profile.fscMarks != null && data.profile.fscTotalMarks != null
                    ? `${data.profile.fscMarks}/${data.profile.fscTotalMarks} (${data.profile.fscYear})`
                    : undefined} />
                  <Row label="Board" value={data.profile.fscBoard} />
                </>
              ) : (
                <p className="text-muted-foreground italic">Profile not completed</p>
              )}
            </CardContent>
          </Card>

          {/* Program + Session */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Application
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <Row label="Program" value={data.program?.name} />
              <Row label="Code" value={data.program?.code} mono />
              <Row label="Session" value={data.session?.name} />
              {data.quota && <Row label="Quota" value={data.quota.name} />}
              {data.meritEntries.length > 0 && (
                <>
                  <Separator />
                  {data.meritEntries.map((e) => (
                    <div key={e.id} className="text-xs">
                      <span className="text-muted-foreground">Merit:</span>{" "}
                      <strong>Rank #{e.rank}</strong>{" "}
                      <span className="text-muted-foreground">— {e.meritListName}</span>
                    </div>
                  ))}
                </>
              )}
              {data.application.meritScore != null && (
                <Row label="Merit Score" value={Number(data.application.meritScore).toFixed(4)} />
              )}
            </CardContent>
          </Card>

          {/* Challans */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.challans.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No challans issued</p>
              ) : (
                data.challans.map((c) => (
                  <div key={c.id} className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{c.challanNumber}</span>
                      {getChallanStatusBadge(c.status)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      PKR {c.amount?.toLocaleString()} — Due: {c.dueDate}
                    </div>
                    {c.bankName && <div className="text-xs text-muted-foreground">{c.bankName} {c.transactionRef && `— Ref: ${c.transactionRef}`}</div>}
                    {c.paidSlipPath && (
                      <a
                        href={`${import.meta.env.BASE_URL}api/storage/objects/${c.paidSlipPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Slip
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: documents + checklist */}
        <div className="space-y-4 lg:col-span-2">
          {/* Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {data.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/20"
                    >
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {doc.docType.replace(/_/g, " ")}
                        </div>
                        {doc.fileName && (
                          <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{doc.status}</Badge>
                        {doc.filePath && (
                          <a
                            href={`${import.meta.env.BASE_URL}api/storage/objects/${doc.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Verification Checklist
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {verifiedCount}/{items.length} verified
                  </span>
                  <Button size="sm" variant="outline" onClick={saveChecklist} disabled={savingChecklist}>
                    {savingChecklist ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
              <CardDescription>
                Mark each item after cross-checking with the uploaded documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.key} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    {STATUS_ICON[item.status]}
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <Select
                      value={item.status}
                      onValueChange={(v) => updateItem(item.key, "status", v as ChecklistStatus)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="mismatch">Mismatch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(item.status !== "pending" || editingRemarks === item.key) && (
                    <Input
                      placeholder="Remarks (optional)..."
                      className="h-7 text-xs"
                      value={item.remarks}
                      onFocus={() => setEditingRemarks(item.key)}
                      onChange={(e) => updateItem(item.key, "remarks", e.target.value)}
                    />
                  )}
                  {item.status === "pending" && editingRemarks !== item.key && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setEditingRemarks(item.key)}
                    >
                      + Add remarks
                    </button>
                  )}
                </div>
              ))}

              {/* Progress summary */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Mandatory items verified</span>
                  <span className={allMandatoryVerified ? "text-yellow-600 font-bold" : "text-muted-foreground"}>
                    {mandatoryVerified} / {mandatoryItems.length}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      allMandatoryVerified ? "bg-yellow-500" : "bg-primary"
                    }`}
                    style={{ width: `${(mandatoryVerified / mandatoryItems.length) * 100}%` }}
                  />
                </div>
                {!allMandatoryVerified && (
                  <p className="text-xs text-muted-foreground mt-2">
                    All mandatory items must be verified before accepting joining.
                  </p>
                )}
                {allMandatoryVerified && !challanPaid && (
                  <p className="text-xs text-amber-600 mt-2">
                    Note: No verified payment found. Ensure fee is paid before accepting.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Joining Decision</DialogTitle>
            <DialogDescription>
              This decision will update the application status and be permanently recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1.5">
              <div><span className="text-muted-foreground">Candidate:</span> <strong>{data.user?.fullName}</strong></div>
              <div><span className="text-muted-foreground">Checklist:</span> <strong>{verifiedCount}/{items.length}</strong> items verified</div>
              <div><span className="text-muted-foreground">Mandatory:</span> <strong className={allMandatoryVerified ? "text-yellow-600" : "text-red-500"}>{mandatoryVerified}/{mandatoryItems.length}</strong></div>
            </div>

            <div className="space-y-1.5">
              <Label>Decision</Label>
              <Select value={decisionType} onValueChange={(v) => setDecisionType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept_joining">Accept Joining</SelectItem>
                  <SelectItem value="reject_joining">Reject Joining</SelectItem>
                  <SelectItem value="send_back">Send Back for Clarification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {decisionType === "accept_joining" && !allMandatoryVerified && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                Cannot accept — {mandatoryItems.length - mandatoryVerified} mandatory checklist item(s) not yet verified.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="dec-remarks">
                Remarks{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="dec-remarks"
                placeholder="Decision notes..."
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={decisionType === "reject_joining" ? "destructive" : "default"}
              onClick={submitDecision}
              disabled={decisionType === "accept_joining" && !allMandatoryVerified}
            >
              {decisionType === "accept_joining" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : decisionType === "reject_joining" ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Confirm Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Decision History</DialogTitle>
            <DialogDescription>All decisions made for {data.application.applicationNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {!history ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No decisions recorded yet</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="border rounded-lg p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <strong>{getDecisionLabel(h.decision)}</strong>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(h.decidedAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    By: {h.officerName} — {h.verifiedCount}/{h.totalCount} items verified
                  </div>
                  {h.remarks && <div className="text-xs">{h.remarks}</div>}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${mono ? "font-mono" : ""}`}>{String(value)}</span>
    </div>
  );
}
