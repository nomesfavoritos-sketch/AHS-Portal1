import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListVerifications,
  useCreateVerification,
  getListVerificationsQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<string>("approved");
  
  const queryParams: any = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data: verificationsData, isLoading } = useListVerifications(queryParams);
  const createVerification = useCreateVerification();

  const handleOpenVerify = (appId: number) => {
    setSelectedAppId(appId);
    setRemarks("");
    setDecisionStatus("approved");
    setIsVerifyOpen(true);
  };

  const handleVerifySubmit = () => {
    if (!selectedAppId) return;
    
    createVerification.mutate(
      { data: { applicationId: selectedAppId, status: decisionStatus, remarks: remarks || null } },
      {
        onSuccess: () => {
          toast({ title: `Application ${decisionStatus} successfully` });
          setIsVerifyOpen(false);
          queryClient.invalidateQueries({ queryKey: getListVerificationsQueryKey(queryParams) });
        },
        onError: (error) => {
          toast({
            title: "Action failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending Review</Badge>;
      case "approved": return <Badge variant="default" className="bg-emerald-500">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Verification</h1>
          <p className="text-muted-foreground">Review student documents and academic details.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Verification Queue
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !verificationsData?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No items in the verification queue.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App ID</TableHead>
                    <TableHead>Officer ID</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Verified At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium font-mono text-xs">{item.applicationId}</TableCell>
                      <TableCell>{item.officerId}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.verifiedAt ? format(new Date(item.verifiedAt), "MMM d, yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenVerify(item.applicationId)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verification Decision</DialogTitle>
            <DialogDescription>
              Submit verification decision for Application #{selectedAppId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Decision</label>
              <Select value={decisionStatus} onValueChange={setDecisionStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve Documents</SelectItem>
                  <SelectItem value="rejected">Reject Documents</SelectItem>
                  <SelectItem value="pending">Keep Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks (Optional)</label>
              <Textarea 
                placeholder="Reason for rejection or notes..." 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleVerifySubmit} 
              disabled={createVerification.isPending}
              variant={decisionStatus === "rejected" ? "destructive" : "default"}
            >
              {createVerification.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
