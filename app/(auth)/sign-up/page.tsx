/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';
import { z } from "zod";
import { RegisiterSchema } from "@/lib";
import { SignUpWithCredentials } from "@/actions/action";
import SignInButtons from "@/components/SignInBotton";
import Image from 'next/image';

const welcomeMessages = [
  {
    title: "Welcome to Your Future",
    subtitle: "Build smarter, faster and beautifully — just like we do.",
    highlight: "Where innovation meets simplicity"
  },
  {
    title: "Start Your Journey",
    subtitle: "Join thousands of creators building the next big thing.",
    highlight: "Your ideas deserve the best tools"
  },
  {
    title: "Unlock Your Potential",
    subtitle: "Transform your workflow with intelligent automation.",
    highlight: "Built for dreamers and doers"
  },
  {
    title: "Create Without Limits",
    subtitle: "Everything you need to bring your vision to life.",
    highlight: "Where creativity has no boundaries"
  }
];

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  const form = useForm<z.infer<typeof RegisiterSchema>>({
    resolver: zodResolver(RegisiterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Rotating messages effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    });
  };

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

  const currentMessage = welcomeMessages[currentMessageIndex];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left: Enhanced Branding with Inverted Light/Dark Mode */}
      <div className="hidden md:flex w-full md:w-1/2 items-center justify-center relative overflow-hidden bg-black dark:bg-white text-white dark:text-black p-8">
        {/* Animated Background - Inverted */}
        <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] dark:from-blue-50 dark:via-indigo-100 dark:to-purple-100 opacity-80" />
        <div className="absolute inset-0 bg-black/60 dark:bg-white/60" />
        
        {/* Floating Particles - Inverted */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-2 h-2 bg-white/30 dark:bg-gray-400/30 rounded-full animate-ping"></div>
          <div className="absolute top-32 right-24 w-1 h-1 bg-white/40 dark:bg-gray-500/40 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-24 left-12 w-1.5 h-1.5 bg-white/20 dark:bg-gray-400/20 rounded-full animate-ping delay-500"></div>
          <div className="absolute bottom-16 right-16 w-1 h-1 bg-white/50 dark:bg-gray-600/50 rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-8 w-1 h-1 bg-white/30 dark:bg-gray-400/30 rounded-full animate-ping delay-300"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md space-y-8">
          {/* Dynamic Message */}
          <div className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4 bg-gradient-to-r from-white to-gray-300 dark:from-gray-900 dark:to-gray-700 bg-clip-text text-transparent">
              {currentMessage.title}
            </h1>
            <p className="text-lg text-white/90 dark:text-gray-700 mb-2">
              {currentMessage.subtitle}
            </p>
            <p className="text-sm text-white/70 dark:text-gray-600 italic">
              {currentMessage.highlight}
            </p>
          </div>

          {/* Features Showcase - Inverted */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="bg-white/10 dark:bg-gray-100/80 p-4 rounded-lg backdrop-blur-md border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-xs text-white/80 dark:text-gray-600">Fast Setup</p>
            </div>
            <div className="bg-white/10 dark:bg-gray-100/80 p-4 rounded-lg backdrop-blur-md border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-xs text-white/80 dark:text-gray-600">Secure by Default</p>
            </div>
            <div className="bg-white/10 dark:bg-gray-100/80 p-4 rounded-lg backdrop-blur-md border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-xs text-white/80 dark:text-gray-600">Lightning Fast</p>
            </div>
            <div className="bg-white/10 dark:bg-gray-100/80 p-4 rounded-lg backdrop-blur-md border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-xs text-white/80 dark:text-gray-600">Built for You</p>
            </div>
          </div>

          {/* Progress Dots - Inverted */}
          <div className="flex justify-center gap-2 pt-4">
            {welcomeMessages.map((_, index) => (
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

          {/* Call to Action - Inverted */}
          <div className="pt-4">
            <p className="text-sm text-white/60 dark:text-gray-500">
              Join the community of innovators
            </p>
          </div>
        </div>
      </div>

      {/* Right: Enhanced Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 relative">
        
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
            <p className="text-muted-foreground">Get started with your new account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="John Doe" 
                        className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"} 
                          className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          onChange={(e) => {
                            field.onChange(e);
                            checkPasswordStrength(e.target.value);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    
                    {/* Password Strength Indicator */}
                    {field.value && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.length ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <Circle className="h-3 w-3 text-gray-400" />
                          }
                          <span className={passwordStrength.length ? "text-green-600" : "text-gray-500"}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.uppercase ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <Circle className="h-3 w-3 text-gray-400" />
                          }
                          <span className={passwordStrength.uppercase ? "text-green-600" : "text-gray-500"}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.number ? 
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                            <Circle className="h-3 w-3 text-gray-400" />
                          }
                          <span className={passwordStrength.number ? "text-green-600" : "text-gray-500"}>
                            One number
                          </span>
                        </div>
                      </div>
                    )}
                    
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
                Create Account
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

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline transition-colors">
              Sign in
            </Link>
          </p>

          {/* Terms and Privacy */}
          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}