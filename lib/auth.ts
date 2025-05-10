import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getUserFromToken(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) return null;
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}