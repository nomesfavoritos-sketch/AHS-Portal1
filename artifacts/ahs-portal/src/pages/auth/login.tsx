import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or CNIC is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={import.meta.env.BASE_URL + "logo.webp"}
            alt="AHS Logo"
            className="h-14 w-14 rounded-2xl object-contain bg-white p-1 mb-4"
            style={{ boxShadow: "0 8px 24px rgba(1,65,28,0.30)" }}
          />
          <h1 className="text-xl font-bold text-[#0F172A]">AHS Admissions Portal</h1>
          <p className="text-[13px] text-[#64748B] mt-1">Allied Health College · Nishtar Medical University</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-7"
          style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <h2 className="text-[16px] font-bold text-[#0F172A] mb-1">Sign in</h2>
          <p className="text-[12px] text-[#94A3B8] mb-6">Enter your credentials to continue</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-[#374151]">
                      Email / CNIC
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
                      <FormLabel className="text-[13px] font-medium text-[#374151]">Password</FormLabel>
                      <Link href="/forgot-password">
                        <span className="text-[12px] font-medium cursor-pointer hover:underline" style={{ color: "#01411C" }}>
                          Forgot?
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
                style={{
                  background: "linear-gradient(135deg, #01411C 0%, #006C35 100%)",
                  boxShadow: "0 4px 14px rgba(1,65,28,0.30)",
                }}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>

          <p className="text-[12px] text-center text-[#94A3B8] mt-5">
            New student?{" "}
            <Link href="/register">
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: "#01411C" }}>
                Create account
              </span>
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          <Shield className="h-3.5 w-3.5 text-[#CBD5E1]" />
          <p className="text-[11px] text-[#CBD5E1]">Government of Punjab · HEC Recognized</p>
        </div>
      </div>
    </div>
  );
}
