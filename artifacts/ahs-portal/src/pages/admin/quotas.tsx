import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListQuotas, 
  getListQuotasQueryKey,
  useCreateQuota,
  useUpdateQuota,
  useDeleteQuota 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil, Trash2, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuotaCategory } from "@workspace/api-client-react/src/generated/api.schemas";

const quotaSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  percentage: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type QuotaFormValues = z.infer<typeof quotaSchema>;

export default function AdminQuotas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<QuotaCategory | null>(null);

  const { data: quotas, isLoading } = useListQuotas();
  const createQuota = useCreateQuota();
  const updateQuota = useUpdateQuota();
  const deleteQuota = useDeleteQuota();

  const createForm = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaSchema),
    defaultValues: {
      name: "",
      code: "",
      percentage: 0,
      description: "",
      isActive: true,
    },
  });

  const editForm = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaSchema),
    defaultValues: {
      name: "",
      code: "",
      percentage: 0,
      description: "",
      isActive: true,
    },
  });

  const handleOpenEdit = (quota: QuotaCategory) => {
    setSelectedQuota(quota);
    editForm.reset({
      name: quota.name,
      code: quota.code,
      percentage: quota.percentage,
      description: quota.description || "",
      isActive: quota.isActive,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (quota: QuotaCategory) => {
    setSelectedQuota(quota);
    setIsDeleteOpen(true);
  };

  const onCreateSubmit = (data: QuotaFormValues) => {
    createQuota.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Quota created successfully" });
          setIsCreateOpen(false);
          createForm.reset();
          queryClient.invalidateQueries({ queryKey: getListQuotasQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to create quota",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onEditSubmit = (data: QuotaFormValues) => {
    if (!selectedQuota) return;
    updateQuota.mutate(
      { id: selectedQuota.id, data },
      {
        onSuccess: () => {
          toast({ title: "Quota updated successfully" });
          setIsEditOpen(false);
          setSelectedQuota(null);
          queryClient.invalidateQueries({ queryKey: getListQuotasQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to update quota",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedQuota) return;
    deleteQuota.mutate(
      { id: selectedQuota.id },
      {
        onSuccess: () => {
          toast({ title: "Quota deleted successfully" });
          setIsDeleteOpen(false);
          setSelectedQuota(null);
          queryClient.invalidateQueries({ queryKey: getListQuotasQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to delete quota",
            description: error.error || "Quota might be in use",
            variant: "destructive",
          });
        },
      }
    );
  };

  const totalPercentage = quotas?.reduce((acc, q) => acc + (q.isActive ? q.percentage : 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seat Quotas</h1>
          <p className="text-muted-foreground">Manage admission seat distribution categories.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Quota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Quota Category</DialogTitle>
              <DialogDescription>Define a new reservation quota.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quota Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Open Merit" {...field} />
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
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. OM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about this quota" {...field} />
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
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createQuota.isPending}>
                    {createQuota.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Quota
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {totalPercentage > 100 && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/30 flex items-center justify-between">
          <div className="font-medium text-sm">Warning: Total active quota percentage exceeds 100% ({totalPercentage.toFixed(1)}%).</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              All Quotas
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              Total Active: <span className={`font-bold ${totalPercentage > 100 ? "text-destructive" : "text-foreground"}`}>{totalPercentage.toFixed(1)}%</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !quotas?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No quotas found. Click 'Add Quota' to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.id}>
                      <TableCell className="font-medium">{quota.code}</TableCell>
                      <TableCell>{quota.name}</TableCell>
                      <TableCell className="text-right font-medium">{quota.percentage}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={quota.isActive ? "default" : "secondary"}>
                          {quota.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(quota)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDelete(quota)}>
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
            <DialogTitle>Edit Quota</DialogTitle>
            <DialogDescription>Update the quota details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quota Name</FormLabel>
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
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                <Button type="submit" disabled={updateQuota.isPending}>
                  {updateQuota.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <DialogTitle>Delete Quota</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedQuota?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteQuota.isPending}>
              {deleteQuota.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Quota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
