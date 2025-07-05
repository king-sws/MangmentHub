/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSafeSearchParams from '@/hooks/useSafeSearchParams';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, Shield, Lock, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Import your actual server actions
import { VerifyResetToken, ResetPassword } from "@/actions/action";

// TypeScript interfaces
interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  email?: string;
}

// Password reset schema with enterprise-grade validation
const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const token = searchParams?.get('token');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async (): Promise<void> => {
      if (!token) {
        toast.error("Invalid reset link - no token provided");
        router.push("/forgot-password");
        return;
      }

      try {
        console.log(`[Security] Verifying reset token: ${token.substring(0, 8)}...`);
        const result = await VerifyResetToken(token);
        
        if (result.success && result.email) {
          setTokenValid(true);
          setUserEmail(result.email);
          console.log(`[Security] Token verified for user: ${result.email}`);
        } else {
          toast.error(result.error || "Invalid or expired reset link");
          setTimeout(() => {
            router.push("/forgot-password");
          }, 2000);
        }
      } catch (error) {
        console.error('[Security] Token verification failed:', error);
        toast.error("Failed to verify reset link - please try again");
        setTimeout(() => {
          router.push("/forgot-password");
        }, 2000);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, router]);

  const onSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    if (!token) {
      toast.error("Security error: No valid token");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`[Security] Initiating password reset for user: ${userEmail}`);
      const result = await ResetPassword(token, data.password);

      if (result.success) {
        setResetSuccess(true);
        toast.success("Password reset successful");
        console.log(`[Security] Password successfully reset for: ${userEmail}`);
      } else {
        toast.error("Failed to reset password - please try again");
      }
    } catch (error) {
      console.error('[Security] Password reset failed:', error);
      toast.error("An unexpected error occurred - please contact support");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state during token verification
  if (isVerifying) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 lg:px-20 bg-white dark:bg-gray-900">
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Verifying Security Token</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we validate your reset request...
              </p>
            </div>
          </div>
        </div>

        <div className="hidden md:block bg-gradient-to-br from-primary to-primary/80 relative">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12">
            <div className="max-w-md text-center text-white">
              <Shield className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-6">Security First</h1>
              <p className="text-lg">
                We're verifying your reset request to ensure your account security.
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

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 lg:px-20 bg-white dark:bg-gray-900">
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold">Invalid Reset Link</h2>
              <p className="text-muted-foreground mt-2">
                This reset link is invalid or has expired
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/forgot-password">
                <Button className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link href="/sign-in">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden md:block bg-gradient-to-br from-primary to-primary/80 relative">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12">
            <div className="max-w-md text-center text-white">
              <Lock className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-6">Link Expired</h1>
              <p className="text-lg">
                For your security, password reset links expire after a short time. Request a new one to continue.
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

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 lg:px-20 bg-white dark:bg-gray-900">
          <div className="mx-auto w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold">Password Reset Complete</h2>
              <p className="text-muted-foreground mt-2">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Encrypted</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Secure</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Protected</p>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/sign-in">
                <Button className="w-full h-11">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden md:block bg-gradient-to-br from-primary to-primary/80 relative">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12">
            <div className="max-w-md text-center text-white">
              <CheckCircle className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
              <p className="text-lg mb-8">
                Your account security has been updated. Continue with confidence knowing your data is protected.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                  <p className="text-xl font-semibold">🔒</p>
                  <p className="text-sm">Secure</p>
                </div>
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                  <p className="text-xl font-semibold">⚡</p>
                  <p className="text-sm">Updated</p>
                </div>
                <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                  <p className="text-xl font-semibold">✅</p>
                  <p className="text-sm">Complete</p>
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

  // Main password reset form
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
            <h2 className="text-3xl font-bold">Reset Your Password</h2>
            <p className="text-muted-foreground mt-2">
              Create a new secure password for{" "}
              <span className="font-medium text-foreground">{userEmail}</span>
            </p>
          </div>

          <Form {...form}>
            <div className="space-y-4">
              {/* New Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, number, and special character
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Updating Password...' : 'Update Password'}
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
            <Lock className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-6">Enterprise Security</h1>
            <p className="text-lg mb-8">
              Your password will be encrypted using military-grade security protocols. 
              We maintain the highest standards for data protection and user privacy.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-xl font-semibold">🔐</p>
                <p className="text-sm">256-bit Encryption</p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-xl font-semibold">🛡️</p>
                <p className="text-sm">Zero Knowledge</p>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-xl font-semibold">⚡</p>
                <p className="text-sm">Instant Reset</p>
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