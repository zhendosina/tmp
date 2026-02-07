"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, FilePlus, Loader2 } from "lucide-react"

interface MultiUploadZoneProps {
  onUploadComplete: (data: any) => void
  onUploadMultiple?: (results: any[]) => void
  ocrEnabled?: boolean
  ocrPassphrase?: string
}

export default function MultiUploadZone({ 
  onUploadComplete, 
  onUploadMultiple,
  ocrEnabled = false, 
  ocrPassphrase = "" 
}: MultiUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) return
    
    setIsProcessing(true)
    setProcessingIndex(0)
    setError(null)
    
    const results: any[] = []
    
    for (let i = 0; i < filesToProcess.length; i++) {
      setProcessingIndex(i)
      const file = filesToProcess[i]
      
      if (file.size > 4 * 1024 * 1024) {
        setError(`Файл "${file.name}" слишком большой. Максимальный размер 4MB`)
        continue
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
          throw new Error(`Ошибка при обработке "${file.name}"`)
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Ошибка сервера: ${response.status}`)
        }

        results.push({
          ...data,
          fileName: file.name,
          processedAt: new Date().toISOString()
        })
      } catch (err: any) {
        console.error("Upload error:", err)
        setError(err.message || `Не удалось обработать "${file.name}"`)
      }
    }

    setIsProcessing(false)
    
    if (results.length === 1) {
      onUploadComplete(results[0])
    } else if (results.length > 1 && onUploadMultiple) {
      onUploadMultiple(results)
    } else if (results.length > 0) {
      onUploadComplete(results[0])
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf" || file.type.startsWith("image/")
    )
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles])
    } else {
      setError("Неверный тип файла. Пожалуйста, загружайте только PDF или изображения.")
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    setError(null)
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleStartAnalysis = () => {
    if (files.length > 0) {
      processFiles(files)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileInput}
        className="hidden"
        multiple
        disabled={isProcessing}
      />

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-500 overflow-hidden
          ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"}
          ${isProcessing ? "pointer-events-none" : "cursor-pointer hover:bg-card/50"}
          ${error ? "border-danger/50" : ""}
          card-warm
        `}
      >
        {/* Subtle pattern background */}
        <div className="absolute inset-0 dot-pattern opacity-20" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent"
              />
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Обработка {processingIndex + 1} из {files.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {files[processingIndex]?.name}
                </p>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                animate={{ y: isDragging ? -10 : 0 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="relative"
              >
                <motion.div
                  animate={isDragging ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isDragging
                      ? "bg-gradient-to-br from-primary to-accent shadow-xl"
                      : "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                  }`}
                >
                  {isDragging ? (
                    <Upload className="w-7 h-7 text-primary-foreground" />
                  ) : (
                    <FilePlus className="w-7 h-7 text-primary" />
                  )}
                </motion.div>
              </motion.div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-medium text-foreground">
                  {isDragging ? "Отпустите файлы" : "Загрузить анализы крови"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Перетащите один или несколько файлов
                </p>
              </div>

              {/* Supported formats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-medium">PDF</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-medium">PNG</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border font-medium">JPG</span>
                <span className="text-border">|</span>
                <span>Макс. 4MB каждый</span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">
                Выбрано файлов: {files.length}
              </span>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-danger hover:underline"
              >
                Очистить все
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60"
                >
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Start Analysis Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleStartAnalysis}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Loader2 className="w-4 h-4" />
              Начать анализ ({files.length} файл{files.length > 1 ? 'а' : ''})
            </motion.button>
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
  )
}
