"use client"

import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Activity } from "lucide-react"

interface TestResult {
  test: string
  value: number
  units: string
  referenceRange: string
  status: "Normal" | "High" | "Low"
}

interface ResultsDisplayProps {
  data: {
    results: TestResult[]
    summary: {
      total: number
      normal: number
      abnormal: number
    }
  }
}

const calculateRangePercentage = (value: number, range: string): number => {
  try {
    const parts = range.split("-").map((s) => Number.parseFloat(s.trim()))
    if (parts.length !== 2) return 50
    const [min, max] = parts
    const percentage = ((value - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, percentage))
  } catch {
    return 50
  }
}

export default function ResultsDisplay({ data }: ResultsDisplayProps) {
  const { results, summary } = data

  const normalTests = results.filter((r) => r.status === "Normal")
  const abnormalTests = results.filter((r) => r.status !== "Normal")

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-card border border-border rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Tests</p>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{summary.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Parameters analyzed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-success/10 border border-success/20 rounded-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-success">Normal</p>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-success">{summary.normal}</p>
          <p className="text-xs text-success/70 mt-1">
            {summary.total > 0 ? Math.round((summary.normal / summary.total) * 100) : 0}% of tests
          </p>
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-warning/10 border border-warning/20 rounded-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-warning">Needs Attention</p>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <p className="text-3xl font-bold text-warning">{summary.abnormal}</p>
          <p className="text-xs text-warning/70 mt-1">
            {summary.total > 0 ? Math.round((summary.abnormal / summary.total) * 100) : 0}% of tests
          </p>
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Abnormal Results */}
      {abnormalTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <h3 className="text-xl font-bold text-foreground">Results Needing Attention</h3>
          </div>

          <div className="space-y-3">
            {abnormalTests.map((test, index) => {
              const percentage = calculateRangePercentage(test.value, test.referenceRange)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className={`p-5 rounded-lg border-l-4 ${
                    test.status === "High" ? "bg-danger/5 border-danger" : "bg-warning/5 border-warning"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {test.status === "High" ? (
                          <TrendingUp className="w-5 h-5 text-danger" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-warning" />
                        )}
                        <h4 className="font-semibold text-foreground">{test.test}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            test.status === "High" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                          }`}
                        >
                          {test.status}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-foreground">{test.value}</span>
                        <span className="text-sm text-muted-foreground">{test.units}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          {/* Reference range indicator */}
                          <div className="absolute inset-0 bg-success/20" />
                          {/* Value position indicator */}
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, delay: 0.5 + index * 0.05 }}
                            className={`absolute left-0 top-0 h-full ${
                              test.status === "High" ? "bg-danger" : "bg-warning"
                            }`}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reference: <span className="font-medium text-foreground">{test.referenceRange}</span>{" "}
                          {test.units}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Normal Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle className="w-6 h-6 text-success" />
          <h3 className="text-xl font-bold text-foreground">Normal Results</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {normalTests.map((test, index) => {
            const percentage = calculateRangePercentage(test.value, test.referenceRange)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.02 }}
                className="p-4 bg-success/5 border border-success/20 rounded-lg hover:bg-success/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground text-sm">{test.test}</h4>
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-bold text-foreground">{test.value}</span>
                  <span className="text-xs text-muted-foreground">{test.units}</span>
                </div>

                <div className="space-y-1">
                  <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.02 }}
                      className="absolute left-0 top-0 h-full bg-success"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Range: {test.referenceRange}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
