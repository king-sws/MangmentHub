'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SignInButtons from "@/components/SignInBotton";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignInWithCredentials } from "@/actions/action";

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

const brandMessages = [
  {
    title: "Welcome back to Blutto",
    subtitle: "Your all-in-one platform for productivity and collaboration.",
    highlight: "Streamline your workflow with powerful tools"
  },
  {
    title: "Power your productivity",
    subtitle: "Transform the way you work with intelligent automation.",
    highlight: "Built for teams that think big"
  },
  {
    title: "Collaborate without limits",  
    subtitle: "Connect, create, and achieve more together.",
    highlight: "Where great ideas come to life"
  },
  {
    title: "Scale your success",
    subtitle: "Enterprise-grade tools for growing businesses.",
    highlight: "Trusted by industry leaders worldwide"
  }
];

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
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

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await SignInWithCredentials(data.email, data.password);

      if (!result.success) {
        toast.error(result.error || "Authentication failed");
        return;
      }

      toast.success("Welcome back!");
      router.push(`/dashboard/${result.userId}`);
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMessage = brandMessages[currentMessageIndex];

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 ">
      {/* Left: Form */}
      <div className="flex flex-col justify-center px-6 py-10 lg:px-20 bg-white dark:bg-gray-950 hide-scrollbar relative">
        {/* Back to Landing Page Button */}
        <div className="absolute top-6 left-6">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
            <p className="text-muted-foreground">Welcome back! Please enter your credentials</p>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"} 
                          className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20" 
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

          <p className="text-sm text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary font-medium hover:underline transition-colors">
              Sign up
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

            {/* Enhanced Stats - Light/Dark Mode */}
            <div className="flex justify-center gap-6 pt-6">
              <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">100+</p>
                <p className="text-xs text-white/80 dark:text-gray-600">Productivity Tools</p>
              </div>
              <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">24/7</p>
                <p className="text-xs text-white/80 dark:text-gray-600">Support</p>
              </div>
              <div className="bg-white/10 dark:bg-gray-100/80 p-6 rounded-xl backdrop-blur-md text-center border border-white/20 dark:border-gray-200 hover:bg-white/15 dark:hover:bg-gray-200/80 transition-all duration-300 group">
                <p className="text-2xl font-bold group-hover:scale-110 transition-transform text-white dark:text-gray-900">20k+</p>
                <p className="text-xs text-white/80 dark:text-gray-600">Active Users</p>
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
                Join thousands of professionals who trust Blutto
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