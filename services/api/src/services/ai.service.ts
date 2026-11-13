import { generateAIServiceToken } from "../utils/ai-service-token.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL


if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL is not configured");
  }
  
  interface AskAIInput {
    question: string;
    userId: string;
    organizationId: string;
  }

export const askAI= async({
    question,
  userId,
  organizationId,
}: AskAIInput) =>{
    const internalToken = generateAIServiceToken({
        userId,
        organizationId
    })

    const response = await fetch(`${AI_SERVICE_URL}/ask`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${internalToken}`,
        },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(90000),
    })

  if (!response.ok) {
    throw new Error(`AI service returned status ${response.status}`);
  }

  return response.json();
}