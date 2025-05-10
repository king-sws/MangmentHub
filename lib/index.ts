import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({
    message: 'Email is required',
  }),
  password: z.string().min(1, 'Password is required'),
});
export const RegisiterSchema = z.object({
  email: z.string().email({
    message: 'Email is required',
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long"
  }),
  name: z.string().min(1, {
    message: "Name is required"
  }),
});