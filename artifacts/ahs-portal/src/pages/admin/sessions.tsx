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
import { Loader2, Plus, Pencil, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdmissionSession } from "@workspace/api-client-react/src/generated/api.schemas";

const sessionSchema = z.object({
  name: z.string().min(2, "Name is required"),
  year: z.coerce.number().min(2000, "Valid year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["open", "closed", "processing"]),
  isActive: z.boolean().default(true),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export default function AdminSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdmissionSession | null>(null);

  const { data: sessions, isLoading } = useListSessions();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const createForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      year: new Date().getFullYear(),
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd"),
      status: "open",
      isActive: true,
    },
  });

  const editForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      year: new Date().getFullYear(),
      startDate: "",
      endDate: "",
      status: "open",
      isActive: true,
    },
  });

  const handleOpenEdit = (session: AdmissionSession) => {
    setSelectedSession(session);
    editForm.reset({
      name: session.name,
      year: session.year,
      startDate: format(new Date(session.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(session.endDate), "yyyy-MM-dd"),
      status: session.status as any,
      isActive: session.isActive,
    });
    setIsEditOpen(true);
  };

  const onCreateSubmit = (data: SessionFormValues) => {
    createSession.mutate(
      { data: { ...data, startDate: new Date(data.startDate).toISOString(), endDate: new Date(data.endDate).toISOString() } },
      {
        onSuccess: () => {
          toast({ title: "Session created successfully" });
          setIsCreateOpen(false);
          createForm.reset();
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to create session",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onEditSubmit = (data: SessionFormValues) => {
    if (!selectedSession) return;
    updateSession.mutate(
      { id: selectedSession.id, data: { ...data, startDate: new Date(data.startDate).toISOString(), endDate: new Date(data.endDate).toISOString() } },
      {
        onSuccess: () => {
          toast({ title: "Session updated successfully" });
          setIsEditOpen(false);
          setSelectedSession(null);
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to update session",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Open</Badge>;
      case "closed": return <Badge variant="secondary">Closed</Badge>;
      case "processing": return <Badge variant="outline" className="text-amber-500 border-amber-500">Processing</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admission Sessions</h1>
          <p className="text-muted-foreground">Manage yearly admission cycles.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
              <DialogDescription>Create a new admission cycle.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Fall 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createSession.isPending}>
                    {createSession.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Session
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
            <CalendarDays className="h-5 w-5" />
            All Sessions
          </CardTitle>
          <CardDescription>A list of all admission sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !sessions?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No sessions found. Click 'Add Session' to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.name}</TableCell>
                      <TableCell>{session.year}</TableCell>
                      <TableCell>{format(new Date(session.startDate), "PP")}</TableCell>
                      <TableCell>{format(new Date(session.endDate), "PP")}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(session.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {session.isActive ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(session)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the details of the session.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateSession.isPending}>
                  {updateSession.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
