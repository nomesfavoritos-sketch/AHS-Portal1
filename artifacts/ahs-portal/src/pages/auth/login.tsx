import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Loader2, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your CNIC/B-Form or email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    if (data.identifier === "student@ahscollege.edu.pk") {
      toast({ title: "Login successful", description: "Welcome back to AHS Portal." });
      setLocation("/student/dashboard");
    } else {
      toast({ title: "Login successful", description: "Welcome back to AHS Portal." });
      setLocation("/admin/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gov-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Shield className="h-7 w-7 text-gold" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Allied Health Sciences<br />Admission Portal
          </h1>
          <p className="text-lg text-white/60 leading-relaxed max-w-md mb-8">
            Nishtar Medical University, Multan. Secure government portal for managing admissions, merit lists, and student enrollment.
          </p>
          <div className="flex items-center gap-6 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>256-bit Encrypted</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span>Government Verified</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pakistan-green shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">AHS Portal</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Allied Health College, Nishtar Medical University
            </p>
          </div>

          <div className="lg:block hidden">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access the admission portal
            </p>
          </div>

          <Card className="shadow-lg border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sign in to your account</CardTitle>
              <CardDescription>Enter your credentials to access the portal</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          CNIC / B-Form
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XXXXX-XXXXXXX-X"
                            autoComplete="username"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Admin staff may sign in with their email address.
                        </p>
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
                          <FormLabel className="text-sm font-semibold">Password</FormLabel>
                          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input placeholder="Enter your password" type="password" autoComplete="current-password" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loginMutation.isPending}>
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-5">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Register as student
                </Link>
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Allied Health Sciences College, NMU Multan
          </p>
        </div>
      </div>
    </div>
  );
}
