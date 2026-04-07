import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetMyProfile,
  useUpdateMyProfile,
  useGetMe,
} from "@workspace/api-client-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Plus, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";

const PUNJAB_DISTRICTS = [
  "Attock",
  "Bahawalnagar",
  "Bahawalpur",
  "Bhakkar",
  "Chakwal",
  "Chiniot",
  "Dera Ghazi Khan",
  "Faisalabad",
  "Gujranwala",
  "Gujrat",
  "Hafizabad",
  "Jhang",
  "Jhelum",
  "Kasur",
  "Khanewal",
  "Khushab",
  "Lahore",
  "Layyah",
  "Lodhran",
  "Mandi Bahauddin",
  "Mianwali",
  "Multan",
  "Murree",
  "Muzaffargarh",
  "Nankana Sahib",
  "Narowal",
  "Okara",
  "Pakpattan",
  "Rahim Yar Khan",
  "Rajanpur",
  "Rawalpindi",
  "Sahiwal",
  "Sargodha",
  "Sheikhupura",
  "Sialkot",
  "Toba Tek Singh",
  "Vehari",
  // Newly elevated / commonly recognised districts
  "Ahmadpur East",
  "Chunian",
  "Jampur",
  "Kamalia",
  "Khairpur Tamewali",
  "Kot Addu",
  "Pattoki",
  "Shakargarh",
  "Wazirabad",
].sort();

const BOARDS = [
  "BISE Lahore","BISE Gujranwala","BISE Rawalpindi","BISE Faisalabad",
  "BISE Multan","BISE Sargodha","BISE Bahawalpur","BISE DG Khan",
  "BISE Sahiwal","BISE Mirpur","Federal Board","Nishtar Medical University",
  "University of Health Sciences","Other",
];

const additionalQualSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  board: z.string().min(1, "Board/University is required"),
  year: z.coerce.number().min(1990).max(new Date().getFullYear()),
  marksObtained: z.coerce.number().min(0),
  totalMarks: z.coerce.number().min(1),
});

