/* eslint-disable react/no-unescaped-entities */
'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RequestPasswordReset } from "@/actions/action";

// Define the forgot password schema
const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export default function ForgotPasswordPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const result = await RequestPasswordReset(data.email);

      if (result.success) {
        setEmailSent(true);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to send reset email");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Success message side */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-20 bg-white dark:bg-gray-900">
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold">Check Your Email</h2>
              <p className="text-muted-foreground mt-2">
                We've sent a password reset link to your email address
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you don't see the email, check your spam folder or try again with a different email address.
              </p>
              
              <Button 
                onClick={() => setEmailSent(false)} 
                variant="outline" 
                className="w-full"
              >
                Try Different Email
              </Button>
              
              <Link href="/sign-in">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Branding side */}
        <div className="hidden md:block bg-gradient-to-br from-primary to-primary/80 relative">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12">
            <div className="max-w-md text-center text-white">
              <h1 className="text-4xl font-bold mb-6">Almost There!</h1>
              <p className="text-lg mb-8">
                Check your inbox for the password reset link. You'll be back to your dashboard in no time.
              </p>
            </div>
          </div>
          <Image
            src="/bluto-auth.jpg"
            alt="Brand Illustration"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-20 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div>
            <Link href="/sign-in">
              <Button variant="ghost" className="mb-4 p-0 h-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
            <h2 className="text-3xl font-bold">Forgot Password?</h2>
            <p className="text-muted-foreground mt-2">
              No worries! Enter your email and we'll send you a reset link
            </p>
          </div>

          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="you@example.com" 
                        type="email" 
                        className="h-11" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </div>
          </Form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/sign-in" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Branding side */}
      <div className="hidden md:block bg-gradient-to-br from-primary to-primary/80 relative">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12">
          <div className="max-w-md text-center text-white">
            <h1 className="text-4xl font-bold mb-6">Reset Made Easy</h1>
            <p className="text-lg mb-8">
              Forgot your password? No problem! We'll get you back into your account securely and quickly.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-xl font-semibold">🔒</p>
                <p className="text-sm">Secure Reset</p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-xl font-semibold">⚡</p>
                <p className="text-sm">Quick Process</p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-xl font-semibold">📧</p>
                <p className="text-sm">Email Link</p>
              </div>
            </div>
          </div>
        </div>
        <Image
          src="/bluto-auth.jpg"
          alt="Brand Illustration"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
    </div>
  );
}