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
  useGetMe,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, Plus, CheckCircle, UploadCloud, AlertTriangle,
  ClipboardCheck, PartyPopper, XCircle, Clock, UserCheck,
  Printer, Eye,
} from "lucide-react";
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
    case "draft": return <Badge variant="secondary">Draft</Badge>;
    case "challan_generated": return <Badge className="bg-amber-500 text-white">Challan Generated</Badge>;
    case "slip_uploaded": return <Badge className="bg-blue-500 text-white">Slip Uploaded</Badge>;
    case "submitted": return <Badge className="bg-green-600 text-white">Submitted</Badge>;
    case "under_review": return <Badge className="bg-amber-600 text-white">Under Review</Badge>;
    case "verified": return <Badge className="bg-emerald-500 text-white">Verified</Badge>;
    case "rejected": return <Badge variant="destructive">Rejected</Badge>;
    case "merit_listed": return <Badge className="bg-purple-500 text-white">Merit Listed</Badge>;
    case "selected_for_verification": return <Badge className="bg-sky-600 text-white">For Verification</Badge>;
    case "clarification_required": return <Badge className="bg-orange-500 text-white">Clarification Needed</Badge>;
    case "admitted": return <Badge className="bg-green-700 text-white">Admitted</Badge>;
    default: return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
  }
}

