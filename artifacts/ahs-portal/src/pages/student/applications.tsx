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
  Printer, Eye, FileCheck2, CreditCard, Send, Zap,
  Pencil, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const G = "#01411C";

const FLOW_STEPS = [
  { icon: FileCheck2, label: "Apply", desc: "Create application" },
  { icon: CreditCard, label: "Challan", desc: "Generate fee challan" },
  { icon: Printer, label: "Pay", desc: "Pay at HBL & upload slip" },
  { icon: Send, label: "Submit", desc: "Submit for review" },
];

function ApplicationFlowGuide({ currentStatus }: { currentStatus?: string }) {
  const activeIdx = currentStatus === "draft" ? 0
    : currentStatus === "challan_generated" ? 1
    : currentStatus === "slip_uploaded" ? 2
    : currentStatus === "submitted" || currentStatus === "under_review" ? 3 : 3;

  return (
    <div className="rounded-xl border bg-white p-4 mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Process</p>
      <div className="flex items-center">
        {FLOW_STEPS.map((step, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all
                  ${done ? "bg-green-500 text-white" : active ? "text-white" : "bg-gray-100 text-gray-400"}`}
                  style={active ? { background: G } : {}}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-semibold ${done ? "text-green-600" : active ? "text-gray-900" : "text-gray-400"}`}>{step.label}</span>
                <span className="text-[10px] text-gray-400 hidden sm:block text-center">{step.desc}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full ${done ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GenerateChallanButton({ appId, onSuccess }: { appId: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const baseUrl = import.meta.env.BASE_URL;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}api/applications/${appId}/generate-challan`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Failed to generate challan", description: body?.error || "An error occurred", variant: "destructive" });
        return;
      }
      toast({ title: "Fee challan generated!", description: `Challan # ${body.challanNumber} — PKR ${Number(body.amount).toLocaleString()}` });
      onSuccess();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={handleGenerate} disabled={loading}
      className="gap-1.5 text-white"
      style={{ background: G }}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
      Generate Challan
    </Button>
  );
}

function amountToWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (amount === 0) return "Zero Rupees Only";
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
  };
  return convert(amount) + " Rupees Only";
}

function PrintChallanWindow({ app, challan, profile, user }: { app: any; challan: any; profile: any; user: any }) {
  const handlePrint = () => {
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    const dueDate = challan.dueDate ? format(new Date(challan.dueDate), "dd MMM, yyyy") : "—";
    const sessionName = app.session?.name ?? "";
    const amount = Number(challan.amount ?? 0);
    const amountStr = amount.toLocaleString();
    const amountWords = amountToWords(amount);
    const studentName = user?.fullName ?? "";
    const fatherName = profile?.fatherName ?? "";
    const cnic = profile?.cnic ?? "";
    const challanNo = challan.challanNumber ?? "";
    const appNo = app.applicationNumber ?? "";
    const program = app.program?.name ?? "";

    const copyHtml = (copyLabel: string) => `
<div class="copy">
  <div class="copy-label">${copyLabel}</div>
  <div class="copy-title">Application Challan Form – ${sessionName}</div>
  <div class="logo-block">
    <div class="logo-badge">AHS</div>
    <div class="logo-text">
      <div class="inst-name">Allied Health Sciences College</div>
      <div class="inst-sub">Nishtar Medical University, Multan</div>
    </div>
  </div>
  <div class="date-row">
    <div class="date-field">
      <span class="field-label">Payment Date:</span>
      <span class="date-boxes"><span class="box"></span><span class="box"></span> / <span class="box"></span><span class="box"></span> / <span class="box"></span><span class="box"></span><span class="box"></span><span class="box"></span></span>
    </div>
    <div class="due-date">Due Date: <strong>${dueDate}</strong></div>
  </div>

  <div class="section-head">For Cash Payment</div>
  <div class="bank-info">
    <div><strong>A/C Title:</strong> Allied Health Sciences College – NMU Admissions Fee</div>
    <div><strong>Bank:</strong> Habib Bank Limited (Any Branch)</div>
    <div><strong>A/C No:</strong> 0001-7939840154 <em>(only posted thru AHS Portal)</em></div>
  </div>

  <div class="section-head">For Online Payment</div>
  <div class="bank-info">
    <div><strong>JazzCash / EasyPaisa:</strong> 0300-1234567</div>
    <div><strong>Reference:</strong> CNIC No. (without dashes)</div>
  </div>

  <div class="challan-no-row">Challan No: <strong>${challanNo}</strong></div>

  <table class="info-table">
    <tr><td class="lbl">Student Name:</td><td>${studentName}</td></tr>
    <tr><td class="lbl">Father Name:</td><td>${fatherName}</td></tr>
    <tr><td class="lbl">CNIC / B-Form:</td><td>${cnic}</td></tr>
    <tr><td class="lbl">Program:</td><td>${program}</td></tr>
    <tr><td class="lbl">Application No:</td><td>${appNo}</td></tr>
    <tr><td class="lbl">Processing Fee:</td><td>Rs ${amountStr}/-</td></tr>
    <tr><td class="lbl">Other Charges:</td><td>Rs 0/-</td></tr>
    <tr><td class="lbl total-row">Total Amount:</td><td class="total-row">Rs ${amountStr}/-</td></tr>
    <tr><td class="lbl">In Words:</td><td>${amountWords}</td></tr>
  </table>

  <div class="sig-row">
    <div class="sig-block">Deposited By: <span class="underline-field"></span></div>
    <div class="sig-block">Bank Stamp</div>
    <div class="sig-block">Signature</div>
  </div>
</div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Fee Challan – ${challanNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; background: #fff; color: #111; }
    .page-wrapper { padding: 12px 10px; }

    /* top bar */
    .top-bar { display: flex; justify-content: center; gap: 12px; margin-bottom: 14px; }
    .btn { padding: 6px 16px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .btn.primary { background: #01411C; color: #fff; border-color: #01411C; }
    @media print { .top-bar { display: none; } }

    /* three copies */
    .copies-row { display: flex; gap: 0; border: 1px solid #aaa; }
    .copy { flex: 1; border-right: 1px dashed #aaa; padding: 8px 9px; min-height: 460px; }
    .copy:last-child { border-right: none; }

    .copy-label { text-align: center; font-weight: bold; font-size: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 4px; color: #01411C; }
    .copy-title { text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 7px; }

    .logo-block { display: flex; align-items: center; gap: 7px; justify-content: center; margin-bottom: 6px; }
    .logo-badge { width: 36px; height: 36px; background: #01411C; color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; letter-spacing: -0.5px; flex-shrink: 0; }
    .logo-text { text-align: left; }
    .inst-name { font-size: 10px; font-weight: bold; line-height: 1.3; }
    .inst-sub { font-size: 9px; color: #555; }

    .date-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 10px; border: 1px solid #ccc; padding: 3px 5px; }
    .date-field { display: flex; align-items: center; gap: 5px; }
    .field-label { font-weight: bold; }
    .box { display: inline-block; width: 12px; height: 14px; border: 1px solid #333; margin: 0 1px; }
    .due-date { font-size: 10px; }

    .section-head { text-align: center; font-weight: bold; font-size: 10.5px; margin: 5px 0 3px; background: #f0f0f0; padding: 2px 0; border: 1px solid #ccc; }
    .bank-info { font-size: 9.5px; line-height: 1.5; border: 1px solid #eee; border-top: none; padding: 3px 5px; margin-bottom: 0; }

    .challan-no-row { text-align: center; background: #ddd; padding: 3px; font-size: 11px; margin: 5px 0 5px; border: 1px solid #bbb; }

    .info-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .info-table td { padding: 2.5px 4px; border: 1px solid #ccc; }
    .info-table .lbl { font-weight: bold; background: #f8f8f8; width: 40%; }
    .info-table .total-row { font-weight: bold; background: #fffbeb; }

    .sig-row { display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 5px; font-size: 9px; }
    .sig-block { flex: 1; text-align: center; }
    .underline-field { display: inline-block; width: 60px; border-bottom: 1px solid #333; }

    /* instructions */
    .instructions { margin-top: 12px; border: 1px solid #ccc; padding: 8px 10px; font-size: 9.5px; line-height: 1.7; }
    .instructions strong { font-size: 10px; }
    .instructions ol { padding-left: 16px; }
    .footer-cr { text-align: center; font-size: 9px; color: #888; margin-top: 8px; }
  </style>
</head>
<body>
<div class="page-wrapper">
  <div class="top-bar">
    <button class="btn" onclick="window.close()">✕ Close</button>
    <button class="btn primary" onclick="window.print()">🖨 Print</button>
  </div>

  <div class="copies-row">
    ${copyHtml("Student Copy")}
    ${copyHtml("University Copy")}
    ${copyHtml("Bank Copy")}
  </div>

  <div class="instructions">
    <strong>Instructions:</strong>
    <ol>
      <li>Application Processing Fee can be deposited at any branch of Habib Bank Limited (HBL).</li>
      <li>Fee can also be paid via JazzCash or EasyPaisa using the mobile number provided above. Enter your CNIC as reference.</li>
      <li>In case of Direct transfer / IBFT / RTGS, payment traceability issues may cause failure to verify your application.</li>
      <li>Due to missing information and non-traceable payment, a candidate may not be able to complete the admissions process.</li>
      <li>After payment, upload the bank-stamped deposit slip on the AHS Student Portal immediately.</li>
      <li>In case of payment through Mobile/Digital Banking App, please share your payment proof at <strong>admissions@ahscollege.edu.pk</strong></li>
    </ol>
  </div>
  <div class="footer-cr">© All Rights Reserved – Allied Health Sciences College, NMU ${new Date().getFullYear()}</div>
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

function ViewApplicationDialog({ app, challan }: { app: any; challan?: any }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button title="View Application"
          className="h-8 w-8 rounded-md bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>Full details of your application.</DialogDescription>
        </DialogHeader>
        <div className="divide-y text-sm">
          {[
            ["Application #", app.applicationNumber],
            ["Program", app.program?.name],
            ["Program Code", app.program?.code ?? "—"],
            ["Session", app.session?.name],
            ["Quota", app.quota?.name ?? "Open Merit"],
            ["Status", app.status?.replace(/_/g, " ")],
            ["Applied On", app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy, hh:mm a") : "—"],
            ...(challan ? [
              ["Challan #", challan.challanNumber],
              ["Fee Amount", `PKR ${Number(challan.amount).toLocaleString()}`],
              ["Due Date", challan.dueDate ? format(new Date(challan.dueDate), "dd MMM yyyy") : "—"],
              ["Payment Status", challan.isPaid ? "Paid" : "Unpaid"],
            ] : []),
            ...(app.remarks ? [["Remarks", app.remarks]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 gap-4">
              <span className="text-muted-foreground font-medium shrink-0">{label}</span>
              <span className="text-right font-medium">{value}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditApplicationDialog({ app, programs, quotas, onSuccess }: {
  app: any; programs: any[]; quotas: any[]; onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.BASE_URL;
  const canEdit = app.status !== "submitted" && app.status !== "under_review" && app.status !== "verified"
    && app.status !== "merit_listed" && app.status !== "selected_for_verification"
    && app.status !== "admitted" && app.status !== "rejected";

  const form = useForm<{ programId: string; quotaId: string }>({
    defaultValues: { programId: String(app.program?.id ?? ""), quotaId: String(app.quota?.id ?? "none") },
  });

  const onSubmit = async (data: { programId: string; quotaId: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}api/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          programId: Number(data.programId),
          quotaId: data.quotaId === "none" ? null : Number(data.quotaId),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Update failed", description: err.error, variant: "destructive" });
      } else {
        toast({ title: "Application updated" });
        setOpen(false);
        onSuccess();
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title={canEdit ? "Edit Application" : "Cannot edit at this stage"}
          disabled={!canEdit}
          className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors text-white
            ${canEdit ? "bg-amber-500 hover:bg-amber-600 cursor-pointer" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>Update the program or quota for {app.applicationNumber}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="programId" render={({ field }) => (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {programs?.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="quotaId" render={({ field }) => (
              <FormItem>
                <FormLabel>Quota Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Open Merit" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Open Merit (Default)</SelectItem>
                    {quotas?.filter(q => q.isActive).map(q => (
                      <SelectItem key={q.id} value={String(q.id)}>{q.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteApplicationButton({ app, onSuccess }: { app: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.BASE_URL;
  const canDelete = app.status === "draft";

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}api/applications/${app.id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Delete failed", description: err.error, variant: "destructive" });
      } else {
        toast({ title: "Application deleted" });
        onSuccess();
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!canDelete) {
    return (
      <button
        title="Only draft applications can be deleted"
        disabled
        className="h-8 w-8 rounded-md bg-gray-200 text-gray-400 cursor-not-allowed flex items-center justify-center">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button title="Delete Application"
          className="h-8 w-8 rounded-md bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Application?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete application <strong>{app.applicationNumber}</strong> for{" "}
            <strong>{app.program?.name}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
            Yes, Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
  const latestApp = apps[apps.length - 1];

  const refreshApps = () => queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });

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

      {/* Application Flow Guide */}
      {apps.length > 0 && <ApplicationFlowGuide currentStatus={latestApp?.status} />}

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
                  const showGenerate = app.status === "draft";
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
                        <div className="flex flex-col gap-2">
                          {/* 3 icon action buttons always shown */}
                          <div className="flex items-center gap-1.5">
                            <ViewApplicationDialog app={app} challan={challan} />
                            <EditApplicationDialog app={app} programs={programs ?? []} quotas={quotas ?? []} onSuccess={refreshApps} />
                            <DeleteApplicationButton app={app} onSuccess={refreshApps} />
                          </div>
                          {/* Workflow buttons depending on status */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {showGenerate && <GenerateChallanButton appId={app.id} onSuccess={refreshApps} />}
                            {showPrint && <PrintChallanWindow app={app} challan={challan} profile={profileData} user={userData} />}
                            {showSubmit && (
                              <SubmitChallanDialog
                                app={app}
                                challan={challan}
                                onUploadComplete={handleUploadComplete}
                                onFinalSubmit={handleFinalSubmit}
                                isSubmitting={isSubmitting}
                              />
                            )}
                            {!showGenerate && !showPrint && !showSubmit && <StatusMessage app={app} />}
                          </div>
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
