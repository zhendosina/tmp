"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, X, FileText, Download, Loader2, Info } from "lucide-react"
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

// Parse date in format DD.MM.YYYY or YYYY-MM-DD
function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date(0)
  
  // Try DD.MM.YYYY format
  const ddmmyyyy = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  if (ddmmyyyy) {
    return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]))
  }
  
  // Try YYYY-MM-DD format
  const yyyymmdd = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (yyyymmdd) {
    return new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]))
  }
  
  return new Date(dateStr)
}

export default function ComparisonTable({ analyses, onClose }: ComparisonTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [normalizedMappings, setNormalizedMappings] = useState<Record<string, string> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Collect all unique test names
  const allTestNames = useMemo(() => {
    const names = new Set<string>()
    analyses.forEach(analysis => {
      analysis.tests.forEach(test => {
        names.add(test.test_name)
      })
    })
    return Array.from(names)
  }, [analyses])

  // Fetch normalization from API
  useEffect(() => {
    const normalizeTestNames = async () => {
      console.log("[Comparison] Starting normalization for", allTestNames.length, "tests")
      console.log("[Comparison] Test names:", allTestNames)
      
      try {
        const response = await fetch("/api/normalize-tests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ testNames: allTestNames })
        })

        if (!response.ok) {
          throw new Error("Failed to normalize test names")
        }

        const data = await response.json()
        console.log("[Comparison] Received mappings:", data.mappings)
        setNormalizedMappings(data.mappings)
      } catch (error) {
        console.error("Error normalizing test names:", error)
        // Fallback to identity mappings if API fails
        const fallback: Record<string, string> = {}
        allTestNames.forEach(name => {
          fallback[name] = name
        })
        setNormalizedMappings(fallback)
      } finally {
        setIsLoading(false)
      }
    }

    if (allTestNames.length > 0) {
      normalizeTestNames()
    }
  }, [allTestNames])

  // Get canonical name from AI mappings
  const getCanonicalName = (name: string): string => {
    if (!normalizedMappings) return name
    return normalizedMappings[name] || name
  }

  // Sort analyses by date
  const sortedAnalyses = useMemo(() => {
    return [...analyses].sort((a, b) => {
      const dateA = parseDate(a.patient_info?.date)
      const dateB = parseDate(b.patient_info?.date)
      return dateA.getTime() - dateB.getTime()
    })
  }, [analyses])

  // Get all unique test names across all analyses (with AI normalization)
  const allTests = useMemo(() => {
    if (!normalizedMappings) return []
    
    console.log("[Comparison] Building allTests with mappings:", normalizedMappings)
    
    const testMap = new Map<string, { 
      category: string; 
      unit: string; 
      originalNames: Set<string> 
    }>()
    
    sortedAnalyses.forEach(analysis => {
      analysis.tests.forEach(test => {
        const canonicalName = getCanonicalName(test.test_name)
        console.log(`[Comparison] Mapping "${test.test_name}" -> "${canonicalName}"`)
        
        if (!testMap.has(canonicalName)) {
          testMap.set(canonicalName, { 
            category: test.category, 
            unit: test.unit,
            originalNames: new Set()
          })
        }
        
        testMap.get(canonicalName)?.originalNames.add(test.test_name)
      })
    })
    
    const result = Array.from(testMap.entries()).map(([name, info]) => ({
      name,
      category: info.category,
      unit: info.unit,
      originalNames: Array.from(info.originalNames)
    }))
    
    console.log("[Comparison] Final allTests:", result)
    return result
  }, [sortedAnalyses, normalizedMappings])

  // Get all categories
  const categories = useMemo(() => {
    const cats = new Set(allTests.map(t => t.category))
    return Array.from(cats).sort()
  }, [allTests])

  // Get dates for columns (sorted)
  const dates = useMemo(() => {
    return sortedAnalyses.map((a, idx) => ({
      date: a.patient_info?.date || `Анализ ${idx + 1}`,
      index: idx,
      fileName: a.fileName,
      rawDate: parseDate(a.patient_info?.date)
    }))
  }, [sortedAnalyses])

  // Filter tests by category
  const filteredTests = useMemo(() => {
    if (!selectedCategory) return allTests
    return allTests.filter(t => t.category === selectedCategory)
  }, [allTests, selectedCategory])

  // Get value for a specific test and analysis (using AI canonical name matching)
  const getTestValue = (canonicalName: string, analysisIndex: number) => {
    const analysis = sortedAnalyses[analysisIndex]
    if (!analysis) return null
    
    // Find any test that maps to this canonical name
    const test = analysis.tests.find(t => {
      const testCanonical = getCanonicalName(t.test_name)
      return testCanonical === canonicalName
    })
    
    return test || null
  }

  // Determine trend (increasing, decreasing, stable)
  const getTrend = (canonicalName: string, currentIndex: number) => {
    if (currentIndex === 0) return null
    
    const current = getTestValue(canonicalName, currentIndex)
    const previous = getTestValue(canonicalName, currentIndex - 1)
    
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

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-foreground">Нормализация названий анализов...</p>
          <p className="text-sm text-muted-foreground">ИИ анализирует {allTestNames.length} уникальных названий</p>
        </div>
      </motion.div>
    )
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
              {analyses.length} анализа • {allTests.length} показателей (сгруппировано ИИ)
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
                          {test.originalNames.length > 1 && (
                            <div className="group relative">
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                <div className="font-medium mb-1">Варианты названий:</div>
                                <div>{test.originalNames.filter(n => n !== test.name).join(", ")}</div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                              </div>
                            </div>
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
