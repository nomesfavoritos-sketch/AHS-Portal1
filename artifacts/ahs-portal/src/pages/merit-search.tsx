import { useState } from "react";
import { useMeritSearch } from "@workspace/api-client-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Trophy, Award, GraduationCap, ChevronLeft } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function PublicMeritSearch() {
  const [searchValue, setSearchValue] = useState("");
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const { data: results, isLoading } = useMeritSearch(
    { query: searchQuery ?? "" },
    { query: { enabled: !!searchQuery } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.replace(/-/g, "").trim();
    if (!trimmed || trimmed.length < 4) return;
    setSearchQuery(searchValue.trim());
    setSearched(true);
  };

  const formatCnic = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    setSearchValue(formatCnic(raw));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selected": return <Badge className="bg-yellow-500 hover:bg-yellow-500">Selected</Badge>;
      case "waiting": return <Badge variant="outline" className="text-amber-600 border-amber-400">Waiting</Badge>;
      case "rejected": return <Badge variant="destructive">Not Selected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Allied Health College</p>
              <p className="text-xs text-muted-foreground">Nishtar Medical University</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login"><ChevronLeft className="mr-1 h-4 w-4" />Login</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Merit List Search</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Check your position in the published admission merit lists by entering your CNIC number.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Search by CNIC or Application Number</CardTitle>
            <CardDescription>Enter your CNIC or application number to find your merit position. No login required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-input">CNIC or Application Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-input"
                    placeholder="e.g. 42101-1234567-8 or AHS-2024-00001"
                    value={searchValue}
                    onChange={handleCnicChange}
                    className="font-mono text-base h-12 flex-1"
                    maxLength={20}
                  />
                  <Button type="submit" className="h-12 px-6" disabled={isLoading || searchValue.replace(/-/g, "").trim().length < 4}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">CNIC format: 42101-1234567-8 &nbsp;·&nbsp; Auto-formatted as you type</p>
              </div>
            </form>
          </CardContent>
        </Card>

        {searched && (
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !results || (results as any[]).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-10 space-y-2">
                  <Award className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <h3 className="font-semibold text-lg">No Results Found</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    No published merit list entry was found for this CNIC or application number.
                    Merit lists may not have been published yet, or the entry may not match.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Found <strong>{(results as any[]).length}</strong> result(s) for <span className="font-mono">{searchValue}</span>
                </p>
                {(results as any[]).map((r, idx) => (
                  <Card key={idx} className={r.status === "selected" ? "border-yellow-200 bg-yellow-50/30" : ""}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-bold text-lg">{r.programName}</p>
                          <p className="text-sm text-muted-foreground">{r.sessionName} · {r.meritListName}</p>
                        </div>
                        <div className="text-right space-y-1">
                          {getStatusBadge(r.status)}
                          <div className="text-2xl font-extrabold text-primary">
                            {(r.meritScoreNormalized ?? r.meritScore)?.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="rounded-lg bg-muted/50 py-2 px-3">
                          <p className="text-xs text-muted-foreground">Rank</p>
                          <p className="text-xl font-bold">#{r.rank}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 py-2 px-3">
                          <p className="text-xs text-muted-foreground">Merit Score</p>
                          <p className="text-xl font-bold">{(r.meritScoreNormalized ?? r.meritScore)?.toFixed(2)}%</p>
                        </div>
                        {r.totalCandidates && (
                          <div className="rounded-lg bg-muted/50 py-2 px-3">
                            <p className="text-xs text-muted-foreground">Total Candidates</p>
                            <p className="text-xl font-bold">{r.totalCandidates}</p>
                          </div>
                        )}
                        <div className="rounded-lg bg-muted/50 py-2 px-3">
                          <p className="text-xs text-muted-foreground">Selection</p>
                          <p className="text-base font-bold capitalize">{r.status}</p>
                        </div>
                      </div>
                      {r.status === "selected" && (
                        <div className="mt-3 text-sm text-yellow-700 font-medium flex items-center gap-1.5 bg-yellow-100 rounded-lg px-3 py-2">
                          <Trophy className="h-4 w-4 flex-shrink-0" />
                          Congratulations! You have been selected. Please check the joining instructions on the portal or contact the admissions office.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-white/60 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Allied Health College — Nishtar Medical University, Multan</p>
          <p className="mt-1">For queries, contact the Admissions Office. This is a public search portal — no login required.</p>
        </div>
      </footer>
    </div>
  );
}
