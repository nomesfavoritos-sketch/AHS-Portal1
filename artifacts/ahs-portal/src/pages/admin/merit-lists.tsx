import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListMeritLists,
  useCreateMeritList,
  useGetMeritList,
  usePublishMeritList,
  useFreezeMeritList,
  useRecalculateMeritList,
  useListSessions,
  useListPrograms,
  useListQuotas,
  getListMeritListsQueryKey,
  getGetMeritListQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, ListOrdered, Eye, Send, Lock, RefreshCw, Download, Award, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sessionId: z.coerce.number().min(1, "Session required"),
  programId: z.coerce.number().min(1, "Program required"),
  quotaId: z.coerce.number().optional(),
  listNumber: z.coerce.number().min(1).max(10).default(1),
  requirePaymentVerified: z.boolean().default(false),
  requireDocumentsComplete: z.boolean().default(false),
});
type CreateValues = z.infer<typeof createSchema>;

function statusBadge(ml: { isPublished: boolean; isFrozen: boolean }) {
  if (ml.isFrozen) return <Badge className="bg-slate-500 hover:bg-slate-600">Frozen</Badge>;
  if (ml.isPublished) return <Badge className="bg-yellow-500 hover:bg-yellow-500">Published</Badge>;
  return <Badge variant="outline" className="text-amber-600 border-amber-400">Draft</Badge>;
}

