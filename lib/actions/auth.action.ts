"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  SESSION_DURATION,
} from "@/lib/auth";

// Set session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  // Set cookie in the browser
  cookieStore.set("session", token, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { name, email, password } = params;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    // For compatibility, we'll use email and password from the idToken
    // In the real implementation, you'd need to modify the AuthForm to send password
    // For now, we'll assume idToken contains the password
    const password = idToken; // This should be the actual password

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid credentials. Please try again.",
      };
    }

    // Create JWT token
    const token = await createToken(user.id);
    await setSessionCookie(token);

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error: any) {
    console.error("Error signing in:", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const payload = await verifyToken(sessionCookie);
    if (!payload) return null;

    // Get user info from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileURL: true,
      },
    });

    if (!user) return null;

    return user as User;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
