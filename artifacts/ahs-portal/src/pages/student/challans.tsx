import { useListChallans, getListChallansQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, UploadCloud, Printer } from "lucide-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function StudentChallans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: challansData, isLoading } = useListChallans();

  const handleUploadComplete = async (result: any, challanId: number) => {
    const successful = result.successful?.[0];
    if (successful) {
      const objectPath = successful.response?.uploadURL?.split("?")[0]?.split("/").slice(-2).join("/") ?? "";
      
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/challans/${challanId}/paid-slip`, {
          method: "POST",
          body: JSON.stringify({ paidSlipPath: objectPath }),
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        
        if (response.ok) {
          toast({ title: "Paid slip uploaded successfully" });
          queryClient.invalidateQueries({ queryKey: getListChallansQueryKey() });
        } else {
          throw new Error("Failed to update paid slip");
        }
      } catch (e: any) {
        toast({
          title: "Upload error",
          description: e.message || "An error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending Payment</Badge>;
      case "paid": return <Badge variant="default" className="bg-blue-500">Paid (Unverified)</Badge>;
      case "verified": return <Badge variant="default" className="bg-yellow-500">Payment Verified</Badge>;
      case "overdue": return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Challans</h1>
          <p className="text-muted-foreground">View your fee vouchers and upload paid slips.</p>
        </div>
      </div>

      {!challansData?.length ? (
        <Card>
          <CardContent className="text-center p-12 text-muted-foreground">
            No challans generated yet. Create an application to generate a processing fee challan.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {challansData.map((challan) => (
            <Card key={challan.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Challan #{challan.challanNumber}</CardTitle>
                    <CardDescription className="font-mono mt-1">App ID: {challan.applicationId}</CardDescription>
                  </div>
                  {getStatusBadge(challan.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2 text-sm">
                    <span className="text-muted-foreground">Amount Due</span>
                    <span className="font-bold text-lg">PKR {challan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">{format(new Date(challan.dueDate), "MMM d, yyyy")}</span>
                  </div>
                  
                  {challan.paidAt && (
                    <div className="flex justify-between items-center border-b pb-2 text-sm">
                      <span className="text-muted-foreground">Paid Date</span>
                      <span className="font-medium">{format(new Date(challan.paidAt), "MMM d, yyyy")}</span>
                    </div>
                  )}

                  {/* Print Preview Skeleton */}
                  <div className="p-4 border rounded bg-white dark:bg-zinc-950 mt-4">
                    <div className="text-center border-b pb-2 mb-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider">AHS NMU Multan</h4>
                      <p className="text-[10px] text-muted-foreground">Processing Fee Voucher</p>
                    </div>
                    <div className="text-xs space-y-1 font-mono">
                      <div className="flex justify-between"><span>No:</span><span>{challan.challanNumber}</span></div>
                      <div className="flex justify-between"><span>Date:</span><span>{format(new Date(challan.dueDate), "dd-MM-yyyy")}</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t mt-2"><span>Total:</span><span>Rs. {challan.amount}</span></div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t p-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                
                {(challan.status === "pending" || challan.status === "generated") && (
                  <div className="flex-1">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880}
                      buttonClassName="w-full"
                      onGetUploadParameters={async (file) => {
                        const res = await fetch(`${import.meta.env.BASE_URL}api/storage/uploads/request-url`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" })
                        });
                        const data = await res.json();
                        return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "application/octet-stream" } };
                      }}
                      onComplete={(result) => handleUploadComplete(result, challan.id)}
                    >
                      <div className="flex items-center justify-center gap-2 w-full h-9 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                        <UploadCloud className="h-4 w-4" /> Upload Slip
                      </div>
                    </ObjectUploader>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
