import { useGetStudentDashboardSummary, useGetMe, useListNotices } from "@workspace/api-client-react";
import { Loader2, FileText, CreditCard, Award, Bell, User, ChevronRight, AlertTriangle, ShieldCheck, PartyPopper, TrendingUp, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";

const G = "#01411C";

/* ───────── Stat Card ───────── */
function StatCard({
  label, value, sub, icon: Icon, bg, border, text, iconBg, href,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType;
  bg: string; border: string; text: string; iconBg: string;
  href?: string;
}) {
  const inner = (
    <div className={`rounded-xl p-4 border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${bg} ${border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${text} opacity-60`}>{label}</p>
          <p className={`text-2xl font-black leading-none truncate ${text}`}>{value}</p>
          <p className={`text-[11px] mt-1.5 leading-tight ${text} opacity-55`}>{sub}</p>
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${text}`} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ───────── Application Timeline ───────── */
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
      <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                  style={{
                    background: warn ? "#f97316" : done ? "#16a34a" : active ? G : "#f3f4f6",
                    borderColor: warn ? "#f97316" : done ? "#16a34a" : active ? G : "#e5e7eb",
                    color: done || active || warn ? "white" : "#9ca3af",
                  }}
                >
                  {done ? "✓" : warn ? "!" : idx + 1}
                </div>
                <span
                  className="text-[9px] whitespace-nowrap font-semibold"
                  style={{ color: warn ? "#f97316" : done ? "#16a34a" : active ? G : "#9ca3af" }}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="h-0.5 w-7 mb-4 mx-0.5 rounded"
                  style={{ background: idx < cur ? "#16a34a" : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Quick Access Card ───────── */
function QuickCard({ icon: Icon, label, sub, href, color }: {
  icon: React.ElementType; label: string; sub: string; href: string; color: string;
}) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <p className="text-xs font-bold text-gray-800 text-center">{label}</p>
        <p className="text-[10px] text-gray-400 text-center leading-tight">{sub}</p>
      </div>
    </Link>
  );
}

/* ───────── Main Dashboard ───────── */
export default function StudentDashboard() {
  const { data: user } = useGetMe();
  const { data: summary, isLoading } = useGetStudentDashboardSummary();
  const { data: noticesData } = useListNotices();

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: G }} />
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
    <div className="space-y-5">

      {/* ── Hero Banner ── */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: G }}>
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-green-300 uppercase">Live Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Admission Overview</h1>
            <p className="text-green-300 text-sm mt-0.5">
              {greeting}, {user?.fullName?.split(" ")[0]} &nbsp;·&nbsp; {format(now, "EEE, d MMM yyyy")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-black text-white tracking-tight">
              {format(now, "hh:mm")} <span className="text-green-300 text-2xl">{format(now, "a")}</span>
            </p>
            <p className="text-green-300 text-xs">{greeting}</p>
          </div>
        </div>
      </div>

      {/* ── Alert Banners ── */}
      {isAdmitted && (
        <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <PartyPopper className="h-7 w-7 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-green-800">Congratulations! You have been Admitted</p>
            <p className="text-xs text-green-700 mt-0.5">Collect your joining letter from the college office and complete enrollment by the joining deadline.</p>
          </div>
          <Link href="/student/applications">
            <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 shrink-0">
              View <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}
      {isClarification && (
        <div className="flex items-center gap-4 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <AlertTriangle className="h-7 w-7 text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-orange-800">Action Required — Clarification Needed</p>
            <p className="text-xs text-orange-700 mt-0.5">A verification officer has flagged an issue. Please visit the Admissions Office with your original documents.</p>
          </div>
        </div>
      )}
      {isVerification && (
        <div className="flex items-center gap-4 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4">
          <ShieldCheck className="h-7 w-7 text-sky-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sky-800">Report to Verification Desk</p>
            <p className="text-xs text-sky-700 mt-0.5">Bring all originals: Matric & FSc certificates, Domicile, CNIC/B-Form, Medical Fitness (Mon–Fri, 8am–2pm).</p>
          </div>
        </div>
      )}

      {/* ── 6 Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="My Applications"
          value={totalApps}
          sub={totalApps === 0 ? "No applications yet" : `${totalApps} program(s) applied`}
          icon={FileText}
          bg="bg-indigo-50" border="border-indigo-100" text="text-indigo-700" iconBg="bg-indigo-100"
          href="/student/applications"
        />
        <StatCard
          label="Current Status"
          value={latestApp ? latestApp.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "—"}
          sub={latestApp?.applicationNumber ?? "No application"}
          icon={TrendingUp}
          bg="bg-teal-50" border="border-teal-100" text="text-teal-700" iconBg="bg-teal-100"
          href="/student/applications"
        />
        <StatCard
          label="Pending Fee"
          value={pendingPay}
          sub={pendingPay === 0 ? "All challans cleared" : `${pendingPay} challan(s) pending`}
          icon={CreditCard}
          bg="bg-orange-50" border="border-orange-100" text="text-orange-700" iconBg="bg-orange-100"
          href="/student/challans"
        />
        <StatCard
          label="Merit Rank"
          value={meritRank ? `#${meritRank}` : "—"}
          sub={meritScore ? `Score: ${Number(meritScore).toFixed(2)}` : "Not listed yet"}
          icon={Award}
          bg="bg-violet-50" border="border-violet-100" text="text-violet-700" iconBg="bg-violet-100"
          href="/student/merit"
        />
        <StatCard
          label="Profile Complete"
          value={`${completion}%`}
          sub={completion >= 100 ? "Fully complete ✓" : `${14 - Math.round(completion * 14 / 100)} fields remaining`}
          icon={User}
          bg="bg-emerald-50" border="border-emerald-100" text="text-emerald-700" iconBg="bg-emerald-100"
          href="/student/profile"
        />
        <StatCard
          label="Active Notices"
          value={activeNotices}
          sub={activeNotices === 0 ? "No new notices" : "Important announcements"}
          icon={Bell}
          bg="bg-rose-50" border="border-rose-100" text="text-rose-700" iconBg="bg-rose-100"
          href="/student/notices"
        />
      </div>

      {/* ── Bottom two columns ── */}
      <div className="grid md:grid-cols-5 gap-5">

        {/* Application Progress */}
        <div className="md:col-span-3 bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Application Progress</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {latestApp ? latestApp.applicationNumber : "No active application"}
              </p>
            </div>
            {latestApp && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ background: G }}
              >
                {latestApp.status.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div className="px-5 py-5">
            {latestApp ? (
              <>
                <AppTimeline status={latestApp.status} />
                {latestApp.status === "draft" && (
                  <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "#f0fdf4", borderLeft: `3px solid ${G}` }}>
                    <p className="font-semibold text-green-900">Next Step: Generate Fee Challan</p>
                    <p className="text-green-700 text-xs mt-0.5">Go to Applications page and click <strong>Generate Challan</strong> to proceed.</p>
                  </div>
                )}
                {latestApp.status === "challan_generated" && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border-l-4 border-amber-500 text-sm">
                    <p className="font-semibold text-amber-900">Next Step: Pay & Upload Slip</p>
                    <p className="text-amber-700 text-xs mt-0.5">Print the challan, pay at HBL, then upload the bank-stamped deposit slip.</p>
                  </div>
                )}
                {latestApp.status === "slip_uploaded" && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500 text-sm">
                    <p className="font-semibold text-blue-900">Next Step: Submit Application</p>
                    <p className="text-blue-700 text-xs mt-0.5">Your slip is uploaded. Click Submit Application to send it for review.</p>
                  </div>
                )}
                {(latestApp.status === "submitted" || latestApp.status === "under_review") && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border-l-4 border-gray-300 text-sm">
                    <p className="font-semibold text-gray-700">Under Review</p>
                    <p className="text-gray-500 text-xs mt-0.5">Your application is being processed. No action needed — we will notify you of any updates.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-14 w-14 rounded-full flex items-center justify-center mb-3" style={{ background: `${G}12` }}>
                  <FileText className="h-7 w-7" style={{ color: G }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No Application Yet</p>
                <p className="text-xs text-gray-400 mb-4">
                  {completion >= 100 ? "Complete your profile and start your application." : `Complete your profile (${completion}% done) first.`}
                </p>
                <Link href="/student/applications">
                  <Button size="sm" className="text-white" style={{ background: G }}>
                    {completion >= 100 ? "Apply Now" : "Complete Profile"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="md:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <p className="font-bold text-gray-900 text-sm">Recent Notices</p>
            <span className="text-xs text-gray-400">TODAY</span>
          </div>
          <div className="divide-y">
            {notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Bell className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No notices yet</p>
              </div>
            ) : (
              notices.map((n: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${G}15` }}
                  >
                    <Bell className="h-3.5 w-3.5" style={{ color: G }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {n.createdAt ? format(new Date(n.createdAt), "d MMM yyyy") : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {notices.length > 0 && (
            <div className="px-5 py-3 border-t">
              <Link href="/student/notices">
                <p className="text-xs font-semibold text-center" style={{ color: G }}>View All Notices →</p>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-5 py-4 border-b">
          <p className="font-bold text-gray-900 text-sm">Quick Access</p>
          <p className="text-xs text-gray-400">Jump to any section</p>
        </div>
        <div className="p-4 grid grid-cols-3 md:grid-cols-6 gap-3">
          <QuickCard icon={FileText}  label="Applications"  sub="Apply for programs"  href="/student/applications" color="#4f46e5" />
          <QuickCard icon={User}      label="My Profile"    sub="Update your info"    href="/student/profile"      color={G} />
          <QuickCard icon={CreditCard}label="Fee Challans"  sub="Pay fees"            href="/student/challans"     color="#f97316" />
          <QuickCard icon={FileUp}    label="Documents"     sub="Upload files"        href="/student/documents"    color="#0d9488" />
          <QuickCard icon={Award}     label="Merit Status"  sub="Check your rank"     href="/student/merit"        color="#7c3aed" />
          <QuickCard icon={Bell}      label="Notices"       sub="Announcements"       href="/student/notices"      color="#e11d48" />
        </div>
      </div>

      {/* ── System Status Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Profile Status", value: completion >= 100 ? "Complete" : `${completion}% Done`, ok: completion >= 100 },
          { label: "Application",    value: latestApp ? latestApp.status.replace(/_/g, " ") : "Not Applied", ok: !!latestApp },
          { label: "Fee Challans",   value: pendingPay === 0 ? "All Cleared" : `${pendingPay} Pending`, ok: pendingPay === 0 },
          { label: "Portal",         value: "Active & Secure", ok: true },
        ].map(({ label, value, ok }) => (
          <div key={label} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${ok ? "bg-green-400" : "bg-amber-400"}`} />
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium">{label}</p>
              <p className="text-xs font-bold text-gray-800 truncate capitalize">{value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
