import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  useListApplications,
  useGetApplication,
  useUpdateApplicationStatus,
  getListApplicationsQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, FileText, Filter, Eye, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "challan_generated", label: "Challan Generated" },
  { value: "slip_uploaded", label: "Slip Uploaded" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "merit_listed", label: "Merit Listed" },
  { value: "selected_for_verification", label: "Selected for Verification" },
  { value: "clarification_required", label: "Clarification Required" },
  { value: "admitted", label: "Admitted" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "challan_generated":
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Challan Generated</Badge>;
    case "slip_uploaded":
      return <Badge variant="default" className="bg-blue-500">Slip Uploaded</Badge>;
    case "submitted":
      return <Badge variant="default" className="bg-blue-600">Submitted</Badge>;
    case "under_review":
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Under Review</Badge>;
    case "verified":
      return <Badge variant="default" className="bg-emerald-500">Verified</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "merit_listed":
      return <Badge variant="default" className="bg-purple-500">Merit Listed</Badge>;
    case "selected_for_verification":
      return <Badge variant="default" className="bg-sky-600">Verification Desk</Badge>;
    case "clarification_required":
      return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Clarification Req.</Badge>;
    case "admitted":
      return <Badge variant="default" className="bg-green-600">Admitted</Badge>;
    default:
      return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
  }
}

