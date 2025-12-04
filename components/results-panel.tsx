"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Activity, Droplet, Heart, Zap, TrendingUp, TrendingDown, Minus,
  AlertCircle, CheckCircle, AlertTriangle, Beaker, Flame, Shield,
  ChevronDown, Info, ArrowRight, Sparkles
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"

export interface Test {
  id: string
  name: string
  value: number
  unit: string
  normalRange: { min: number; max: number }
  status: "normal" | "borderline" | "abnormal"
  category: string
}

interface ResultsPanelProps {
  data: any
  onTestSelect: (test: Test | null) => void
  onTestHover: (test: Test | null) => void
  selectedTest: Test | null
  hoveredTest: Test | null
}

const categoryConfig: Record<string, { icon: any; color: string; gradient: string; bgGradient: string }> = {
  "Complete Blood Count": {
    icon: Droplet,
    color: "text-rose-400",
    gradient: "from-rose-500 to-red-500",
    bgGradient: "from-rose-500/10 to-red-500/5"
  },
  "Metabolic Panel": {
    icon: Activity,
    color: "text-sky-400",
    gradient: "from-sky-500 to-blue-500",
    bgGradient: "from-sky-500/10 to-blue-500/5"
  },
  "Lipid Profile": {
    icon: Heart,
    color: "text-pink-400",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/10 to-rose-500/5"
  },
  "Liver Function": {
    icon: Beaker,
    color: "text-amber-400",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/10 to-orange-500/5"
  },
  "Kidney Function": {
    icon: Shield,
    color: "text-emerald-400",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/5"
  },
  "Thyroid Function": {
    icon: Flame,
    color: "text-orange-400",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/5"
  },
  "Vitamins & Minerals": {
    icon: Zap,
    color: "text-sky-400",
    gradient: "from-sky-500 to-cyan-500",
    bgGradient: "from-sky-500/10 to-cyan-500/5"
  },
  "Other": {
    icon: Activity,
    color: "text-slate-400",
    gradient: "from-slate-500 to-gray-500",
    bgGradient: "from-slate-500/10 to-gray-500/5"
  },
}

const statusConfig = {
  normal: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    glowClass: "",
  },
  borderline: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    glowClass: "shadow-amber-500/10",
  },
  abnormal: {
    icon: AlertCircle,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    glowClass: "shadow-rose-500/20",
  },
}

function RangeVisualization({ test, animate = true }: { test: Test; animate?: boolean }) {
  const { value, normalRange, status } = test
  const range = normalRange.max - normalRange.min
  const extendedMin = normalRange.min - range * 0.4
  const extendedMax = normalRange.max + range * 0.4
  const totalRange = extendedMax - extendedMin

  const normalStartPercent = ((normalRange.min - extendedMin) / totalRange) * 100
  const normalWidthPercent = ((normalRange.max - normalRange.min) / totalRange) * 100
  const valuePercent = Math.max(0, Math.min(100, ((value - extendedMin) / totalRange) * 100))

  const markerColor = status === "normal"
    ? "bg-emerald-400"
    : status === "borderline"
      ? "bg-amber-400"
      : "bg-rose-400"

  const markerGlow = status === "normal"
    ? "shadow-emerald-400/50"
    : status === "borderline"
      ? "shadow-amber-400/50"
      : "shadow-rose-400/50"

  return (
    <div className="relative h-2 group">
      {/* Background track */}
      <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
        {/* Normal range highlight */}
        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute h-full bg-gradient-to-r from-emerald-500/20 via-emerald-500/30 to-emerald-500/20 rounded-full"
          style={{
            left: `${normalStartPercent}%`,
            width: `${normalWidthPercent}%`
          }}
        />
      </div>

      {/* Min/Max labels on hover */}
      <div className="absolute -bottom-5 left-0 text-[9px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {normalRange.min}
      </div>
      <div className="absolute -bottom-5 right-0 text-[9px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {normalRange.max}
      </div>

      {/* Value marker */}
      <motion.div
        initial={animate ? { left: "0%", opacity: 0, scale: 0.5 } : false}
        animate={{ left: `${valuePercent}%`, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        <div className={`w-3.5 h-3.5 rounded-full ${markerColor} shadow-lg ${markerGlow} ring-2 ring-background`} />
      </motion.div>
    </div>
  )
}

function HealthScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreColor = () => {
    if (score >= 80) return { stroke: "url(#scoreGradientGood)", text: "text-emerald-400" }
    if (score >= 60) return { stroke: "url(#scoreGradientOk)", text: "text-amber-400" }
    return { stroke: "url(#scoreGradientBad)", text: "text-rose-400" }
  }

  const colors = getScoreColor()

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id="scoreGradientGood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="scoreGradientOk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="scoreGradientBad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-white/5"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
          className={`text-3xl font-bold ${colors.text}`}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health Score</span>
      </div>
    </div>
  )
}

