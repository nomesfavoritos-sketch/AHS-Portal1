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
  useGetMyProfile,
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, CheckCircle, UploadCloud, AlertTriangle, ClipboardCheck, PartyPopper, XCircle, Clock, ShieldCheck, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@workspace/object-storage-web";

const applicationSchema = z.object({
  sessionId: z.coerce.number().min(1, "Session is required"),
  programId: z.coerce.number().min(1, "Program is required"),
  quotaId: z.coerce.number().optional().nullable(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

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
      return <Badge variant="default" className="bg-sky-600">Selected for Verification</Badge>;
    case "clarification_required":
      return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">Clarification Required</Badge>;
    case "admitted":
      return <Badge variant="default" className="bg-green-600">Admitted</Badge>;
    default:
      return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
  }
}

function ApplicationActionPanel({ app, challan, onUploadComplete, onSubmit, isSubmitting }: {
  app: any;
  challan: any;
  onUploadComplete: (result: any, challanId: number, appId: number) => Promise<void>;
  onSubmit: (appId: number) => void;
  isSubmitting: boolean;
}) {
  const baseUrl = import.meta.env.BASE_URL;

  if (app.status === "challan_generated" && challan) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md space-y-3">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Please deposit <strong>PKR {challan.amount}</strong> at any HBL branch using Challan # <strong>{challan.challanNumber}</strong>, then upload the paid slip below.
          </p>
        </div>
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={5242880}
          buttonClassName="w-full"
          onGetUploadParameters={async (file) => {
            const res = await fetch(`${baseUrl}api/storage/uploads/request-url`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" })
            });
            const data = await res.json();
            return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "application/octet-stream" } };
          }}
          onComplete={(result) => onUploadComplete(result, challan.id, app.id)}
        >
          <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
            <UploadCloud className="h-4 w-4" /> Upload Paid Slip
          </div>
        </ObjectUploader>
      </div>
    );
  }

  if (app.status === "slip_uploaded") {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md space-y-3">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Your payment slip has been uploaded. Review it once more then submit your final application.
          </p>
        </div>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => onSubmit(app.id)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Submit Application
        </Button>
      </div>
    );
  }

  if (app.status === "submitted" || app.status === "under_review" || app.status === "verified") {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-md bg-muted/30">
        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Your application is <strong>{app.status.replace(/_/g, " ")}</strong>. The admissions office is processing it — no action needed from you right now.
        </p>
      </div>
    );
  }

  if (app.status === "merit_listed") {
    return (
      <Alert className="border-purple-200 bg-purple-50">
        <ClipboardCheck className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-800">Merit Listed</AlertTitle>
        <AlertDescription className="text-purple-700 text-sm">
          Congratulations — your application has been placed on the merit list. Check your merit ranking on the <strong>Merit Status</strong> page. Confirm your joining intent there if you haven't already.
        </AlertDescription>
      </Alert>
    );
  }

  if (app.status === "selected_for_verification") {
    return (
      <Alert className="border-sky-200 bg-sky-50">
        <ShieldCheck className="h-4 w-4 text-sky-600" />
        <AlertTitle className="text-sky-800">Selected for Physical Verification</AlertTitle>
        <AlertDescription className="text-sky-700 text-sm">
          You have been shortlisted for physical document verification at the college. Please bring <strong>all original documents</strong> (Matric & FSc certificates, Domicile, CNIC/B-Form, Medical Fitness Certificate) to the Verification Desk during working hours (8am–2pm, Mon–Fri).
        </AlertDescription>
      </Alert>
    );
  }

  if (app.status === "clarification_required") {
    return (
      <Alert className="border-orange-300 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Clarification Required</AlertTitle>
        <AlertDescription className="text-orange-700 text-sm">
          The verification officer has flagged an issue with your application. Please contact the Admissions Office (<strong>051-XXXXXXX</strong>) or visit in person to resolve the issue. Bring your original documents.
        </AlertDescription>
      </Alert>
    );
  }

  if (app.status === "admitted") {
    return (
      <Alert className="border-green-300 bg-green-50">
        <PartyPopper className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Congratulations! You have been Admitted</AlertTitle>
        <AlertDescription className="text-green-700 text-sm">
          Your admission to <strong>{app.program.name}</strong> has been confirmed. Please collect your joining letter from the college office and complete your enrollment formalities by the joining deadline.
        </AlertDescription>
      </Alert>
    );
  }

  if (app.status === "rejected") {
    return (
      <Alert variant="destructive" className="bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Application Rejected</AlertTitle>
        <AlertDescription className="text-sm">
          Unfortunately your application was not successful this time. You may apply again in the next admission session. Contact the Admissions Office for details.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

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
  const { data: profileData } = useGetMyProfile();
  const createApplication = useCreateApplication();

  const profilePct = (profileData as any)?.completionPercentage ?? 0;
  const profileComplete = profilePct >= 80;

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { sessionId: 0, programId: 0, quotaId: null },
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

  const handleFinalSubmit = async (appId: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/applications/${appId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok) {
        toast({
          title: "Submission failed",
          description: body?.error || "An error occurred",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Application submitted successfully", description: "Your application is now under review." });
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message || "Network error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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

  const openSessions = sessions?.filter(s => s.status === "open" && s.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Profile incomplete warning */}
      {!profileComplete && (
        <Alert className="border-amber-300 bg-amber-50">
          <UserCheck className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Profile Incomplete — {profilePct}% done</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            Your profile must be at least <strong>80% complete</strong> before you can start or submit an application.
            Please go to <strong>My Profile</strong> and fill in your personal details, academic records, and upload your photo.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Manage your program applications and track their progress.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!profileComplete && open) return; setIsCreateOpen(open); }}>
          <DialogTrigger asChild>
            <Button
              disabled={openSessions.length === 0 || !profileComplete}
              title={!profileComplete ? `Complete your profile to at least 80% (currently ${profilePct}%)` : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Application</DialogTitle>
              <DialogDescription>Apply for a program in an open admission session.</DialogDescription>
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
                          <SelectTrigger><SelectValue placeholder="Select Open Session" /></SelectTrigger>
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
                          <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
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
                          <SelectTrigger><SelectValue placeholder="Open Merit (Default)" /></SelectTrigger>
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
                    {createApplication.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Application
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
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No applications yet</p>
            <p className="text-sm mb-4">Click "New Application" to apply for a program when an admission session is open.</p>
            <Button onClick={() => setIsCreateOpen(true)} disabled={openSessions.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Start Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applicationsData.applications.map((app) => {
            const challan = challansData?.find(c => c.applicationId === app.id);
            return (
              <Card key={app.id}>
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-xl text-primary">{app.program.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Application #{app.applicationNumber} &bull; {app.session.name}
                        {app.submittedAt && (
                          <span className="ml-2 text-xs">· Submitted {format(new Date(app.submittedAt), "MMM d, yyyy")}</span>
                        )}
                      </CardDescription>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Application Details</h4>
                      <dl className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Program</dt>
                          <dd className="font-medium text-right">{app.program.name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Session</dt>
                          <dd className="font-medium">{app.session.name}</dd>
                        </div>
                        {app.quota && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Quota</dt>
                            <dd className="font-medium">{app.quota.name}</dd>
                          </div>
                        )}
                        {challan && (
                          <>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Challan #</dt>
                              <dd className="font-medium font-mono text-xs">{challan.challanNumber}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Fee</dt>
                              <dd className="font-medium">PKR {challan.amount}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Next Steps</h4>
                      <ApplicationActionPanel
                        app={app}
                        challan={challan}
                        onUploadComplete={handleUploadComplete}
                        onSubmit={handleFinalSubmit}
                        isSubmitting={isSubmitting}
                      />
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

function FileText({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
}
