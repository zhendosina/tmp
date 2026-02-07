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

// Use Sonnet 4.5 for test name normalization
const MODEL = "anthropic/claude-sonnet-4.5"

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

    const prompt = `You are a medical data normalization expert. Your task is to analyze a list of blood test parameter names and group similar tests together by assigning them canonical (standard) names.

Input test names (in Russian and possibly English):
${testNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

Rules:
1. Different variations of the same test should get the SAME canonical name
2. Examples of variations to group together:
   - "Глюкоза", "Глюкоза в крови", "Glucose", "Глюкоза (венозная кровь)" → "Глюкоза"
   - "Холестерин", "Холестерин общий", "Общий холестерин", "Cholesterol" → "Холестерин общий"
   - "ЛДЛ", "ЛПНП", "Холестерин ЛПНП", "LDL-cholesterol" → "ЛПНП (LDL)"
   - "ЛПВП", "HDL", "Холестерин ЛПВП" → "ЛПВП (HDL)"
   - "ТТГ", "TSH", "Тиреотропный гормон" → "ТТГ"
   - "Креатинин", "Creatinine", "Креатинин в сыворотке" → "Креатинин"
   - "АЛТ", "ALT", "Аланинаминотрансфераза" → "АЛТ"
   - "АСТ", "AST", "Аспартатаминотрансфераза" → "АСТ"
   - "Лейкоциты", "WBC", "White Blood Cells", "Лейкоцитарная формула" → "Лейкоциты (WBC)"
   - "Эритроциты", "RBC", "Red Blood Cells" → "Эритроциты (RBC)"
   - "Гемоглобин", "Hemoglobin", "HGB" → "Гемоглобин"
   - "Тромбоциты", "PLT", "Platelets" → "Тромбоциты (PLT)"
   - "СРБ", "CRP", "C-реактивный белок" → "С-реактивный белок"

3. Return a JSON object with mappings from original names to canonical names
4. Use Russian language for canonical names, optionally adding English abbreviations in parentheses
5. Keep the same level of specificity (don't merge unrelated tests like "общий белок" and "альбумин")
6. CRITICAL: ALL similar tests must have the EXACT SAME canonical name

Return ONLY this JSON format:
{
  "mappings": {
    "original_name_1": "Canonical Name",
    "original_name_2": "Canonical Name",
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
