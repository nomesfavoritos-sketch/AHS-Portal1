import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListChallans,
  useUpdateChallanStatus,
  getListChallansQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  FileImage,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ChallanStatus = "pending" | "slip_uploaded" | "paid" | "verified" | "rejected" | "overdue";

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "slip_uploaded":
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Slip Uploaded</Badge>;
    case "paid":
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Paid (Unverified)</Badge>;
    case "verified":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Verified</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SlipPreviewModal({ challan, onClose }: { challan: any; onClose: () => void }) {
  const slipUrl = challan.paidSlipPath ? `/api${challan.paidSlipPath}` : null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Paid Slip Preview — {challan.challanNumber}</DialogTitle>
          <DialogDescription>
            Bank slip uploaded by the student. Verify amount, date, and reference number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Amount:</span>{" "}
              <strong>PKR {challan.amount?.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>{" "}
              <strong>{challan.dueDate}</strong>
            </div>
            {challan.bankName && (
              <div>
                <span className="text-muted-foreground">Bank:</span>{" "}
                <strong>{challan.bankName}</strong>
              </div>
            )}
            {challan.transactionRef && (
              <div>
                <span className="text-muted-foreground">Ref No:</span>{" "}
                <strong className="font-mono">{challan.transactionRef}</strong>
              </div>
            )}
            {challan.paidAt && (
              <div>
                <span className="text-muted-foreground">Paid At:</span>{" "}
                <strong>{format(new Date(challan.paidAt), "MMM d, yyyy")}</strong>
              </div>
            )}
          </div>

          <Separator />

          {slipUrl ? (
            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <img
                src={slipUrl}
                alt="Paid bank slip"
                className="w-full max-h-[420px] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="p-2 flex justify-center border-t bg-background">
                <a href={slipUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    Open in new tab
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground border rounded-lg border-dashed">
              <FileImage className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No slip image available</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionDialog({
  challan,
  action,
  onClose,
  onConfirm,
  isPending,
}: {
  challan: any;
  action: "verify" | "reject";
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  isPending: boolean;
}) {
  const [remarks, setRemarks] = useState("");
  const isVerify = action === "verify";

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isVerify ? "Verify Payment" : "Reject Payment"} — {challan.challanNumber}
          </DialogTitle>
          <DialogDescription>
            {isVerify
              ? "Confirm this challan payment has been verified against bank records."
              : "Reject this payment. The student will be notified to re-upload their slip."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">Amount:</span>{" "}
              <span className="font-medium">PKR {challan.amount?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              {getStatusBadge(challan.status)}
            </div>
            {challan.bankName && (
              <div>
                <span className="text-muted-foreground">Bank:</span>{" "}
                <span className="font-medium">{challan.bankName}</span>
              </div>
            )}
            {challan.transactionRef && (
              <div>
                <span className="text-muted-foreground">Ref:</span>{" "}
                <span className="font-mono text-xs">{challan.transactionRef}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">
              Remarks{" "}
              <span className="text-muted-foreground text-xs">
                {isVerify ? "(optional)" : "(required)"}
              </span>
            </Label>
            <Textarea
              id="remarks"
              placeholder={
                isVerify
                  ? "Verified against bank statement..."
                  : "Reason for rejection (e.g., amount mismatch, unclear image)..."
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isVerify ? "default" : "destructive"}
            onClick={() => onConfirm(remarks)}
            disabled={isPending || (!isVerify && !remarks.trim())}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isVerify ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            {isVerify ? "Confirm Verification" : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminChallans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [previewChallan, setPreviewChallan] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{
    challan: any;
    action: "verify" | "reject";
  } | null>(null);

  const queryParams: any = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data: challansData, isLoading } = useListChallans(queryParams);
  const updateStatus = useUpdateChallanStatus();

  const handleConfirm = (remarks: string) => {
    if (!actionDialog) return;
    const newStatus = actionDialog.action === "verify" ? "verified" : "rejected";

    updateStatus.mutate(
      {
        id: actionDialog.challan.id,
        data: { status: newStatus, ...(remarks ? { remarks } : {}) } as any,
      },
      {
        onSuccess: () => {
          toast({ title: `Payment ${newStatus} successfully` });
          setActionDialog(null);
          queryClient.invalidateQueries({ queryKey: getListChallansQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Action failed",
            description: err?.error || "An error occurred",
            variant: "destructive",
          });
          setActionDialog(null);
        },
      }
    );
  };

  const allChallans = challansData ?? [];
  const challans = search
    ? allChallans.filter(
        (c) =>
          c.challanNumber.toLowerCase().includes(search.toLowerCase()) ||
          String(c.applicationId).includes(search)
      )
    : allChallans;

  const count = (s: string) => allChallans.filter((c) => c.status === s).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Verification</h1>
        <p className="text-muted-foreground">Review and verify student challan payment slips.</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Pending", status: "pending", cls: "text-muted-foreground" },
          { label: "Slip Uploaded", status: "slip_uploaded", cls: "text-blue-600" },
          { label: "Verified", status: "verified", cls: "text-emerald-600" },
          { label: "Rejected", status: "rejected", cls: "text-red-600" },
        ].map(({ label, status, cls }) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === status ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
          >
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${cls}`}>{count(status)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Challan Payments
          </CardTitle>
          <CardDescription>Filter and review payment submissions from applicants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search challan number or application ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="slip_uploaded">Slip Uploaded</SelectItem>
                <SelectItem value="paid">Paid (Unverified)</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : challans.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border rounded border-dashed">
              No challans found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challan No</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bank / Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challans.map((challan) => (
                    <TableRow key={challan.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {challan.challanNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        #{challan.applicationId}
                      </TableCell>
                      <TableCell className="font-semibold">
                        PKR {challan.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{challan.dueDate}</TableCell>
                      <TableCell>{getStatusBadge(challan.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground space-y-0.5">
                        {challan.bankName && <div>{challan.bankName}</div>}
                        {challan.transactionRef && (
                          <div className="font-mono">{challan.transactionRef}</div>
                        )}
                        {challan.paidAt && (
                          <div>{format(new Date(challan.paidAt), "MMM d, yyyy")}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end items-center">
                          {challan.paidSlipPath && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewChallan(challan)}
                              title="View slip"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {["slip_uploaded", "paid"].includes(challan.status) && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => setActionDialog({ challan, action: "verify" })}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Verify
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setActionDialog({ challan, action: "reject" })}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {challan.status === "verified" && (
                            <span className="text-xs text-emerald-600 font-medium">✓ Verified</span>
                          )}
                          {challan.status === "rejected" && (
                            <span className="text-xs text-red-500 font-medium">✗ Rejected</span>
                          )}
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

      {previewChallan && (
        <SlipPreviewModal challan={previewChallan} onClose={() => setPreviewChallan(null)} />
      )}
      {actionDialog && (
        <ActionDialog
          challan={actionDialog.challan}
          action={actionDialog.action}
          onClose={() => setActionDialog(null)}
          onConfirm={handleConfirm}
          isPending={updateStatus.isPending}
        />
      )}
    </div>
  );
}