const profileSchema = z.object({
  fullName: z.string().optional().or(z.literal("")),
  fatherName: z.string().optional().or(z.literal("")),
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
  matricYear: z.coerce.number().optional().or(z.literal(0)),
  matricBoard: z.string().optional().or(z.literal("")),
  interMarks: z.coerce.number().optional().or(z.literal(0)),
  interTotal: z.coerce.number().optional().or(z.literal(0)),
  interYear: z.coerce.number().optional().or(z.literal(0)),
  interBoard: z.string().optional().or(z.literal("")),
  additionalQualifications: z.array(additionalQualSchema).optional().default([]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function StudentProfile() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: profile, isLoading } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [step, setStep] = useState(1);
  const [districtOpen, setDistrictOpen] = useState(false);
  const totalSteps = 4;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName || "",
      fatherName: (profile as any)?.fatherName || "",
      dateOfBirth: (profile as any)?.dateOfBirth
        ? format(new Date((profile as any).dateOfBirth), "yyyy-MM-dd")
        : "",
      gender: (profile as any)?.gender || "",
      cnic: (profile as any)?.cnic || "",
      address: (profile as any)?.address || "",
      city: (profile as any)?.city || "",
      domicile: (profile as any)?.domicile || "",
      religion: (profile as any)?.religion || "",
      nationality: (profile as any)?.nationality || "Pakistani",
      matricMarks: (profile as any)?.matricMarks || 0,
      matricTotal: (profile as any)?.matricTotal || 1100,
      matricYear: (profile as any)?.matricYear || 0,
      matricBoard: (profile as any)?.matricBoard || "",
      interMarks: (profile as any)?.interMarks || 0,
      interTotal: (profile as any)?.interTotal || 1100,
      interYear: (profile as any)?.interYear || new Date().getFullYear(),
      interBoard: (profile as any)?.interBoard || "",
      additionalQualifications: (profile as any)?.additionalQualifications || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalQualifications",
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({ title: "Profile updated successfully" });
        },
        onError: () => {
          toast({ title: "Update failed", description: "An error occurred", variant: "destructive" });
        },
      }
    );
  };

  const nextStep = () => { if (step < totalSteps) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepPercent = Math.round((step / totalSteps) * 100);

  const STEPS = [
    { n: 1, label: "Personal Info" },
    { n: 2, label: "Classification" },
    { n: 3, label: "Academic Details" },
    { n: 4, label: "Review" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Complete your profile to apply for programs.</p>
        <div className="mt-4 p-4 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-bold">{stepPercent}%</span>
          </div>
          <Progress value={stepPercent} className="h-2" />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors
                  ${done ? "bg-green-600 text-white" : active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check className="h-4 w-4" /> : s.n}
                </div>
                <span className={`text-xs font-medium text-center hidden sm:block ${done ? "text-green-600" : active ? "text-primary" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s.n ? "bg-green-600" : "bg-border"}`} />
              )}
            </div>
          );
        })}
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
                      <FormField control={form.control} name="fullName"
                        render={({ field }) => (
                          <FormItem><FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} disabled /></FormControl>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="fatherName"
                        render={({ field }) => (
                          <FormItem><FormLabel>Father's Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem><FormLabel>Date of Birth</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="gender"
                        render={({ field }) => (
                          <FormItem><FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="cnic"
                        render={({ field }) => (
                          <FormItem><FormLabel>CNIC / B-Form No.</FormLabel>
                            <FormControl><Input placeholder="XXXXX-XXXXXXX-X" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="city"
                        render={({ field }) => (
                          <FormItem><FormLabel>City</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Permanent Address</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )} />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="domicile"
                        render={({ field }) => (
                          <FormItem><FormLabel>Domicile District</FormLabel>
                            <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                                      {field.value || "Select district"}
                                    </span>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                  </button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search district..." />
                                  <CommandList>
                                    <CommandEmpty>No district found.</CommandEmpty>
                                    <CommandGroup>
                                      {PUNJAB_DISTRICTS.map((d) => (
                                        <CommandItem key={d} value={d} onSelect={() => { field.onChange(d); setDistrictOpen(false); }}>
                                          <Check className={`mr-2 h-4 w-4 ${field.value === d ? "opacity-100" : "opacity-0"}`} />
                                          {d}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="nationality"
                        render={({ field }) => (
                          <FormItem><FormLabel>Nationality</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )} />
                      <FormField control={form.control} name="religion"
                        render={({ field }) => (
                          <FormItem><FormLabel>Religion</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="islam">Islam</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      {/* Matriculation */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-foreground">Matriculation (10th Grade)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField control={form.control} name="matricYear"
                            render={({ field }) => (
                              <FormItem><FormLabel>Passing Year</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                              </FormItem>
                            )} />
                          <FormField control={form.control} name="matricBoard"
                            render={({ field }) => (
                              <FormItem><FormLabel>Board</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                          <FormField control={form.control} name="matricMarks"
                            render={({ field }) => (
                              <FormItem><FormLabel>Marks Obtained</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                              </FormItem>
                            )} />
                          <FormField control={form.control} name="matricTotal"
                            render={({ field }) => (
                              <FormItem><FormLabel>Total Marks</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                              </FormItem>
                            )} />
                        </div>
                      </div>

                      <Separator />

                      {/* Intermediate / FSc */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-foreground">Intermediate / FSc (12th Grade)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField control={form.control} name="interYear"
                            render={({ field }) => (
                              <FormItem><FormLabel>Passing Year</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                              </FormItem>
                            )} />
                          <FormField control={form.control} name="interBoard"
                            render={({ field }) => (
                              <FormItem><FormLabel>Board</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                          <FormField control={form.control} name="interMarks"
                            render={({ field }) => (
                              <FormItem><FormLabel>Marks Obtained</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                              </FormItem>
                            )} />
                          <FormField control={form.control} name="interTotal"
                            render={({ field }) => (
                              <FormItem><FormLabel>Total Marks</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                              </FormItem>
                            )} />
                        </div>
                      </div>

                      <Separator />

                      {/* Additional Qualifications */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-foreground">Additional Qualifications</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              append({
                                degree: "",
                                institution: "",
                                board: "",
                                year: new Date().getFullYear(),
                                marksObtained: 0,
                                totalMarks: 100,
                              })
                            }
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Qualification
                          </Button>
                        </div>

                        {fields.length === 0 && (
                          <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
                            No additional qualifications added. Click "Add Qualification" to add a degree, diploma, or certificate.
                          </p>
                        )}

                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="border rounded-md p-4 space-y-4 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Qualification {index + 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name={`additionalQualifications.${index}.degree`}
                                  render={({ field: f }) => (
                                    <FormItem><FormLabel>Degree / Certificate</FormLabel>
                                      <FormControl><Input placeholder="e.g., B.Sc, Diploma" {...f} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                <FormField control={form.control} name={`additionalQualifications.${index}.institution`}
                                  render={({ field: f }) => (
                                    <FormItem><FormLabel>Institution</FormLabel>
                                      <FormControl><Input placeholder="College/University name" {...f} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                <FormField control={form.control} name={`additionalQualifications.${index}.board`}
                                  render={({ field: f }) => (
                                    <FormItem><FormLabel>Board / University</FormLabel>
                                      <FormControl><Input placeholder="Awarding body" {...f} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                <FormField control={form.control} name={`additionalQualifications.${index}.year`}
                                  render={({ field: f }) => (
                                    <FormItem><FormLabel>Passing Year</FormLabel>
                                      <FormControl><Input type="number" {...f} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                <FormField control={form.control} name={`additionalQualifications.${index}.marksObtained`}
                                  render={({ field: f }) => (
                                    <FormItem><FormLabel>Marks Obtained</FormLabel>
                                      <FormControl><Input type="number" {...f} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                                <FormField control={form.control} name={`additionalQualifications.${index}.totalMarks`}
                                  render={({ field: f }) => (
                                    <FormItem><FormLabel>Total Marks</FormLabel>
                                      <FormControl><Input type="number" {...f} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Please review your information before saving. Ensure all details match your official documents.
                      </p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm border p-4 rounded-md">
                        <div className="text-muted-foreground">Full Name:</div><div>{form.getValues("fullName")}</div>
                        <div className="text-muted-foreground">Father's Name:</div><div>{form.getValues("fatherName")}</div>
                        <div className="text-muted-foreground">CNIC:</div><div>{form.getValues("cnic")}</div>
                        <div className="text-muted-foreground">Gender:</div><div className="capitalize">{form.getValues("gender")}</div>
                        <div className="text-muted-foreground">Date of Birth:</div><div>{form.getValues("dateOfBirth")}</div>
                        <div className="text-muted-foreground">Domicile District:</div><div>{form.getValues("domicile")}</div>
                        <div className="text-muted-foreground">Nationality:</div><div>{form.getValues("nationality")}</div>
                        <div className="text-muted-foreground">Religion:</div><div className="capitalize">{form.getValues("religion")}</div>
                      </div>
                      <div className="border p-4 rounded-md text-sm space-y-2">
                        <p className="font-semibold">Academic Background</p>
                        <div className="grid grid-cols-2 gap-y-1">
                          <div className="text-muted-foreground">Matric:</div>
                          <div>{form.getValues("matricMarks")} / {form.getValues("matricTotal")} — {form.getValues("matricBoard")} ({form.getValues("matricYear")})</div>
                          <div className="text-muted-foreground">Intermediate:</div>
                          <div>{form.getValues("interMarks")} / {form.getValues("interTotal")} — {form.getValues("interBoard")} ({form.getValues("interYear")})</div>
                        </div>
                        {fields.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-muted-foreground mb-1">Additional Qualifications:</p>
                            {fields.map((_, i) => {
                              const q = form.getValues(`additionalQualifications.${i}`);
                              return (
                                <div key={i} className="text-xs text-muted-foreground">
                                  {q?.degree} — {q?.institution} ({q?.year}): {q?.marksObtained}/{q?.totalMarks}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {step < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Profile
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
