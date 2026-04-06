import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPrograms, 
  getListProgramsQueryKey,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram 
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Program } from "@workspace/api-client-react/src/generated/api.schemas";

const programSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  duration: z.string().min(1, "Duration is required"),
  seats: z.coerce.number().min(1, "Seats must be at least 1"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function AdminPrograms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const { data: programs, isLoading } = useListPrograms();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();

  const createForm = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      code: "",
      duration: "4 Years",
      seats: 50,
      description: "",
      isActive: true,
    },
  });

  const editForm = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      code: "",
      duration: "",
      seats: 0,
      description: "",
      isActive: true,
    },
  });

  const handleOpenEdit = (program: Program) => {
    setSelectedProgram(program);
    editForm.reset({
      name: program.name,
      code: program.code,
      duration: program.duration,
      seats: program.seats,
      description: program.description || "",
      isActive: program.isActive,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (program: Program) => {
    setSelectedProgram(program);
    setIsDeleteOpen(true);
  };

  const onCreateSubmit = (data: ProgramFormValues) => {
    createProgram.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Program created successfully" });
          setIsCreateOpen(false);
          createForm.reset();
          queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to create program",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onEditSubmit = (data: ProgramFormValues) => {
    if (!selectedProgram) return;
    updateProgram.mutate(
      { id: selectedProgram.id, data },
      {
        onSuccess: () => {
          toast({ title: "Program updated successfully" });
          setIsEditOpen(false);
          setSelectedProgram(null);
          queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to update program",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedProgram) return;
    deleteProgram.mutate(
      { id: selectedProgram.id },
      {
        onSuccess: () => {
          toast({ title: "Program deleted successfully" });
          setIsDeleteOpen(false);
          setSelectedProgram(null);
          queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to delete program",
            description: error.error || "Program might be in use",
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
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">Manage academic programs and seats.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Program</DialogTitle>
              <DialogDescription>Create a new academic program for admissions.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BS Medical Laboratory Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. BS-MLT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 4 Years" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Seats</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the program" {...field} />
                      </FormControl>
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
                        <CardDescription>Make program available for admissions</CardDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createProgram.isPending}>
                    {createProgram.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Program
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
            <GraduationCap className="h-5 w-5" />
            All Programs
          </CardTitle>
          <CardDescription>A list of all programs offered in the college.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !programs?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No programs found. Click 'Add Program' to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-center">Seats</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.code}</TableCell>
                      <TableCell>{program.name}</TableCell>
                      <TableCell>{program.duration}</TableCell>
                      <TableCell className="text-center">{program.seats}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={program.isActive ? "default" : "secondary"}>
                          {program.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(program)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDelete(program)}>
                          <Trash2 className="h-4 w-4" />
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
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update the details of the program.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Seats</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
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
                <Button type="submit" disabled={updateProgram.isPending}>
                  {updateProgram.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProgram?.name}? This action cannot be undone.
              Note: You cannot delete a program if there are applications or students associated with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProgram.isPending}>
              {deleteProgram.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
