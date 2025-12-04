import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY not set in environment variables")
}

const genAI = new GoogleGenerativeAI(apiKey || "")

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Please set GEMINI_API_KEY environment variable." },
        { status: 500 }
      )
    }

    console.log("[analyze] Starting file analysis")

    const formData = await request.formData()
    const file = formData.get("file") as File

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

    console.log("[analyze] File converted to base64, calling Gemini API")

    // Use Gemini Vision to extract blood test data
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    const prompt = `
You are a specialized medical data extraction AI analyzing a blood report. Extract ALL blood test parameters.

Extract in this exact JSON format:
{
  "tests": [
    {
      "test_name": "Hemoglobin",
      "value": "12.5",
      "unit": "g/dL",
      "normal_range": "12.0-15.0",
      "status": "Normal",
      "category": "Complete Blood Count"
    }
  ]
}

RULES:
1. "status" must be exactly "Normal", "High", or "Low" based on reference range comparison
2. "category" should be one of: "Complete Blood Count", "Metabolic Panel", "Lipid Profile", "Liver Function", "Kidney Function", "Thyroid Function", "Vitamins & Minerals", or "Other"
3. "value" should be the numeric value as a string
4. "normal_range" should be in format "min-max" (e.g., "12.0-15.0")

DO NOT INCLUDE administrative data (patient info, dates, addresses).
EXTRACT every medical test parameter present.
Return ONLY valid JSON, no markdown or explanation.
`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      },
    ])

    const response = result.response.text()
    console.log("[analyze] Gemini response received:", response.substring(0, 200))

    let jsonMatch = response.match(/\{[\s\S]*\}/)

    // Try to extract JSON from markdown code block if direct match fails
    if (!jsonMatch) {
      const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]]
      }
    }

    if (!jsonMatch) {
      console.error("[analyze] Could not parse JSON from response:", response)
      throw new Error("Could not parse blood test data from the image. Please ensure the image is clear and contains blood test results.")
    }

    const data = JSON.parse(jsonMatch[0])
    const tests = data.tests || []
    
    console.log("[analyze] Successfully parsed", tests.length, "test results")

    if (tests.length === 0) {
      return NextResponse.json(
        { error: "No blood test results found in the uploaded file. Please upload a clear image of a blood test report." },
        { status: 400 }
      )
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
