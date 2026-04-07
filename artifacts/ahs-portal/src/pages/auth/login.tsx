import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Loader2, CreditCard } from "lucide-react";
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
    loginMutation.mutate(
      { data },
      {
        onSuccess: (loggedInUser) => {
          toast({ title: "Login successful", description: "Welcome back to AHS Portal." });
          if (loggedInUser.role === "student") {
            setLocation("/student/dashboard");
          } else {
            setLocation("/admin/dashboard");
          }
        },
        onError: (error: any) => {
          toast({
            title: "Login failed",
            description: error?.data?.error || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">AHS Portal</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Allied Health College, Nishtar Medical University
          </p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        CNIC / B-Form
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XXXXX-XXXXXXX-X"
                          autoComplete="username"
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
                        <FormLabel>Password</FormLabel>
                        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Register as student
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
