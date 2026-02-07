"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, X, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TestResult {
  test_name: string
  value: number | string
  unit: string
  normal_range: string
  status: "Normal" | "High" | "Low"
  category: string
}

interface AnalysisData {
  tests: TestResult[]
  summary?: {
    total: number
    normal: number
    abnormal: number
  }
  patient_info?: {
    name?: string
    age?: string
    gender?: string
    date?: string
  }
  fileName?: string
  processedAt?: string
}

interface ComparisonTableProps {
  analyses: AnalysisData[]
  onClose: () => void
}

export default function ComparisonTable({ analyses, onClose }: ComparisonTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get all unique test names across all analyses
  const allTests = useMemo(() => {
    const testMap = new Map<string, { category: string; unit: string }>()
    
    analyses.forEach(analysis => {
      analysis.tests.forEach(test => {
        if (!testMap.has(test.test_name)) {
          testMap.set(test.test_name, { 
            category: test.category, 
            unit: test.unit 
          })
        }
      })
    })
    
    return Array.from(testMap.entries()).map(([name, info]) => ({
      name,
      ...info
    }))
  }, [analyses])

  // Get all categories
  const categories = useMemo(() => {
    const cats = new Set(allTests.map(t => t.category))
    return Array.from(cats).sort()
  }, [allTests])

  // Get dates for columns
  const dates = useMemo(() => {
    return analyses.map((a, idx) => ({
      date: a.patient_info?.date || `Анализ ${idx + 1}`,
      index: idx,
      fileName: a.fileName
    }))
  }, [analyses])

  // Filter tests by category
  const filteredTests = useMemo(() => {
    if (!selectedCategory) return allTests
    return allTests.filter(t => t.category === selectedCategory)
  }, [allTests, selectedCategory])

  // Get value for a specific test and analysis
  const getTestValue = (testName: string, analysisIndex: number) => {
    const test = analyses[analysisIndex]?.tests.find(t => t.test_name === testName)
    return test || null
  }

  // Determine trend (increasing, decreasing, stable)
  const getTrend = (testName: string, currentIndex: number) => {
    if (currentIndex === 0) return null
    
    const current = getTestValue(testName, currentIndex)
    const previous = getTestValue(testName, currentIndex - 1)
    
    if (!current || !previous) return null
    
    const currVal = parseFloat(String(current.value))
    const prevVal = parseFloat(String(previous.value))
    
    if (isNaN(currVal) || isNaN(prevVal)) return null
    
    const diff = currVal - prevVal
    const percentChange = prevVal !== 0 ? (diff / prevVal) * 100 : 0
    
    if (Math.abs(percentChange) < 5) return "stable"
    return diff > 0 ? "up" : "down"
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Анализ", "Ед. изм.", ...dates.map(d => d.date)]
    const rows = filteredTests.map(test => {
      const values = dates.map(d => {
        const t = getTestValue(test.name, d.index)
        return t ? `${t.value} ${t.status !== "Normal" ? `(${t.status === "High" ? "↑" : "↓"})` : ""}` : "-"
      })
      return [test.name, test.unit, ...values]
    })
    
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `сравнение-анализов-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/95 border-b border-border z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-medium text-foreground">
              Сравнение анализов
            </h2>
            <p className="text-sm text-muted-foreground">
              {analyses.length} анализа • {allTests.length} показателей
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт CSV
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Все категории
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                    Показатель
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Ед.
                  </th>
                  {dates.map((d, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-center text-sm font-medium text-muted-foreground min-w-[140px]"
                    >
                      <div className="space-y-1">
                        <div>{d.date}</div>
                        {d.fileName && (
                          <div className="text-xs text-muted-foreground/70 truncate max-w-[120px]">
                            {d.fileName}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, testIdx) => {
                  const values = dates.map((d, idx) => ({
                    data: getTestValue(test.name, idx),
                    trend: getTrend(test.name, idx)
                  }))
                  
                  // Check if any value is abnormal
                  const hasAbnormal = values.some(v => 
                    v.data && v.data.status !== "Normal"
                  )
                  
                  return (
                    <tr
                      key={test.name}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                        hasAbnormal ? "bg-warning/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <span className={hasAbnormal ? "text-warning" : ""}>
                            {test.name}
                          </span>
                          {testIdx === 0 && (
                            <span className="text-xs text-muted-foreground">
                              {test.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {test.unit}
                      </td>
                      {values.map((v, idx) => (
                        <td
                          key={idx}
                          className="px-4 py-3 text-center"
                        >
                          {v.data ? (
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className={`text-sm font-medium ${
                                  v.data.status === "High"
                                    ? "text-danger"
                                    : v.data.status === "Low"
                                    ? "text-warning"
                                    : "text-success"
                                }`}
                              >
                                {v.data.value}
                              </span>
                              {v.trend && idx > 0 && (
                                <span className="text-xs">
                                  {v.trend === "up" ? (
                                    <TrendingUp className="w-3 h-3 text-danger" />
                                  ) : v.trend === "down" ? (
                                    <TrendingDown className="w-3 h-3 text-success" />
                                  ) : (
                                    <Minus className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span>В норме</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span>Повышено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span>Понижено</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-danger" />
            <span>Рост</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-success" />
            <span>Снижение</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-muted-foreground" />
            <span>Стабильно</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
