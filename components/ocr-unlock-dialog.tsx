"use client"

import { useEffect, useState } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface OcrUnlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlocked: (passphrase: string) => void
}

const COOLDOWN_STORAGE_KEY = "ocrCooldownUntil"

export function OcrUnlockDialog({ open, onOpenChange, onUnlocked }: OcrUnlockDialogProps) {
  const { toast } = useToast()
  const [passphrase, setPassphrase] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  // Hydrate cooldown from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.sessionStorage.getItem(COOLDOWN_STORAGE_KEY)
    if (stored) {
      const until = Number(stored)
      const now = Date.now()
      if (!Number.isNaN(until) && until > now) {
        setCooldownSeconds(Math.ceil((until - now) / 1000))
      } else {
        window.sessionStorage.removeItem(COOLDOWN_STORAGE_KEY)
      }
    }
  }, [])

  // Countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const id = window.setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id)
          window.sessionStorage.removeItem(COOLDOWN_STORAGE_KEY)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [cooldownSeconds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || cooldownSeconds > 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/verify-ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passphrase }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.valid) {
        window.sessionStorage.removeItem(COOLDOWN_STORAGE_KEY)
        toast({
          title: "Secure mode activated",
          description: "Reports will now use the enhanced processing pipeline.",
        })
        onUnlocked(passphrase)
        setPassphrase("")
        onOpenChange(false)
        return
      }

      const retryAfter = typeof data.retryAfter === "number" ? data.retryAfter : 60
      const until = Date.now() + retryAfter * 1000
      window.sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(until))
      setCooldownSeconds(retryAfter)

      setError("Incorrect phrase. Please wait before trying again.")
    } catch (err) {
      console.error("[OcrUnlockDialog] Verification error:", err)
      setError("Failed to verify phrase. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = isSubmitting || cooldownSeconds > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Безопасная обработка
          </DialogTitle>
          <DialogDescription>
            Введите вашу секретную фразу для активации безопасной обработки отчетов.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Введите секретную фразу"
              disabled={isDisabled}
              aria-invalid={!!error}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isDisabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {cooldownSeconds > 0 && (
            <p className="text-xs text-muted-foreground">
              Попробуйте снова через {cooldownSeconds}
              сек
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isDisabled || !passphrase.trim()}
            >
              {cooldownSeconds > 0 ? "Заблокировано" : isSubmitting ? "Проверка..." : "Активировать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

