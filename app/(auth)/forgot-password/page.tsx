/* eslint-disable react/no-unescaped-entities */
'use client'
import { useState, useEffect } from "react";
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

const brandMessages = [
  {
    title: "Reset Made Simple",
    subtitle: "Secure password recovery for your Blutto account.",
    highlight: "Get back to work in minutes, not hours"
  },
  {
    title: "Security First",
    subtitle: "Advanced encryption protects your reset process.",
    highlight: "Your data security is our priority"
  },
  {
    title: "Quick Recovery",  
    subtitle: "Streamlined reset process gets you back online fast.",
    highlight: "No complex steps, just simple recovery"
  },
  {
    title: "Always Accessible",
    subtitle: "24/7 account recovery whenever you need it.",
    highlight: "Support that never sleeps"
  }
];

export default function ForgotPasswordPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const form = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Rotating messages effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % brandMessages.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

  const currentMessage = brandMessages[currentMessageIndex];

  if (emailSent) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Success message side */}
        <div className="flex flex-col justify-center px-6 py-10 lg:px-20 bg-white dark:bg-gray-950 hide-scrollbar relative">
          {/* Back to Sign In Button */}
          <div className="absolute top-6 left-6">
            <Link href="/sign-in">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Sign In
              </Button>
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 transition-all duration-200">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Check Your Email</h2>
                <p className="text-muted-foreground">
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
                  className="w-full h-11 transition-all duration-200 hover:shadow-lg"
                >
                  Try Different Email
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Branding with Inverted Light/Dark Mode */}
        <div className="hidden md:block relative bg-black dark:bg-white text-white dark:text-black overflow-hidden hide-scrollbar">
          {/* Animated Background - Inverted Light and Dark Mode */}
          <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] dark:from-blue-50 dark:via-indigo-100 dark:to-purple-100 opacity-90" />
          <div className="absolute inset-0 bg-black/40 dark:bg-white/40" />
          
          {/* Floating Particles - Inverted for both modes */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 dark:bg-gray-400/30 rounded-full animate-ping"></div>
            <div className="absolute top-40 right-32 w-1 h-1 bg-white/40 dark:bg-gray-500/40 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-white/20 dark:bg-gray-400/20 rounded-full animate-ping delay-500"></div>
            <div className="absolute bottom-20 right-20 w-1 h-1 bg-white/50 dark:bg-gray-600/50 rounded-full animate-pulse delay-700"></div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12">
            <div className="max-w-md text-center space-y-8">
              {/* Success Message */}
              <div className="transition-all duration-500">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 dark:from-gray-900 dark:to-gray-700 bg-clip-text text-transparent">
                  Email Sent Successfully!
                </h1>
                <p className="text-lg text-white/90 dark:text-gray-700 mb-2">
                  Check your inbox for the reset link
                </p>
                <p className="text-sm text-white/70 dark:text-gray-600 italic">
                  You'll be back to your dashboard in no time
                </p>
              </div>

              {/* Enhanced Stats - Success themed */}
              <div className="flex justify-center gap-6 pt-6">
                <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                  <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">🔒</p>
                  <p className="text-xs text-white/80 dark:text-gray-600">Secure Reset</p>
                </div>
                <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                  <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">⚡</p>
                  <p className="text-xs text-white/80 dark:text-gray-600">Quick Process</p>
                </div>
                <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                  <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">📧</p>
                  <p className="text-xs text-white/80 dark:text-gray-600">Email Link</p>
                </div>
              </div>

              {/* Call to Action - Inverted Light/Dark Mode */}
              <div className="pt-8">
                <p className="text-sm text-white/60 dark:text-gray-500">
                  Secure password recovery you can trust
                </p>
              </div>
            </div>
          </div>

          <Image
            src="/bluto-auth.jpg"
            alt="Brand Illustration"
            fill
            className="object-cover object-center opacity-0"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-6 py-10 lg:px-20 bg-white dark:bg-gray-950 hide-scrollbar relative">
        {/* Back to Sign In Button */}
        <div className="absolute top-6 left-6">
          <Link href="/sign-in">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Forgot Password?</h2>
            <p className="text-muted-foreground">No worries! Enter your email and we'll send you a reset link</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-11 transition-all duration-200 hover:shadow-lg" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </form>
          </Form>

          <p className="text-sm text-center mt-6">
            Remember your password?{" "}
            <Link href="/sign-in" className="text-primary font-medium hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Enhanced Branding with Inverted Light/Dark Mode */}
      <div className="hidden md:block relative bg-black dark:bg-white text-white dark:text-black overflow-hidden hide-scrollbar">
        {/* Animated Background - Inverted Light and Dark Mode */}
        <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] dark:from-blue-50 dark:via-indigo-100 dark:to-purple-100 opacity-90" />
        <div className="absolute inset-0 bg-black/40 dark:bg-white/40" />
        
        {/* Floating Particles - Inverted for both modes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 dark:bg-gray-400/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-white/40 dark:bg-gray-500/40 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-white/20 dark:bg-gray-400/20 rounded-full animate-ping delay-500"></div>
          <div className="absolute bottom-20 right-20 w-1 h-1 bg-white/50 dark:bg-gray-600/50 rounded-full animate-pulse delay-700"></div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12">
          <div className="max-w-md text-center space-y-8">
            {/* Dynamic Message */}
            <div className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 dark:from-gray-900 dark:to-gray-700 bg-clip-text text-transparent">
                {currentMessage.title}
              </h1>
              <p className="text-lg text-white/90 dark:text-gray-700 mb-2">
                {currentMessage.subtitle}
              </p>
              <p className="text-sm text-white/70 dark:text-gray-600 italic">
                {currentMessage.highlight}
              </p>
            </div>

            {/* Enhanced Stats - Reset themed */}
            <div className="flex justify-center gap-6 pt-6">
              <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">🔒</p>
                <p className="text-xs text-white/80 dark:text-gray-600">Secure Reset</p>
              </div>
              <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">⚡</p>
                <p className="text-xs text-white/80 dark:text-gray-600">Instant Delivery</p>
              </div>
              <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">24/7</p>
                <p className="text-xs text-white/80 dark:text-gray-600">Always Available</p>
              </div>
            </div>

            {/* Progress Dots - Light/Dark Mode */}
            <div className="flex justify-center gap-2 pt-4">
              {brandMessages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentMessageIndex 
                      ? 'bg-white dark:bg-gray-900 w-8' 
                      : 'bg-white/40 dark:bg-gray-500 hover:bg-white/60 dark:hover:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Call to Action - Inverted Light/Dark Mode */}
            <div className="pt-8">
              <p className="text-sm text-white/60 dark:text-gray-500">
                Secure password recovery you can trust
              </p>
            </div>
          </div>
        </div>

        <Image
          src="/bluto-auth.jpg"
          alt="Brand Illustration"
          fill
          className="object-cover object-center opacity-0"
          priority
        />
      </div>
    </div>
  );
}