import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { prisma } from "@/lib/prisma";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log("Generating interview:", {
      role: requestBody.role,
      type: requestBody.type,
      level: requestBody.level,
    });

    const { type, role, level, techstack, amount, userid } = requestBody;

    // Validate required fields
    if (!type || !role || !level || !techstack || !amount || !userid) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount is a number
    const questionAmount = parseInt(amount);
    if (isNaN(questionAmount) || questionAmount <= 0 || questionAmount > 20) {
      return Response.json(
        { success: false, error: "Invalid amount of questions" },
        { status: 400 }
      );
    }

    console.log("Generating questions for:", {
      type,
      role,
      level,
      techstack,
      amount: questionAmount,
      userid,
    });

    const { text: questionsText } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Generate ${questionAmount} interview questions for a ${role} position.
        Experience level: ${level}
        Tech stack: ${techstack}
        Focus: ${type}
        
        IMPORTANT: Return ONLY a valid JSON array of strings. No additional text, no markdown, no explanations.
        Format: ["Question 1", "Question 2", "Question 3"]
        
        Questions should be clear, professional, and avoid special characters that might break voice assistants.
        Do not use /, *, or other special characters.
        
        Example format:
        ["Tell me about your experience with React", "How do you handle state management in large applications", "Describe a challenging project you worked on"]
      `,
    });

    console.log("Raw AI response:", questionsText);

    // Clean and validate the response
    let questions: string[] = [];
    try {
      // Remove any markdown formatting or extra text
      const cleanedText = questionsText.trim();

      // Try to find JSON array in the response
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsedQuestions = JSON.parse(jsonStr);

        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          questions = parsedQuestions.filter(
            (q) => typeof q === "string" && q.trim().length > 0
          );
        }
      }

      // If parsing failed or no valid questions, create fallback questions
      if (questions.length === 0) {
        console.warn("Failed to parse AI response, using fallback questions");
        questions = [
          `Tell me about your experience with ${role} development`,
          `How do you approach problem-solving in ${role} projects?`,
          `Describe a challenging ${role} project you've worked on recently`,
          `What interests you most about ${role} development?`,
          `How do you stay updated with the latest ${role} technologies?`,
        ].slice(0, questionAmount);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback questions if parsing completely fails
      questions = [
        `Tell me about your experience as a ${role}`,
        `How do you approach problem-solving in your work?`,
        `Describe a challenging project you've worked on recently`,
        `What interests you most about this role?`,
        `How do you stay updated with industry trends?`,
      ].slice(0, questionAmount);
    }

    console.log("Final questions:", questions);

    // Validate techstack and convert to array
    let techstackArray: string[] = [];
    if (typeof techstack === "string") {
      techstackArray = techstack
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);
    } else if (Array.isArray(techstack)) {
      techstackArray = techstack
        .map((tech) => String(tech).trim())
        .filter((tech) => tech.length > 0);
    }

    // Create interview record
    const interview = await prisma.interview.create({
      data: {
        role: role.trim(),
        type: type.trim(),
        level: level.trim(),
        techstack: techstackArray,
        questions: questions,
        userId: userid,
        finalized: true,
        coverImage: getRandomInterviewCover(),
      },
    });

    console.log("Interview created successfully:", interview.id);

    // Return response in VAPI-friendly format
    return Response.json(
      {
        success: true,
        interviewId: interview.id,
        message: `Interview created successfully! Your ${role} interview with ${questions.length} questions is ready.`,
        status: "completed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in generate route:", error);

    // Return a more specific error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      {
        success: false,
        error: "Failed to generate interview",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      success: true,
      data: "Interview generation API is working",
    },
    { status: 200 }
  );
}
