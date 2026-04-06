import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListMeritLists,
  useCreateMeritList,
  useListSessions,
  useListPrograms,
  getListMeritListsQueryKey
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
import { Loader2, Plus, ListOrdered, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createMeritListSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sessionId: z.coerce.number().min(1, "Session is required"),
  programId: z.coerce.number().min(1, "Program is required"),
});

type CreateMeritListValues = z.infer<typeof createMeritListSchema>;

export default function AdminMeritLists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: meritLists, isLoading } = useListMeritLists();
  const { data: sessions } = useListSessions();
  const { data: programs } = useListPrograms();
  const createMeritList = useCreateMeritList();

  const form = useForm<CreateMeritListValues>({
    resolver: zodResolver(createMeritListSchema),
    defaultValues: {
      name: "",
      sessionId: 0,
      programId: 0,
    },
  });

  const onSubmit = (data: CreateMeritListValues) => {
    createMeritList.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Merit list generated successfully" });
          setIsCreateOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListMeritListsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to generate merit list",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merit Lists</h1>
          <p className="text-muted-foreground">Generate and publish merit lists for programs.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Merit List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Merit List</DialogTitle>
              <DialogDescription>
                System will calculate merit scores for verified applications and rank them.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. First Merit List Fall 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sessions?.map(s => (
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
                      <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs?.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMeritList.isPending}>
                    {createMeritList.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate
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
            <ListOrdered className="h-5 w-5" />
            Generated Lists
          </CardTitle>
          <CardDescription>Merit lists generated for different programs and sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !meritLists?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No merit lists generated yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Program ID</TableHead>
                    <TableHead className="text-center">Total Entries</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meritLists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        {list.name}
                      </TableCell>
                      <TableCell>{list.programId}</TableCell>
                      <TableCell className="text-center font-medium">{list.totalEntries}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(list.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        {list.isPublished ? (
                          <Badge variant="default" className="bg-green-500">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
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
