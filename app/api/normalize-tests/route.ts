import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY
const baseURL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"

const openai = new OpenAI({
  baseURL: baseURL,
  apiKey: apiKey || "",
  defaultHeaders: {
    "HTTP-Referer": "http://95.142.45.234",
    "X-Title": "BloodParser"
  }
})

// Use Gemini Flash for test name normalization (cheaper)
const MODEL = "google/gemini-2.5-flash"

export async function POST(request: NextRequest) {
  try {
    console.log("[normalize-tests] Received request")
    
    if (!apiKey) {
      console.error("[normalize-tests] API key not configured")
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      )
    }

    const { testNames } = await request.json()
    console.log("[normalize-tests] Received test names:", testNames)
    
    if (!Array.isArray(testNames) || testNames.length === 0) {
      return NextResponse.json(
        { error: "No test names provided" },
        { status: 400 }
      )
    }

    const prompt = `Посмотри на список параметров крови ниже.

Задача: найди разные наименования для одних и тех же параметров и собери их вместе под одним общим названием.

${testNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

Важно:
- Если параметры отличаются только аббревиатурой в скобках - это один и тот же параметр
- Используй русские названия для canonical name
- Все варианты одного параметра должны иметь ОДИНАКОВОЕ canonical name

Верни результат в формате JSON:
{
  "mappings": {
    "оригинальное_название_1": "Общее название",
    "оригинальное_название_2": "Общее название",
    ...
  }
}`

    console.log("[normalize-tests] Calling OpenRouter with model:", MODEL)
    
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1 // Low temperature for consistency
    })

    const responseText = completion.choices[0]?.message?.content || ""
    console.log("[normalize-tests] Raw response:", responseText.substring(0, 500))
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[normalize-tests] Could not parse JSON from response:", responseText)
      return NextResponse.json(
        { error: "Failed to normalize test names" },
        { status: 500 }
      )
    }

    const data = JSON.parse(jsonMatch[0])
    console.log("[normalize-tests] Parsed mappings:", data.mappings)
    
    return NextResponse.json({ mappings: data.mappings })
  } catch (error) {
    console.error("[normalize-tests] Error:", error)
    return NextResponse.json(
      { error: "Failed to normalize test names" },
      { status: 500 }
    )
  }
}
