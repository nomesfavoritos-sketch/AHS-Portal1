import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetMyProfile, 
  useUpdateMyProfile, 
  useGetMe 
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

const profileSchema = z.object({
  fullName: z.string().optional().or(z.literal("")),
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
  
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName || "",
      fatherName: profile?.fatherName || "",
      dateOfBirth: profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), "yyyy-MM-dd") : "",
      gender: profile?.gender || "",
      cnic: profile?.cnic || "",
      address: profile?.address || "",
      city: profile?.city || "",
      domicile: profile?.domicile || "",
      religion: profile?.religion || "",
      nationality: profile?.nationality || "Pakistani",
      matricMarks: profile?.matricMarks || 0,
      matricTotal: profile?.matricTotal || 1100,
      interMarks: profile?.interMarks || 0,
      interTotal: profile?.interTotal || 1100,
      interYear: profile?.interYear || new Date().getFullYear(),
      interBoard: profile?.interBoard || "",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
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

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Assuming profile has completionPercent
  const completionPercent = (profile as any)?.completionPercent || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Complete your profile to apply for programs.</p>
        
        <div className="mt-4 p-4 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-bold">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-4">
        <span className={step >= 1 ? "text-primary" : ""}>1. Personal Info</span>
        <ArrowRight className="h-4 w-4" />
        <span className={step >= 2 ? "text-primary" : ""}>2. Classification</span>
        <ArrowRight className="h-4 w-4" />
        <span className={step >= 3 ? "text-primary" : ""}>3. Academic Details</span>
        <ArrowRight className="h-4 w-4" />
        <span className={step >= 4 ? "text-primary" : ""}>4. Review</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle>
                {step === 1 && "Personal Information"}
                {step === 2 && "Classification & Quota"}
                {step === 3 && "Academic Background"}
                {step === 4 && "Review & Submit"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} disabled /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Father's Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cnic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNIC Number</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
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
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Permanent Address</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="domicile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domicile District</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {[
                                  "Attock","Bahawalnagar","Bahawalpur","Bhakkar","Chakwal",
                                  "Chiniot","Dera Ghazi Khan","Faisalabad","Gujranwala","Gujrat",
                                  "Hafizabad","Jhang","Jhelum","Kasur","Khanewal","Khushab",
                                  "Lahore","Layyah","Lodhran","Mandi Bahauddin","Mianwali",
                                  "Multan","Muzaffargarh","Nankana Sahib","Narowal","Okara",
                                  "Pakpattan","Rahim Yar Khan","Rajanpur","Rawalpindi","Sahiwal",
                                  "Sargodha","Sheikhupura","Sialkot","Toba Tek Singh","Vehari",
                                ].map((d) => (
                                  <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
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
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="islam">Islam</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Matriculation</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="matricMarks"
                            render={({ field }) => (
                              <FormItem><FormLabel>Marks</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="matricTotal"
                            render={({ field }) => (
                              <FormItem><FormLabel>Total</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Intermediate</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="interMarks"
                            render={({ field }) => (
                              <FormItem><FormLabel>Marks</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="interTotal"
                            render={({ field }) => (
                              <FormItem><FormLabel>Total</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="interYear"
                            render={({ field }) => (
                              <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="interBoard"
                            render={({ field }) => (
                              <FormItem><FormLabel>Board</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Please review your information before saving. Ensure all details match your official documents.</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm border p-4 rounded-md">
                        <div className="text-muted-foreground">Full Name:</div><div>{form.getValues("fullName")}</div>
                        <div className="text-muted-foreground">CNIC:</div><div>{form.getValues("cnic")}</div>
                        <div className="text-muted-foreground">Matric Marks:</div><div>{form.getValues("matricMarks")} / {form.getValues("matricTotal")}</div>
                        <div className="text-muted-foreground">Inter Marks:</div><div>{form.getValues("interMarks")} / {form.getValues("interTotal")}</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <div className="flex items-center justify-between p-6 bg-muted/20 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {step < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              )}
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
