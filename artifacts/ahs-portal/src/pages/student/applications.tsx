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
  getListChallansQueryKey,
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
  Pencil, Trash2, User, GraduationCap, BookOpen, FileUp,
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
  priority: z.coerce.number().int().min(1).max(5).default(1),
});

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "1st Choice",  color: "bg-yellow-500 text-white" },
  2: { label: "2nd Choice",  color: "bg-blue-500 text-white" },
  3: { label: "3rd Choice",  color: "bg-amber-500 text-white" },
  4: { label: "4th Choice",  color: "bg-orange-500 text-white" },
  5: { label: "5th Choice",  color: "bg-slate-500 text-white" },
};

type ApplicationFormValues = z.infer<typeof applicationSchema>;

function getStatusBadge(status: string) {
  switch (status) {
    case "draft": return <Badge variant="secondary">Draft</Badge>;
    case "challan_generated": return <Badge className="bg-amber-500 text-white">Challan Generated</Badge>;
    case "slip_uploaded": return <Badge className="bg-blue-500 text-white">Slip Uploaded</Badge>;
    case "submitted": return <Badge className="bg-yellow-500 text-white">Submitted</Badge>;
    case "under_review": return <Badge className="bg-amber-600 text-white">Under Review</Badge>;
    case "verified": return <Badge className="bg-yellow-500 text-white">Verified</Badge>;
    case "rejected": return <Badge variant="destructive">Rejected</Badge>;
    case "merit_listed": return <Badge className="bg-purple-500 text-white">Merit Listed</Badge>;
    case "selected_for_verification": return <Badge className="bg-sky-600 text-white">For Verification</Badge>;
    case "clarification_required": return <Badge className="bg-orange-500 text-white">Clarification Needed</Badge>;
    case "admitted": return <Badge className="bg-yellow-600 text-white">Admitted</Badge>;
    default: return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
  }
}

const G = "#01411C";

const FLOW_STEPS = [
  { icon: User,        label: "Profile",    desc: "Complete your profile" },
  { icon: FileUp,      label: "Documents",  desc: "Upload required docs" },
  { icon: FileCheck2,  label: "Apply",      desc: "Create application" },
  { icon: CreditCard,  label: "Challan",    desc: "Generate fee challan" },
  { icon: Printer,     label: "Pay",        desc: "Pay at HBL & upload slip" },
  { icon: Send,        label: "Submit",     desc: "Submit for review" },
];