function PrintChallanWindow({ app, challan, profile, user }: { app: any; challan: any; profile: any; user: any }) {
  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Fee Challan – ${challan.challanNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .page { width: 190mm; margin: 10mm auto; border: 1px solid #333; }
    .header { background: #01411C; color: white; padding: 12px 16px; text-align: center; }
    .header h2 { margin: 0; font-size: 16px; }
    .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
    .challan-no { background: #f0f0f0; padding: 8px 16px; text-align: center; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ccc; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #ccc; padding: 7px 10px; font-size: 12px; }
    th { background: #f5f5f5; font-weight: bold; width: 40%; }
    .amount-row td { font-size: 16px; font-weight: bold; text-align: center; background: #fffbeb; }
    .footer { text-align: center; font-size: 11px; color: #555; padding: 8px; border-top: 1px solid #ccc; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <h2>Allied Health Sciences College – Nishtar Medical University</h2>
    <p>Bank Copy – Fee Deposit Challan</p>
  </div>
  <div class="challan-no">Challan # ${challan.challanNumber}</div>
  <table>
    <tr><th>Applicant Name</th><td>${profile?.fatherName ? user?.fullName ?? "" : user?.fullName ?? ""}</td></tr>
    <tr><th>CNIC / B-Form</th><td>${profile?.cnic ?? ""}</td></tr>
    <tr><th>Program Applied</th><td>${app.program.name}</td></tr>
    <tr><th>Session</th><td>${app.session.name}</td></tr>
    <tr><th>Application #</th><td>${app.applicationNumber}</td></tr>
    <tr><th>Due Date</th><td>${challan.dueDate ? format(new Date(challan.dueDate), "dd MMM yyyy") : "—"}</td></tr>
  </table>
  <table style="margin-top:10px;">
    <tr class="amount-row"><td colspan="2">Fee Amount: PKR ${Number(challan.amount).toLocaleString()}</td></tr>
  </table>
  <div class="footer">
    Deposit at any HBL branch. Keep this challan as receipt. Non-refundable.
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  };
  return (
    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={handlePrint}>
      <Printer className="h-3.5 w-3.5" /> Print Challan
    </Button>
  );
}

function SubmitChallanDialog({ app, challan, onUploadComplete, onFinalSubmit, isSubmitting }: {
  app: any; challan: any;
  onUploadComplete: (result: any, challanId: number, appId: number) => Promise<void>;
  onFinalSubmit: (appId: number) => void;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
          <UploadCloud className="h-3.5 w-3.5" />
          {app.status === "slip_uploaded" ? "Submit Application" : "Submit Challan"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {app.status === "slip_uploaded" ? "Submit Final Application" : "Upload Paid Challan Slip"}
          </DialogTitle>
          <DialogDescription>
            {app.status === "slip_uploaded"
              ? "Your payment slip has been received. Click below to submit your application for review."
              : `Deposit PKR ${Number(challan?.amount ?? 0).toLocaleString()} at any HBL branch using Challan # ${challan?.challanNumber}, then upload the paid deposit slip.`}
          </DialogDescription>
        </DialogHeader>

        {app.status === "challan_generated" && challan && (
          <div className="space-y-4">
            <div className="rounded-md border bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Instructions:</strong> Print the challan, deposit the fee at HBL, then upload the bank-stamped slip here.
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
              onComplete={async (result) => {
                await onUploadComplete(result, challan.id, app.id);
                setOpen(false);
              }}
            >
              <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer w-full">
                <UploadCloud className="h-4 w-4" /> Upload Paid Slip
              </div>
            </ObjectUploader>
          </div>
        )}

        {app.status === "slip_uploaded" && (
          <DialogFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { onFinalSubmit(app.id); setOpen(false); }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Submit Application
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusMessage({ app }: { app: any }) {
  switch (app.status) {
    case "merit_listed":
      return <div className="flex items-center gap-1.5 text-purple-700 text-xs"><ClipboardCheck className="h-3.5 w-3.5" /> Merit Listed – check Merit Status page</div>;
    case "selected_for_verification":
      return <div className="flex items-center gap-1.5 text-sky-700 text-xs"><Eye className="h-3.5 w-3.5" /> Selected for physical verification</div>;
    case "clarification_required":
      return <div className="flex items-center gap-1.5 text-orange-700 text-xs"><AlertTriangle className="h-3.5 w-3.5" /> Contact Admissions Office</div>;
    case "admitted":
      return <div className="flex items-center gap-1.5 text-green-700 text-xs"><PartyPopper className="h-3.5 w-3.5" /> Admitted – collect joining letter</div>;
    case "rejected":
      return <div className="flex items-center gap-1.5 text-red-700 text-xs"><XCircle className="h-3.5 w-3.5" /> Application not successful</div>;
    case "submitted":
    case "under_review":
    case "verified":
      return <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Clock className="h-3.5 w-3.5" /> Processing – no action needed</div>;
    default:
      return null;
  }
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
  const { data: userData } = useGetMe();
  const createApplication = useCreateApplication();

  const profilePct = (profileData as any)?.completionPercentage ?? 0;
  const profileComplete = profilePct >= 100;

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
          toast({ title: "Failed to create application", description: (error as any).error || "An error occurred", variant: "destructive" });
        },
      }
    );
  };

  const handleFinalSubmit = async (appId: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/applications/${appId}/submit`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Submission failed", description: body?.error || "An error occurred", variant: "destructive" });
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
          method: "POST", body: JSON.stringify({ paidSlipPath: objectPath }),
          headers: { "Content-Type": "application/json" }, credentials: "include"
        });
        if (response.ok) {
          toast({ title: "Paid slip uploaded successfully" });
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        } else {
          throw new Error("Failed to update paid slip");
        }
      } catch (e: any) {
        toast({ title: "Upload error", description: e.message || "An error occurred", variant: "destructive" });
      }
    }
  };

  const openSessions = sessions?.filter(s => s.status === "open" && s.isActive) || [];
  const apps = applicationsData?.applications ?? [];
  const hasDraft = apps.some(a => a.status === "draft" || a.status === "challan_generated");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Profile Completion Gate */}
      {!profileComplete && (
        <Alert className="border-red-300 bg-red-50">
          <UserCheck className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">Profile Incomplete — {profilePct}% Complete</AlertTitle>
          <AlertDescription className="text-red-700 text-sm mt-1">
            You must complete your profile <strong>100%</strong> before you can apply for any program.{" "}
            <Link href="/student/profile" className="font-semibold underline">Go to My Profile →</Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Incomplete draft warning */}
      {profileComplete && hasDraft && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">You have an incomplete application in the panel. Please complete it before proceeding.</AlertTitle>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your program applications and challan payments.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!profileComplete && open) return; setIsCreateOpen(open); }}>
          <DialogTrigger asChild>
            <Button disabled={openSessions.length === 0 || !profileComplete} title={!profileComplete ? `Complete profile to 100% before applying` : undefined}>
              <Plus className="mr-2 h-4 w-4" /> Add New Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for a Program</DialogTitle>
              <DialogDescription>Select a session and program to start your application.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Session</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Open Session" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {openSessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                <FormField control={form.control} name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {programs?.filter(p => p.isActive).map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.code})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                <FormField control={form.control} name="quotaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quota Category (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue="none">
                        <FormControl><SelectTrigger><SelectValue placeholder="Open Merit (Default)" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Open Merit (Default)</SelectItem>
                          {quotas?.filter(q => q.isActive).map(q => <SelectItem key={q.id} value={q.id.toString()}>{q.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
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

      {/* Applications Table */}
      {isLoadingApps ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="text-center p-14 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-base mb-1">No applications yet</p>
            <p className="text-sm mb-4">
              {profileComplete
                ? 'Click "Add New Program" to apply when an admission session is open.'
                : "Complete your profile first, then apply for a program."}
            </p>
            {profileComplete ? (
              <Button onClick={() => setIsCreateOpen(true)} disabled={openSessions.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> Start Application
              </Button>
            ) : (
              <Button asChild>
                <Link href="/student/profile">Complete Profile</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">My Program Applications</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 px-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 pl-6">Sr#</TableHead>
                  <TableHead>Application #</TableHead>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app, idx) => {
                  const challan = challansData?.find(c => c.applicationId === app.id);
                  const showPrint = challan && (app.status === "challan_generated" || app.status === "slip_uploaded" || app.status === "submitted" || app.status === "under_review" || app.status === "verified" || app.status === "admitted");
                  const showSubmit = app.status === "challan_generated" || app.status === "slip_uploaded";

                  return (
                    <TableRow key={app.id} className="align-top">
                      <TableCell className="pl-6 font-mono text-muted-foreground text-sm">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-medium text-sm">{app.applicationNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{app.program.name}</div>
                        {app.program.code && <div className="text-xs text-muted-foreground">{app.program.code}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{app.session.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(app.status)}
                          <StatusMessage app={app} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 items-center">
                          {showPrint && (
                            <PrintChallanWindow app={app} challan={challan} profile={profileData} user={userData} />
                          )}
                          {showSubmit && (
                            <SubmitChallanDialog
                              app={app}
                              challan={challan}
                              onUploadComplete={handleUploadComplete}
                              onFinalSubmit={handleFinalSubmit}
                              isSubmitting={isSubmitting}
                            />
                          )}
                          {!showPrint && !showSubmit && (
                            <StatusMessage app={app} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="px-6 pt-2 pb-1 text-xs text-muted-foreground">
              Showing {apps.length} of {apps.length} {apps.length === 1 ? "entry" : "entries"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
