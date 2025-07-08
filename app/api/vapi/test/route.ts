export async function POST(request: Request) {
  try {
    console.log("=== VAPI Test Endpoint Called ===");
    const body = await request.json();
    console.log("Test request body:", body);

    // Simple success response
    return Response.json({
      success: true,
      message: "Test endpoint working",
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return Response.json(
      {
        success: false,
        error: "Test endpoint failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: "VAPI test endpoint is working",
  });
}