function ApplicationFlowGuide({ currentStatus, profileComplete, hasApp }: {
  currentStatus?: string;
  profileComplete?: boolean;
  hasApp?: boolean;
}) {
  const activeIdx =
    !profileComplete                                                          ? 0
    : !hasApp                                                                 ? 1
    : currentStatus === "draft"                                               ? 2
    : currentStatus === "challan_generated"                                   ? 3
    : currentStatus === "slip_uploaded"                                       ? 4
    : (currentStatus === "submitted" || currentStatus === "under_review")     ? 5
    : 5;

  return (
    <div className="rounded-xl border bg-white p-4 mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Process</p>
      <div className="flex items-center overflow-x-auto pb-1">
        {FLOW_STEPS.map((step, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={i} className="flex items-center flex-1 min-w-fit">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0
                  ${done ? "bg-yellow-500 text-white" : active ? "text-white" : "bg-gray-100 text-gray-400"}`}
                  style={active ? { background: G } : {}}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${done ? "text-yellow-600" : active ? "text-gray-900" : "text-gray-400"}`}>{step.label}</span>
                <span className="text-[10px] text-gray-400 hidden sm:block text-center whitespace-nowrap">{step.desc}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full min-w-[12px] ${done ? "bg-yellow-400" : "bg-gray-200"}`} />
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

    const logoUrl = window.location.origin + import.meta.env.BASE_URL + "logo.webp";
    const copyHtml = (copyLabel: string) => `
<div class="copy">
  <div class="copy-label">${copyLabel}</div>
  <div class="copy-title">Application Challan Form – ${sessionName}</div>
  <div class="logo-block">
    <img src="${logoUrl}" class="logo-badge" style="object-fit:contain;background:#fff;padding:2px;border-radius:4px;" />
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
      <li>In case of Direct transfer / IBFT / RTGS, payment traceability issues may cause failure to verify your application.</li>
      <li>Due to missing information and non-traceable payment, a candidate may not be able to complete the admissions process.</li>
      <li>After payment, upload the bank-stamped deposit slip on the AHS Student Portal immediately.</li>
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
    <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 h-7 px-2 text-[11px]" onClick={handlePrint}>
      <Printer className="h-3 w-3" /> Print Challan
    </Button>
  );
}

function PrintApplicationButton({ app, challan, profile, user }: { app: any; challan?: any; profile?: any; user?: any }) {
  const baseUrl = import.meta.env.BASE_URL;
  const p = profile ?? {};
  const u = user ?? {};
  const photoUrl = p.photoPath ? `${baseUrl}api/storage/objects/${p.photoPath}` : null;

  const handlePrint = () => {
    const dob = p.dateOfBirth ? format(new Date(p.dateOfBirth), "dd MMM yyyy") : "—";
    const appliedOn = app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy, hh:mm a") : "—";
    const submittedOn = app.submittedAt ? format(new Date(app.submittedAt), "dd MMM yyyy, hh:mm a") : "—";
    const dueDate = challan?.dueDate ? format(new Date(challan.dueDate), "dd MMM yyyy") : "—";
    const mPct = p.matricTotal && p.matricMarks ? ((p.matricMarks / p.matricTotal)*100).toFixed(1)+"%" : "—";
    const iPct = p.interTotal  && p.interMarks  ? ((p.interMarks  / p.interTotal) *100).toFixed(1)+"%" : "—";
    const priority = (app as any).priority ?? 1;
    const priorityLabel = ["","1st Choice","2nd Choice","3rd Choice","4th Choice","5th Choice"][priority] ?? `Choice ${priority}`;

    const win = window.open("", "_blank", "width=960,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Application Form — ${app.applicationNumber}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:20px;}
  .header{background:#01411C;color:white;padding:14px 18px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:flex-start;}
  .header h1{margin:0;font-size:15px;font-weight:700;letter-spacing:.5px;}
  .header p{margin:2px 0 0;font-size:11px;opacity:.8;}
  .stamp{display:inline-block;padding:3px 10px;border:2px solid #F0B429;color:#F0B429;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px;}
  .section-head{background:#01411C;color:white;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:16px 0 10px;}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 20px;margin-bottom:10px;}
  .field label{display:block;font-size:9px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;}
  .field span{font-size:12px;font-weight:600;color:#111;}
  .photo-row{display:flex;gap:16px;align-items:flex-start;}
  .photo{width:80px;height:96px;border:2px solid #01411C;object-fit:cover;border-radius:4px;background:#eee;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;color:#ccc;text-align:center;padding-top:28px;}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:4px;}
  th{background:#f3f4f6;text-align:left;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;border:1px solid #e5e7eb;}
  td{padding:7px 10px;border:1px solid #e5e7eb;color:#111;}
  .badge{display:inline-block;background:#01411C;color:white;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;}
  .sig-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:30px;}
  .sig-box{border-top:1px solid #555;padding-top:6px;font-size:10px;color:#555;text-align:center;}
  .footer{margin-top:20px;text-align:center;font-size:10px;color:#888;border-top:1px solid #e5e7eb;padding-top:10px;}
  @media print{body{padding:10px;}button{display:none;}}
</style></head><body>
<div class="header">
  <div style="display:flex;align-items:center;gap:10px;">
    <img src="${window.location.origin + baseUrl + 'logo.webp'}" style="height:42px;width:42px;object-fit:contain;background:#fff;padding:3px;border-radius:5px;flex-shrink:0;" />
    <div>
      <h1>Application Form</h1>
      <p>Allied Health Sciences College — Nishtar Medical University, Multan</p>
      <span class="stamp">✓ ${(app.status ?? "").replace(/_/g," ").toUpperCase()}</span>
    </div>
  </div>
  <div style="text-align:right">
    <h1>${app.applicationNumber}</h1>
    <p>Applied: ${appliedOn}</p>
    ${app.submittedAt ? `<p>Submitted: ${submittedOn}</p>` : ""}
  </div>
</div>
<div class="section-head">Personal Information</div>
<div class="photo-row">
  ${photoUrl ? `<img class="photo" src="${photoUrl}" style="padding:0;" />` : `<div class="photo">No<br>Photo</div>`}
  <div class="grid" style="flex:1">
    <div class="field"><label>Applicant Name</label><span>${u.fullName || "—"}</span></div>
    <div class="field"><label>Father's Name</label><span>${p.fatherName || "—"}</span></div>
    <div class="field"><label>Mother's Name</label><span>${p.motherName || "—"}</span></div>
    <div class="field"><label>CNIC / B-Form</label><span>${p.cnic || "—"}</span></div>
    <div class="field"><label>Date of Birth</label><span>${dob}</span></div>
    <div class="field"><label>Gender</label><span>${p.gender || "—"}</span></div>
    <div class="field"><label>Religion</label><span>${p.religion || "—"}</span></div>
    <div class="field"><label>Email</label><span>${u.email || "—"}</span></div>
    <div class="field"><label>Phone</label><span>${p.phone || "—"}</span></div>
  </div>
</div>
<div class="grid" style="margin-top:10px">
  <div class="field"><label>Domicile District</label><span>${p.domicileDistrict || "—"}</span></div>
  <div class="field"><label>Province</label><span>${p.province || "—"}</span></div>
  <div class="field"><label>Permanent Address</label><span>${p.address || "—"}</span></div>
</div>
<div class="section-head">Academic Qualifications</div>
<table>
  <thead><tr><th>Examination</th><th>Board / University</th><th>Roll No.</th><th>Year</th><th>Total</th><th>Obtained</th><th>%age</th></tr></thead>
  <tbody>
    <tr><td><strong>Matriculation (SSC)</strong></td><td>${p.matricBoard||"—"}</td><td>${p.matricRoll||"—"}</td><td>${p.matricYear||"—"}</td><td>${p.matricTotal||"—"}</td><td>${p.matricMarks||"—"}</td><td>${mPct}</td></tr>
    <tr><td><strong>Intermediate (FSc/ICS)</strong></td><td>${p.interBoard||"—"}</td><td>${p.interRoll||"—"}</td><td>${p.interYear||"—"}</td><td>${p.interTotal||"—"}</td><td>${p.interMarks||"—"}</td><td>${iPct}</td></tr>
  </tbody>
</table>
<div class="section-head">Program Details</div>
<table>
  <thead><tr><th>Program Name</th><th>Program Code</th><th>Duration</th><th>Session</th><th>Quota Category</th><th>Priority</th></tr></thead>
  <tbody><tr>
    <td><strong>${app.program?.name||"—"}</strong></td>
    <td>${app.program?.code||"—"}</td>
    <td>${app.program?.duration||"—"}</td>
    <td>${app.session?.name||"—"}</td>
    <td>${app.quota?.name||"Open Merit"}</td>
    <td>${priorityLabel}</td>
  </tr></tbody>
</table>
${challan ? `
<div class="section-head">Fee Payment Details</div>
<table>
  <thead><tr><th>Challan #</th><th>Amount (PKR)</th><th>Due Date</th><th>Payment Status</th></tr></thead>
  <tbody><tr>
    <td>${challan.challanNumber}</td>
    <td><strong>PKR ${Number(challan.amount).toLocaleString()}</strong></td>
    <td>${dueDate}</td>
    <td>${challan.status?.replace(/_/g," ")||"—"}</td>
  </tr></tbody>
</table>` : ""}
<div class="sig-row">
  <div class="sig-box">Applicant Signature</div>
  <div class="sig-box">Verification Officer</div>
  <div class="sig-box">Admissions Controller</div>
</div>
<div class="footer">Allied Health Sciences College, Nishtar Medical University, Multan &nbsp;|&nbsp; Printed: ${new Date().toLocaleString("en-PK")}<br>This is a computer-generated document. No signature is required for authenticity.</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    win.document.close();
  };

  return (
    <Button size="sm" className="gap-1 h-7 px-2 text-[11px] text-white" style={{ background: "#01411C" }} onClick={handlePrint}>
      <FileCheck2 className="h-3 w-3" /> Print App
    </Button>
  );
}

function SubmitChallanDialog({ app, challan, onUploadComplete, onFinalSubmit, isSubmitting }: {
  app: any; challan: any;
  onUploadComplete: (result: any, challanId: number, appId: number, bankReceiptNo: string) => Promise<void>;
  onFinalSubmit: (appId: number) => void;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [bankReceiptNo, setBankReceiptNo] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const baseUrl = import.meta.env.BASE_URL;

  const canUpload = bankReceiptNo.trim().length >= 4;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setBankReceiptNo(""); setReceiptError(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1 h-7 px-2 text-[11px]">
          <UploadCloud className="h-3 w-3" />
          {app.status === "slip_uploaded" ? "Submit App" : "Submit Challan"}
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
              <strong>Instructions:</strong> Print the challan, deposit the fee at HBL, then enter the bank receipt number and upload the stamped slip here.
            </div>

            {/* Bank Receipt Number Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Bank Deposit Receipt / Transaction Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bankReceiptNo}
                onChange={(e) => { setBankReceiptNo(e.target.value); setReceiptError(""); }}
                placeholder="e.g. HBL-20260426-123456"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {receiptError && <p className="text-xs text-red-600">{receiptError}</p>}
              {!canUpload && bankReceiptNo.length > 0 && (
                <p className="text-xs text-amber-600">Receipt number must be at least 4 characters.</p>
              )}
              <p className="text-xs text-gray-400">Enter the receipt/transaction number shown on your HBL bank deposit slip.</p>
            </div>

            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={5242880}
              buttonClassName="w-full"
              onGetUploadParameters={async (file) => {
                if (!canUpload) {
                  setReceiptError("Please enter the bank receipt number before uploading.");
                  throw new Error("Receipt number required");
                }
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
                if (!canUpload) { setReceiptError("Please enter the bank receipt number."); return; }
                await onUploadComplete(result, challan.id, app.id, bankReceiptNo.trim());
                setOpen(false);
              }}
            >
              <div className={`flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer w-full
                ${canUpload ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
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

const G_COLOR = "#01411C";

function AppSectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: G_COLOR }}>
      <span className="text-white opacity-80">{icon}</span>
      <span className="text-white font-semibold text-sm tracking-wide uppercase">{title}</span>
    </div>
  );
}

function AppInfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || "—"}</p>
    </div>
  );
}

function ViewApplicationDialog({ app, challan, profile, user }: {
  app: any; challan?: any; profile?: any; user?: any;
}) {
  const [open, setOpen] = useState(false);
  const baseUrl = import.meta.env.BASE_URL;
  const p = profile ?? {};
  const u = user ?? {};
  const photoUrl = p.photoPath ? `${baseUrl}api/storage/objects/${p.photoPath}` : null;

  const matricPct = p.matricTotal && p.matricMarks ? ((p.matricMarks / p.matricTotal) * 100).toFixed(1) + "%" : "—";
  const interPct  = p.interTotal  && p.interMarks  ? ((p.interMarks  / p.interTotal)  * 100).toFixed(1) + "%" : "—";

  const handlePrint = () => {
    const dob = p.dateOfBirth ? format(new Date(p.dateOfBirth), "dd MMM yyyy") : "—";
    const appliedOn = app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy, hh:mm a") : "—";
    const dueDate = challan?.dueDate ? format(new Date(challan.dueDate), "dd MMM yyyy") : "—";
    const mPct = p.matricTotal && p.matricMarks ? ((p.matricMarks / p.matricTotal)*100).toFixed(1)+"%" : "—";
    const iPct = p.interTotal  && p.interMarks  ? ((p.interMarks  / p.interTotal) *100).toFixed(1)+"%" : "—";
    const win = window.open("", "_blank", "width=960,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Application Form — ${app.applicationNumber}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:20px;}
  .header{background:#01411C;color:white;padding:12px 16px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center;}
  .header h1{margin:0;font-size:14px;font-weight:700;letter-spacing:.5px;}
  .header p{margin:0;font-size:11px;opacity:.8;}
  .section-head{background:#01411C;color:white;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:14px 0 10px;}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 20px;margin-bottom:10px;}
  .field label{display:block;font-size:9px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;}
  .field span{font-size:12px;font-weight:600;color:#111;}
  .photo-row{display:flex;gap:16px;align-items:flex-start;}
  .photo{width:80px;height:96px;border:2px solid #01411C;object-fit:cover;border-radius:4px;background:#eee;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#f3f4f6;text-align:left;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;border:1px solid #e5e7eb;}
  td{padding:7px 10px;border:1px solid #e5e7eb;color:#111;}
  .footer{margin-top:24px;text-align:center;font-size:10px;color:#888;border-top:1px solid #e5e7eb;padding-top:10px;}
  @media print{body{padding:10px;}button{display:none;}}
</style></head><body>
<div class="header">
  <div><h1>Application Form</h1><p>Allied Health Sciences College — Nishtar Medical University</p></div>
  <div style="text-align:right"><h1>${app.applicationNumber}</h1><p>Status: ${(app.status ?? "").replace(/_/g, " ")}</p></div>
</div>
<div class="section-head">Personal Information</div>
<div class="photo-row">
  ${photoUrl ? `<img class="photo" src="${photoUrl}" />` : `<div class="photo" style="color:#ccc;font-size:10px;text-align:center;padding-top:30px;">No Photo</div>`}
  <div class="grid" style="flex:1">
    <div class="field"><label>Applicant Name</label><span>${u.fullName || "—"}</span></div>
    <div class="field"><label>Father's Name</label><span>${p.fatherName || "—"}</span></div>
    <div class="field"><label>Mother's Name</label><span>${p.motherName || "—"}</span></div>
    <div class="field"><label>CNIC / B-Form</label><span>${p.cnic || "—"}</span></div>
    <div class="field"><label>Date of Birth</label><span>${dob}</span></div>
    <div class="field"><label>Gender</label><span>${p.gender || "—"}</span></div>
    <div class="field"><label>Religion</label><span>${p.religion || "—"}</span></div>
    <div class="field"><label>Email Address</label><span>${u.email || "—"}</span></div>
    <div class="field"><label>Phone</label><span>${p.phone || "—"}</span></div>
  </div>
</div>
<div class="grid" style="margin-top:10px">
  <div class="field"><label>Domicile District</label><span>${p.domicileDistrict || "—"}</span></div>
  <div class="field"><label>Province</label><span>${p.province || "—"}</span></div>
  <div class="field"><label>Address</label><span>${p.address || "—"}</span></div>
</div>
<div class="section-head">Education Details</div>
<table>
  <thead><tr><th>Examination</th><th>Board / University</th><th>Roll No.</th><th>Year</th><th>Total Marks</th><th>Marks Obtained</th><th>Percentage</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>Matriculation</strong></td>
      <td>${p.matricBoard || "—"}</td><td>${p.matricRoll || "—"}</td><td>${p.matricYear || "—"}</td>
      <td>${p.matricTotal || "—"}</td><td>${p.matricMarks || "—"}</td><td>${mPct}</td>
    </tr>
    <tr>
      <td><strong>FSc / Intermediate</strong></td>
      <td>${p.interBoard || "—"}</td><td>${p.interRoll || "—"}</td><td>${p.interYear || "—"}</td>
      <td>${p.interTotal || "—"}</td><td>${p.interMarks || "—"}</td><td>${iPct}</td>
    </tr>
  </tbody>
</table>
<div class="section-head">Program Selection</div>
<table>
  <thead><tr><th>Program Name</th><th>Program Code</th><th>Session</th><th>Quota</th><th>Status</th></tr></thead>
  <tbody><tr>
    <td>${app.program?.name || "—"}</td>
    <td>${app.program?.code || "—"}</td>
    <td>${app.session?.name || "—"}</td>
    <td>${app.quota?.name || "Open Merit"}</td>
    <td>${(app.status ?? "").replace(/_/g, " ")}</td>
  </tr></tbody>
</table>
<div class="section-head">Application Details</div>
<div class="grid">
  <div class="field"><label>Application #</label><span>${app.applicationNumber}</span></div>
  <div class="field"><label>Applied On</label><span>${appliedOn}</span></div>
  <div class="field"><label>Remarks</label><span>${app.remarks || "—"}</span></div>
</div>
${challan ? `
<div class="section-head">Fee Challan Details</div>
<div class="grid">
  <div class="field"><label>Challan #</label><span>${challan.challanNumber}</span></div>
  <div class="field"><label>Fee Amount</label><span>PKR ${Number(challan.amount).toLocaleString()}</span></div>
  <div class="field"><label>Due Date</label><span>${dueDate}</span></div>
  <div class="field"><label>Payment Status</label><span>${challan.isPaid ? "Paid" : "Unpaid"}</span></div>
</div>` : ""}
<div class="footer">Allied Health Sciences College, Nishtar Medical University, Multan &nbsp;|&nbsp; Printed: ${new Date().toLocaleString("en-PK")}</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button title="View Application"
          className="h-8 w-8 rounded-md bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-base font-bold text-gray-900">Application Form</DialogTitle>
            <p className="text-xs text-gray-400 mt-0.5">{app.applicationNumber} &nbsp;·&nbsp; Applied: {app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy") : "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs h-8">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Personal Information */}
          <AppSectionHead icon={<User className="h-3.5 w-3.5" />} title="Personal Information" />
          <div className="flex gap-5">
            {/* Photo */}
            <div className="shrink-0">
              <div className="h-28 w-24 rounded-lg border-2 overflow-hidden bg-gray-100 flex items-center justify-center"
                style={{ borderColor: G_COLOR }}>
                {photoUrl
                  ? <img src={photoUrl} alt="Student" className="h-full w-full object-cover" />
                  : <User className="h-10 w-10 text-gray-300" />}
              </div>
            </div>
            {/* Top fields */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <AppInfoField label="Applicant Name" value={u.fullName} />
              <AppInfoField label="Father's Name" value={p.fatherName} />
              <AppInfoField label="Mother's Name" value={p.motherName} />
              <AppInfoField label="CNIC / B-Form" value={p.cnic} />
              <AppInfoField label="Date of Birth" value={p.dateOfBirth ? format(new Date(p.dateOfBirth), "dd MMM yyyy") : null} />
              <AppInfoField label="Gender" value={p.gender} />
              <AppInfoField label="Religion" value={p.religion} />
              <AppInfoField label="Email Address" value={u.email} />
              <AppInfoField label="Phone" value={p.phone} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <AppInfoField label="Domicile District" value={p.domicileDistrict} />
            <AppInfoField label="Province" value={p.province} />
            <AppInfoField label="Permanent Address" value={p.address} />
          </div>

          {/* Education Details */}
          <AppSectionHead icon={<GraduationCap className="h-3.5 w-3.5" />} title="Education Details" />
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {["Examination", "Board / University", "Roll No.", "Year", "Total Marks", "Marks Obtained", "Percentage"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2.5 font-semibold text-gray-800">Matriculation</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.matricBoard || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.matricRoll || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.matricYear || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.matricTotal || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.matricMarks || "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{matricPct}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-semibold text-gray-800">FSc / Intermediate</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.interBoard || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.interRoll || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.interYear || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.interTotal || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.interMarks || "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800">{interPct}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Program Selection */}
          <AppSectionHead icon={<BookOpen className="h-3.5 w-3.5" />} title="Program Selection" />
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {["Program Name", "Program Code", "Session", "Quota", "Status"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-semibold text-gray-800">{app.program?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{app.program?.code || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{app.session?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{app.quota?.name || "Open Merit"}</td>
                  <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Application Details */}
          <AppSectionHead icon={<FileCheck2 className="h-3.5 w-3.5" />} title="Application Details" />
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <AppInfoField label="Application #" value={app.applicationNumber} />
            <AppInfoField label="Applied On" value={app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy, hh:mm a") : "—"} />
            <AppInfoField label="Current Status" value={(app.status ?? "").replace(/_/g, " ")} />
            {app.remarks && <AppInfoField label="Remarks" value={app.remarks} />}
          </div>

          {/* Fee Challan */}
          {challan && (
            <>
              <AppSectionHead icon={<CreditCard className="h-3.5 w-3.5" />} title="Fee Challan Details" />
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                <AppInfoField label="Challan #" value={challan.challanNumber} />
                <AppInfoField label="Fee Amount" value={`PKR ${Number(challan.amount).toLocaleString()}`} />
                <AppInfoField label="Due Date" value={challan.dueDate ? format(new Date(challan.dueDate), "dd MMM yyyy") : "—"} />
                <AppInfoField label="Payment Status" value={challan.isPaid ? "✓ Paid" : "Unpaid"} />
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t flex items-center justify-between shrink-0 bg-gray-50">
          <span className="text-xs text-gray-400">Allied Health Sciences College — Nishtar Medical University, Multan</span>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </div>
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

  const form = useForm<{ programId: string; quotaId: string; priority: string }>({
    defaultValues: {
      programId: String(app.program?.id ?? ""),
      quotaId: String(app.quota?.id ?? "none"),
      priority: String(app.priority ?? 1),
    },
  });

  const onSubmit = async (data: { programId: string; quotaId: string; priority: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}api/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          programId: Number(data.programId),
          quotaId: data.quotaId === "none" ? null : Number(data.quotaId),
          priority: Number(data.priority),
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
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Program Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="1">1st Choice (Highest)</SelectItem>
                    <SelectItem value="2">2nd Choice</SelectItem>
                    <SelectItem value="3">3rd Choice</SelectItem>
                    <SelectItem value="4">4th Choice</SelectItem>
                    <SelectItem value="5">5th Choice (Lowest)</SelectItem>
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
      return <div className="flex items-center gap-1.5 text-yellow-700 text-xs"><PartyPopper className="h-3.5 w-3.5" /> Admitted – collect joining letter</div>;
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
    defaultValues: { sessionId: 0, programId: 0, quotaId: null, priority: 1 },
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
      refreshAll();
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message || "Network error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadComplete = async (result: any, challanId: number, appId: number, bankReceiptNo: string) => {
    const successful = result.successful?.[0];
    if (successful) {
      const objectPath = successful.response?.uploadURL?.split("?")[0]?.split("/").slice(-2).join("/") ?? "";
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/challans/${challanId}/paid-slip`, {
          method: "POST",
          body: JSON.stringify({ paidSlipPath: objectPath, bankReceiptNo: bankReceiptNo.trim() }),
          headers: { "Content-Type": "application/json" }, credentials: "include"
        });
        if (response.ok) {
          toast({ title: "Paid slip uploaded successfully" });
          refreshAll();
        } else {
          const err = await response.json().catch(() => ({}));
          toast({ title: "Upload failed", description: err.error || "Failed to update paid slip", variant: "destructive" });
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

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListChallansQueryKey() });
  };
  const refreshApps = refreshAll;

  return (
    <div className="space-y-4 w-full">

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
                <FormField control={form.control} name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Priority</FormLabel>
                      <Select onValueChange={v => field.onChange(Number(v))} defaultValue={field.value?.toString() ?? "1"}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1">1st Choice (Highest)</SelectItem>
                          <SelectItem value="2">2nd Choice</SelectItem>
                          <SelectItem value="3">3rd Choice</SelectItem>
                          <SelectItem value="4">4th Choice</SelectItem>
                          <SelectItem value="5">5th Choice (Lowest)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Set your preference order across programs — used during merit list processing.
                      </p>
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

      {/* Application Flow Guide — always visible */}
      <ApplicationFlowGuide
        currentStatus={latestApp?.status}
        profileComplete={profileComplete}
        hasApp={apps.length > 0}
      />

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
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 pl-6">Sr#</TableHead>
                  <TableHead>Application #</TableHead>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app, idx) => {
                  const challan = challansData?.find(c => c.applicationId === app.id);
                  const showGenerate = app.status === "draft";
                  const showPrint = challan && (app.status === "challan_generated" || app.status === "slip_uploaded");
                  const showPrintApp = ["submitted","under_review","verified","merit_listed","selected_for_verification","admitted","rejected"].includes(app.status);
                  const showSubmit = app.status === "challan_generated" || app.status === "slip_uploaded";

                  return (
                    <TableRow key={app.id} className="align-top">
                      <TableCell className="pl-6 font-mono text-muted-foreground text-sm">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-medium text-sm">{app.applicationNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{app.program.name}</div>
                        {app.program.code && <div className="text-xs text-muted-foreground">{app.program.code}</div>}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const p = (app as any).priority ?? 1;
                          const meta = PRIORITY_LABELS[p] ?? { label: `Choice ${p}`, color: "bg-slate-400 text-white" };
                          return <Badge className={`${meta.color} text-xs`}>{meta.label}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell className="text-sm">{app.session.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(app.status)}
                          <StatusMessage app={app} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-nowrap items-center gap-1">
                          <ViewApplicationDialog app={app} challan={challan} profile={profileData} user={userData} />
                          <EditApplicationDialog app={app} programs={programs ?? []} quotas={quotas ?? []} onSuccess={refreshApps} />
                          <DeleteApplicationButton app={app} onSuccess={refreshApps} />
                          {showGenerate && <GenerateChallanButton appId={app.id} onSuccess={refreshApps} />}
                          {showPrint && <PrintChallanWindow app={app} challan={challan} profile={profileData} user={userData} />}
                          {showPrintApp && <PrintApplicationButton app={app} challan={challan} profile={profileData} user={userData} />}
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
            <div className="px-6 pt-2 pb-1 text-xs text-muted-foreground">
              Showing {apps.length} of {apps.length} {apps.length === 1 ? "entry" : "entries"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
