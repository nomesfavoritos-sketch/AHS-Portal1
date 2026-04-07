import { useGetStudentDashboardSummary, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle, Clock, CreditCard, Bell, Award, User, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

const STATUS_STEPS = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "verified", label: "Verified" },
  { key: "merit_listed", label: "Merit Listed" },
  { key: "admitted", label: "Admitted" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under Review", variant: "outline" },
  verified: { label: "Verified", variant: "default" },
  merit_listed: { label: "Merit Listed", variant: "default" },
  admitted: { label: "Admitted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

function ApplicationTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx || status === "admitted";
        const active = idx === currentIdx;
        const future = idx > currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${done ? "bg-green-500 border-green-500 text-white" :
                  active ? "bg-primary border-primary text-white" :
                  "bg-muted border-muted-foreground/20 text-muted-foreground"}`}>
                {done ? "✓" : idx + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mx-0.5 mb-4 rounded ${done || active ? "bg-primary/60" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentDashboard() {
  const { data: user } = useGetMe();
  const { data: summary, isLoading } = useGetStudentDashboardSummary();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completionPercent = (summary as any)?.profileCompletion ?? 0;
  const meritRank = (summary as any)?.meritRank ?? null;
  const meritScore = (summary as any)?.meritScore ?? null;
  const joiningConfirmed = (summary as any)?.joiningIntentConfirmed ?? false;
  const joiningAt = (summary as any)?.joiningIntentAt ?? null;
  const appStatuses: Array<{ id: number; status: string; applicationNumber: string }> = (summary as any)?.applicationStatuses ?? [];
  const latestApp = appStatuses[appStatuses.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Track your admission progress below.</p>
        </div>
        <Link href="/student/applications">
          <Button>New Application</Button>
        </Link>
      </div>

      {/* Merit Banner */}
      {meritRank && (
        <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-violet-100 dark:bg-violet-900 p-3">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">Merit List Position</p>
                <p className="text-2xl font-bold text-violet-800 dark:text-violet-200">Rank #{meritRank}</p>
                {meritScore && <p className="text-xs text-violet-600 dark:text-violet-400">Merit score: {Number(meritScore).toFixed(2)}</p>}
              </div>
              <Link href="/student/merit">
                <Button variant="outline" size="sm" className="border-violet-300 text-violet-700 hover:bg-violet-100">
                  View Details <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Joining Confirmed Banner */}
      {joiningConfirmed && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">Joining Intent Confirmed</p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  You confirmed your intent to join{joiningAt ? ` on ${format(new Date(joiningAt), "MMM d, yyyy")}` : ""}. The administration will process your joining formally.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Completion */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 opacity-80" />
                <h3 className="text-sm font-semibold">Profile Completion</h3>
                <span className="ml-auto text-sm font-bold">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
              <p className="text-xs opacity-70 mt-1.5">
                {completionPercent < 100 ? "Complete your profile to strengthen your application." : "Your profile is fully complete."}
              </p>
            </div>
            <Link href="/student/profile">
              <Button variant="secondary" size="sm">
                {completionPercent < 100 ? "Complete Profile" : "Edit Profile"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">My Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalApplications ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.approvedApplications ?? 0} admitted · {summary?.pendingApplications ?? 0} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingPayments ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Challans awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary as any)?.activeNotices ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/student/notices" className="underline underline-offset-2">View all notices</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Timeline */}
      {latestApp && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Application Status
              </CardTitle>
              <Badge variant={STATUS_BADGE[latestApp.status]?.variant ?? "secondary"}>
                {STATUS_BADGE[latestApp.status]?.label ?? latestApp.status}
              </Badge>
            </div>
            <CardDescription>{latestApp.applicationNumber}</CardDescription>
          </CardHeader>
          <CardContent>
            {latestApp.status === "rejected" ? (
              <div className="flex items-center gap-3 py-2 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">This application has been rejected. You may submit a new application for the next session.</p>
              </div>
            ) : (
              <ApplicationTimeline status={latestApp.status} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and links</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {[
            { href: "/student/documents", icon: CheckCircle, label: "Documents" },
            { href: "/student/challans", icon: CreditCard, label: "Pay Challans" },
            { href: "/student/merit", icon: Award, label: "Merit Status" },
            { href: "/student/notices", icon: Bell, label: "Notices" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer text-center">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
