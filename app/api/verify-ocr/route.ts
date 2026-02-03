import { NextResponse, type NextRequest } from "next/server"
import crypto from "node:crypto"

export const runtime = "nodejs"

const COOLDOWN_MS = 60_000
const failedAttempts = new Map<string, number>() // ip -> last failed timestamp

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const [first] = xff.split(",")
    return first?.trim() || "unknown"
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}

function timingSafeEqual(input: string, secretEnv: string | undefined): boolean {
  if (!secretEnv) return false

  const inputBuf = Buffer.from(input, "utf8")
  const secretBuf = Buffer.from(secretEnv, "utf8")

  if (inputBuf.length !== secretBuf.length) {
    // Ensure consistent timing even on length mismatch
    return false
  }

  return crypto.timingSafeEqual(inputBuf, secretBuf)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const now = Date.now()
    const lastFailed = failedAttempts.get(ip)

    if (lastFailed && now - lastFailed < COOLDOWN_MS) {
      const retryAfterMs = COOLDOWN_MS - (now - lastFailed)
      const retryAfter = Math.ceil(retryAfterMs / 1000)
      return NextResponse.json(
        { valid: false, retryAfter },
        {
          status: 429,
        },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const passphrase = (body as { passphrase?: unknown }).passphrase

    if (typeof passphrase !== "string" || !passphrase.trim()) {
      return NextResponse.json({ error: "Passphrase is required" }, { status: 400 })
    }

    const secret = process.env.OCR_PASSPHRASE
    if (!secret) {
      console.warn("[verify-ocr] OCR_PASSPHRASE not set in environment")
      return NextResponse.json(
        { error: "OCR passphrase is not configured on the server" },
        { status: 500 },
      )
    }

    const isValid = timingSafeEqual(passphrase, secret)

    if (isValid) {
      failedAttempts.delete(ip)
      return NextResponse.json({ valid: true })
    }

    failedAttempts.set(ip, now)
    return NextResponse.json(
      { valid: false, retryAfter: 60 },
      {
        status: 401,
      },
    )
  } catch (error) {
    console.error("[verify-ocr] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to verify passphrase" },
      {
        status: 500,
      },
    )
  }
}

