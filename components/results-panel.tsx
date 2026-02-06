"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Activity, Droplets, Heart, Zap, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, AlertTriangle, Beaker, Flame, Shield,
  ChevronDown, ArrowRight, MessageCircle
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

// Category translations
const categoryTranslations: Record<string, string> = {
  "Complete Blood Count": "Общий анализ крови",
  "Metabolic Panel": "Метаболическая панель",
  "Lipid Profile": "Липидный профиль",
  "Liver Function": "Функция печени",
  "Kidney Function": "Функция почек",
  "Thyroid Function": "Функция щитовидной железы",
  "Vitamins & Minerals": "Витамины и минералы",
  "Other": "Другое"
}

// Test name translations
const testNameTranslations: Record<string, string> = {
  "WBC": "Лейкоциты",
  "RBC": "Эритроциты",
  "Hemoglobin": "Гемоглобин",
  "Hematocrit": "Гематокрит",
  "Platelets": "Тромбоциты",
  "MCV": "Средний объем эритроцита",
  "MCH": "Среднее содержание Hb",
  "MCHC": "Средняя концентрация Hb",
  "RDW": "Ширина распределения эритроцитов",
  "Glucose": "Глюкоза",
  "Creatinine": "Креатинин",
  "Urea": "Мочевина",
  "Uric Acid": "Мочевая кислота",
  "Total Protein": "Общий белок",
  "Albumin": "Альбумин",
  "Globulin": "Глобулин",
  "Bilirubin": "Билирубин",
  "ALT": "АЛТ",
  "AST": "АСТ",
  "ALP": "ЩФ",
  "GGT": "ГГТ",
  "Cholesterol": "Холестерин",
  "Triglycerides": "Триглицериды",
  "HDL": "ЛПВП",
  "LDL": "ЛПНП",
  "VLDL": "ЛПОНП",
  "Sodium": "Натрий",
  "Potassium": "Калий",
  "Calcium": "Кальций",
  "Phosphorus": "Фосфор",
  "Magnesium": "Магний",
  "Iron": "Железо",
  "Ferritin": "Ферритин",
  "Vitamin D": "Витамин D",
  "Vitamin B12": "Витамин B12",
  "Folate": "Фолат",
  "TSH": "ТТГ",
  "T3": "Т3",
  "T4": "Т4",
  "C-Reactive Protein": "С-реактивный белок",
  "ESR": "СОЭ",
  "Neutrophils": "Нейтрофилы",
  "Lymphocytes": "Лимфоциты",
  "Monocytes": "Моноциты",
  "Eosinophils": "Эозинофилы",
  "Basophils": "Базофилы",
  "Insulin": "Инсулин",
  "Amylase pancreatic": "Панкреатическая амилаза",
  "HOMA-IR": "HOMA-IR",
  "Testosterone": "Тестостерон",
  "SHBG": "ГСПГ",
  "Free Androgen Index": "Индекс свободных андрогенов",
  "Free Testosterone": "Свободный тестостерон",
  "Cortisol": "Кортизол",
  "Total PSA": "Общий ПСА",
  "Prolactin": "Пролактин",
  "DHEA-S": "ДГЭА-С",
  "Estradiol": "Эстрадиол",
  "Progesterone": "Прогестерон",
  "LH": "ЛГ",
  "FSH": "ФСГ"
}

// Status translations
const statusTranslations: Record<string, string> = {
  "Normal": "Норма",
  "High": "Повышено",
  "Low": "Понижено",
  "Borderline": "Погранично"
}

const categoryConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  "Complete Blood Count": {
    icon: Droplets,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  "Metabolic Panel": {
    icon: Activity,
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  "Lipid Profile": {
    icon: Heart,
    color: "text-danger",
    bgColor: "bg-danger/10"
  },
  "Liver Function": {
    icon: Beaker,
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  "Kidney Function": {
    icon: Shield,
    color: "text-success",
    bgColor: "bg-success/10"
  },
  "Thyroid Function": {
    icon: Flame,
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  "Vitamins & Minerals": {
    icon: Zap,
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  "Other": {
    icon: Activity,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50"
  },
}

const statusConfig = {
  normal: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    label: "Normal",
  },
  borderline: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    label: "Borderline",
  },
  abnormal: {
    icon: AlertCircle,
    color: "text-danger",
    bgColor: "bg-danger/10",
    borderColor: "border-danger/30",
    label: "Отклонения",
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
    ? "bg-success"
    : status === "borderline"
      ? "bg-warning"
      : "bg-danger"

  return (
    <div className="relative h-2.5 group mt-3">
      {/* Background track */}
      <div className="absolute inset-0 bg-muted/50 rounded-full overflow-hidden">
        {/* Normal range highlight */}
        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute h-full bg-success/20 rounded-full"
          style={{
            left: `${normalStartPercent}%`,
            width: `${normalWidthPercent}%`
          }}
        />
      </div>

      {/* Value marker */}
      <motion.div
        initial={animate ? { left: "0%", opacity: 0, scale: 0.5 } : false}
        animate={{ left: `${valuePercent}%`, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
      >
        <div className={`w-4 h-4 rounded-full ${markerColor} shadow-lg ring-2 ring-background`} />
      </motion.div>
    </div>
  )
}

function HealthScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreColor = () => {
    if (score >= 80) return { stroke: "url(#scoreGradientGood)", text: "text-success", label: "Excellent" }
    if (score >= 60) return { stroke: "url(#scoreGradientOk)", text: "text-warning", label: "Good" }
    return { stroke: "url(#scoreGradientBad)", text: "text-danger", label: "Needs Attention" }
  }

  const colors = getScoreColor()

  return (
    <div className="relative health-ring" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id="scoreGradientGood" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.65 0.14 145)" />
            <stop offset="100%" stopColor="oklch(0.70 0.16 145)" />
          </linearGradient>
          <linearGradient id="scoreGradientOk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.70 0.15 70)" />
            <stop offset="100%" stopColor="oklch(0.75 0.16 70)" />
          </linearGradient>
          <linearGradient id="scoreGradientBad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.60 0.18 25)" />
            <stop offset="100%" stopColor="oklch(0.65 0.16 25)" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth="10"
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
          className={`text-4xl font-serif font-medium ${colors.text}`}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{colors.label}</span>
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
        className="relative overflow-hidden rounded-2xl card-warm p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score Ring */}
          <HealthScoreRing score={stats.healthScore} />

          {/* Stats */}
          <div className="flex-1 w-full">
            <div className="mb-4">
              <h2 className="text-xl font-serif font-medium text-foreground mb-1">Ваши результаты</h2>
              <p className="text-sm text-muted-foreground">
                {stats.totalTests} биомаркеров проанализировано из вашего отчета
              </p>
            </div>

            {/* Mini stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-3 rounded-xl bg-success/10 border border-success/20"
              >
                <div className="text-2xl font-mono font-bold text-success">{stats.normalTests}</div>
                <div className="text-[10px] text-success/80 uppercase tracking-wide font-medium">Норма</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-3 rounded-xl bg-warning/10 border border-warning/20"
              >
                <div className="text-2xl font-mono font-bold text-warning">{stats.borderlineTests}</div>
                <div className="text-[10px] text-warning/80 uppercase tracking-wide font-medium">Погранично</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`p-3 rounded-xl border ${stats.abnormalTests > 0
                  ? "bg-danger/10 border-danger/30"
                  : "bg-danger/5 border-danger/10"
                  }`}
              >
                <div className="text-2xl font-mono font-bold text-danger">{stats.abnormalTests}</div>
                <div className="text-[10px] text-danger/80 uppercase tracking-wide font-medium">Отклонение</div>
              </motion.div>
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
            className="p-4 rounded-xl bg-danger/5 border border-danger/20 breathe-danger"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-medium text-danger text-base mb-1">Требуется внимание</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stats.abnormalTests} анализ{stats.abnormalTests > 1 ? 'ов' : ''} вне нормы.
                  Нажмите на любую карточку для детальной информации.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium transition-all flex-shrink-0 border border-danger/20">
                <MessageCircle className="w-4 h-4" />
                Спросить ИИ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="space-y-4">
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
                  w-full flex items-center justify-between p-4 rounded-xl
                  card-warm transition-all duration-300 group
                  ${categoryAbnormals > 0 ? 'border-danger/30' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${config.bgColor} flex items-center justify-center border border-border/50`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-serif font-medium text-foreground">{categoryTranslations[category] || category}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{categoryTests.length} анализов</span>
                      {categoryAbnormals > 0 && (
                        <span className="flex items-center gap-1 text-danger font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                          {categoryAbnormals} отклонений
                        </span>
                      )}
                      {categoryBorderlines > 0 && categoryAbnormals === 0 && (
                        <span className="flex items-center gap-1 text-warning font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                          {categoryBorderlines} пограничных
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
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
                              transition-all duration-200 card-interactive
                              ${testConfig.borderColor} ${testConfig.bgColor}
                              ${isHighlighted
                                ? "ring-2 ring-primary/50 scale-[1.01] shadow-lg"
                                : "hover:shadow-md"
                              }
                              ${test.status === "abnormal" ? "breathe-danger" : ""}
                            `}
                          >
                            {/* Abnormal indicator dot */}
                            {test.status === "abnormal" && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-danger"
                              />
                            )}

                            {/* Content */}
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground truncate">{testNameTranslations[test.name] || test.name}</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                  <span className="text-2xl font-mono font-semibold text-foreground">{test.value}</span>
                                  <span className="text-xs text-muted-foreground">{test.unit}</span>
                                </div>
                              </div>
                              <div className={`w-8 h-8 rounded-lg ${testConfig.bgColor} flex items-center justify-center border ${testConfig.borderColor}`}>
                                <StatusIcon className={`w-4 h-4 ${testConfig.color}`} />
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
                                {statusTranslations[testConfig.label] || testConfig.label}
                              </span>
                              <span className="flex items-center gap-1 text-primary font-medium">
                                Подробнее <ArrowRight className="w-3 h-3" />
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
