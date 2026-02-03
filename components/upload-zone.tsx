"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle2, Activity, FileSearch, HeartPulse, Droplets } from "lucide-react"

interface UploadZoneProps {
  onUploadComplete: (data: any) => void
  ocrEnabled?: boolean
  ocrPassphrase?: string
}

const processingSteps = [
  { id: 1, label: "Uploading document", icon: Upload, duration: 800 },
  { id: 2, label: "Reading pages", icon: FileSearch, duration: 1500 },
  { id: 3, label: "Extracting biomarkers", icon: Droplets, duration: 2000 },
  { id: 4, label: "Analyzing results", icon: Activity, duration: 2500 },
  { id: 5, label: "Preparing insights", icon: HeartPulse, duration: 1000 },
]

export default function UploadZone({ onUploadComplete, ocrEnabled = false, ocrPassphrase = "" }: UploadZoneProps) {
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

    if (file.size > 4 * 1024 * 1024) {
      setError("File too large. Maximum size is 4MB")
      setIsProcessing(false)
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    if (ocrEnabled && ocrPassphrase) {
      formData.append("ocrEnabled", "true")
      formData.append("passphrase", ocrPassphrase)
    }

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
          relative border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all duration-500 overflow-hidden
          ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"}
          ${isProcessing ? "pointer-events-none" : "cursor-pointer hover:bg-card/50"}
          ${error ? "border-danger/50" : ""}
          card-warm
        `}
      >
        {/* Subtle pattern background */}
        <div className="absolute inset-0 dot-pattern opacity-20" />

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
                {/* Central processing animation - organic pulse */}
                <div className="relative">
                  {/* Outer breathing ring */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-primary/20"
                    style={{ margin: "-12px" }}
                  />

                  {/* Main circle */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-2 border-primary/30 relative"
                  >
                    {/* Orbiting dot */}
                    <motion.div
                      className="absolute w-3 h-3 bg-primary rounded-full shadow-lg"
                      style={{ top: "-6px", left: "50%", marginLeft: "-6px" }}
                    />
                  </motion.div>

                  {/* Inner circle */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border-2 border-accent/40"
                  >
                    <motion.div
                      className="absolute w-2 h-2 bg-accent rounded-full"
                      style={{ bottom: "-4px", left: "50%", marginLeft: "-4px" }}
                    />
                  </motion.div>

                  {/* Center icon */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      {(() => {
                        const StepIcon = processingSteps[currentStep]?.icon || Activity
                        return <StepIcon className="w-6 h-6 text-primary-foreground" />
                      })()}
                    </div>
                  </motion.div>
                </div>

                {/* File name */}
                <div className="text-center space-y-1">
                  <p className="text-lg font-serif font-medium text-foreground mb-2">
                    Analyzing Report
                  </p>
                  <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-4 py-1.5 rounded-lg border border-border">
                    {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Processing...
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
                            ? "bg-success/5 border border-success/20"
                            : "bg-muted/30 border border-border/50"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive
                          ? "bg-primary/20"
                          : isComplete
                            ? "bg-success/20"
                            : "bg-muted/50"
                          }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : isActive ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
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
                            ? "text-success"
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
                            <div className="status-dot status-normal" />
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
                className="flex flex-col items-center gap-6"
              >
                {/* Upload icon with animation */}
                <motion.div
                  animate={{ y: isDragging ? -10 : 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className="relative"
                >
                  <motion.div
                    animate={isDragging ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging
                      ? "bg-gradient-to-br from-primary to-accent shadow-xl glow-primary"
                      : "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                      }`}
                  >
                    {isDragging ? (
                      <Upload className="w-9 h-9 text-primary-foreground" />
                    ) : (
                      <FileText className="w-9 h-9 text-primary" />
                    )}
                  </motion.div>

                  {/* Decorative elements */}
                  {!isDragging && (
                    <>
                      <motion.div
                        animate={{ y: [-3, 3, -3], rotate: [0, 5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-1 -right-2"
                      >
                        <div className="w-4 h-4 rounded-full bg-success/20 border border-success/30" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [3, -3, 3], rotate: [0, -5, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity }}
                        className="absolute -bottom-1 -left-2"
                      >
                        <div className="w-3 h-3 rounded-full bg-accent/30 border border-accent/40" />
                      </motion.div>
                    </>
                  )}
                </motion.div>

                <div className="text-center space-y-2">
                  <motion.h3
                    animate={{ scale: isDragging ? 1.02 : 1 }}
                    className="text-xl font-serif font-medium text-foreground"
                  >
                    {isDragging ? "Drop your file here" : "Upload Blood Report"}
                  </motion.h3>
                  <p className="text-muted-foreground text-sm">
                    Drag and drop or{" "}
                    <span className="text-primary font-medium hover:underline">click to browse</span>
                  </p>
                </div>

                {/* Supported formats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-medium">PDF</span>
                  <span className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-medium">PNG</span>
                  <span className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-medium">JPG</span>
                  <span className="text-border">|</span>
                  <span>Max 4MB</span>
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
                className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm"
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
