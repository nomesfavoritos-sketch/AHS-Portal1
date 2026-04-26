import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSessions,
  getListSessionsQueryKey,
  useCreateSession,
  useUpdateSession
} from "@workspace/api-client-react";
import { format } from "date-fns";

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
import { Loader2, Plus, Pencil, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdmissionSession } from "@workspace/api-client-react/src/generated/api.schemas";

const sessionSchema = z.object({
  name: z.string().min(2, "Name is required"),
  year: z.coerce.number().min(2000, "Valid year required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  correctionWindowStart: z.string().optional(),
  correctionWindowEnd: z.string().optional(),
  meritPublicationDate: z.string().optional(),
  joiningDeadline: z.string().optional(),
  status: z.enum(["open", "closed", "processing"]),
  isActive: z.boolean().default(true),
});
type SessionFormValues = z.infer<typeof sessionSchema>;

const toIso = (v: string | undefined) => (v ? new Date(v).toISOString() : undefined);
const toDate = (v: string | null | undefined) => (v ? format(new Date(v), "yyyy-MM-dd") : "");

function SessionForm({ form, onSubmit, isLoading, label }: { form: any; onSubmit: (d: SessionFormValues) => void; isLoading: boolean; label: string }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Session Name</FormLabel><FormControl><Input placeholder="e.g. Fall 2024" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="year" render={({ field }) => (
          <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem><FormLabel>Application Start</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem><FormLabel>Application End</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <Separator />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional Milestones</p>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="correctionWindowStart" render={({ field }) => (
            <FormItem><FormLabel>Correction Start</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="correctionWindowEnd" render={({ field }) => (
            <FormItem><FormLabel>Correction End</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="meritPublicationDate" render={({ field }) => (
            <FormItem><FormLabel>Merit Publication</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="joiningDeadline" render={({ field }) => (
            <FormItem><FormLabel>Joining Deadline</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <Separator />

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem><FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5"><FormLabel className="text-base">Active Session</FormLabel></div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />

        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {label}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function AdminSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdmissionSession | null>(null);

  const { data: sessions, isLoading } = useListSessions();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const defaultValues: SessionFormValues = {
    name: "", year: new Date().getFullYear(),
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"),
    status: "open", isActive: true,
  };

  const createForm = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema), defaultValues });
  const editForm = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema), defaultValues });

  const handleOpenEdit = (session: AdmissionSession) => {
    setSelectedSession(session);
    editForm.reset({
      name: session.name,
      year: session.year,
      startDate: toDate(session.startDate),
      endDate: toDate(session.endDate),
      correctionWindowStart: toDate((session as any).correctionWindowStart),
      correctionWindowEnd: toDate((session as any).correctionWindowEnd),
      meritPublicationDate: toDate((session as any).meritPublicationDate),
      joiningDeadline: toDate((session as any).joiningDeadline),
      status: session.status as any,
      isActive: session.isActive,
    });
    setIsEditOpen(true);
  };

  const buildPayload = (data: SessionFormValues) => ({
    ...data,
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    correctionWindowStart: toIso(data.correctionWindowStart),
    correctionWindowEnd: toIso(data.correctionWindowEnd),
    meritPublicationDate: toIso(data.meritPublicationDate),
    joiningDeadline: toIso(data.joiningDeadline),
  });

  const onCreateSubmit = (data: SessionFormValues) => {
    createSession.mutate({ data: buildPayload(data) }, {
      onSuccess: () => {
        toast({ title: "Session created" });
        setIsCreateOpen(false);
        createForm.reset(defaultValues);
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
      onError: (e) => toast({ title: "Failed to create session", description: (e as any).error, variant: "destructive" }),
    });
  };

  const onEditSubmit = (data: SessionFormValues) => {
    if (!selectedSession) return;
    updateSession.mutate({ id: selectedSession.id, data: buildPayload(data) }, {
      onSuccess: () => {
        toast({ title: "Session updated" });
        setIsEditOpen(false);
        setSelectedSession(null);
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
      onError: (e) => toast({ title: "Failed to update session", description: (e as any).error, variant: "destructive" }),
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-yellow-500 hover:bg-yellow-500">Open</Badge>;
      case "closed": return <Badge variant="secondary">Closed</Badge>;
      case "processing": return <Badge variant="outline" className="text-amber-600 border-amber-400">Processing</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admission Sessions</h1>
          <p className="text-muted-foreground">Manage yearly admission cycles and key milestones.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Session</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Admission Session</DialogTitle>
              <DialogDescription>Create a new admission cycle with its key dates.</DialogDescription>
            </DialogHeader>
            <SessionForm form={createForm} onSubmit={onCreateSubmit} isLoading={createSession.isPending} label="Create Session" />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />All Sessions</CardTitle>
          <CardDescription>A list of all admission sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !sessions?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No sessions yet. Click "Add Session" to create one.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Merit Publication</TableHead>
                    <TableHead>Joining Deadline</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.year}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(s.startDate), "PP")} – {format(new Date(s.endDate), "PP")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(s as any).meritPublicationDate
                          ? format(new Date((s as any).meritPublicationDate), "PP")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(s as any).joiningDeadline
                          ? format(new Date((s as any).joiningDeadline), "PP")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(s.status)}</TableCell>
                      <TableCell className="text-center">
                        {s.isActive
                          ? <Badge variant="outline" className="text-yellow-600 border-yellow-400">Yes</Badge>
                          : <Badge variant="outline" className="text-muted-foreground">No</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the session details and milestone dates.</DialogDescription>
          </DialogHeader>
          <SessionForm form={editForm} onSubmit={onEditSubmit} isLoading={updateSession.isPending} label="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
