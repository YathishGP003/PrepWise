import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Test user data (matches the user we created)
    const testUser = {
      id: "cmcozrl8l0000ygtdzq9wumd9",
      email: "test@example.com",
      name: "Test User",
      profileURL: "/user-avatar.png",
    };

    // Create JWT token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default-secret"
    );
    const token = await new SignJWT({
      userId: testUser.id,
      email: testUser.email,
      name: testUser.name,
      profileURL: testUser.profileURL,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // Set HTTP-only cookie
    cookies().set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: "Logged in as test user",
      user: testUser,
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      { success: false, error: "Test login failed" },
      { status: 500 }
    );
  }
}
