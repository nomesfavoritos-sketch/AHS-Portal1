import { useGetStudentDashboardSummary, useListMeritLists, useGetMeritList } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Award, Trophy, Star, TrendingUp, Info, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function MeritScoreCard({ score, rank }: { score?: number | null; rank?: number | null }) {
  if (!score && !rank) return null;
  const pct = score ?? 0;
  const color = pct >= 85 ? "text-green-600" : pct >= 70 ? "text-blue-600" : pct >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-5xl font-extrabold ${color}`}>{pct.toFixed(2)}%</div>
      <p className="text-sm text-muted-foreground">Merit Score</p>
      {rank && <div className="mt-1 text-2xl font-bold text-primary">Rank #{rank}</div>}
    </div>
  );
}

function MeritEntry({ entry }: { entry: any }) {
  const breakdown = entry.meritBreakdown ?? {};
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{entry.application?.program?.name ?? "Program"}</p>
          <p className="text-sm text-muted-foreground">App #{entry.application?.applicationNumber}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{(entry.meritScoreNormalized ?? entry.meritScore).toFixed(2)}%</div>
          <Badge variant={entry.status === "selected" ? "default" : "secondary"} className="mt-1">{entry.status}</Badge>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">Rank</span>
        <span className="font-semibold">#{entry.rank}</span>
        {breakdown.matricMarks != null && <>
          <span className="text-muted-foreground">Matric Marks</span>
          <span>{breakdown.matricMarks}/{breakdown.matricTotal}</span>
        </>}
        {breakdown.fscMarks != null && <>
          <span className="text-muted-foreground">FSc Marks</span>
          <span>{breakdown.fscMarks}/{breakdown.fscTotal}</span>
        </>}
        {entry.matricScore != null && <>
          <span className="text-muted-foreground">Matric Score</span>
          <span>{entry.matricScore.toFixed(3)}</span>
        </>}
        {entry.fscScore != null && <>
          <span className="text-muted-foreground">FSc Score</span>
          <span>{entry.fscScore.toFixed(3)}</span>
        </>}
        {entry.meritScoreRaw != null && <>
          <span className="text-muted-foreground">Raw Score</span>
          <span>{entry.meritScoreRaw.toFixed(3)}</span>
        </>}
      </div>
    </div>
  );
}

function PublishedMeritLists({ studentId }: { studentId?: number }) {
  const { data: allLists } = useListMeritLists();
  const published = allLists?.filter((ml) => ml.isPublished) ?? [];

  if (!published.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" />Published Merit Lists</h2>
      {published.map((ml) => (
        <MeritListCard key={ml.id} id={ml.id} name={ml.name} studentId={studentId} />
      ))}
    </div>
  );
}

function MeritListCard({ id, name, studentId }: { id: number; name: string; studentId?: number }) {
  const { data, isLoading } = useGetMeritList(id);
  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!data) return null;

  const myEntries = data.entries?.filter((e) => e.application?.userId === studentId) ?? [];
  const allEntries = data.entries ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>
        </div>
        <CardDescription>{allEntries.length} candidates ranked</CardDescription>
      </CardHeader>
      <CardContent>
        {myEntries.length > 0 ? (
          <div className="space-y-3">
            {myEntries.map((entry) => <MeritEntry key={entry.id} entry={entry} />)}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Info className="h-4 w-4 mx-auto mb-1" />
            You do not appear in this merit list. Check your application status or contact the admissions office.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merit Status</h1>
          <p className="text-muted-foreground">Your ranking across published admission merit lists.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/merit-search"><Search className="mr-2 h-4 w-4" />Public Search</Link>
        </Button>
      </div>

      <Card className={summary?.meritRank ? "border-green-200 bg-green-50/30" : ""}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Overall Merit Position</CardTitle>
          <CardDescription>Based on your academic profile and applied programs</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {summary?.meritRank || summary?.meritScore ? (
            <>
              <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${summary.meritRank ? "bg-amber-100" : "bg-primary/10"}`}>
                {summary.meritRank && summary.meritRank <= 3
                  ? <Trophy className="h-10 w-10 text-amber-500" />
                  : summary.meritRank
                  ? <Star className="h-10 w-10 text-primary" />
                  : <Award className="h-10 w-10 text-primary" />}
              </div>
              <MeritScoreCard score={summary.meritScore} rank={summary.meritRank} />
              {summary.meritRank && summary.meritRank <= 10 && (
                <p className="mt-3 text-sm text-green-700 font-medium">You are in the top 10 candidates!</p>
              )}
            </>
          ) : (
            <>
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="text-xl font-bold text-muted-foreground mb-2">Not Yet Ranked</div>
              <p className="text-muted-foreground text-center max-w-sm text-sm">
                Merit lists have not been published yet, or no active merit list includes your application.
                Merit is typically published after the application window closes.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <PublishedMeritLists studentId={(summary as any)?.userId} />
    </div>
  );
}
