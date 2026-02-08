"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, X, FileText, Download, Loader2, Info, FileJson, FileDown, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportComparisonToPDF } from "@/lib/comparison-pdf-export"

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
      normalRange: string;
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
            normalRange: test.normal_range,
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
      normalRange: info.normalRange,
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

  // Get unique dates for columns (merge analyses from same date)
  const dates = useMemo(() => {
    const dateGroups = new Map<string, { indices: number[]; fileNames: string[]; rawDate: Date }>()
    
    sortedAnalyses.forEach((a, idx) => {
      const dateStr = a.patient_info?.date || `Анализ ${idx + 1}`
      const rawDate = parseDate(a.patient_info?.date)
      
      if (!dateGroups.has(dateStr)) {
        dateGroups.set(dateStr, { indices: [], fileNames: [], rawDate })
      }
      
      const group = dateGroups.get(dateStr)!
      group.indices.push(idx)
      if (a.fileName) {
        group.fileNames.push(a.fileName)
      }
    })
    
    return Array.from(dateGroups.entries()).map(([date, info]) => ({
      date,
      indices: info.indices,
      fileNames: info.fileNames,
      rawDate: info.rawDate
    })).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
  }, [sortedAnalyses])

  // Filter tests by category
  const filteredTests = useMemo(() => {
    if (!selectedCategory) return allTests
    return allTests.filter(t => t.category === selectedCategory)
  }, [allTests, selectedCategory])

  // Get value for a specific test and analysis (using AI canonical name matching)
  // Now accepts an array of indices for merged dates
  const getTestValue = (canonicalName: string, analysisIndices: number[]) => {
    for (const idx of analysisIndices) {
      const analysis = sortedAnalyses[idx]
      if (!analysis) continue
      
      // Find any test that maps to this canonical name
      const test = analysis.tests.find(t => {
        const testCanonical = getCanonicalName(t.test_name)
        return testCanonical === canonicalName
      })
      
      if (test) return test
    }
    
    return null
  }

  // Determine trend (increasing, decreasing, stable)
  const getTrend = (canonicalName: string, currentDateIndex: number) => {
    if (currentDateIndex === 0) return null
    
    const currentIndices = dates[currentDateIndex]?.indices || []
    const previousIndices = dates[currentDateIndex - 1]?.indices || []
    
    const current = getTestValue(canonicalName, currentIndices)
    const previous = getTestValue(canonicalName, previousIndices)
    
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
    const headers = ["Анализ", "Референс", "Ед. изм.", ...dates.map(d => d.date)]
    const rows = filteredTests.map(test => {
      const values = dates.map(d => {
        const t = getTestValue(test.name, d.indices)
        return t ? `${t.value} ${t.status !== "Normal" ? `(${t.status === "High" ? "↑" : "↓"})` : ""}` : "-"
      })
      return [test.name, test.normalRange, test.unit, ...values]
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

  // Export to JSON
  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalTests: filteredTests.length,
      totalDates: dates.length,
      dates: dates.map(d => d.date),
      tests: filteredTests.map(test => {
        const values = dates.map(d => {
          const t = getTestValue(test.name, d.indices)
          return {
            date: d.date,
            value: t ? t.value : null,
            unit: t ? t.unit : test.unit,
            status: t ? t.status : null,
            normalRange: t ? t.normal_range : test.normalRange,
            trend: dates.indexOf(d) > 0 ? getTrend(test.name, dates.indexOf(d)) : null
          }
        })
        
        return {
          name: test.name,
          category: test.category,
          unit: test.unit,
          normalRange: test.normalRange,
          alternativeNames: test.originalNames.filter(n => n !== test.name),
          values: values
        }
      })
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `сравнение-анализов-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export to PDF
  const exportToPDF = () => {
    exportComparisonToPDF(filteredTests, dates, getTestValue, analyses)
  }

  // Export to HTML
  const exportToHTML = () => {
    // Get patient info
    const firstAnalysis = analyses[0]
    const patientName = firstAnalysis?.patient_info?.name || 'Не указано'
    
    // Get date range
    const dateList = dates.map(d => d.date).filter(Boolean)
    const periodText = dateList.length >= 2 
      ? `${dateList[0]} — ${dateList[dateList.length - 1]}`
      : dateList[0] || ''

    // Helper function to format date
    const formatDate = (dateStr: string) => {
      const parts = dateStr.split('.')
      return parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2].slice(-2)}` : dateStr
    }

    // Helper function to get values for a test
    const getTestValues = (testName: string) => {
      return dates.map(d => {
        const t = getTestValue(testName, d.indices)
        if (!t) return { value: '—', isAbnormal: false }
        const isAbnormal = t.status === 'High' || t.status === 'Low'
        return { value: t.value, isAbnormal }
      })
    }

    // Group tests by section
    const hematologyTests = filteredTests.filter(t => t.category === 'Общий анализ крови')
    const biochemCategories = ['Метаболическая панель', 'Функция печени', 'Функция почек', 'Липидный профиль', 'Витамины и минералы']
    const biochemTests = filteredTests.filter(t => biochemCategories.includes(t.category))
    const coagulationTests = filteredTests.filter(t => t.category === 'Коагулограмма')
    const otherCategories = ['Лейкоцитарная формула', 'Общий анализ мочи', 'Другое']
    const otherTests = filteredTests.filter(t => otherCategories.includes(t.category) || !['Общий анализ крови', 'Коагулограмма', ...biochemCategories].includes(t.category))

    // Build HTML
    let htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Сводный отчет - ${patientName}</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            font-size: 16pt;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .subtitle {
            text-align: center;
            margin-bottom: 20px;
            font-size: 10pt;
            color: #7f8c8d;
        }
        h3 {
            background-color: #f2f2f2;
            padding: 5px 10px;
            border-left: 5px solid #2980b9;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 10pt;
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            table-layout: fixed;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 6px 4px;
            text-align: center;
            word-wrap: break-word;
        }
        th {
            background-color: #ecf0f1;
            font-weight: bold;
            color: #2c3e50;
        }
        .left-align {
            text-align: left;
            width: 30%;
            font-weight: bold;
            background-color: #ffffff;
        }
        .ref-col {
            width: 20%;
            background-color: #f9f9f9;
            font-style: italic;
            color: #7f8c8d;
        }
        .highlight {
            color: #c0392b;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fcfcfc;
        }
        .footer {
            font-size: 7pt;
            color: #95a5a6;
            margin-top: 10px;
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #2980b9;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12pt;
        }
        .print-btn:hover {
            background: #1f5d8b;
        }
        @media print {
            .print-btn { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ Печать / Сохранить как PDF</button>

    <h1>Полный сводный отчет</h1>
    <div class="subtitle">Пациент: ${patientName}${periodText ? ' | Период: ' + periodText : ''}</div>`

    // Section 1: Гематология
    if (hematologyTests.length > 0) {
      htmlContent += `

    <h3>1. Гематология (Общий анализ крови)</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`
      })
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`
      
      hematologyTests.forEach((test) => {
        const values = getTestValues(test.name)
        htmlContent += `
            <tr>
                <td class="left-align">${test.name}${test.unit ? ' (' + test.unit + ')' : ''}</td>`
        
        values.forEach(v => {
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight">${v.value}</td>`
          } else {
            htmlContent += `
                <td>${v.value}</td>`
          }
        })
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`
      })
      
      htmlContent += `
        </tbody>
    </table>`
    }

    // Section 2: Биохимия
    if (biochemTests.length > 0) {
      htmlContent += `

    <h3>2. Биохимия и Гормоны</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`
      })
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`
      
      biochemTests.forEach((test) => {
        const values = getTestValues(test.name)
        htmlContent += `
            <tr>
                <td class="left-align">${test.name}${test.unit ? ' (' + test.unit + ')' : ''}</td>`
        
        values.forEach(v => {
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight">${v.value}</td>`
          } else {
            htmlContent += `
                <td>${v.value}</td>`
          }
        })
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`
      })
      
      htmlContent += `
        </tbody>
    </table>`
    }

    // Section 3: Коагулограмма
    if (coagulationTests.length > 0) {
      htmlContent += `

    <h3>3. Коагулограмма</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`
      })
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`
      
      coagulationTests.forEach((test) => {
        const values = getTestValues(test.name)
        htmlContent += `
            <tr>
                <td class="left-align">${test.name}${test.unit ? ' (' + test.unit + ')' : ''}</td>`
        
        values.forEach(v => {
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight">${v.value}</td>`
          } else {
            htmlContent += `
                <td>${v.value}</td>`
          }
        })
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`
      })
      
      htmlContent += `
        </tbody>
    </table>`
    }

    // Section 4: Дополнительные
    if (otherTests.length > 0) {
      htmlContent += `

    <h3>4. Дополнительные показатели</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`
      })
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`
      
      otherTests.forEach((test) => {
        const values = getTestValues(test.name)
        htmlContent += `
            <tr>
                <td class="left-align">${test.name}${test.unit ? ' (' + test.unit + ')' : ''}</td>`
        
        values.forEach(v => {
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight">${v.value}</td>`
          } else {
            htmlContent += `
                <td>${v.value}</td>`
          }
        })
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`
      })
      
      htmlContent += `
        </tbody>
    </table>`
    }

    htmlContent += `

    <div class="footer">
        * Данные сформированы автоматически на основании предоставленных лабораторных отчетов.
    </div>

</body>
</html>`

    // Create and download HTML file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `сводный-отчет-${patientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
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
              onClick={exportToPDF}
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToHTML}
              className="flex items-center gap-2"
            >
              <FileCode className="w-4 h-4" />
              HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJSON}
              className="flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground min-w-[100px]">
                    Референс
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
                        {d.fileNames.length > 0 && (
                          <div className="text-xs text-muted-foreground/70 truncate max-w-[120px]">
                            {d.fileNames.length > 1 ? `${d.fileNames.length} анализа` : d.fileNames[0]}
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
                    data: getTestValue(test.name, d.indices),
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
                      <td className="px-4 py-3 text-sm font-medium bg-card">
                        <div className="flex items-center gap-2">
                          <span className={hasAbnormal ? "text-warning" : ""}>
                            {test.name}
                          </span>
                          {test.originalNames.length > 1 && (
                            <div className="group relative">
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64 z-50">
                                <div className="font-medium mb-1">Варианты названий:</div>
                                <div className="break-words">{test.originalNames.filter(n => n !== test.name).join(", ")}</div>
                                <div className="absolute top-2 -left-1 w-2 h-2 bg-popover border-l border-b border-border transform rotate-45" />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {test.normalRange}
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
