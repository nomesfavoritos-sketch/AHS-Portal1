import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListChallans, 
  useUpdateChallanStatus,
  getListChallansQueryKey
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminChallans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const queryParams: any = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data: challansData, isLoading } = useListChallans(queryParams);
  const updateStatus = useUpdateChallanStatus();

  const handleVerify = (id: number) => {
    updateStatus.mutate(
      { id, data: { status: "verified", remarks: "Verified by finance" } },
      {
        onSuccess: () => {
          toast({ title: "Challan verified successfully" });
          queryClient.invalidateQueries({ queryKey: getListChallansQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Verification failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleReject = (id: number) => {
    updateStatus.mutate(
      { id, data: { status: "rejected", remarks: "Rejected by finance" } },
      {
        onSuccess: () => {
          toast({ title: "Challan rejected successfully" });
          queryClient.invalidateQueries({ queryKey: getListChallansQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Rejection failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "paid": return <Badge variant="default" className="bg-blue-500">Paid (Unverified)</Badge>;
      case "verified": return <Badge variant="default" className="bg-emerald-500">Verified</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "overdue": return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Challans</h1>
          <p className="text-muted-foreground">Verify student payments and manage challans.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              All Challans
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
          ) : !challansData?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No challans found matching your filters.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challan #</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challansData.map((challan) => (
                    <TableRow key={challan.id}>
                      <TableCell className="font-medium font-mono text-xs">{challan.challanNumber}</TableCell>
                      <TableCell>{challan.applicationId}</TableCell>
                      <TableCell className="text-right font-medium">Rs. {challan.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(challan.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(challan.status)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {challan.status === "paid" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(challan.id)}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-4 w-4" /> 
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleVerify(challan.id)}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" /> Verify
                            </Button>
                          </>
                        )}
                        {challan.status === "verified" && (
                          <span className="text-xs text-muted-foreground">Verified</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
