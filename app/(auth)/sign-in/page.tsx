/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(auth)/sign-in/page.tsx
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { LoginSchema } from "@/lib";
import { SignInWithCredentials } from "@/actions/action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SignInButtons from "@/components/SignInBotton";
import { toast } from "sonner";
import Image from "next/image";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof LoginSchema>) => {
    setIsLoading(true);
    try {
      const result = await SignInWithCredentials(data.email, data.password);

      if (!result.success) {
        toast.error(result.error || "Authentication failed");
        return;
      }

      // Redirect to user-specific dashboard using the user ID from the result
      if (result.userId) {
        toast.success("Welcome back!");
        router.push(`/dashboard/${result.userId}`);
      } else {
        // Fallback if userId is not available
        toast.success("Welcome back!");
        router.push(`/dashboard/${result.userId}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-20 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Sign In</h2>
            <p className="text-muted-foreground">Access your account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="you@example.com" type="email" />
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
                      <Input {...field} placeholder="••••••••" type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <SignInButtons />

          <p className="text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Branding side */}
      <div className="hidden md:block bg-muted overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary to-secondary opacity-50" />
        <div className="flex items-center justify-center h-full">
            <Image
              src="/auth-illustration.jpg"
              alt="Auth Illustration"
              fill
              className="w-full h-auto "
            />
        </div>
      </div>
    </div>
  );
}