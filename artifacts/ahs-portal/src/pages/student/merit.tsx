import { useGetStudentDashboardSummary } from "@workspace/api-client-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Award, Trophy } from "lucide-react";

export default function StudentMerit() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merit Status</h1>
          <p className="text-muted-foreground">Check your ranking in the admission merit lists.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2 border-primary/20 shadow-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Overall Merit Rank</CardTitle>
            <CardDescription>Based on your academic profile and applied programs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {summary?.meritRank ? (
              <>
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
                <div className="text-5xl font-extrabold text-primary mb-2">#{summary.meritRank}</div>
                <p className="text-muted-foreground font-medium">Congratulations! You are on the merit list.</p>
              </>
            ) : (
              <>
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Award className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <div className="text-2xl font-bold text-muted-foreground mb-2">Pending</div>
                <p className="text-muted-foreground text-center max-w-md">
                  Your merit rank has not been generated yet. Merit lists are typically published after the application deadline closes.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
