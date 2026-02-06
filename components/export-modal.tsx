"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, FileText, Table, FileJson, Printer,
  Download, Check, Loader2, FileDown
} from "lucide-react"
import { downloadPDF, downloadCSV, downloadJSON, openPrintView, ReportData } from "@/lib/export-utils"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  data: ReportData
}

type ExportFormat = "pdf" | "csv" | "json" | "print"

const exportOptions = [
  {
    id: "pdf" as const,
    name: "PDF Отчет",
    description: "Профессиональный документ для врачей",
    icon: FileText,
    recommended: true,
    color: "text-danger bg-danger/10 border-danger/20"
  },
  {
    id: "csv" as const,
    name: "CSV Таблица",
    description: "Для Excel или Google Таблиц",
    icon: Table,
    color: "text-success bg-success/10 border-success/20"
  },
  {
    id: "json" as const,
    name: "JSON Данные",
    description: "Сырые данные для разработчиков",
    icon: FileJson,
    color: "text-primary bg-primary/10 border-primary/20"
  },
  {
    id: "print" as const,
    name: "Версия для печати",
    description: "Открыть в браузере для печати",
    icon: Printer,
    color: "text-warning bg-warning/10 border-warning/20"
  }
]

export default function ExportModal({ isOpen, onClose, data }: ExportModalProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [completed, setCompleted] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    setCompleted(null)

    try {
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300))

      switch (format) {
        case "pdf":
          await downloadPDF(data)
          break
        case "csv":
          downloadCSV(data)
          break
        case "json":
          downloadJSON(data)
          break
        case "print":
          openPrintView(data)
          break
      }

      setCompleted(format)

      // Reset after showing success
      setTimeout(() => {
        setCompleted(null)
        if (format !== "print") {
          onClose()
        }
      }, 1500)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setExporting(null)
    }
  }

  const testCount = data?.tests?.length || 0
  const abnormalCount = data?.tests?.filter(t => t.status !== "Normal").length || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 border-b border-border bg-gradient-to-br from-primary/10 to-accent/5">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <FileDown className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-medium text-foreground">Экспорт отчета</h2>
                    <p className="text-sm text-muted-foreground">
                      {testCount} анализов • {abnormalCount} требуют внимания
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="p-4 space-y-2">
                {exportOptions.map((option, idx) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleExport(option.id)}
                    disabled={exporting !== null}
                    className={`w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${option.color} group`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                        {exporting === option.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : completed === option.id ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : (
                          <option.icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{option.name}</span>
                          {option.recommended && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                              Рекомендуется
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer note */}
              <div className="px-6 pb-6">
                <p className="text-[11px] text-muted-foreground text-center">
                  Ваши данные обрабатываются локально и никогда не сохраняются на наших серверах
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
