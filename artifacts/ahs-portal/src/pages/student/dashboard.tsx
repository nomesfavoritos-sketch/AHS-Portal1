import { useGetStudentDashboardSummary, useGetMe, useListNotices } from "@workspace/api-client-react";
import { Loader2, FileText, CreditCard, Award, Bell, User, ChevronRight, AlertTriangle, ShieldCheck, PartyPopper, TrendingUp, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";

/* --------- Stat Card --------- */
function StatCard({
  label, value, sub, icon: Icon, bg, border, text, iconBg, href,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType;
  bg: string; border: string; text: string; iconBg: string;
  href?: string;
}) {
  const inner = (
    <Card className={`relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer ${bg} ${border}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${text} opacity-60`}>{label}</p>
            <p className={`text-2xl font-bold leading-none truncate ${text}`}>{value}</p>
            <p className={`text-[11px] leading-tight ${text} opacity-55`}>{sub}</p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* --------- Application Timeline --------- */
const STEPS = [
  { key: "draft",                   label: "Applied" },
  { key: "challan_generated",       label: "Challan" },
  { key: "slip_uploaded",           label: "Paid" },
  { key: "submitted",               label: "Submitted" },
  { key: "under_review",            label: "Under Review" },
  { key: "verified",                label: "Verified" },
  { key: "merit_listed",            label: "Merit Listed" },
  { key: "selected_for_verification", label: "Verification" },
  { key: "admitted",                label: "Admitted" },
];

const STEP_IDX: Record<string, number> = {
  draft: 0, challan_generated: 1, slip_uploaded: 2,
  submitted: 3, under_review: 4, clarification_required: 4,
  verified: 5, merit_listed: 6, selected_for_verification: 7, admitted: 8,
};

function AppTimeline({ status }: { status: string }) {
  const cur = STEP_IDX[status] ?? 0;
  const isRejected = status === "rejected";
  const isClarification = status === "clarification_required";

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 py-4 px-5 rounded-2xl bg-red-50 border border-red-200/60 text-red-700 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        Application not successful. You may apply again in the next open session.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center min-w-max gap-0">
        {STEPS.map((step, idx) => {
          const done = idx < cur;
          const active = idx === cur;
          const warn = isClarification && idx === cur;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-sm"
                  style={{
                    background: warn ? "#f97316" : done ? "#16a34a" : active ? "#01411C" : "#f8fafc",
                    borderColor: warn ? "#f97316" : done ? "#16a34a" : active ? "#01411C" : "#e2e8f0",
                    color: done || active || warn ? "white" : "#94a3b8",
                  }}
                >
                  {done ? "✓" : warn ? "!" : idx + 1}
                </div>
                <span
                  className="text-[9px] whitespace-nowrap font-semibold"
                  style={{ color: warn ? "#f97316" : done ? "#16a34a" : active ? "#01411C" : "#94a3b8" }}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="h-0.5 w-8 mb-4 mx-1 rounded-full"
                  style={{ background: idx < cur ? "#16a34a" : "#e2e8f0" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------- Quick Access Card --------- */
function QuickCard({ icon: Icon, label, sub, href, color }: {
  icon: React.ElementType; label: string; sub: string; href: string; color: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex flex-col items-center gap-2 p-4 hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5">
        <CardContent className="p-0 flex flex-col items-center gap-2">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <p className="text-xs font-bold text-foreground text-center">{label}</p>
          <p className="text-[10px] text-muted-foreground text-center leading-tight">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

/* --------- Main Dashboard --------- */
export default function StudentDashboard() {
  const { data: user } = useGetMe();
  const { data: summary, isLoading } = useGetStudentDashboardSummary();
  const { data: noticesData } = useListNotices();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completion   = (summary as any)?.profileCompletion ?? 0;
  const meritRank    = (summary as any)?.meritRank ?? null;
  const meritScore   = (summary as any)?.meritScore ?? null;
  const appStatuses: Array<{ id: number; status: string; applicationNumber: string }> = (summary as any)?.applicationStatuses ?? [];
  const latestApp    = appStatuses[appStatuses.length - 1];
  const totalApps    = (summary as any)?.totalApplications ?? 0;
  const pendingPay   = (summary as any)?.pendingPayments ?? 0;
  const activeNotices= (summary as any)?.activeNotices ?? 0;

  const isAdmitted   = latestApp?.status === "admitted";
  const isClarification = latestApp?.status === "clarification_required";
  const isVerification  = latestApp?.status === "selected_for_verification";

  const now = new Date();
  const hr  = now.getHours();
  const greeting = hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening";

  const notices = ((noticesData as any)?.notices ?? []).slice(0, 5);

  return (
    <div className="space-y-6">

      {/* Hero Banner */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="gov-gradient px-6 py-6 sm:px-8 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Badge variant="gold" className="text-[10px] px-2.5 py-0.5">Live Portal</Badge>
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">Admission Overview</h1>
              <p className="text-white/50 text-sm mt-1">
                {greeting}, {user?.fullName?.split(" ")[0]} · {format(now, "EEE, d MMM yyyy")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-bold text-white tracking-tight">
                {format(now, "hh:mm")} <span className="text-white/40 text-2xl">{format(now, "a")}</span>
              </p>
              <p className="text-white/40 text-xs">{greeting}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Alert Banners */}
      {isAdmitted && (
        <Card className="border-emerald-200/60 bg-emerald-50/50">
          <CardContent className="flex items-center gap-4 p-5">
            <PartyPopper className="h-7 w-7 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-emerald-800">Congratulations! You have been Admitted</p>
              <p className="text-xs text-emerald-700 mt-0.5">Collect your joining letter from the college office and complete enrollment by the joining deadline.</p>
            </div>
            <Link href="/student/applications">
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 shrink-0">
                View <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      {isClarification && (
        <Card className="border-orange-200/60 bg-orange-50/50">
          <CardContent className="flex items-center gap-4 p-5">
            <AlertTriangle className="h-7 w-7 text-orange-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-orange-800">Action Required — Clarification Needed</p>
              <p className="text-xs text-orange-700 mt-0.5">A verification officer has flagged an issue. Please visit the Admissions Office with your original documents.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {isVerification && (
        <Card className="border-sky-200/60 bg-sky-50/50">
          <CardContent className="flex items-center gap-4 p-5">
            <ShieldCheck className="h-7 w-7 text-sky-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sky-800">Report to Verification Desk</p>
              <p className="text-xs text-sky-700 mt-0.5">Bring all originals: Matric & FSc certificates, Domicile, CNIC/B-Form, Medical Fitness (Mon–Fri, 8am–2pm).</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="My Applications"
          value={totalApps}
          sub={totalApps === 0 ? "No applications yet" : `${totalApps} program(s) applied`}
          icon={FileText}
          bg="bg-indigo-50/50" border="border-indigo-100" text="text-indigo-700" iconBg="bg-indigo-100/80"
          href="/student/applications"
        />
        <StatCard
          label="Current Status"
          value={latestApp ? latestApp.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "—"}
          sub={latestApp?.applicationNumber ?? "No application"}
          icon={TrendingUp}
          bg="bg-teal-50/50" border="border-teal-100" text="text-teal-700" iconBg="bg-teal-100/80"
          href="/student/applications"
        />
        <StatCard
          label="Pending Fee"
          value={pendingPay}
          sub={pendingPay === 0 ? "All challans cleared" : `${pendingPay} challan(s) pending`}
          icon={CreditCard}
          bg="bg-orange-50/50" border="border-orange-100" text="text-orange-700" iconBg="bg-orange-100/80"
          href="/student/challans"
        />
        <StatCard
          label="Merit Rank"
          value={meritRank ? `#${meritRank}` : "—"}
          sub={meritScore ? `Score: ${Number(meritScore).toFixed(2)}` : "Not listed yet"}
          icon={Award}
          bg="bg-violet-50/50" border="border-violet-100" text="text-violet-700" iconBg="bg-violet-100/80"
          href="/student/merit"
        />
        <StatCard
          label="Profile Complete"
          value={`${completion}%`}
          sub={completion >= 100 ? "Fully complete" : `${14 - Math.round(completion * 14 / 100)} fields remaining`}
          icon={User}
          bg="bg-emerald-50/50" border="border-emerald-100" text="text-emerald-700" iconBg="bg-emerald-100/80"
          href="/student/profile"
        />
        <StatCard
          label="Active Notices"
          value={activeNotices}
          sub={activeNotices === 0 ? "No new notices" : "Important announcements"}
          icon={Bell}
          bg="bg-rose-50/50" border="border-rose-100" text="text-rose-700" iconBg="bg-rose-100/80"
          href="/student/notices"
        />
      </div>

      {/* Application Progress + Notices */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Application Progress */}
        <Card className="md:col-span-3">
          <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-sm">Application Progress</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {latestApp ? latestApp.applicationNumber : "No active application"}
              </p>
            </div>
            {latestApp && (
              <Badge variant="default" className="text-[11px]">
                {latestApp.status.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <CardContent className="p-6">
            {latestApp ? (
              <>
                <AppTimeline status={latestApp.status} />
                {latestApp.status === "draft" && (
                  <div className="mt-5 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 gold-accent">
                    <p className="font-semibold text-emerald-900 text-sm">Next Step: Generate Fee Challan</p>
                    <p className="text-emerald-700 text-xs mt-1">Go to Applications page and click <strong>Generate Challan</strong> to proceed.</p>
                  </div>
                )}
                {latestApp.status === "challan_generated" && (
                  <div className="mt-5 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 gold-accent">
                    <p className="font-semibold text-amber-900 text-sm">Next Step: Pay & Upload Slip</p>
                    <p className="text-amber-700 text-xs mt-1">Print the challan, pay at HBL, then upload the bank-stamped deposit slip.</p>
                  </div>
                )}
                {latestApp.status === "slip_uploaded" && (
                  <div className="mt-5 p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 gold-accent">
                    <p className="font-semibold text-blue-900 text-sm">Next Step: Submit Application</p>
                    <p className="text-blue-700 text-xs mt-1">Your slip is uploaded. Click Submit Application to send it for review.</p>
                  </div>
                )}
                {(latestApp.status === "submitted" || latestApp.status === "under_review") && (
                  <div className="mt-5 p-4 rounded-xl bg-muted/30 border border-border/40 gold-accent">
                    <p className="font-semibold text-foreground text-sm">Under Review</p>
                    <p className="text-muted-foreground text-xs mt-1">Your application is being processed. No action needed — we will notify you of any updates.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/8">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No Application Yet</p>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">
                  {completion >= 100 ? "Complete your profile and start your application." : `Complete your profile (${completion}% done) first.`}
                </p>
                <Link href="/student/applications">
                  <Button size="sm">
                    {completion >= 100 ? "Apply Now" : "Complete Profile"}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notices */}
        <Card className="md:col-span-2">
          <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
            <p className="font-bold text-foreground text-sm">Recent Notices</p>
            <Badge variant="outline" className="text-[10px]">Today</Badge>
          </div>
          <div className="divide-y divide-border/40">
            {notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="h-8 w-8 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground">No notices yet</p>
              </div>
            ) : (
              notices.map((n: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-primary/8">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {n.createdAt ? format(new Date(n.createdAt), "d MMM yyyy") : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {notices.length > 0 && (
            <div className="px-6 py-3.5 border-t border-border/40">
              <Link href="/student/notices">
                <p className="text-xs font-semibold text-center text-primary hover:underline">View All Notices →</p>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <div className="px-6 py-5 border-b border-border/40">
          <p className="font-bold text-foreground text-sm">Quick Access</p>
          <p className="text-xs text-muted-foreground mt-0.5">Jump to any section</p>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <QuickCard icon={FileText}  label="Applications"  sub="Apply for programs"  href="/student/applications" color="#4f46e5" />
            <QuickCard icon={User}      label="My Profile"    sub="Update your info"    href="/student/profile"      color="#01411C" />
            <QuickCard icon={CreditCard}label="Fee Challans"  sub="Pay fees"            href="/student/challans"     color="#f97316" />
            <QuickCard icon={FileUp}    label="Documents"     sub="Upload files"        href="/student/documents"    color="#0d9488" />
            <QuickCard icon={Award}     label="Merit Status"  sub="Check your rank"     href="/student/merit"        color="#7c3aed" />
            <QuickCard icon={Bell}      label="Notices"       sub="Announcements"       href="/student/notices"      color="#e11d48" />
          </div>
        </CardContent>
      </Card>

      {/* System Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Profile Status", value: completion >= 100 ? "Complete" : `${completion}% Done`, ok: completion >= 100 },
          { label: "Application",    value: latestApp ? latestApp.status.replace(/_/g, " ") : "Not Applied", ok: !!latestApp },
          { label: "Fee Challans",   value: pendingPay === 0 ? "All Cleared" : `${pendingPay} Pending`, ok: pendingPay === 0 },
          { label: "Portal",         value: "Active & Secure", ok: true },
        ].map(({ label, value, ok }) => (
          <Card key={label} className="p-0">
            <CardContent className="px-4 py-3 flex items-center gap-3 p-0">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                <p className="text-xs font-bold text-foreground truncate capitalize">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
