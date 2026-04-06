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
  useListQuotas
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const applicationSchema = z.object({
  sessionId: z.coerce.number().min(1, "Session is required"),
  programId: z.coerce.number().min(1, "Program is required"),
  quotaId: z.coerce.number().optional().nullable(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function StudentApplications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: applicationsData, isLoading } = useListApplications();
  const { data: sessions } = useListSessions();
  const { data: programs } = useListPrograms();
  const { data: quotas } = useListQuotas();
  const createApplication = useCreateApplication();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      sessionId: 0,
      programId: 0,
      quotaId: null,
    },
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
          toast({
            title: "Failed to submit application",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "submitted": return <Badge variant="default" className="bg-blue-500">Submitted</Badge>;
      case "under_review": return <Badge variant="outline" className="border-amber-500 text-amber-600">Reviewing</Badge>;
      case "verified": return <Badge variant="default" className="bg-emerald-500">Verified</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "merit_listed": return <Badge variant="default" className="bg-purple-500">Merit Listed</Badge>;
      case "admitted": return <Badge variant="default" className="bg-green-600">Admitted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openSessions = sessions?.filter(s => s.status === "open" && s.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Manage your program applications.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={openSessions.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Application</DialogTitle>
              <DialogDescription>Apply for a new program in an open admission session.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Session</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Open Session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {openSessions.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs?.filter(p => p.isActive).map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quotaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quota Category (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Open Merit (Default)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Open Merit (Default)</SelectItem>
                          {quotas?.filter(q => q.isActive).map(q => (
                            <SelectItem key={q.id} value={q.id.toString()}>{q.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createApplication.isPending}>
                    {createApplication.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Application
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application History
          </CardTitle>
          <CardDescription>Track the status of all your submitted applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !applicationsData?.applications.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              You haven't submitted any applications yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App No.</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicationsData.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium font-mono text-xs">{app.applicationNumber}</TableCell>
                      <TableCell className="font-medium">{app.program.name}</TableCell>
                      <TableCell className="text-sm">{app.session.name}</TableCell>
                      <TableCell className="text-sm">
                        {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(app.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
