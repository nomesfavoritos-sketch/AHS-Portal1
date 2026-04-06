import { useListChallans } from "@workspace/api-client-react";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";

export default function StudentChallans() {
  const { data: challansData, isLoading } = useListChallans();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending Payment</Badge>;
      case "paid": return <Badge variant="default" className="bg-blue-500">Paid (Awaiting Verification)</Badge>;
      case "verified": return <Badge variant="default" className="bg-emerald-500">Payment Verified</Badge>;
      case "overdue": return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Challans</h1>
          <p className="text-muted-foreground">View and download your payment vouchers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            My Challans
          </CardTitle>
          <CardDescription>All fee vouchers associated with your applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !challansData?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No challans generated yet. Wait for your applications to be processed.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challan No.</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead className="text-right">Amount (Rs)</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challansData.map((challan) => (
                    <TableRow key={challan.id}>
                      <TableCell className="font-medium font-mono text-xs">{challan.challanNumber}</TableCell>
                      <TableCell>{challan.applicationId}</TableCell>
                      <TableCell className="text-right font-medium">{challan.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(challan.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(challan.status)}
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
