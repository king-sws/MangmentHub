"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  AlertCircle,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";

// Define the User type
type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string;
  role: string;
  createdAt?: string;
  lastLogin?: string;
};

// Enhanced schema with better validation
const formSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: "Password must be at least 8 characters long",
    })
    .refine((val) => !val || /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => !val || /[a-z]/.test(val), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((val) => !val || /[0-9]/.test(val), {
      message: "Password must contain at least one number",
    }),
  confirmPassword: z.string().optional(),
  image: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      image: "",
    },
  });

  // Watch form values for changes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formValues = watch();
  const imageValue = watch("image");
  const passwordValue = watch("password");

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);
        
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("Failed to fetch user data");
        
        const userData = await res.json();
        setUser(userData);
        
        reset({
          name: userData.name || "",
          email: userData.email || "",
          password: "",
          confirmPassword: "",
          image: userData.image || "",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUser();
  }, [reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Validate password fields if password is being changed
      if (data.password) {
        await trigger(["password", "confirmPassword"]);
      }
      
      const formData = new FormData();
      
      if (data.name) formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.password) formData.append("password", data.password);
      if (data.image) formData.append("image", data.image);
      
      const response = await fetch("/api/user/update", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
        if (result.fieldErrors) {
          console.error("Field errors:", result.fieldErrors);
        }
      } else {
        toast.success("Profile updated successfully!");
        
        // Clear password fields
        setValue("password", "");
        setValue("confirmPassword", "");
        
        // Update local state
        if (user) {
          setUser({
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
            image: data.image || user.image,
          });
        }
        
        router.refresh();
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-red-800 dark:text-red-400 font-medium">Error loading profile</p>
            <p className="text-red-600 dark:text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button 
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) return null;

  const isCredentialUser = user.provider === "credentials";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Profile Picture Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.image ? (
                <img src={user.image} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5">
              <Camera className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Profile Picture
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a photo to personalize your account
            </p>
          </div>
        </div>
        
        <ImageUpload
          value={imageValue || ""}
          onChange={(value) => {
            setValue("image", value, { shouldDirty: true }); // ✅ Add shouldDirty: true
          }}
          disabled={isSubmitting}
        />
      </div>

      {/* Personal Information */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Personal Information
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                {...register("name")}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors"
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                {...register("email")}
                disabled={!isCredentialUser || isSubmitting}
                className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors ${
                  !isCredentialUser 
                    ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" 
                    : "bg-white dark:bg-gray-700"
                }`}
                placeholder="Enter your email address"
              />
            </div>
            {!isCredentialUser && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Email is managed by your {user.provider} account and cannot be changed here.
                  </p>
                </div>
              </div>
            )}
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Security Section - Only for credential users */}
      {isCredentialUser && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Security
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-12 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordValue && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Password strength:</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => {
                      const strength = getPasswordStrength(passwordValue);
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= strength
                              ? strength <= 1
                                ? "bg-red-400"
                                : strength <= 2
                                ? "bg-yellow-400"
                                : strength <= 3
                                ? "bg-blue-400"
                                : "bg-green-400"
                              : "bg-gray-200 dark:bg-gray-600"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to keep your current password
              </p>
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-sm flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  disabled={isSubmitting || !passwordValue}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-12 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={!passwordValue}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-sm flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.confirmPassword.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Account Information
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Account Type:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100 capitalize">
                {user.provider === "credentials" ? "Email & Password" : user.provider}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Role:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100 capitalize">
                {user.role}
              </span>
            </div>
            {user.createdAt && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Member since:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.lastLogin && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last login:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {new Date(user.lastLogin).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-amber-800 dark:text-amber-400 font-medium">Unsaved Changes</p>
              <p className="text-amber-600 dark:text-amber-500 text-sm">
                You have unsaved changes. Don&#39;t forget to save your updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={isSubmitting || !hasUnsavedChanges}
          className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isSubmitting || !hasUnsavedChanges
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={() => {
            reset();
            setHasUnsavedChanges(false);
          }}
          disabled={isSubmitting || !hasUnsavedChanges}
          className={`px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-colors ${
            isSubmitting || !hasUnsavedChanges
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          Reset Changes
        </button>
      </div>
    </form>
  );
}

// Helper function to calculate password strength
function getPasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
}