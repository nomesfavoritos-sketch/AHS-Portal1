import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListUsers, 
  getListUsersQueryKey,
  useCreateUser,
  useUpdateUser,
  useDeleteUser 
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
import { Loader2, Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@workspace/api-client-react/src/generated/api.schemas";

const userSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  role: z.enum(["student", "admission_admin", "verification_officer", "finance_verifier", "super_admin"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const editUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional().nullable(),
  role: z.enum(["student", "admission_admin", "verification_officer", "finance_verifier", "super_admin"]),
  isActive: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Determine query params
  const queryParams: any = { limit: 50 };
  if (searchTerm) queryParams.search = searchTerm;
  if (roleFilter !== "all") queryParams.role = roleFilter;

  const { data: usersData, isLoading } = useListUsers(queryParams);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      role: "admission_admin",
      password: "",
    },
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      role: "student",
      isActive: true,
    },
  });

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      fullName: user.fullName,
      phone: user.phone || "",
      role: user.role as any,
      isActive: user.isActive,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const onCreateSubmit = (data: UserFormValues) => {
    if (!data.password) {
      createForm.setError("password", { message: "Password is required for new users" });
      return;
    }
    
    createUser.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({ title: "User created successfully" });
          setIsCreateOpen(false);
          createForm.reset();
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: (error) => {
          toast({
            title: "Failed to create user",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onEditSubmit = (data: EditUserFormValues) => {
    if (!selectedUser) return;
    updateUser.mutate(
      { id: selectedUser.id, data },
      {
        onSuccess: () => {
          toast({ title: "User updated successfully" });
          setIsEditOpen(false);
          setSelectedUser(null);
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: (error) => {
          toast({
            title: "Failed to update user",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    deleteUser.mutate(
      { id: selectedUser.id },
      {
        onSuccess: () => {
          toast({ title: "User deleted successfully" });
          setIsDeleteOpen(false);
          setSelectedUser(null);
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(queryParams) });
        },
        onError: (error) => {
          toast({
            title: "Failed to delete user",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin": return <Badge variant="default" className="bg-primary hover:bg-primary/90">Super Admin</Badge>;
      case "admission_admin": return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Admissions</Badge>;
      case "verification_officer": return <Badge variant="outline" className="text-purple-600 border-purple-300">Verifier</Badge>;
      case "finance_verifier": return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Finance</Badge>;
      case "student": return <Badge variant="secondary">Student</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatRoleLabel = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage staff roles and user accounts.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new staff or admin account.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admission_admin">Admission Admin</SelectItem>
                            <SelectItem value="verification_officer">Verification Officer</SelectItem>
                            <SelectItem value="finance_verifier">Finance Verifier</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="03XXXXXXXXX" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                System Users
              </CardTitle>
              <CardDescription>All registered accounts.</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name or email..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admission_admin">Admission Admin</SelectItem>
                  <SelectItem value="verification_officer">Verification Officer</SelectItem>
                  <SelectItem value="finance_verifier">Finance Verifier</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !usersData?.users.length ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No users found matching your filters.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-center">
                        {user.isActive ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => handleOpenDelete(user)}
                          disabled={user.role === "super_admin"} // Prevent deleting super admins from UI
                        >
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
            <DialogTitle>Edit User: {selectedUser?.email}</DialogTitle>
            <DialogDescription>Update user details and permissions.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admission_admin">Admission Admin</SelectItem>
                          <SelectItem value="verification_officer">Verification Officer</SelectItem>
                          <SelectItem value="finance_verifier">Finance Verifier</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Account Active</FormLabel>
                      <CardDescription>If off, the user cannot login.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user account for {selectedUser?.fullName}? This action cannot be undone.
              Data associated with this user might become orphaned or the deletion might fail if there are constraints.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
