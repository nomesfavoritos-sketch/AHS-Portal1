import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  CreditCard, Loader2, Lock, Eye, EyeOff,
  Shield, GraduationCap, Award, Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your CNIC/B-Form or email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const STATS = [
  { icon: GraduationCap, value: "8",    label: "AHS Programs" },
  { icon: Users,          value: "1200+", label: "Students Enrolled" },
  { icon: Award,          value: "100%", label: "HEC Recognized" },
  { icon: Shield,         value: "NMU",  label: "Affiliated University" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [showPass, setShowPass] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (user) => {
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        if (user?.role === "student") {
          setLocation("/student/dashboard");
        } else {
          setLocation("/admin/dashboard");
        }
      },
      onError: () => {
        toast({ title: "Sign in failed", description: "Invalid credentials. Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #01411C 0%, #006C35 55%, #013220 100%)" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #16A34A, transparent)" }}
        />
        <div
          className="absolute bottom-32 -left-20 h-80 w-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        />
        <div
          className="absolute top-1/2 right-0 h-40 w-40 rounded-full opacity-[0.07]"
          style={{ background: "#4ade80" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center text-[13px] font-black text-white"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)" }}
            >
              AHS
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-tight">AHS Admissions Portal</p>
              <p className="text-[12px] leading-tight" style={{ color: "rgba(255,255,255,0.55)" }}>
                Allied Health College · NMU
              </p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black text-white leading-[1.1] mb-4">
            Begin Your<br />
            <span style={{ color: "#D4AF37" }}>Healthcare</span><br />
            Career
          </h1>
          <p className="text-[14px] leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            Official admissions portal for Allied Health College, Nishtar Medical University, Multan — premier institution for Allied Health Sciences in southern Punjab.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center mb-2"
                style={{ background: "rgba(22,163,74,0.30)" }}
              >
                <Icon className="h-4 w-4" style={{ color: "#4ade80" }} />
              </div>
              <p className="text-xl font-black text-white leading-tight">{value}</p>
              <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.50)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Govt trust seal at bottom */}
        <div className="relative z-10 flex items-center gap-2 mt-6">
          <Shield className="h-4 w-4" style={{ color: "rgba(255,255,255,0.40)" }} />
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.40)" }}>
            Government of Punjab · HEC Recognized · PMDC Affiliated
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white"
            style={{ background: "linear-gradient(135deg, #01411C, #16A34A)" }}
          >
            AHS
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#0F172A]">AHS Portal</p>
            <p className="text-[11px] text-[#64748B]">Allied Health College · NMU</p>
          </div>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Sign in to Portal</h2>
            <p className="text-[13px] text-[#64748B]">Enter your credentials to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Identifier */}
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#01411C]" />
                      CNIC / B-Form / Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="XXXXX-XXXXXXX-X or email"
                          autoComplete="username"
                          className="h-11 rounded-xl text-[13px] pl-4"
                          style={{ border: "1.5px solid #E5E7EB" }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-[#94A3B8] mt-1">
                      Admin staff may sign in with their email address.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1.5">
                      <FormLabel className="text-[13px] font-medium text-[#374151] flex items-center gap-1.5 mb-0">
                        <Lock className="h-3.5 w-3.5 text-[#01411C]" />
                        Password
                      </FormLabel>
                      <Link href="/forgot-password">
                        <span className="text-[12px] font-semibold cursor-pointer hover:underline" style={{ color: "#01411C" }}>
                          Forgot password?
                        </span>
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPass ? "text" : "password"}
                          autoComplete="current-password"
                          className="h-11 rounded-xl text-[13px] pr-10"
                          style={{ border: "1.5px solid #E5E7EB" }}
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                          onClick={() => setShowPass(v => !v)}
                          tabIndex={-1}
                        >
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 rounded-xl text-[14px] font-semibold text-white mt-2 btn-green-gradient"
                disabled={loginMutation.isPending}
                style={{
                  background: "linear-gradient(135deg, #01411C 0%, #006C35 100%)",
                  boxShadow: "0 4px 15px rgba(1,65,28,0.35)",
                }}
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in to Portal
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-[11px] text-[#94A3B8] font-medium">New applicant?</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <Link href="/register">
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl text-[13px] font-semibold"
              style={{ borderColor: "#01411C", color: "#01411C", borderWidth: "1.5px" }}
            >
              Create Student Account
            </Button>
          </Link>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <Shield className="h-3.5 w-3.5 text-[#94A3B8]" />
            <p className="text-[11px] text-[#94A3B8]">Secured by AHS Portal · Government of Punjab</p>
          </div>
        </div>
      </div>
    </div>
  );
}
