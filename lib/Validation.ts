import { z } from "zod"

export const signUpSchema = z.object({
    name: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
  }
  );
  
  export const signInSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Please enter your password"),
  });

  export const linkAccountSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    provider: z.enum(["google", "github"]),
  });
  
  export const oauthCallbackSchema = z.object({
    code: z.string(),
    state: z.string().optional(),
  });
  
  export type LinkAccountFormValues = z.infer<typeof linkAccountSchema>;
  export type OAuthCallbackValues = z.infer<typeof oauthCallbackSchema>;