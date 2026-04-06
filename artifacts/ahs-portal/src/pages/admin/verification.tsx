import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListVerifications,
  useCreateVerification,
  getListVerificationsQueryKey,
  useListDocuments,
  useListApplications
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("under_review");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<string>("approved");
  
  const { data: appsData, isLoading: isLoadingApps } = useListApplications({ status: statusFilter });
  const { data: documentsData, isLoading: isLoadingDocs } = useListDocuments({ applicationId: selectedAppId || 0 });
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
          toast({ title: `Application marked as ${decisionStatus} successfully` });
          setIsVerifyOpen(false);
          queryClient.invalidateQueries({ queryKey: getListVerificationsQueryKey() });
          // Note: In a real app we'd also invalidate applications list
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
      case "submitted": return <Badge variant="secondary">Submitted</Badge>;
      case "under_review": return <Badge variant="outline" className="border-amber-500 text-amber-600">Under Review</Badge>;
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingApps ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !appsData?.applications.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No applications in this queue.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appsData.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium font-mono text-xs">{app.applicationNumber}</TableCell>
                      <TableCell>{app.user.fullName}</TableCell>
                      <TableCell className="text-sm">{app.program.name}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenVerify(app.id)}
                        >
                          Review Docs
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verification Review</DialogTitle>
            <DialogDescription>
              Review documents for Application #{selectedAppId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDocs ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : !documentsData?.length ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No documents uploaded.</TableCell></TableRow>
                  ) : documentsData.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium capitalize">{doc.docType.replace('_', ' ')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                            <FileUp className="h-4 w-4 mr-2" /> View
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Decision</label>
                <Select value={decisionStatus} onValueChange={setDecisionStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Verify Documents (Approve)</SelectItem>
                    <SelectItem value="rejected">Reject Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks (Required for rejection)</label>
                <Textarea 
                  placeholder="Reason for rejection or verification notes..." 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleVerifySubmit} 
              disabled={createVerification.isPending || (decisionStatus === "rejected" && !remarks)}
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
