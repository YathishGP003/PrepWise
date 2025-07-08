"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedbackData = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
    };

    let feedback;

    if (feedbackId) {
      // Update existing feedback
      feedback = await prisma.feedback.update({
        where: { id: feedbackId },
        data: feedbackData,
      });
    } else {
      // Create new feedback
      feedback = await prisma.feedback.create({
        data: feedbackData,
      });
    }

    return { success: true, feedbackId: feedback.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id },
    });

    return interview as Interview | null;
  } catch (error) {
    console.error("Error getting interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  try {
    const feedback = await prisma.feedback.findUnique({
      where: {
        interviewId_userId: {
          interviewId,
          userId,
        },
      },
    });

    if (!feedback) return null;

    return {
      ...feedback,
      categoryScores: feedback.categoryScores as any,
      createdAt: feedback.createdAt.toISOString(),
    } as Feedback;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  try {
    const interviews = await prisma.interview.findMany({
      where: {
        finalized: true,
        userId: {
          not: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return interviews.map((interview) => ({
      ...interview,
      createdAt: interview.createdAt.toISOString(),
    })) as Interview[];
  } catch (error) {
    console.error("Error getting latest interviews:", error);
    return null;
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  try {
    const interviews = await prisma.interview.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return interviews.map((interview) => ({
      ...interview,
      createdAt: interview.createdAt.toISOString(),
    })) as Interview[];
  } catch (error) {
    console.error("Error getting user interviews:", error);
    return null;
  }
}
