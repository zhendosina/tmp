import "server-only"

const ZAI_API_KEY = process.env.ZAI_API_KEY

if (!ZAI_API_KEY) {
  console.warn(
    "[glm-ocr] Warning: ZAI_API_KEY not set. GLM-OCR pipeline will fail until it is configured.",
  )
}

const ZAI_LAYOUT_PARSING_URL = "https://api.z.ai/api/paas/v4/layout_parsing"
const ZAI_MODEL_NAME = "glm-ocr"

interface GlmOcrParams {
  base64: string
  mimeType: string
}

export interface GlmOcrResult {
  markdown: string
}

async function makeOcrRequest(filePayload: string, retryCount = 0): Promise<Response> {
  const MAX_RETRIES = 3
  const RETRY_DELAYS = [1000, 2000, 4000] // Exponential backoff in ms

  try {
    const response = await fetch(ZAI_LAYOUT_PARSING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ZAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: ZAI_MODEL_NAME,
        file: filePayload,
      }),
    })

    // Retry on 500 errors (server errors) or 429 (rate limit)
    if (!response.ok && (response.status === 500 || response.status === 429) && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      console.warn(
        `[glm-ocr] Request failed with ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
      return makeOcrRequest(filePayload, retryCount + 1)
    }

    return response
  } catch (error) {
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      console.warn(
        `[glm-ocr] Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error instanceof Error ? error.message : String(error),
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
      return makeOcrRequest(filePayload, retryCount + 1)
    }
    throw error
  }
}

export async function runGlmOcr({ base64, mimeType }: GlmOcrParams): Promise<GlmOcrResult> {
  if (!ZAI_API_KEY) {
    throw new Error("GLM-OCR is not configured. Please set ZAI_API_KEY on the server.")
  }

  const filePayload = `data:${mimeType};base64,${base64}`

  const response = await makeOcrRequest(filePayload)

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    let errorMessage = "Failed to run OCR on the document."
    
    try {
      const errorData = JSON.parse(text)
      if (errorData.error?.message) {
        errorMessage = `OCR service error: ${errorData.error.message}`
      }
    } catch {
      // Use default message
    }
    
    console.error(
      "[glm-ocr] Z.ai layout_parsing request failed after retries:",
      response.status,
      response.statusText,
      text.slice(0, 300),
    )
    
    if (response.status === 500) {
      errorMessage += " This appears to be a temporary server issue. Please try again in a moment."
    }
    
    throw new Error(errorMessage)
  }

  const data = (await response.json()) as {
    md_results?: string
  }

  const markdown = data.md_results?.trim()

  if (!markdown) {
    console.error("[glm-ocr] Missing md_results in response:", data)
    throw new Error("OCR did not return any text. Please ensure the report is clear and readable.")
  }

  return { markdown }
}

