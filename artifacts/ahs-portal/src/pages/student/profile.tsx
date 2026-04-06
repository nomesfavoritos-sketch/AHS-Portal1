import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMyProfile, useUpdateMyProfile, useGetMe } from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, GraduationCap, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  fatherName: z.string().min(2, "Father name is required").optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  cnic: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  domicile: z.string().optional().or(z.literal("")),
  religion: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  matricMarks: z.coerce.number().optional().or(z.literal(0)),
  matricTotal: z.coerce.number().optional().or(z.literal(0)),
  interMarks: z.coerce.number().optional().or(z.literal(0)),
  interTotal: z.coerce.number().optional().or(z.literal(0)),
  interYear: z.coerce.number().optional().or(z.literal(0)),
  interBoard: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function StudentProfile() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: profile, isLoading } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();
  
  const initialized = useRef(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fatherName: "",
      dateOfBirth: "",
      gender: "",
      cnic: "",
      address: "",
      city: "",
      domicile: "",
      religion: "",
      nationality: "Pakistani",
      matricMarks: 0,
      matricTotal: 1100,
      interMarks: 0,
      interTotal: 1100,
      interYear: new Date().getFullYear(),
      interBoard: "",
    },
  });

  useEffect(() => {
    if (profile && !initialized.current) {
      initialized.current = true;
      form.reset({
        fatherName: profile.fatherName || "",
        dateOfBirth: profile.dateOfBirth ? format(new Date(profile.dateOfBirth), "yyyy-MM-dd") : "",
        gender: profile.gender || "",
        cnic: profile.cnic || "",
        address: profile.address || "",
        city: profile.city || "",
        domicile: profile.domicile || "",
        religion: profile.religion || "",
        nationality: profile.nationality || "Pakistani",
        matricMarks: profile.matricMarks || 0,
        matricTotal: profile.matricTotal || 1100,
        interMarks: profile.interMarks || 0,
        interTotal: profile.interTotal || 1100,
        interYear: profile.interYear || new Date().getFullYear(),
        interBoard: profile.interBoard || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    // Clean up empty strings or 0 to nulls if needed, or pass as is
    updateProfile.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({ title: "Profile updated successfully" });
        },
        onError: (error) => {
          toast({
            title: "Update failed",
            description: error.error || "An error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal and academic information.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic details required for your application. Match these with your CNIC/B-Form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Full Name</FormLabel>
                  <Input disabled value={user?.fullName || ""} className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Changeable via support</p>
                </div>
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNIC / B-Form Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XXXXX-XXXXXXX-X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domicile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domicile District</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select religion" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="islam">Islam</SelectItem>
                          <SelectItem value="christianity">Christianity</SelectItem>
                          <SelectItem value="hinduism">Hinduism</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Background
              </CardTitle>
              <CardDescription>
                Your previous educational records. Accurate marks are crucial for merit calculation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Matriculation / O-Level</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="matricMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks Obtained</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="matricTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Intermediate / A-Level (FSc Pre-Medical)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="interMarks"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Marks Obtained</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interTotal"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interYear"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel>Passing Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interBoard"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-1">
                        <FormLabel>Board</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. BISE Multan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-end p-6 pt-0">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Profile
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
