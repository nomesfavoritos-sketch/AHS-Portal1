import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Loader2, ArrowLeft, CreditCard, User,
  Mail, Phone, Lock, Eye, EyeOff, Shield,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const cnicRegex = /^\d{5}-?\d{7}-?\d{1}$/;

const registerSchema = z.object({
  cnic: z
    .string()
    .min(1, "CNIC / B-Form is required")
    .refine(
      (v) => cnicRegex.test(v) || /^\d{13}$/.test(v.replace(/-/g, "")),
      "Enter a valid 13-digit CNIC or B-Form number"
    ),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const REQUIREMENTS = [
  "FSc Pre-Medical with ≥50% marks",
  "Valid CNIC or B-Form (13 digits)",
  "Punjab domicile certificate",
  "PKR 500 application fee",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { cnic: "", fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      { data: { cnic: data.cnic, fullName: data.fullName, email: data.email, phone: data.phone || undefined, password: data.password } },
      {
        onSuccess: () => {
          toast({ title: "Account created!", description: "Welcome to AHS Portal. Redirecting to your dashboard..." });
          setLocation("/student/dashboard");
        },
        onError: (error) => {
          const apiError = error as any;
          let description = "There was a problem creating your account.";
          if (apiError.status === 409) description = apiError.data?.error ?? "An account with this CNIC or email already exists.";
          else if (apiError.data?.error) description = apiError.data.error;
          toast({ title: "Registration failed", description, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[38%] p-10 relative overflow-hidden"
        style={{ background: "#01411C" }}
      >
        <div
          className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #16A34A, transparent)" }}
        />
        <div
          className="absolute bottom-20 -left-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <img
              src={import.meta.env.BASE_URL + "logo.webp"}
              alt="AHS Logo"
              className="h-12 w-12 rounded-2xl object-contain shrink-0 bg-white p-1"
            />
            <div>
              <p className="text-white font-bold text-[17px] leading-tight">AHS Admissions Portal</p>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>Allied Health College · NMU</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-3">
            Start Your<br />
            <span style={{ color: "#D4AF37" }}>Application</span>
          </h2>
          <p className="text-[14px] mb-8 max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Create your student account to apply for admission to one of 8 Allied Health Sciences programs.
          </p>

          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.40)" }}>
              Eligibility Requirements
            </p>
            {REQUIREMENTS.map((req) => (
              <div key={req} className="flex items-start gap-2.5">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "rgba(22,163,74,0.25)" }}
                >
                  <CheckCircle className="h-3 w-3" style={{ color: "#4ade80" }} />
                </div>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.70)" }}>{req}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Government of Punjab · HEC Recognized
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <img
            src={import.meta.env.BASE_URL + "logo.webp"}
            alt="AHS Logo"
            className="h-9 w-9 rounded-xl object-contain bg-white p-0.5"
          />
          <div>
            <p className="text-[13px] font-bold text-[#0F172A]">AHS Portal</p>
            <p className="text-[10px] text-[#64748B]">Allied Health College · NMU</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-7">
            <Link href="/login">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium cursor-pointer mb-4 hover:underline" style={{ color: "#01411C" }}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Create Student Account</h2>
            <p className="text-[13px] text-[#64748B]">Fill in your details accurately as per official documents</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="cnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#01411C]" />
                      CNIC / B-Form <span className="text-red-500 ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXXXX-XXXXXXX-X"
                        maxLength={15}
                        className="h-11 rounded-xl text-[13px]"
                        style={{ border: "1.5px solid #E5E7EB" }}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">This will be your login ID. Enter with or without dashes.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#01411C]" />
                      Full Name <span className="text-red-500 ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="As per Matriculation Certificate"
                        className="h-11 rounded-xl text-[13px]"
                        style={{ border: "1.5px solid #E5E7EB" }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#01411C]" />
                        Email <span className="text-red-500 ml-0.5">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@email.com"
                          type="email"
                          className="h-11 rounded-xl text-[13px]"
                          style={{ border: "1.5px solid #E5E7EB" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#64748B]" />
                        Phone <span className="text-[#94A3B8] text-[11px] font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="03XXXXXXXXX"
                          className="h-11 rounded-xl text-[13px]"
                          style={{ border: "1.5px solid #E5E7EB" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[#01411C]" />
                      Password <span className="text-red-500 ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Min. 6 characters"
                          type={showPass ? "text" : "password"}
                          className="h-11 rounded-xl text-[13px] pr-10"
                          style={{ border: "1.5px solid #E5E7EB" }}
                          {...field}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-[#01411C]" />
                      Confirm Password <span className="text-red-500 ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Re-enter password"
                          type={showConfirm ? "text" : "password"}
                          className="h-11 rounded-xl text-[13px] pr-10"
                          style={{ border: "1.5px solid #E5E7EB" }}
                          {...field}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 rounded-xl text-[14px] font-semibold text-white mt-2"
                disabled={registerMutation.isPending}
                style={{
                  background: "linear-gradient(135deg, #01411C 0%, #006C35 100%)",
                  boxShadow: "0 4px 15px rgba(1,65,28,0.35)",
                }}
              >
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account & Apply
              </Button>
            </form>
          </Form>

          <p className="text-[12px] text-center text-[#94A3B8] mt-6">
            Already have an account?{" "}
            <Link href="/login">
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: "#01411C" }}>Sign in</span>
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield className="h-3.5 w-3.5 text-[#94A3B8]" />
            <p className="text-[11px] text-[#94A3B8]">Secured by AHS Portal · Government of Punjab</p>
          </div>
        </div>
      </div>
    </div>
  );
}
