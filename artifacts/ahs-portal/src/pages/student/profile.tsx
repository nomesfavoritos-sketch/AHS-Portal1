import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Plus, Trash2, ChevronsUpDown, Check, User, MapPin, GraduationCap, ClipboardList, Camera } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { ObjectUploader } from "@workspace/object-storage-web";

const G = "#01411C";

const PUNJAB_DISTRICTS = [
  "Ahmadpur East","Attock","Bahawalnagar","Bahawalpur","Bhakkar","Chakwal",
  "Chiniot","Chunian","Dera Ghazi Khan","Faisalabad","Gujranwala","Gujrat",
  "Hafizabad","Jhang","Jhelum","Kamalia","Kasur","Khanewal","Khairpur Tamewali",
  "Khushab","Kot Addu","Lahore","Layyah","Lodhran","Mandi Bahauddin","Mianwali",
  "Multan","Murree","Muzaffargarh","Narowal","Nankana Sahib","Okara","Pakpattan",
  "Pattoki","Rahim Yar Khan","Rajanpur","Rawalpindi","Sahiwal","Sargodha",
  "Shakargarh","Sheikhupura","Sialkot","Toba Tek Singh","Vehari","Wazirabad",
].sort();

const BOARDS = [
  "Bahawalpur Board","DG Khan Board","Faisalabad Board","Gujranwala Board",
  "Lahore Board","Multan Board","Rawalpindi Board","Sahiwal Board","Sargodha Board",
  "Federal Board","AJK Board","Aga Khan Board",
];

