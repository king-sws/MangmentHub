
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { useRouter } from "next/navigation";

// Define the User type
type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string;
  role: string;
};

// Define the schema for form validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.string().length(0)),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      image: "",
    },
  });

  // Watch the image value
  const imageValue = watch("image");

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get user from the server
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("Failed to fetch user data");
        
        const userData = await res.json();
        setUser(userData);
        
        // Reset form with user data
        reset({
          name: userData.name || "",
          email: userData.email || "",
          password: "",
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
      
      // Create FormData to handle image upload
      const formData = new FormData();
      
      // Add form fields to FormData
      if (data.name) formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.password) formData.append("password", data.password);
      if (data.image) formData.append("image", data.image);
      
      // Call the server endpoint directly
      const response = await fetch("/api/user/update", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
        
        // Display field-specific errors if available
        if (result.fieldErrors) {
          console.error("Field errors:", result.fieldErrors);
        }
      } else {
        toast.success("Settings updated successfully!");
        // Clear password field after successful update
        setValue("password", "");
        
        // Update local state with the new data
        if (user) {
          setUser({
            ...user,
            name: data.name || user.name,
            email: data.email || user.email,
            image: data.image || user.image,
          });
        }
        
        // Refresh server components to reflect changes
        router.refresh();
        
        // Update session data in localStorage for immediate UI updates
        // This is a common pattern to sync state without a full page reload
        if (window.localStorage) {
          const sessionData = window.localStorage.getItem("session");
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session.user) {
                session.user.name = data.name || session.user.name;
                session.user.image = data.image || session.user.image;
                window.localStorage.setItem("session", JSON.stringify(session));
              }
            } catch (e) {
              console.error("Error updating session data:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4 sm:p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          className="mt-2 text-sm text-red-700 dark:text-red-400 underline hover:opacity-80"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) return null;

  // Check if user is using social login or credentials
  const isCredentialUser = user.provider === "credentials";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Image</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a profile picture to personalize your account.
        </p>
        
        <ImageUpload
          value={imageValue || ""}
          onChange={(value) => setValue("image", value)}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 sm:text-sm"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          disabled={!isCredentialUser || isSubmitting}
          className={`mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
            !isCredentialUser ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}
        />
        {!isCredentialUser && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Email cannot be changed for accounts using social login.
          </p>
        )}
        {errors.email && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {isCredentialUser && (
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 sm:text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Leave blank to keep your current password.
          </p>
          {errors.password && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 transition-colors ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}