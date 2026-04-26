import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Loader2, ArrowLeft, CreditCard, Lock, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cnic: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      {
        data: {
          cnic: data.cnic,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || undefined,
          password: data.password,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Registration successful",
            description: "Your student account has been created. Redirecting to dashboard...",
          });
          setLocation("/student/dashboard");
        },
        onError: (error) => {
          const apiError = error as unknown as { status?: number; data?: { error?: string } };
          let description = "There was a problem creating your account.";
          if (apiError.status === 409) {
            description = apiError.data?.error ?? "An account with this CNIC/B-Form or email already exists.";
          } else if (apiError.data?.error) {
            description = apiError.data.error;
          }
          toast({ title: "Registration failed", description, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gov-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <GraduationCap className="h-7 w-7 text-gold" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Start Your<br />Academic Journey
          </h1>
          <p className="text-lg text-white/60 leading-relaxed max-w-md mb-8">
            Register as a student to apply for Allied Health Sciences programs at Nishtar Medical University, Multan.
          </p>
          <div className="flex items-center gap-6 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Secure Registration</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span>Government Portal</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center lg:hidden">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pakistan-green shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            Student Registration
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account to apply for admissions
          </p>
        </div>

        <div className="hidden lg:block">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Register to start your admission application</p>
        </div>

        <Card className="shadow-lg border-border/40">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Please provide your accurate information as per your official documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* CNIC / B-Form — required identity field */}
                <FormField
                  control={form.control}
                  name="cnic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        CNIC / B-Form Number
                        <span className="text-destructive ml-0.5">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XXXXX-XXXXXXX-X"
                          maxLength={15}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Used as your login ID. Enter with or without dashes.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="As per Matriculation Certificate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" type="email" {...field} />
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
                      <FormLabel>Phone Number <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="03XXXXXXXXX" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} />
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
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-6" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t p-5">
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Link href="/" className="text-sm text-center text-muted-foreground flex items-center justify-center hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
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
