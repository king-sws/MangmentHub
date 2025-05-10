import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google"
import Github from "next-auth/providers/github"
import { prisma } from "@/lib/prisma";
import { signInSchema } from "./lib/Validation";

const prismaAdapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  adapter: prismaAdapter,
  providers: [
    Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
        
        Github({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedFields = signInSchema.safeParse(credentials);
          if (!validatedFields.success) throw new Error("Invalid fields");
         
          const { email, password } = validatedFields.data;
         
          const user = await prisma.user.findUnique({
            where: { email },
            select: { 
              id: true, 
              password: true, 
              name: true,
              emailVerified: true,
              image: true,
              role: true // Add role to selection
            },
          });
          
          if (!user) throw new Error("User not found");
          if (!user.password) throw new Error("No password set");
          
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) throw new Error("Invalid password");
          
          return { 
            id: user.id, 
            email, 
            name: user.name, 
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role // Include role in returned user object
          };
        } catch (error) {
          console.error("Authorization Error:", error);
          return null;
        }
      },
    }),
  ],
  // auth.ts
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.role = token.role as string;
        session.user.email = token.email ?? ""; // Add email for safety
        session.user.image = token.picture ?? null; // Use token.picture and provide fallback
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.emailVerified = user.emailVerified;
        token.role = user.role;
        token.picture = user.image; // Store user.image in token.picture
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  secret: process.env.AUTH_SECRET,
});