export default function ResultsPanel({
  data,
  onTestSelect,
  onTestHover,
  selectedTest,
  hoveredTest
}: ResultsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [hasInitialized, setHasInitialized] = useState(false)

  // Parse the data
  const tests: Test[] = useMemo(() => {
    return data.tests?.map((test: any, idx: number) => ({
      id: `test-${idx}`,
      name: test.test_name,
      value: Number.parseFloat(test.value) || 0,
      unit: test.unit || "",
      normalRange: {
        min: Number.parseFloat(test.normal_range?.split("-")[0]) || 0,
        max: Number.parseFloat(test.normal_range?.split("-")[1]) || 100,
      },
      status: test.status === "Normal" ? "normal" : test.status === "High" || test.status === "Low" ? "abnormal" : "borderline",
      category: test.category || "Other",
    })) || []
  }, [data])

  // Group by category
  const categorizedTests = useMemo(() => {
    return tests.reduce((acc: Record<string, Test[]>, test) => {
      if (!acc[test.category]) acc[test.category] = []
      acc[test.category].push(test)
      return acc
    }, {})
  }, [tests])

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalTests = tests.length
    const abnormalTests = tests.filter((t) => t.status === "abnormal").length
    const borderlineTests = tests.filter((t) => t.status === "borderline").length
    const normalTests = tests.filter((t) => t.status === "normal").length
    const healthScore = totalTests > 0
      ? Math.round(((totalTests - abnormalTests * 1.5 - borderlineTests * 0.5) / totalTests) * 100)
      : 100
    return { totalTests, abnormalTests, borderlineTests, normalTests, healthScore: Math.max(0, Math.min(100, healthScore)) }
  }, [tests])

  // Auto-expand categories with abnormal results on mount
  useEffect(() => {
    if (!hasInitialized && Object.keys(categorizedTests).length > 0) {
      const initialExpanded = new Set<string>()
      Object.entries(categorizedTests).forEach(([category, categoryTests], idx) => {
        if (idx === 0 || categoryTests.some(t => t.status === "abnormal")) {
          initialExpanded.add(category)
        }
      })
      setExpandedCategories(initialExpanded)
      setHasInitialized(true)
    }
  }, [categorizedTests, hasInitialized])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const handleTestClick = (test: Test) => {
    if (selectedTest?.id === test.id) {
      onTestSelect(null)
    } else {
      onTestSelect(test)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-6">
      {/* Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-sky-500/10" />
        <div className="relative p-6 rounded-2xl glass-card">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score Ring */}
            <HealthScoreRing score={stats.healthScore} />

            {/* Stats */}
            <div className="flex-1 w-full">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white/90 mb-1">Overall Assessment</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.totalTests} biomarkers analyzed from your report
                </p>
              </div>

              {/* Mini stat cards */}
              <div className="grid grid-cols-3 gap-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="text-xl font-bold text-emerald-400">{stats.normalTests}</div>
                  <div className="text-[10px] text-emerald-400/70 uppercase tracking-wide">Normal</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                >
                  <div className="text-xl font-bold text-amber-400">{stats.borderlineTests}</div>
                  <div className="text-[10px] text-amber-400/70 uppercase tracking-wide">Borderline</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`p-3 rounded-xl border ${stats.abnormalTests > 0
                    ? "bg-rose-500/10 border-rose-500/30"
                    : "bg-rose-500/5 border-rose-500/10"
                    }`}
                >
                  <div className="text-xl font-bold text-rose-400">{stats.abnormalTests}</div>
                  <div className="text-[10px] text-rose-400/70 uppercase tracking-wide">Abnormal</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Attention Alert */}
      <AnimatePresence>
        {stats.abnormalTests > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-rose-300 text-sm mb-0.5">Attention Required</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stats.abnormalTests} test{stats.abnormalTests > 1 ? 's' : ''} outside normal range.
                  Hover or tap on highlighted cards to see details in the insights panel.
                </p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-all flex-shrink-0">
                <Sparkles className="w-3 h-3" />
                Ask AI
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="space-y-3">
        {Object.entries(categorizedTests).map(([category, categoryTests], categoryIdx) => {
          const config = categoryConfig[category] || categoryConfig["Other"]
          const Icon = config.icon
          const isExpanded = expandedCategories.has(category)
          const categoryAbnormals = categoryTests.filter(t => t.status === "abnormal").length
          const categoryBorderlines = categoryTests.filter(t => t.status === "borderline").length

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + categoryIdx * 0.05 }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-xl 
                  bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10
                  transition-all duration-300 mb-2 group
                  ${categoryAbnormals > 0 ? 'border-rose-500/20 bg-rose-500/[0.02]' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.bgGradient} flex items-center justify-center border border-white/5`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-sm text-white/90">{category}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{categoryTests.length} tests</span>
                      {categoryAbnormals > 0 && (
                        <span className="flex items-center gap-1 text-rose-400">
                          <span className="w-1 h-1 rounded-full bg-rose-400" />
                          {categoryAbnormals} abnormal
                        </span>
                      )}
                      {categoryBorderlines > 0 && categoryAbnormals === 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <span className="w-1 h-1 rounded-full bg-amber-400" />
                          {categoryBorderlines} borderline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>

              {/* Test Cards */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                      {categoryTests.map((test, testIdx) => {
                        const testConfig = statusConfig[test.status]
                        const StatusIcon = testConfig.icon
                        const isSelected = selectedTest?.id === test.id
                        const isHovered = hoveredTest?.id === test.id
                        const isHighlighted = isSelected || isHovered

                        return (
                          <motion.div
                            key={test.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: testIdx * 0.02 }}
                            onMouseEnter={() => onTestHover(test)}
                            onMouseLeave={() => onTestHover(null)}
                            onClick={() => handleTestClick(test)}
                            className={`
                              relative p-4 rounded-xl border cursor-pointer
                              transition-all duration-200 group/card
                              ${testConfig.borderColor} ${testConfig.bgColor}
                              ${isHighlighted
                                ? "ring-1 ring-primary/50 scale-[1.01] shadow-lg shadow-primary/10 bg-primary/5"
                                : "hover:bg-white/[0.04] hover:border-white/10"
                              }
                              ${test.status === "abnormal" ? "shadow-lg shadow-rose-500/10" : ""}
                            `}
                          >
                            {/* Abnormal indicator dot */}
                            {test.status === "abnormal" && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-400"
                              />
                            )}

                            {/* Content */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-white/90 truncate mb-0.5">{test.name}</h4>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-mono font-semibold text-white">{test.value}</span>
                                  <span className="text-xs text-muted-foreground">{test.unit}</span>
                                </div>
                              </div>
                              <div className={`w-7 h-7 rounded-lg ${testConfig.bgColor} flex items-center justify-center border ${testConfig.borderColor}`}>
                                <StatusIcon className={`w-3.5 h-3.5 ${testConfig.color}`} />
                              </div>
                            </div>

                            {/* Range Visualization */}
                            <RangeVisualization test={test} animate={true} />

                            {/* Hover hint */}
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: isHighlighted ? 1 : 0, y: isHighlighted ? 0 : 5 }}
                              className="mt-3 flex items-center justify-between text-[10px]"
                            >
                              <span className={`${testConfig.color} font-medium`}>
                                {test.status === "normal" ? "Within range" : test.status === "borderline" ? "Near boundary" : "Outside range"}
                              </span>
                              <span className="flex items-center gap-1 text-primary">
                                View insights <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