const PIPELINE_ACTIONS: Record<string, Array<{ label: string; status: string; className: string; needsRemarks?: boolean }>> = {
  submitted: [
    { label: "Start Review", status: "under_review", className: "border-amber-500 text-amber-600" },
    { label: "Reject", status: "rejected", className: "border-red-500 text-red-600", needsRemarks: true },
  ],
  under_review: [
    { label: "Reject", status: "rejected", className: "border-red-500 text-red-600", needsRemarks: true },
    { label: "Verify", status: "verified", className: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  ],
  verified: [
    { label: "Reject", status: "rejected", className: "border-red-500 text-red-600", needsRemarks: true },
    { label: "Add to Merit List", status: "merit_listed", className: "bg-purple-600 hover:bg-purple-700 text-white" },
  ],
  merit_listed: [
    { label: "Route to Verification Desk", status: "selected_for_verification", className: "bg-sky-600 hover:bg-sky-700 text-white" },
    { label: "Mark Admitted", status: "admitted", className: "bg-green-600 hover:bg-green-700 text-white" },
  ],
  selected_for_verification: [
    { label: "Send Back (Clarification)", status: "clarification_required", className: "border-orange-500 text-orange-600", needsRemarks: true },
  ],
  clarification_required: [
    { label: "Restore to Under Review", status: "under_review", className: "border-amber-500 text-amber-600" },
    { label: "Reject", status: "rejected", className: "border-red-500 text-red-600", needsRemarks: true },
  ],
  rejected: [],
  admitted: [],
};

export default function AdminApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const queryParams: any = { limit: 100 };
  if (searchTerm) queryParams.search = searchTerm;
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data: applicationsData, isLoading } = useListApplications(queryParams);
  const { data: selectedApp, isLoading: isLoadingApp } = useGetApplication(selectedAppId || 0, {
    query: { enabled: !!selectedAppId && isViewOpen }
  });
  const updateStatus = useUpdateApplicationStatus();

  const handleOpenView = (appId: number) => {
    setSelectedAppId(appId);
    setRemarks("");
    setPendingStatus(null);
    setIsViewOpen(true);
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedAppId) return;
    const actions = PIPELINE_ACTIONS[selectedApp?.status ?? ""] ?? [];
    const action = actions.find(a => a.status === status);
    if (action?.needsRemarks && !remarks.trim()) {
      toast({ title: "Remarks required", description: "Please add a remark before applying this action.", variant: "destructive" });
      return;
    }
    updateStatus.mutate(
      { id: selectedAppId, data: { status, remarks: remarks.trim() || null } },
      {
        onSuccess: () => {
          toast({ title: `Application status updated to: ${status.replace(/_/g, " ")}` });
          setIsViewOpen(false);
          setPendingStatus(null);
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to update status",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const currentActions = PIPELINE_ACTIONS[selectedApp?.status ?? ""] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Review and process student applications through the pipeline.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Pipeline
              </CardTitle>
              <CardDescription>
                {applicationsData?.applications.length ?? 0} application{applicationsData?.applications.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by App # or Name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground hidden sm:block" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !applicationsData?.applications.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No applications found matching the selected criteria.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">App Number</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicationsData.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium font-mono text-xs">{app.applicationNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{app.user.fullName}</span>
                          <span className="text-xs text-muted-foreground">{app.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate text-sm" title={app.program.name}>
                          {app.program.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {app.session.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(app.status === "selected_for_verification" || app.status === "admitted") && (
                            <Link href={`/admin/verification/${app.id}`}>
                              <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50">
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Desk</span>
                              </Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleOpenView(app.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { setIsViewOpen(open); if (!open) setPendingStatus(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {selectedApp ? `${selectedApp.applicationNumber} · ${selectedApp.program.name}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingApp ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedApp ? (
            <div className="space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Current Status:</span>
                {getStatusBadge(selectedApp.status)}
                {(selectedApp.status === "selected_for_verification" || selectedApp.status === "admitted") && (
                  <Link href={`/admin/verification/${selectedApp.id}`}>
                    <Button variant="outline" size="sm" className="ml-auto border-sky-300 text-sky-700 hover:bg-sky-50">
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      Open Verification Desk
                    </Button>
                  </Link>
                )}
              </div>

              <Separator />

              {/* Applicant Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Applicant</h4>
                  <p className="font-medium">{selectedApp.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedApp.user.email}</p>
                  {selectedApp.user.phone && <p className="text-sm text-muted-foreground">{selectedApp.user.phone}</p>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Application</h4>
                  <p className="font-medium">{selectedApp.program.name}</p>
                  <p className="text-sm text-muted-foreground">Session: {selectedApp.session.name}</p>
                  {(selectedApp as any).quota && (
                    <p className="text-sm text-muted-foreground">Quota: {(selectedApp as any).quota.name}</p>
                  )}
                  {selectedApp.submittedAt && (
                    <p className="text-sm text-muted-foreground">
                      Submitted: {format(new Date(selectedApp.submittedAt), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {/* Merit Info */}
              {((selectedApp as any).meritScore || (selectedApp as any).meritScoreRaw) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Merit Score</h4>
                    <div className="flex gap-4 text-sm">
                      {(selectedApp as any).meritScore && (
                        <span>Normalized: <strong>{Number((selectedApp as any).meritScore).toFixed(2)}%</strong></span>
                      )}
                      {(selectedApp as any).meritScoreRaw && (
                        <span>Raw: <strong>{Number((selectedApp as any).meritScoreRaw).toFixed(2)}</strong></span>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Remarks + Actions */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="remarks" className="text-sm font-semibold">Admin Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Add comments or reason for action (required for Reject / Send Back)..."
                    className="mt-1.5"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Remarks are visible to the applicant.</p>
                </div>

                {currentActions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Pipeline Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {currentActions.map((action) => {
                        const isOutline = !action.className.includes("bg-");
                        return (
                          <Button
                            key={action.status}
                            variant={isOutline ? "outline" : "default"}
                            className={action.className}
                            onClick={() => handleStatusUpdate(action.status)}
                            disabled={updateStatus.isPending}
                            size="sm"
                          >
                            {updateStatus.isPending && pendingStatus === action.status && (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            )}
                            {action.needsRemarks && <AlertTriangle className="mr-1.5 h-3 w-3" />}
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                    {currentActions.some(a => a.needsRemarks) && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Actions marked with this icon require remarks.
                      </p>
                    )}
                  </div>
                )}

                {currentActions.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No further pipeline actions available for this status.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">Application not found.</div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
