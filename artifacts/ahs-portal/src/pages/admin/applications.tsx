import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Loader2, Search, FileText, Filter, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Application } from "@workspace/api-client-react/src/generated/api.schemas";

export default function AdminApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [remarks, setRemarks] = useState("");

  const queryParams: any = { limit: 50 };
  if (searchTerm) queryParams.search = searchTerm;
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data: applicationsData, isLoading } = useListApplications(queryParams);
  const { data: selectedApp, isLoading: isLoadingApp } = useGetApplication(selectedAppId || 0, {
    query: {
      enabled: !!selectedAppId && isViewOpen
    }
  });

  const updateStatus = useUpdateApplicationStatus();

  const handleOpenView = (appId: number) => {
    setSelectedAppId(appId);
    setRemarks("");
    setIsViewOpen(true);
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedAppId) return;
    
    updateStatus.mutate(
      { id: selectedAppId, data: { status, remarks: remarks || null } },
      {
        onSuccess: () => {
          toast({ title: `Application marked as ${status.replace('_', ' ')}` });
          setIsViewOpen(false);
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey(queryParams) });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "submitted": return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Submitted</Badge>;
      case "under_review": return <Badge variant="outline" className="border-amber-500 text-amber-600">Under Review</Badge>;
      case "verified": return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Verified</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "merit_listed": return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">Merit Listed</Badge>;
      case "admitted": return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Admitted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Review and process student applications.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submitted Applications
              </CardTitle>
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
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
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
              No applications found matching criteria.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App Number</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                        <div className="max-w-[200px] truncate" title={app.program.name}>
                          {app.program.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenView(app.id)}>
                          <Eye className="h-4 w-4 mr-2" /> View
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review application {selectedApp?.applicationNumber}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingApp ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedApp ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Applicant Info</h4>
                  <p className="font-medium">{selectedApp.user.fullName}</p>
                  <p className="text-sm">{selectedApp.user.email}</p>
                  {selectedApp.user.phone && <p className="text-sm">{selectedApp.user.phone}</p>}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Application Info</h4>
                  <p className="font-medium">{selectedApp.program.name}</p>
                  <p className="text-sm">Session: {selectedApp.session.name}</p>
                  <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/30 space-y-4">
                <div>
                  <Label htmlFor="remarks" className="text-sm text-muted-foreground">Admin Remarks</Label>
                  <Textarea 
                    id="remarks" 
                    placeholder="Add comments for the applicant..." 
                    className="mt-1"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Remarks are visible to the applicant.</p>
                </div>
              </div>
              
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">
                <div className="w-full sm:w-auto">
                  {selectedApp.status === "submitted" && (
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto border-amber-500 text-amber-600 hover:bg-amber-50"
                      onClick={() => handleStatusUpdate("under_review")}
                      disabled={updateStatus.isPending}
                    >
                      Mark Under Review
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleStatusUpdate("rejected")}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button 
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleStatusUpdate("verified")}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Verify
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-center p-4">Application not found</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
