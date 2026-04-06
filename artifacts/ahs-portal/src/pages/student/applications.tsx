import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListApplications, 
  getListApplicationsQueryKey,
  useCreateApplication,
  useListSessions,
  useListPrograms,
  useListQuotas,
  useListChallans,
  useUpdateApplicationStatus
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, CheckCircle, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@workspace/object-storage-web";

const applicationSchema = z.object({
  sessionId: z.coerce.number().min(1, "Session is required"),
  programId: z.coerce.number().min(1, "Program is required"),
  quotaId: z.coerce.number().optional().nullable(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function StudentApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: applicationsData, isLoading: isLoadingApps } = useListApplications();
  const { data: sessions } = useListSessions();
  const { data: programs } = useListPrograms();
  const { data: quotas } = useListQuotas();
  const { data: challansData } = useListChallans();
  const createApplication = useCreateApplication();
  const updateApplicationStatus = useUpdateApplicationStatus();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      sessionId: 0,
      programId: 0,
      quotaId: null,
    },
  });

  const onSubmit = (data: ApplicationFormValues) => {
    createApplication.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Application created successfully" });
          setIsCreateOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to submit application",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleFinalSubmit = (appId: number) => {
    setIsSubmitting(true);
    updateApplicationStatus.mutate(
      { id: appId, data: { status: "submitted" } },
      {
        onSuccess: () => {
          toast({ title: "Application submitted successfully" });
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          setIsSubmitting(false);
        },
        onError: (error) => {
          toast({
            title: "Submission failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
          setIsSubmitting(false);
        }
      }
    );
  };

  const handleUploadComplete = async (result: any, challanId: number, appId: number) => {
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
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
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
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "challan_generated": return <Badge variant="outline" className="border-amber-500 text-amber-600">Challan Generated</Badge>;
      case "slip_uploaded": return <Badge variant="default" className="bg-blue-500">Slip Uploaded</Badge>;
      case "submitted": return <Badge variant="default" className="bg-blue-600">Submitted</Badge>;
      case "under_review": return <Badge variant="outline" className="border-amber-500 text-amber-600">Under Review</Badge>;
      case "verified": return <Badge variant="default" className="bg-emerald-500">Verified</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "merit_listed": return <Badge variant="default" className="bg-purple-500">Merit Listed</Badge>;
      case "admitted": return <Badge variant="default" className="bg-green-600">Admitted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openSessions = sessions?.filter(s => s.status === "open" && s.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Manage your program applications.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={openSessions.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Application</DialogTitle>
              <DialogDescription>Apply for a new program in an open admission session.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Session</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Open Session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {openSessions.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs?.filter(p => p.isActive).map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quotaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quota Category (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Open Merit (Default)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Open Merit (Default)</SelectItem>
                          {quotas?.filter(q => q.isActive).map(q => (
                            <SelectItem key={q.id} value={q.id.toString()}>{q.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createApplication.isPending}>
                    {createApplication.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Application
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingApps ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !applicationsData?.applications.length ? (
        <Card>
          <CardContent className="text-center p-12 text-muted-foreground">
            You haven't submitted any applications yet.
            <div className="mt-4">
              <Button onClick={() => setIsCreateOpen(true)} disabled={openSessions.length === 0}>Start Application</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applicationsData.applications.map((app) => {
            const challan = challansData?.find(c => c.applicationId === app.id);
            
            return (
              <Card key={app.id}>
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-primary">{app.program.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Application #{app.applicationNumber} • {app.session.name}
                      </CardDescription>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Application Details</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Status:</dt><dd className="font-medium">{app.status}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Submitted At:</dt><dd className="font-medium">{app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "-"}</dd></div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Workflow Actions</h4>
                      
                      {app.status === "challan_generated" && challan && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                            Please pay PKR {challan.amount} and upload the paid slip to proceed.
                          </p>
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
                            onComplete={(result) => handleUploadComplete(result, challan.id, app.id)}
                          >
                            <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                              <UploadCloud className="h-4 w-4" /> Upload Paid Slip
                            </div>
                          </ObjectUploader>
                        </div>
                      )}

                      {app.status === "slip_uploaded" && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                            Your paid slip has been uploaded. You can now finally submit your application.
                          </p>
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                            onClick={() => handleFinalSubmit(app.id)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Submit Application
                          </Button>
                        </div>
                      )}

                      {["submitted", "under_review", "verified", "rejected", "merit_listed", "admitted"].includes(app.status) && (
                        <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
                          Your application is currently: <strong>{app.status.replace("_", " ")}</strong>. <br/>
                          No further action required at this stage.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
