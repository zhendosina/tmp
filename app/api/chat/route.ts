import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY
const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"

if (!apiKey) {
  console.warn("Warning: OPENROUTER_API_KEY or GEMINI_API_KEY not set in environment variables")
}

const openai = new OpenAI({
  baseURL: baseURL,
  apiKey: apiKey || "",
  defaultHeaders: {
    "HTTP-Referer": "http://95.142.45.234",
    "X-Title": "BloodParser"
  }
})

// Configurable model name
const CHAT_MODEL = process.env.CHAT_MODEL || process.env.GEMINI_CHAT_MODEL || "google/gemini-2.5-flash"

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Please set OPENROUTER_API_KEY environment variable." },
        { status: 500 }
      )
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

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

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const response = completion.choices[0]?.message?.content || "No response generated"

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    )
  }
}
