import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { runGlmOcr } from "@/lib/glm-ocr"

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

// Configurable model names
const TEXT_MODEL = process.env.TEXT_MODEL || process.env.GEMINI_TEXT_MODEL || "google/gemini-2.5-flash"
const VISION_MODEL = process.env.VISION_MODEL || process.env.GEMINI_VISION_MODEL || "google/gemini-2.5-flash"

export const runtime = "nodejs"
export const maxDuration = 60

const extractionPromptBase = `
You are a specialized medical data extraction AI analyzing a blood report. Extract ALL blood test parameters.

IMPORTANT: Return all test names and categories in RUSSIAN language.

Extract in this exact JSON format:
{
  "tests": [
    {
      "test_name": "Гемоглобин",
      "value": "12.5",
      "unit": "г/дл",
      "normal_range": "12.0-15.0",
      "status": "Normal",
      "category": "Общий анализ крови"
    }
  ]
}

RULES:
1. "status" must be exactly "Normal", "High", or "Low" based on reference range comparison
2. "category" should be one of these RUSSIAN categories: "Общий анализ крови", "Метаболическая панель", "Липидный профиль", "Функция печени", "Функция почек", "Функция щитовидной железы", "Витамины и минералы", or "Другое"
3. "value" should be the numeric value as a string
4. "normal_range" should be in format "min-max" (e.g., "12.0-15.0")
5. "test_name" must be in RUSSIAN language (e.g., "Глюкоза", "Креатинин", "Тестостерон")
6. "unit" should be in standard format (keep units as they appear: г/дл, ммоль/л, Ед/л, etc.)

DO NOT INCLUDE administrative data (patient info, dates, addresses).
EXTRACT every medical test parameter present.
Return ONLY valid JSON, no markdown or explanation.
TRANSLATE all test names to Russian before returning.
`

function buildTextExtractionPrompt(ocrMarkdown: string): string {
  return `${extractionPromptBase}

Here is the OCR text content of the blood test report between the markers. Note: The content may include HTML tags (like <table>, <div>, etc.) for layout formatting - extract the actual test data from these structures.

<REPORT>
${ocrMarkdown}
</REPORT>
`
}

function extractTestsFromResponse(raw: string) {
  let jsonMatch = raw.match(/\{[\s\S]*\}/)

  // Try to extract JSON from markdown code block if direct match fails
  if (!jsonMatch) {
    const codeBlockMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (codeBlockMatch) {
      jsonMatch = [codeBlockMatch[1]]
    }
  }

  if (!jsonMatch) {
    console.error("[analyze] Could not parse JSON from response:", raw)
    throw new Error(
      "Could not parse blood test data from the report. Please ensure the report is clear and contains blood test results.",
    )
  }

  const data = JSON.parse(jsonMatch[0])
  const tests = data.tests || []

  console.log("[analyze] Successfully parsed", tests.length, "test results")

  if (tests.length === 0) {
    throw new Error(
      "No blood test results found in the uploaded file. Please upload a clear image of a blood test report.",
    )
  }

  return tests
}

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Please set OPENROUTER_API_KEY environment variable." },
        { status: 500 },
      )
    }

    console.log("[analyze] Starting file analysis")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const ocrEnabledRaw = formData.get("ocrEnabled")
    const passphraseRaw = formData.get("passphrase")

    const ocrEnabled = typeof ocrEnabledRaw === "string" && ocrEnabledRaw === "true"
    const passphrase = typeof passphraseRaw === "string" ? passphraseRaw : ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[analyze] File received:", file.name, file.type, file.size, "bytes")

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 413 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    console.log("[analyze] File converted to base64")

    let tests: any[] = []

    if (ocrEnabled && passphrase) {
      console.log("[analyze] OCR mode requested")

      const secret = process.env.OCR_PASSPHRASE
      if (!secret) {
        console.warn("[analyze] OCR_PASSPHRASE not set; cannot use OCR mode")
        return NextResponse.json(
          { error: "OCR mode is not configured on the server." },
          { status: 500 },
        )
      }

      if (passphrase !== secret) {
        return NextResponse.json({ error: "Invalid OCR passphrase" }, { status: 403 })
      }

      // 1) Run OCR via GLM-OCR
      const { markdown } = await runGlmOcr({ base64, mimeType: file.type })
      console.log("[analyze] OCR completed, length:", markdown.length)

      // 2) Use text model to extract structured JSON from OCR markdown
      const prompt = buildTextExtractionPrompt(markdown)
      const completion = await openai.chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      })
      
      const responseText = completion.choices[0]?.message?.content || ""
      console.log("[analyze] Text model response received:", responseText.substring(0, 200))

      tests = extractTestsFromResponse(responseText)
    } else {
      console.log("[analyze] Using default vision pipeline")

      // Use vision model to extract blood test data directly from the image
      const completion = await openai.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: extractionPromptBase,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64}`,
                },
              },
            ],
          },
        ],
      })

      const responseText = completion.choices[0]?.message?.content || ""
      console.log("[analyze] Vision model response received:", responseText.substring(0, 200))

      tests = extractTestsFromResponse(responseText)
    }

    // Calculate summary
    const summary = {
      total: tests.length,
      normal: tests.filter((r: any) => r.status === "Normal").length,
      abnormal: tests.filter((r: any) => r.status !== "Normal").length,
    }

    return NextResponse.json({ tests, summary })
  } catch (error) {
    console.error("[analyze] Error analyzing file:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to analyze file"
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}
