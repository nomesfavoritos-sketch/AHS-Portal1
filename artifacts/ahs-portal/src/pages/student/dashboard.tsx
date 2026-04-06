import { useGetStudentDashboardSummary, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, CheckCircle, Clock, CreditCard, Bell, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.fullName}</h1>
          <p className="text-muted-foreground">Here's an overview of your admission status.</p>
        </div>
        <Link href="/student/applications">
          <Button>Submit New Application</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">My Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.approvedApplications || 0} approved, {summary?.pendingApplications || 0} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.pendingPayments || 0) + (summary?.pendingDocuments || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex gap-2">
              <span>{summary?.pendingPayments || 0} payments</span>
              <span>•</span>
              <span>{summary?.pendingDocuments || 0} documents</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Merit Status</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.meritRank ? `#${summary.meritRank}` : "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.meritRank ? "In active merit list" : "Awaiting merit lists"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notices
            </CardTitle>
            <CardDescription>
              Important announcements from the administration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-md border-dashed">
              No new notices
            </div>
            <div className="mt-4 flex justify-center">
              <Link href="/student/notices">
                <Button variant="outline" size="sm">View All Notices</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Fee Status
            </CardTitle>
            <CardDescription>
              Your recent fee challans and their payment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-md border-dashed">
              No pending challans
            </div>
            <div className="mt-4 flex justify-center">
              <Link href="/student/challans">
                <Button variant="outline" size="sm">View All Challans</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
