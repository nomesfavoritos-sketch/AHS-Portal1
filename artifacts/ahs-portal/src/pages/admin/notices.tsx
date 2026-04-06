import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListNotices, 
  getListNoticesQueryKey,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil, Trash2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Notice } from "@workspace/api-client-react/src/generated/api.schemas";

const noticeSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(5, "Content is required"),
  category: z.enum(["general", "admission", "merit", "payment", "urgent"]),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

type NoticeFormValues = z.infer<typeof noticeSchema>;

export default function AdminNotices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const { data: notices, isLoading } = useListNotices();
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();

  const createForm = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      isActive: true,
      expiresAt: "",
    },
  });

  const editForm = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      isActive: true,
      expiresAt: "",
    },
  });

  const handleOpenEdit = (notice: Notice) => {
    setSelectedNotice(notice);
    editForm.reset({
      title: notice.title,
      content: notice.content,
      category: notice.category as any,
      isActive: notice.isActive,
      expiresAt: notice.expiresAt ? format(new Date(notice.expiresAt), "yyyy-MM-dd") : "",
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDeleteOpen(true);
  };

  const onCreateSubmit = (data: NoticeFormValues) => {
    const payload = {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null
    };
    
    createNotice.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: "Notice created successfully" });
          setIsCreateOpen(false);
          createForm.reset();
          queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to create notice",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onEditSubmit = (data: NoticeFormValues) => {
    if (!selectedNotice) return;
    
    const payload = {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null
    };
    
    updateNotice.mutate(
      { id: selectedNotice.id, data: payload },
      {
        onSuccess: () => {
          toast({ title: "Notice updated successfully" });
          setIsEditOpen(false);
          setSelectedNotice(null);
          queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to update notice",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedNotice) return;
    deleteNotice.mutate(
      { id: selectedNotice.id },
      {
        onSuccess: () => {
          toast({ title: "Notice deleted successfully" });
          setIsDeleteOpen(false);
          setSelectedNotice(null);
          queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Failed to delete notice",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "urgent": return <Badge variant="destructive">Urgent</Badge>;
      case "admission": return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Admission</Badge>;
      case "merit": return <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Merit List</Badge>;
      case "payment": return <Badge variant="outline" className="border-amber-500 text-amber-600">Payment</Badge>;
      default: return <Badge variant="secondary">General</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">Manage announcements and alerts for students.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>Publish a new notice to the portal.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notice Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a clear, descriptive title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="admission">Admission</SelectItem>
                            <SelectItem value="merit">Merit List</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires At (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value || ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full notice content..." className="min-h-[120px]" {...field} />
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
                        <FormLabel className="text-base">Publish Immediately</FormLabel>
                        <CardDescription>Notice will be visible to students right away</CardDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createNotice.isPending}>
                    {createNotice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Publish Notice
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
            <Bell className="h-5 w-5" />
            All Announcements
          </CardTitle>
          <CardDescription>History of all published and draft notices.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !notices?.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No notices found. Click 'Add Notice' to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[380px]" title={notice.title}>
                          {notice.title}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(notice.category)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(notice.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={notice.isActive ? "default" : "secondary"} className={notice.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                          {notice.isActive ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(notice)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDelete(notice)}>
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>Update the announcement details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notice Title</FormLabel>
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="admission">Admission</SelectItem>
                          <SelectItem value="merit">Merit List</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires At (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px]" {...field} />
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
                      <FormLabel className="text-base">Published</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateNotice.isPending}>
                  {updateNotice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <DialogTitle>Delete Notice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedNotice?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteNotice.isPending}>
              {deleteNotice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