function exportCSV(listName: string, entries: any[]) {
  const header = ["Rank", "Application No.", "Student Name", "CNIC", "Program", "Matric Marks", "Matric Total", "FSc Marks", "FSc Total", "Matric Score", "FSc Score", "Raw Score", "Merit Score (%)", "Quota", "Status"];
  const rows = entries.map((e) => [
    e.rank,
    e.application?.applicationNumber ?? "",
    e.application?.user?.fullName ?? "",
    e.cnicMasked ?? "",
    e.application?.program?.name ?? "",
    e.meritBreakdown?.matricMarks ?? "",
    e.meritBreakdown?.matricTotal ?? "",
    e.meritBreakdown?.fscMarks ?? "",
    e.meritBreakdown?.fscTotal ?? "",
    e.matricScore?.toFixed(2) ?? "",
    e.fscScore?.toFixed(2) ?? "",
    e.meritScoreRaw?.toFixed(2) ?? "",
    e.meritScoreNormalized?.toFixed(2) ?? "",
    e.application?.quotaId ? "Quota" : "Open Merit",
    e.status,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${listName.replace(/\s+/g, "_")}_merit_list.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function MeritListDetail({ id, listName }: { id: number; listName: string }) {
  const { data, isLoading } = useGetMeritList(id);

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return null;

  const entries = data.entries ?? [];
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportCSV(listName, entries)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center font-bold">Rank</TableHead>
              <TableHead>App No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead className="text-center">Matric<br /><span className="text-xs text-muted-foreground">Marks/Total</span></TableHead>
              <TableHead className="text-center">FSc<br /><span className="text-xs text-muted-foreground">Marks/Total</span></TableHead>
              <TableHead className="text-center">Matric<br /><span className="text-xs text-muted-foreground">Score</span></TableHead>
              <TableHead className="text-center">FSc<br /><span className="text-xs text-muted-foreground">Score</span></TableHead>
              <TableHead className="text-center font-bold">Merit %</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No entries in this merit list.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id} className={e.rank <= 3 ? "bg-amber-50/50" : ""}>
                  <TableCell className="text-center font-bold">
                    {e.rank <= 3 ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${e.rank === 1 ? "bg-amber-500" : e.rank === 2 ? "bg-slate-400" : "bg-orange-400"}`}>
                        {e.rank}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{e.rank}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.application?.applicationNumber}</TableCell>
                  <TableCell className="font-medium">{e.application?.user?.fullName ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{e.cnicMasked}</TableCell>
                  <TableCell className="text-center text-sm">
                    {e.meritBreakdown?.matricMarks ?? 0}/{e.meritBreakdown?.matricTotal ?? 0}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {e.meritBreakdown?.fscMarks ?? 0}/{e.meritBreakdown?.fscTotal ?? 0}
                  </TableCell>
                  <TableCell className="text-center text-sm">{e.matricScore?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell className="text-center text-sm">{e.fscScore?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-primary">{e.meritScoreNormalized?.toFixed(2) ?? e.meritScore.toFixed(2)}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={e.status === "selected" ? "default" : "secondary"} className="text-xs">
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function AdminMeritLists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: meritLists, isLoading } = useListMeritLists();
  const { data: sessions } = useListSessions();
  const { data: programs } = useListPrograms();
  const { data: quotas } = useListQuotas();

  const createMeritList = useCreateMeritList();
  const publishMeritList = usePublishMeritList();
  const freezeMeritList = useFreezeMeritList();
  const recalculateMeritList = useRecalculateMeritList();

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", sessionId: 0, programId: 0, listNumber: 1, requirePaymentVerified: false, requireDocumentsComplete: false },
  });

  const onSubmit = (data: CreateValues) => {
    createMeritList.mutate(
      {
        data: {
          name: data.name,
          sessionId: data.sessionId,
          programId: data.programId,
          quotaId: data.quotaId || undefined,
          listNumber: data.listNumber,
          eligibilityFilters: {
            requirePaymentVerified: data.requirePaymentVerified,
            requireDocumentsComplete: data.requireDocumentsComplete,
          },
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Merit list generated successfully" });
          setIsCreateOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListMeritListsQueryKey() });
        },
        onError: (e) => toast({ title: "Failed to generate merit list", description: (e as any).error, variant: "destructive" }),
      }
    );
  };

  const handlePublish = (id: number) => {
    publishMeritList.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Merit list published" });
          queryClient.invalidateQueries({ queryKey: getListMeritListsQueryKey() });
        },
        onError: (e) => toast({ title: "Failed to publish", description: (e as any).error, variant: "destructive" }),
      }
    );
  };

  const handleFreeze = (id: number) => {
    freezeMeritList.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Merit list frozen — no further changes possible" });
          queryClient.invalidateQueries({ queryKey: getListMeritListsQueryKey() });
        },
        onError: (e) => toast({ title: "Failed to freeze", description: (e as any).error, variant: "destructive" }),
      }
    );
  };

  const handleRecalculate = (id: number) => {
    recalculateMeritList.mutate(
      { id },
      {
        onSuccess: (data: any) => {
          toast({ title: `Recalculated ${data?.count ?? 0} entries` });
          queryClient.invalidateQueries({ queryKey: getListMeritListsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeritListQueryKey(id) });
        },
        onError: (e) => toast({ title: "Failed to recalculate", description: (e as any).error, variant: "destructive" }),
      }
    );
  };

  const getSessionName = (id: number) => sessions?.find((s) => s.id === id)?.name ?? `Session ${id}`;
  const getProgramName = (id: number) => programs?.find((p) => p.id === id)?.name ?? `Program ${id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merit Lists</h1>
          <p className="text-muted-foreground">Generate, preview, publish and freeze admission merit rankings.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Generate Merit List</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Merit List</DialogTitle>
              <DialogDescription>Select criteria and the system will calculate and rank all eligible applications using the configured formula.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>List Name</FormLabel><FormControl><Input placeholder="e.g. 1st Merit List — BSRA 2024" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="sessionId" render={({ field }) => (
                    <FormItem><FormLabel>Session</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger></FormControl>
                        <SelectContent>{sessions?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="programId" render={({ field }) => (
                    <FormItem><FormLabel>Program</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger></FormControl>
                        <SelectContent>{programs?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.code}</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="quotaId" render={({ field }) => (
                    <FormItem><FormLabel>Quota (optional)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "0" ? undefined : Number(v))} defaultValue="0">
                        <FormControl><SelectTrigger><SelectValue placeholder="All / Open Merit" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="0">All / Open Merit</SelectItem>
                          {quotas?.map((q) => <SelectItem key={q.id} value={String(q.id)}>{q.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="listNumber" render={({ field }) => (
                    <FormItem><FormLabel>List Number</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`} Merit List</SelectItem>)}</SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />
                </div>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Eligibility Filters</p>
                <FormField control={form.control} name="requirePaymentVerified" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div><FormLabel>Payment Verified Only</FormLabel><p className="text-xs text-muted-foreground">Include only applications with verified payment</p></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="requireDocumentsComplete" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div><FormLabel>Documents Complete Only</FormLabel><p className="text-xs text-muted-foreground">Include only fully documented applications</p></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createMeritList.isPending}>
                    {createMeritList.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                    Generate &amp; Rank
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !meritLists?.length ? (
        <Card>
          <CardContent className="text-center p-12 text-muted-foreground border-dashed">
            <Trophy className="h-10 w-10 mx-auto mb-4 opacity-30" />
            <h3 className="font-semibold text-lg mb-1">No Merit Lists Yet</h3>
            <p className="text-sm">Click "Generate Merit List" to create your first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meritLists.map((ml) => (
            <Card key={ml.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{ml.name}</CardTitle>
                      {statusBadge(ml)}
                      <Badge variant="outline" className="text-xs">{ml.listNumber === 1 ? "1st" : ml.listNumber === 2 ? "2nd" : ml.listNumber === 3 ? "3rd" : `${ml.listNumber}th`} List</Badge>
                      <Badge variant="secondary" className="text-xs">v{ml.versionNumber}</Badge>
                    </div>
                    <CardDescription>
                      {getSessionName(ml.sessionId)} · {getProgramName(ml.programId)} · {ml.totalEntries} candidates
                      {ml.publishedAt && <> · Published {format(new Date(ml.publishedAt), "PP")}</>}
                      {ml.frozenAt && <> · Frozen {format(new Date(ml.frozenAt), "PP")}</>}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {!ml.isFrozen && !ml.isPublished && (
                      <Button size="sm" variant="outline" onClick={() => handleRecalculate(ml.id)} disabled={recalculateMeritList.isPending}>
                        <RefreshCw className="mr-2 h-3 w-3" />Recalc
                      </Button>
                    )}
                    {!ml.isPublished && !ml.isFrozen && (
                      <Button size="sm" onClick={() => handlePublish(ml.id)} disabled={publishMeritList.isPending}>
                        <Send className="mr-2 h-3 w-3" />Publish
                      </Button>
                    )}
                    {ml.isPublished && !ml.isFrozen && (
                      <Button size="sm" variant="outline" className="text-slate-600" onClick={() => handleFreeze(ml.id)} disabled={freezeMeritList.isPending}>
                        <Lock className="mr-2 h-3 w-3" />Freeze
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === ml.id ? null : ml.id)}>
                      {expandedId === ml.id ? <><ChevronUp className="mr-1 h-4 w-4" />Hide</> : <><Eye className="mr-1 h-4 w-4" />View</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedId === ml.id && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <MeritListDetail id={ml.id} listName={ml.name} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
