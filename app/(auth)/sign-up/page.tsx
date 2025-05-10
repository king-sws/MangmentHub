/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';
import { z } from "zod";
import { RegisiterSchema } from "@/lib";
import { SignUpWithCredentials } from "@/actions/action";
import SignInButtons from "@/components/SignInBotton";
import Image from 'next/image'; // Import the Image component

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof RegisiterSchema>>({
    resolver: zodResolver(RegisiterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof RegisiterSchema>) => {
    setIsLoading(true);
    try {
      const result = await SignUpWithCredentials(data.name, data.email, data.password);

      if (!result.success) {
        toast.error(result.error || "Registration failed");
        return;
      }

      toast.success("Account created successfully!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Branding / Image Section */}
      <div className="hidden md:flex w-full md:w-1/2 items-center justify-center bg-primary text-white p-8 relative">
        <div className="absolute inset-0">
          <Image
            src="/auth-illustration-2.jpg" //  path to your image
            alt="Auth Illustration"
            fill
            className="" // Ensure the image covers the entire area
            priority // Optional:  prioritize loading
          />
        </div>

      </div>

      {/* Form Section */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Create Account</h2>
            <p className="text-sm text-muted-foreground">Get started with your new account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="email@example.com" type="email" />
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
                Create Account
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <SignInButtons />

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

