import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY not set in environment variables")
}

const genAI = new GoogleGenerativeAI(apiKey || "")

// Configurable model name
const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest"

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Please set GEMINI_API_KEY environment variable." },
        { status: 500 }
      )
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_CHAT_MODEL })

    const prompt = `
You are a medical assistant helping interpret blood test results. Answer based ONLY on the test data provided in the context.

${context || "No specific test data provided."}

USER QUESTION: ${message}

GUIDELINES:
1. Only discuss tests that appear in the context above
2. For abnormal values, explain what they might indicate without making definitive diagnoses
3. If asked about a test that isn't in the data, clearly state that information is not available
4. Use simple, patient-friendly language
5. Include relevant reference ranges when discussing specific tests
6. Always recommend consulting a healthcare professional for medical advice
7. Be concise but thorough

YOUR ANSWER:
`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    )
  }
}
