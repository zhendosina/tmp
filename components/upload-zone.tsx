"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, Scan, CheckCircle2, Sparkles, Zap, Brain, FileSearch, MousePointerClick } from "lucide-react"

interface UploadZoneProps {
  onUploadComplete: (data: any) => void
}

const processingSteps = [
  { id: 1, label: "Uploading document", icon: Upload, duration: 800 },
  { id: 2, label: "Scanning pages", icon: Scan, duration: 1500 },
  { id: 3, label: "AI reading content", icon: FileSearch, duration: 2000 },
  { id: 4, label: "Extracting biomarkers", icon: Brain, duration: 2500 },
  { id: 5, label: "Generating insights", icon: Sparkles, duration: 1000 },
]

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulate processing steps animation
  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(0)
      return
    }

    setCurrentStep(0)
    const timers: NodeJS.Timeout[] = []
    let cumulativeTime = 0

    processingSteps.forEach((step, idx) => {
      if (idx > 0) {
        cumulativeTime += processingSteps[idx - 1].duration
        timers.push(setTimeout(() => setCurrentStep(idx), cumulativeTime))
      }
    })

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [isProcessing])

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setFileName(file.name)
    setError(null)

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB")
      setIsProcessing(false)
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const contentType = response.headers.get("content-type")

      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      // Small delay to show completion animation
      await new Promise(resolve => setTimeout(resolve, 500))
      onUploadComplete(data)
    } catch (err: any) {
      console.error("Upload error:", err)
      setError(err.message || "Failed to analyze report. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
      processFile(file)
    } else {
      setError("Invalid file type. Please upload a PDF or image file.")
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    if (file) {
      processFile(file)
    }
  }

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileInput}
        className="hidden"
        disabled={isProcessing}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-10 md:p-12 text-center transition-all duration-500 overflow-hidden
          ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-primary/40"}
          ${isProcessing ? "pointer-events-none" : "cursor-pointer hover:bg-white/[0.02]"}
          ${error ? "border-rose-500/50" : ""}
        `}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-sky-500/10 opacity-60" />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 dot-grid opacity-20" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-primary/20 rounded-tl-3xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-accent/20 rounded-br-3xl" />

        {/* Scanning line animation during processing */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-hidden pointer-events-none"
            >
              <div className="scan-line" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-8 py-4"
              >
                {/* Central processing animation */}
                <div className="relative">
                  {/* Outer ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-28 h-28 rounded-full border-2 border-primary/20"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50" />
                  </motion.div>

                  {/* Inner ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-3 rounded-full border-2 border-accent/30"
                  >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
                  </motion.div>

                  {/* Center icon */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center shadow-lg shadow-primary/30">
                      {(() => {
                        const StepIcon = processingSteps[currentStep]?.icon || Brain
                        return <StepIcon className="w-7 h-7 text-white" />
                      })()}
                    </div>
                  </motion.div>
                </div>

                {/* File name */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-white mb-2">
                    Analyzing Report
                  </p>
                  <p className="text-sm text-muted-foreground font-mono bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                    {fileName}
                  </p>
                </div>

                {/* Processing steps */}
                <div className="w-full max-w-sm space-y-2">
                  {processingSteps.map((step, idx) => {
                    const StepIcon = step.icon
                    const isActive = idx === currentStep
                    const isComplete = idx < currentStep

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive
                          ? "bg-primary/10 border border-primary/30"
                          : isComplete
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-white/[0.02] border border-white/5"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive
                          ? "bg-primary/20"
                          : isComplete
                            ? "bg-emerald-500/20"
                            : "bg-white/5"
                          }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isActive ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <StepIcon className="w-4 h-4 text-primary" />
                            </motion.div>
                          ) : (
                            <StepIcon className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <span className={`text-sm font-medium transition-colors ${isActive
                          ? "text-primary"
                          : isComplete
                            ? "text-emerald-400"
                            : "text-muted-foreground/50"
                          }`}>
                          {step.label}
                        </span>
                        {isActive && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="ml-auto"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Upload icon with animation */}
                <motion.div
                  animate={{ y: isDragging ? -10 : 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className="relative"
                >
                  <motion.div
                    animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging
                      ? "bg-gradient-to-br from-primary to-sky-500 shadow-xl shadow-primary/30"
                      : "bg-gradient-to-br from-primary/10 to-sky-500/20 border border-white/10"
                      }`}
                  >
                    {isDragging ? (
                      <Upload className="w-9 h-9 text-white" />
                    ) : (
                      <FileText className="w-9 h-9 text-primary" />
                    )}
                  </motion.div>

                  {/* Floating elements */}
                  {!isDragging && (
                    <>
                      <motion.div
                        animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-2 -right-3"
                      >
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [5, -5, 5], rotate: [0, -10, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity }}
                        className="absolute -bottom-2 -left-3"
                      >
                        <Zap className="w-4 h-4 text-primary" />
                      </motion.div>
                    </>
                  )}
                </motion.div>

                <div className="text-center space-y-2">
                  <motion.h3
                    animate={{ scale: isDragging ? 1.05 : 1 }}
                    className="text-xl font-semibold text-white"
                  >
                    {isDragging ? "Drop your file here" : "Upload Blood Report"}
                  </motion.h3>
                  <p className="text-muted-foreground text-sm">
                    Drag and drop or{" "}
                    <span className="text-primary font-medium">click to browse</span>
                  </p>
                </div>

                {/* Supported formats */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10">PDF</span>
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10">PNG</span>
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10">JPG</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>Max 10MB</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