const PROVINCES = [
  "Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan",
  "Islamabad Capital Territory","Azad Jammu & Kashmir","Gilgit-Baltistan",
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
  motherName: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  maritalStatus: z.string().optional().or(z.literal("")),
  cnic: z.string().optional().or(z.literal("")),
  contactNumber: z.string().optional().or(z.literal("")),
  guardianContactNumber: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  domicile: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  religion: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")),
  photoPath: z.string().optional().or(z.literal("")),
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

function SectionBar({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-md mb-4" style={{ background: G }}>
      <span className="text-white opacity-80">{icon}</span>
      <span className="text-white font-semibold text-sm tracking-wide">{title}</span>
    </div>
  );
}

function FieldRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid md:grid-cols-2 gap-x-6 gap-y-4 ${className}`}>{children}</div>;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex gap-0.5">
      {children}<span className="text-red-500 ml-0.5">*</span>
    </span>
  );
}

export default function StudentProfile() {
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: profile, isLoading } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [step, setStep] = useState(1);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const totalSteps = 4;
  const baseUrl = import.meta.env.BASE_URL;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: (user as any)?.fullName || "",
      fatherName: (profile as any)?.fatherName || "",
      motherName: (profile as any)?.motherName || "",
      dateOfBirth: (profile as any)?.dateOfBirth || "",
      gender: (profile as any)?.gender || "",
      maritalStatus: (profile as any)?.maritalStatus || "",
      cnic: (profile as any)?.cnic || "",
      contactNumber: (profile as any)?.contactNumber || "",
      guardianContactNumber: (profile as any)?.guardianContactNumber || "",
      address: (profile as any)?.address || "",
      city: (profile as any)?.city || "",
      domicile: (profile as any)?.domicile || "",
      province: (profile as any)?.province || "",
      religion: (profile as any)?.religion || "",
      nationality: (profile as any)?.nationality || "Pakistani",
      photoPath: (profile as any)?.photoPath || "",
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

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "additionalQualifications" });

  const onSubmit = (data: ProfileFormValues) => {
    const payload: Record<string, unknown> = {
      fatherName: data.fatherName,
      motherName: data.motherName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      cnic: data.cnic,
      contactNumber: data.contactNumber,
      guardianContactNumber: data.guardianContactNumber,
      address: data.address,
      permanentAddress: data.address,
      city: data.city,
      domicileDistrict: data.domicile,
      domicile: data.domicile,
      province: data.province,
      religion: data.religion,
      nationality: data.nationality,
      photoPath: data.photoPath || null,
      matricBoard: data.matricBoard,
      matricYear: Number(data.matricYear),
      matricTotal: Number(data.matricTotal),
      matricMarks: Number(data.matricMarks),
      interBoard: data.interBoard,
      interYear: Number(data.interYear),
      interTotal: Number(data.interTotal),
      interMarks: Number(data.interMarks),
      additionalQualifications: data.additionalQualifications,
    };
    updateProfile.mutate(
      { data: payload },
      {
        onSuccess: () => { toast({ title: "Profile updated successfully" }); },
        onError: () => { toast({ title: "Update failed", description: "An error occurred", variant: "destructive" }); },
      }
    );
  };

  const nextStep = () => { if (step < totalSteps) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const watched = useWatch({
    control: form.control,
    name: ["fatherName","dateOfBirth","gender","cnic","religion","domicile","matricBoard","interBoard","matricYear","matricTotal","matricMarks","interYear","interTotal","interMarks"],
  });
  const livePercent = (() => {
    const [fatherName,dateOfBirth,gender,cnic,religion,domicile,matricBoard,interBoard,matricYear,matricTotal,matricMarks,interYear,interTotal,interMarks] = watched;
    const strFields = [fatherName,dateOfBirth,gender,cnic,religion,domicile,matricBoard,interBoard];
    const numFields = [matricYear,matricTotal,matricMarks,interYear,interTotal,interMarks];
    const strFilled = strFields.filter((f) => f && f !== "").length;
    const numFilled = numFields.filter((f) => Number(f) > 0).length;
    return Math.round(((strFilled + numFilled) / (strFields.length + numFields.length)) * 100);
  })();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: G }} />
      </div>
    );
  }

  const STEPS = [
    { n: 1, label: "Personal Info", icon: <User className="h-3.5 w-3.5" /> },
    { n: 2, label: "Classification", icon: <MapPin className="h-3.5 w-3.5" /> },
    { n: 3, label: "Academics", icon: <GraduationCap className="h-3.5 w-3.5" /> },
    { n: 4, label: "Review", icon: <ClipboardList className="h-3.5 w-3.5" /> },
  ];

  const pct = Math.round(livePercent);
  const pctColor = pct < 40 ? "#ef4444" : pct < 80 ? "#f59e0b" : "#16a34a";

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">

      {/* Header card */}
      <div className="rounded-xl overflow-hidden shadow-sm border">
        <div className="px-6 py-4 text-white" style={{ background: G }}>
          <h1 className="text-xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm opacity-80 mt-0.5">Complete all sections to enable program applications.</p>
        </div>
        <div className="px-6 py-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Profile Completion</span>
            <span className="text-sm font-bold" style={{ color: pctColor }}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pctColor }}
            />
          </div>
        </div>
      </div>

      {/* Step wizard */}
      <div className="bg-white border rounded-xl px-6 py-4 shadow-sm">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => s.n < step && setStep(s.n)}
                  className="flex flex-col items-center gap-1 min-w-0 cursor-default"
                  style={{ cursor: s.n < step ? "pointer" : "default" }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-200"
                    style={{
                      background: done ? "#16a34a" : active ? G : "#f3f4f6",
                      color: done || active ? "white" : "#9ca3af",
                      boxShadow: active ? `0 0 0 4px ${G}22` : "none",
                    }}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.icon}
                  </div>
                  <span
                    className="text-xs font-semibold text-center hidden sm:block transition-colors"
                    style={{ color: done ? "#16a34a" : active ? G : "#9ca3af" }}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-0.5 flex-1 mx-2 rounded-full transition-all duration-300"
                    style={{ background: step > s.n ? "#16a34a" : "#e5e7eb" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {/* Card title bar */}
            <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ color: G }}>
                {step === 1 && "Step 1 — Personal Information"}
                {step === 2 && "Step 2 — Classification & Domicile"}
                {step === 3 && "Step 3 — Academic Background"}
                {step === 4 && "Step 4 — Review & Submit"}
              </span>
              <span className="text-xs text-gray-400">Step {step} of {totalSteps}</span>
            </div>

            <div className="px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                >

                  {/* ─── STEP 1: Personal Info ─── */}
                  {step === 1 && (
                    <div className="space-y-6">

                      {/* Photo Upload */}
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="relative">
                          <div
                            className="h-24 w-24 rounded-full border-4 overflow-hidden flex items-center justify-center bg-gray-100"
                            style={{ borderColor: G }}
                          >
                            {photoUrl || (profile as any)?.photoPath ? (
                              <img
                                src={photoUrl || `${baseUrl}api/storage/objects/${(profile as any)?.photoPath}`}
                                alt="Profile"
                                className="h-full w-full object-cover"
                                onError={() => {}}
                              />
                            ) : (
                              <User className="h-10 w-10 text-gray-400" />
                            )}
                          </div>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={3145728}
                            buttonClassName="absolute -bottom-1 -right-1"
                            onGetUploadParameters={async (file) => {
                              const res = await fetch(`${baseUrl}api/storage/uploads/request-url`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "image/jpeg" })
                              });
                              const data = await res.json();
                              return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "image/jpeg" } };
                            }}
                            onComplete={(result) => {
                              const uploaded = result.successful?.[0];
                              if (uploaded) {
                                const path = uploaded.response?.uploadURL?.split("?")[0]?.split("/").slice(-2).join("/") ?? "";
                                form.setValue("photoPath", path);
                                setPhotoUrl(URL.createObjectURL(uploaded.data as File));
                              }
                            }}
                          >
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center text-white shadow cursor-pointer"
                              style={{ background: G }}
                            >
                              <Camera className="h-3.5 w-3.5" />
                            </div>
                          </ObjectUploader>
                        </div>
                        <span className="text-xs text-gray-500">Click camera icon to upload photo (max 3MB)</span>
                      </div>

                      <Separator />

                      <SectionBar icon={<User className="h-4 w-4" />} title="Basic Information" />
                      <FieldRow>
                        <FormField control={form.control} name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Full Name</RequiredLabel></FormLabel>
                              <FormControl><Input {...field} disabled className="bg-gray-50" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="fatherName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Father's Name</RequiredLabel></FormLabel>
                              <FormControl><Input {...field} placeholder="Enter father's name" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="motherName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Name</FormLabel>
                              <FormControl><Input {...field} placeholder="Enter mother's name" /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="cnic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>CNIC / B-Form No.</RequiredLabel></FormLabel>
                              <FormControl><Input {...field} placeholder="3220296239841" /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Date of Birth</RequiredLabel></FormLabel>
                              <FormControl><Input type="date" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Gender</RequiredLabel></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="maritalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marital Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="single">Single</SelectItem>
                                  <SelectItem value="married">Married</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="religion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Religion</RequiredLabel></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="Islam">Islam</SelectItem>
                                  <SelectItem value="Christianity">Christianity</SelectItem>
                                  <SelectItem value="Hinduism">Hinduism</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl><Input {...field} placeholder="Pakistani" /></FormControl>
                            </FormItem>
                          )} />
                      </FieldRow>

                      <Separator />
                      <SectionBar icon={<MapPin className="h-4 w-4" />} title="Contact Information" />
                      <FieldRow>
                        <FormField control={form.control} name="contactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Applicant's Mobile No.</FormLabel>
                              <FormControl><Input {...field} placeholder="03XX-XXXXXXX" /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="guardianContactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father/Guardian Mobile No.</FormLabel>
                              <FormControl><Input {...field} placeholder="03XX-XXXXXXX" /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Multan" /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Permanent Address</FormLabel>
                              <FormControl><Input {...field} placeholder="House No, Street, Mohalla, City" /></FormControl>
                            </FormItem>
                          )} />
                      </FieldRow>
                    </div>
                  )}

                  {/* ─── STEP 2: Classification ─── */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <SectionBar icon={<MapPin className="h-4 w-4" />} title="Domicile Information" />
                      <FieldRow>
                        <FormField control={form.control} name="domicile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Domicile District</RequiredLabel></FormLabel>
                              <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                      <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                                        {field.value || "Search & select district"}
                                      </span>
                                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                    </button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="Type to search district..." />
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
                        <FormField control={form.control} name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                      </FieldRow>
                    </div>
                  )}

                  {/* ─── STEP 3: Academics ─── */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <SectionBar icon={<GraduationCap className="h-4 w-4" />} title="Matriculation (SSC / 10th Grade)" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField control={form.control} name="matricYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Passing Year</RequiredLabel></FormLabel>
                              <FormControl><Input type="number" placeholder="e.g. 2020" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="matricBoard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Board</RequiredLabel></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="matricMarks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Marks Obtained</RequiredLabel></FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="matricTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Total Marks</RequiredLabel></FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )} />
                      </div>

                      <Separator />
                      <SectionBar icon={<GraduationCap className="h-4 w-4" />} title="Intermediate / FSc (HSSC / 12th Grade)" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField control={form.control} name="interYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Passing Year</RequiredLabel></FormLabel>
                              <FormControl><Input type="number" placeholder="e.g. 2022" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="interBoard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Board</RequiredLabel></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="interMarks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Marks Obtained</RequiredLabel></FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        <FormField control={form.control} name="interTotal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><RequiredLabel>Total Marks</RequiredLabel></FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )} />
                      </div>

                      <Separator />
                      <div className="flex items-center justify-between">
                        <SectionBar icon={<GraduationCap className="h-4 w-4" />} title="Additional Qualifications (Optional)" />
                        <Button type="button" variant="outline" size="sm" className="ml-4 shrink-0"
                          onClick={() => append({ degree: "", institution: "", board: "", year: new Date().getFullYear(), marksObtained: 0, totalMarks: 100 })}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-5 text-center -mt-2">
                          No additional qualifications. Click <strong>Add</strong> to include a degree, diploma, or certificate.
                        </p>
                      )}
                      <div className="space-y-4">
                        {fields.map((f, index) => (
                          <div key={f.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-600">Qualification {index + 1}</span>
                              <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-8 w-8 p-0" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {[
                                { name: `additionalQualifications.${index}.degree` as const, label: "Degree / Certificate", placeholder: "e.g. B.Sc, Diploma" },
                                { name: `additionalQualifications.${index}.institution` as const, label: "Institution", placeholder: "College/University name" },
                                { name: `additionalQualifications.${index}.board` as const, label: "Board / University", placeholder: "Awarding body" },
                              ].map(({ name, label, placeholder }) => (
                                <FormField key={name} control={form.control} name={name}
                                  render={({ field: ff }) => (
                                    <FormItem>
                                      <FormLabel>{label}</FormLabel>
                                      <FormControl><Input placeholder={placeholder} {...ff} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )} />
                              ))}
                              <FormField control={form.control} name={`additionalQualifications.${index}.year`}
                                render={({ field: ff }) => (
                                  <FormItem><FormLabel>Passing Year</FormLabel><FormControl><Input type="number" {...ff} /></FormControl><FormMessage /></FormItem>
                                )} />
                              <FormField control={form.control} name={`additionalQualifications.${index}.marksObtained`}
                                render={({ field: ff }) => (
                                  <FormItem><FormLabel>Marks Obtained</FormLabel><FormControl><Input type="number" {...ff} /></FormControl><FormMessage /></FormItem>
                                )} />
                              <FormField control={form.control} name={`additionalQualifications.${index}.totalMarks`}
                                render={({ field: ff }) => (
                                  <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" {...ff} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─── STEP 4: Review ─── */}
                  {step === 4 && (
                    <div className="space-y-5">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <strong>Please review carefully.</strong> Ensure all details match your official documents before saving. This information will be used in your admission application.
                      </div>

                      {/* Personal */}
                      <div className="rounded-lg border overflow-hidden">
                        <div className="px-4 py-2.5 font-semibold text-sm text-white" style={{ background: G }}>Personal Information</div>
                        <div className="divide-y">
                          {[
                            ["Full Name", form.getValues("fullName")],
                            ["Father's Name", form.getValues("fatherName")],
                            ["Mother's Name", form.getValues("motherName")],
                            ["CNIC / B-Form", form.getValues("cnic")],
                            ["Date of Birth", form.getValues("dateOfBirth")],
                            ["Gender", form.getValues("gender")],
                            ["Marital Status", form.getValues("maritalStatus")],
                            ["Religion", form.getValues("religion")],
                            ["Nationality", form.getValues("nationality")],
                            ["Contact No.", form.getValues("contactNumber")],
                            ["Guardian No.", form.getValues("guardianContactNumber")],
                            ["City", form.getValues("city")],
                            ["Permanent Address", form.getValues("address")],
                          ].map(([label, value]) => value ? (
                            <div key={label} className="grid grid-cols-5 text-sm px-4 py-2.5">
                              <span className="col-span-2 text-gray-500 font-medium">{label}:</span>
                              <span className="col-span-3 font-medium capitalize">{value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>

                      {/* Domicile */}
                      <div className="rounded-lg border overflow-hidden">
                        <div className="px-4 py-2.5 font-semibold text-sm text-white" style={{ background: G }}>Domicile & Classification</div>
                        <div className="divide-y">
                          {[
                            ["Domicile District", form.getValues("domicile")],
                            ["Province", form.getValues("province")],
                          ].map(([label, value]) => value ? (
                            <div key={label} className="grid grid-cols-5 text-sm px-4 py-2.5">
                              <span className="col-span-2 text-gray-500 font-medium">{label}:</span>
                              <span className="col-span-3 font-medium">{value}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>

                      {/* Academic */}
                      <div className="rounded-lg border overflow-hidden">
                        <div className="px-4 py-2.5 font-semibold text-sm text-white" style={{ background: G }}>Academic Records</div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Level</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Board</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Year</th>
                              <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Marks</th>
                              <th className="text-right px-4 py-2.5 font-semibold text-gray-600">%</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-2.5 font-medium">Matriculation</td>
                              <td className="px-4 py-2.5">{form.getValues("matricBoard") || "—"}</td>
                              <td className="px-4 py-2.5">{form.getValues("matricYear") || "—"}</td>
                              <td className="px-4 py-2.5 text-right">{form.getValues("matricMarks")} / {form.getValues("matricTotal")}</td>
                              <td className="px-4 py-2.5 text-right font-semibold" style={{ color: G }}>
                                {form.getValues("matricTotal") > 0
                                  ? ((Number(form.getValues("matricMarks")) / Number(form.getValues("matricTotal"))) * 100).toFixed(1) + "%"
                                  : "—"}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 font-medium">Intermediate / FSc</td>
                              <td className="px-4 py-2.5">{form.getValues("interBoard") || "—"}</td>
                              <td className="px-4 py-2.5">{form.getValues("interYear") || "—"}</td>
                              <td className="px-4 py-2.5 text-right">{form.getValues("interMarks")} / {form.getValues("interTotal")}</td>
                              <td className="px-4 py-2.5 text-right font-semibold" style={{ color: G }}>
                                {form.getValues("interTotal") > 0
                                  ? ((Number(form.getValues("interMarks")) / Number(form.getValues("interTotal"))) * 100).toFixed(1) + "%"
                                  : "—"}
                              </td>
                            </tr>
                            {fields.map((_, i) => {
                              const q = form.getValues(`additionalQualifications.${i}`);
                              return (
                                <tr key={i}>
                                  <td className="px-4 py-2.5 font-medium">{q?.degree}</td>
                                  <td className="px-4 py-2.5">{q?.board}</td>
                                  <td className="px-4 py-2.5">{q?.year}</td>
                                  <td className="px-4 py-2.5 text-right">{q?.marksObtained} / {q?.totalMarks}</td>
                                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: G }}>
                                    {q?.totalMarks > 0 ? ((q.marksObtained / q.totalMarks) * 100).toFixed(1) + "%" : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <p className="text-xs text-gray-400 text-center">By saving, you confirm that the above information is accurate and truthful.</p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="gap-2 text-white"
                style={{ background: G }}
              >
                Save & Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="gap-2 text-white px-8"
                style={{ background: G }}
              >
                {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
