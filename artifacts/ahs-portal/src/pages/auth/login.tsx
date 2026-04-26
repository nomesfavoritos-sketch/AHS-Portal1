import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, Shield, CreditCard, Lock, Users, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or CNIC is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const STATS = [
  { icon: Users, value: "1200+", label: "Students Enrolled" },
  { icon: Award, label: "NMU Affiliated University" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier, password: data.password }),
        credentials: "include",
      });
      if (res.ok) {
        const user = await res.json();
        toast({ title: "Welcome back!", description: `Signed in as ${user.fullName}` });
        if (user.role === "student") {
          setLocation("/student/dashboard");
        } else {
          setLocation("/admin/dashboard");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Sign in failed",
          description: err.error ?? "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Connection error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* Left panel — dark green */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "#01411C" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #F0B429, transparent)" }}
        />
        <div
          className="absolute bottom-20 -left-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
        />

        <div className="relative z-10">
          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-12">
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
            Welcome<br />
            <span style={{ color: "#D4AF37" }}>Back</span>
          </h2>
          <p className="text-[14px] mb-10 max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Sign in to manage your application for Allied Health Sciences programs at Nishtar Medical University, Multan.
          </p>

          {/* Stat cards */}
          <div className="space-y-3">
            <div
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(240,180,41,0.25)" }}>
                <Users className="h-4 w-4" style={{ color: "#F0B429" }} />
              </div>
              <div>
                <p className="text-white font-black text-[18px] leading-none">1200+</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Students Enrolled</p>
              </div>
            </div>
            <div
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(240,180,41,0.25)" }}>
                <Award className="h-4 w-4" style={{ color: "#F0B429" }} />
              </div>
              <div>
                <p className="text-white font-bold text-[14px] leading-none">NMU</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Affiliated University</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Government of Punjab · PMDC Affiliated
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
            style={{ boxShadow: "0 2px 8px rgba(1,65,28,0.20)" }}
          />
          <div>
            <p className="text-[13px] font-bold text-[#0F172A]">AHS Portal</p>
            <p className="text-[10px] text-[#64748B]">Allied Health College · NMU</p>
          </div>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h1 className="text-[24px] font-black text-[#0F172A] leading-tight">Sign in to Portal</h1>
            <p className="text-[13px] text-[#64748B] mt-1">Enter your credentials to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold text-[#374151] flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#64748B]" /> CNIC / B-Form / Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@ahscollege.edu.pk"
                        autoComplete="username"
                        className="h-11 rounded-xl text-[13px]"
                        style={{ border: "1.5px solid #E5E7EB" }}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-[#94A3B8]">Admin staff may sign in with their email address.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[13px] font-semibold text-[#374151] flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-[#64748B]" /> Password
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
                className="w-full h-11 rounded-xl text-[14px] font-semibold text-white mt-2"
                disabled={loading}
                style={{ background: "#01411C" }}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in to Portal
              </Button>
            </form>
          </Form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-[#94A3B8]">New applicant?</span>
            </div>
          </div>

          <Link href="/register">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl text-[14px] font-semibold"
              style={{ borderColor: "#01411C", color: "#01411C" }}
            >
              Create Student Account
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-1.5 mt-6">
            <Shield className="h-3.5 w-3.5 text-[#CBD5E1]" />
            <p className="text-[11px] text-[#94A3B8]">Secured by AHS Portal · Government of Punjab</p>
          </div>
        </div>
      </div>
    </div>
  );
}
