import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null; // Add this line
    emailVerified?: Date | null;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null; // Add this line
      emailVerified?: Date | null;
      role?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    name?: string | null;
    emailVerified?: Date | null;
    role?: string;
    picture?: string | null; // Add this line since you're using picture in the token
  }
}

