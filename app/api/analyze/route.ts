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
You are a specialized medical data extraction AI analyzing a blood report. Extract ALL blood test parameters AND patient information.

IMPORTANT: Return all test names and categories in RUSSIAN language.

Extract in this exact JSON format:
{
  "patient_info": {
    "name": "Patient Name or null if not found",
    "age": "Age in years or null if not found",
    "gender": "Male/Female or null if not found",
    "date": "Test date in format DD.MM.YYYY or null if not found"
  },
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
7. Extract patient_info from the report header: look for name, age/возраст, gender/пол, date/дата исследования
   - For DATE: Look for patterns like "Дата:", "Date:", "Дата исследования:", "Дата взятия:", "Дата анализа:" or similar. Date format can be DD.MM.YYYY, DD/MM/YYYY, or DD-MM-YYYY. Also look for dates in format "06.02.2026" or "27 января 2026" or "06 фев 2026". Convert any date format to DD.MM.YYYY.
   - If date is found in format "06 февраля 2026" or "06 фев 2026", convert month name to number (февраль/фев -> 02) and return as "06.02.2026"
8. If any patient_info field is not found in the report, use null for that field

EXTRACT every medical test parameter present AND all available patient information.
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

// Extract date from OCR text as fallback
function extractDateFromText(text: string): string | null {
  // Pattern 1: DD.MM.YYYY or DD.MM.YY
  const pattern1 = /(?:Дата[\s:]*|Date[\s:]*)(\d{2})[.-](\d{2})[.-](\d{2,4})/i
  const match1 = text.match(pattern1)
  if (match1) {
    const year = match1[3].length === 2 ? `20${match1[3]}` : match1[3]
    return `${match1[1]}.${match1[2]}.${year}`
  }

  // Pattern 2: Just date in format DD.MM.YYYY anywhere in text
  const pattern2 = /(\d{2})\.(\d{2})\.(\d{4})/
  const match2 = text.match(pattern2)
  if (match2) {
    return `${match2[1]}.${match2[2]}.${match2[3]}`
  }

  // Pattern 3: Russian date format "6 февраля 2026" or "06 фев 2026"
  const months: Record<string, string> = {
    'янв': '01', 'фев': '02', 'мар': '03', 'апр': '04', 'май': '05', 'мая': '05',
    'июн': '06', 'июл': '07', 'авг': '08', 'сен': '09', 'окт': '10', 'ноя': '11', 'дек': '12',
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05',
    'июня': '06', 'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10',
    'ноября': '11', 'декабря': '12'
  }
  const pattern3 = /(\d{1,2})\s+([а-я]+)\s+(\d{4})/i
  const match3 = text.match(pattern3)
  if (match3) {
    const monthName = match3[2].toLowerCase()
    const month = months[monthName]
    if (month) {
      const day = match3[1].padStart(2, '0')
      return `${day}.${month}.${match3[3]}`
    }
  }

  return null
}

function extractDataFromResponse(raw: string, ocrText?: string): { tests: any[], patient_info?: any } {
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
  let patient_info = data.patient_info || null

  // If date is missing but we have OCR text, try to extract date from it
  if (patient_info && !patient_info.date && ocrText) {
    const extractedDate = extractDateFromText(ocrText)
    if (extractedDate) {
      console.log("[analyze] Extracted date from OCR text:", extractedDate)
      patient_info.date = extractedDate
    }
  }

  console.log("[analyze] Successfully parsed", tests.length, "test results")
  if (patient_info) {
    console.log("[analyze] Patient info extracted:", patient_info)
  }

  if (tests.length === 0) {
    throw new Error(
      "No blood test results found in the uploaded file. Please upload a clear image of a blood test report.",
    )
  }

  return { tests, patient_info }
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
    let patient_info: any = null

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

      const extracted = extractDataFromResponse(responseText, markdown)
      tests = extracted.tests
      patient_info = extracted.patient_info
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

      const extracted = extractDataFromResponse(responseText)
      tests = extracted.tests
      patient_info = extracted.patient_info
    }

    // Calculate summary
    const summary = {
      total: tests.length,
      normal: tests.filter((r: any) => r.status === "Normal").length,
      abnormal: tests.filter((r: any) => r.status !== "Normal").length,
    }

    return NextResponse.json({ tests, summary, patient_info })
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
