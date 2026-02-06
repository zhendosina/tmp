"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Info, TrendingUp, TrendingDown, Users, Heart, Activity,
  AlertCircle, CheckCircle, Lightbulb, BookOpen, ChevronRight,
  Shield, Beaker, Droplet, MessageCircle
} from "lucide-react"
import { useMemo } from "react"

interface Test {
  id: string
  name: string
  value: number
  unit: string
  normalRange: { min: number; max: number }
  status: "normal" | "borderline" | "abnormal"
  category: string
}

interface InsightsPanelProps {
  selectedTest: Test | null
  hoveredTest: Test | null
  allData: any
  onAskAI?: (context: string) => void
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

// Status translations
const statusTranslations: Record<string, string> = {
  "Normal": "Норма",
  "High": "Повышено",
  "Low": "Понижено",
  "Borderline": "Погранично"
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

// Comprehensive test definitions database
const testDefinitions: Record<string, {
  definition: string
  purpose: string
  implications: { high?: string; low?: string; normal?: string }
  relatedTests: string[]
  tips: string[]
  icon: any
}> = {
  "WBC": {
    definition: "White Blood Cells (Leukocytes) are immune cells that help fight infections, viruses, and foreign invaders in your body.",
    purpose: "Measures immune system health and ability to fight infections.",
    implications: {
      high: "May indicate infection, inflammation, stress, allergic reaction, or in rare cases, leukemia.",
      low: "May suggest bone marrow problems, autoimmune conditions, or immunodeficiency.",
      normal: "Your immune system appears to be functioning well."
    },
    relatedTests: ["Neutrophils", "Lymphocytes", "Monocytes", "Basophils", "Eosinophils"],
    tips: ["Stay well-rested", "Manage stress levels", "Maintain good hygiene"],
    icon: Shield
  },
  "RBC": {
    definition: "Red Blood Cells (Erythrocytes) carry oxygen from your lungs to all tissues and organs throughout your body.",
    purpose: "Evaluates oxygen-carrying capacity and overall blood health.",
    implications: {
      high: "May indicate dehydration, lung disease, or polycythemia.",
      low: "Often indicates anemia, blood loss, or nutritional deficiency.",
      normal: "Your red blood cells are adequately carrying oxygen."
    },
    relatedTests: ["Hemoglobin", "Hematocrit", "MCV", "MCH", "MCHC"],
    tips: ["Eat iron-rich foods", "Stay hydrated", "Consider B12 and folate"],
    icon: Droplet
  },
  "Hemoglobin": {
    definition: "Hemoglobin is the iron-rich protein in red blood cells responsible for carrying oxygen throughout your body.",
    purpose: "Primary indicator for diagnosing anemia and blood disorders.",
    implications: {
      high: "May indicate dehydration, lung conditions, or living at high altitude.",
      low: "Primary indicator of anemia; may cause fatigue and weakness.",
      normal: "Your blood is carrying oxygen efficiently."
    },
    relatedTests: ["RBC", "Hematocrit", "Iron", "Ferritin"],
    tips: ["Include lean meats and leafy greens", "Vitamin C helps iron absorption", "Avoid tea/coffee with meals"],
    icon: Heart
  },
  "Hematocrit": {
    definition: "Hematocrit measures the percentage of your blood volume that consists of red blood cells.",
    purpose: "Helps diagnose anemia, dehydration, and other blood conditions.",
    implications: {
      high: "May indicate dehydration or polycythemia vera.",
      low: "Suggests anemia or fluid overload.",
      normal: "Your blood has a healthy red cell concentration."
    },
    relatedTests: ["RBC", "Hemoglobin", "MCV"],
    tips: ["Monitor hydration levels", "Regular exercise helps"],
    icon: Activity
  },
  "Platelets": {
    definition: "Platelets (Thrombocytes) are small blood cells essential for clotting and wound healing.",
    purpose: "Evaluates blood clotting ability and bleeding risk.",
    implications: {
      high: "May increase clot risk; could indicate inflammation or bone marrow disorder.",
      low: "Increases bleeding risk; may indicate viral infection or medication effect.",
      normal: "Your blood clotting mechanism is functioning properly."
    },
    relatedTests: ["MPV", "PT", "INR", "aPTT"],
    tips: ["Avoid excessive alcohol", "Report unusual bruising", "Some medications affect platelets"],
    icon: Shield
  },
  "Glucose": {
    definition: "Blood glucose measures the amount of sugar in your blood, your body's primary energy source.",
    purpose: "Screens for diabetes and monitors blood sugar control.",
    implications: {
      high: "May indicate diabetes, prediabetes, or stress response.",
      low: "Can cause dizziness and confusion; may indicate medication effects.",
      normal: "Your blood sugar is well-controlled."
    },
    relatedTests: ["HbA1c", "Fasting Insulin", "OGTT"],
    tips: ["Limit refined sugars", "Regular physical activity", "Eat balanced meals"],
    icon: Activity
  },
  "Cholesterol": {
    definition: "Total cholesterol measures all types of cholesterol in your blood, important for heart health assessment.",
    purpose: "Evaluates cardiovascular disease risk.",
    implications: {
      high: "Increases risk of heart disease and stroke.",
      low: "Very low levels may affect hormone production.",
      normal: "Your cholesterol levels support good heart health."
    },
    relatedTests: ["LDL", "HDL", "Triglycerides", "VLDL"],
    tips: ["Increase fiber intake", "Choose healthy fats", "Regular cardio exercise"],
    icon: Heart
  },
  "Creatinine": {
    definition: "Creatinine is a waste product from muscle metabolism, filtered by your kidneys.",
    purpose: "Primary marker for kidney function assessment.",
    implications: {
      high: "May indicate kidney dysfunction or dehydration.",
      low: "Could suggest low muscle mass or liver disease.",
      normal: "Your kidneys are filtering waste effectively."
    },
    relatedTests: ["BUN", "eGFR", "Uric Acid"],
    tips: ["Stay well hydrated", "Limit protein if advised", "Avoid NSAIDs overuse"],
    icon: Beaker
  },
}

// Helper to get test info with fallback
function getTestInfo(testName: string) {
  // Try exact match first
  if (testDefinitions[testName]) return testDefinitions[testName]

  // Try partial match
  const key = Object.keys(testDefinitions).find(k =>
    testName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(testName.toLowerCase())
  )

  return key ? testDefinitions[key] : null
}

// Range position indicator component
function RangeIndicator({ test }: { test: Test }) {
  const { value, normalRange, status } = test
  const range = normalRange.max - normalRange.min
  const extendedMin = normalRange.min - range * 0.4
  const extendedMax = normalRange.max + range * 0.4
  const totalRange = extendedMax - extendedMin

  const normalStartPercent = ((normalRange.min - extendedMin) / totalRange) * 100
  const normalWidthPercent = ((normalRange.max - normalRange.min) / totalRange) * 100
  const valuePercent = Math.max(0, Math.min(100, ((value - extendedMin) / totalRange) * 100))

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-mono font-bold text-foreground">{test.value}</div>
          <div className="text-xs text-muted-foreground">{test.unit}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Референс</div>
          <div className="text-sm font-medium text-foreground/80">
            {test.normalRange.min} - {test.normalRange.max} {test.unit}
          </div>
        </div>
      </div>

      {/* Visual gauge */}
      <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden">
        {/* Low zone */}
        <div
          className="absolute h-full bg-warning/20"
          style={{ left: 0, width: `${normalStartPercent}%` }}
        />
        {/* Normal zone */}
        <div
          className="absolute h-full bg-success/25"
          style={{ left: `${normalStartPercent}%`, width: `${normalWidthPercent}%` }}
        />
        {/* High zone */}
        <div
          className="absolute h-full bg-danger/20"
          style={{ left: `${normalStartPercent + normalWidthPercent}%`, right: 0 }}
        />

        {/* Labels */}
        <div className="absolute inset-0 flex items-center px-2 text-[8px] font-medium">
          <span className="text-warning/70" style={{ width: `${normalStartPercent}%` }}>НИЗКО</span>
          <span className="text-success/70 text-center" style={{ width: `${normalWidthPercent}%` }}>НОРМА</span>
          <span className="text-danger/70 text-right flex-1">ВЫСОКО</span>
        </div>

        {/* Value marker */}
        <motion.div
          initial={{ left: "0%", scale: 0 }}
          animate={{ left: `${valuePercent}%`, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
        >
          <div className={`w-4 h-4 rounded-full shadow-lg ring-2 ring-background ${status === "normal" ? "bg-success" : status === "borderline" ? "bg-warning" : "bg-danger"
            }`}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-card border border-border">
              {test.value}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Health Summary Component (shown when no test is selected)
function HealthSummary({ allData }: { allData: any }) {
  const analysis = useMemo(() => {
    const tests = allData.tests || []
    const totalTests = tests.length
    const abnormal = tests.filter((t: any) => t.status === "High" || t.status === "Low").length
    const normal = tests.filter((t: any) => t.status === "Normal").length

    // Group by category
    const categories: Record<string, { total: number; abnormal: number }> = {}
    tests.forEach((t: any) => {
      const cat = t.category || "Other"
      if (!categories[cat]) categories[cat] = { total: 0, abnormal: 0 }
      categories[cat].total++
      if (t.status === "High" || t.status === "Low") categories[cat].abnormal++
    })

    const abnormalTests = tests.filter((t: any) => t.status === "High" || t.status === "Low")

    return { totalTests, abnormal, normal, categories, abnormalTests }
  }, [allData])

  const getCategoryIcon = (cat: string) => {
    if (cat.includes("Blood")) return Droplet
    if (cat.includes("Lipid") || cat.includes("Heart")) return Heart
    if (cat.includes("Liver")) return Beaker
    if (cat.includes("Kidney")) return Shield
    return Activity
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center pb-4 border-b border-border">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-3 flex items-center justify-center border border-border pulse-life"
        >
          <Activity className="w-7 h-7 text-primary" />
        </motion.div>
        <h3 className="text-lg font-serif font-medium text-foreground mb-1">Обзор здоровья</h3>
        <p className="text-xs text-muted-foreground">
          Наведите или нажмите на любой анализ для детальной информации
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-3 rounded-xl bg-success/10 border border-success/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-success/80 font-medium">Норма</span>
          </div>
          <div className="text-2xl font-mono font-bold text-success">{analysis.normal}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-3 rounded-xl border ${analysis.abnormal > 0
            ? "bg-danger/10 border-danger/20"
            : "bg-muted/30 border-border"
            }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-4 h-4 ${analysis.abnormal > 0 ? "text-danger" : "text-muted-foreground"}`} />
            <span className={`text-xs font-medium ${analysis.abnormal > 0 ? "text-danger/80" : "text-muted-foreground"}`}>Внимание</span>
          </div>
          <div className={`text-2xl font-mono font-bold ${analysis.abnormal > 0 ? "text-danger" : "text-muted-foreground"}`}>
            {analysis.abnormal}
          </div>
        </motion.div>
      </div>

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-4 rounded-xl bg-card border border-border"
      >
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">По категориям</h4>
        <div className="space-y-2">
          {Object.entries(analysis.categories).map(([cat, data], idx) => {
            const Icon = getCategoryIcon(cat)
            const isHealthy = data.abnormal === 0
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isHealthy ? "text-muted-foreground" : "text-danger"}`} />
                  <span className="text-sm text-foreground/80">{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isHealthy && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/20 text-danger font-medium">
                      {data.abnormal} проблем{data.abnormal > 1 ? '' : 'а'}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{data.total} анализов</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Abnormal tests quick list */}
      {analysis.abnormalTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-danger/5 border border-danger/20"
        >
          <h4 className="text-xs font-medium text-danger/80 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Анализы требующие внимания
          </h4>
          <div className="space-y-1.5">
            {analysis.abnormalTests.slice(0, 4).map((test: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground/80">{testNameTranslations[test.test_name] || test.test_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${test.status === "High" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"
                  }`}>
                  {test.value} {test.unit} ({test.status === "High" ? "Повышено" : test.status === "Low" ? "Понижено" : test.status})
                </span>
              </div>
            ))}
            {analysis.abnormalTests.length > 4 && (
              <p className="text-xs text-muted-foreground pt-1">
                +{analysis.abnormalTests.length - 4} еще...
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Pro tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Совет</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Наведите на любую карточку анализа слева для мгновенных объяснений. Нажмите для фиксации просмотра и изучения деталей.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Test Details Component
function TestDetails({ test, onAskAI }: { test: Test; onAskAI?: (context: string) => void }) {
  const testInfo = getTestInfo(test.name)
  const Icon = testInfo?.icon || Activity

  const getStatusImplication = () => {
    if (!testInfo) return null
    if (test.status === "normal") return testInfo.implications.normal
    if (test.value > test.normalRange.max) return testInfo.implications.high
    return testInfo.implications.low
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{categoryTranslations[test.category] || test.category}</div>
            <h2 className="text-xl font-serif font-medium text-foreground">{testNameTranslations[test.name] || test.name}</h2>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${test.status === "normal"
            ? "bg-success/20 text-success"
            : test.status === "borderline"
              ? "bg-warning/20 text-warning"
              : "bg-danger/20 text-danger"
            }`}>
            {test.status === "normal" ? "Норма" : test.status === "borderline" ? "Погранично" : "Отклонение"}
          </div>
        </div>

        {/* Result visualization */}
        <RangeIndicator test={test} />
      </div>

      {/* Definition */}
      {testInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What is this?</h4>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{testInfo.definition}</p>
        </motion.div>
      )}

      {/* Implications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`p-4 rounded-xl border ${test.status === "normal"
          ? "bg-success/5 border-success/20"
          : test.status === "borderline"
            ? "bg-warning/5 border-warning/20"
            : "bg-danger/5 border-danger/20"
          }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {test.status === "normal" ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : test.value > test.normalRange.max ? (
            <TrendingUp className="w-4 h-4 text-danger" />
          ) : (
            <TrendingDown className="w-4 h-4 text-warning" />
          )}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Что это означает</h4>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {getStatusImplication() || (
            test.status === "normal"
              ? "Ваш результат в пределах нормы."
              : `Ваш результат ${test.value > test.normalRange.max ? "выше" : "ниже"} нормы. Рекомендуем обсудить с врачом.`
          )}
        </p>
        {test.status !== "normal" && (
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Всегда проконсультируйтесь с врачом для правильной интерпретации.
          </p>
        )}
      </motion.div>

      {/* Tips */}
      {testInfo && testInfo.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-warning" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tips</h4>
          </div>
          <ul className="space-y-2">
            {testInfo.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground/70">
                <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Related Tests */}
      {testInfo && testInfo.relatedTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Related Tests</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {testInfo.relatedTests.map((relatedTest) => (
              <span
                key={relatedTest}
                className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs text-foreground/70"
              >
                {relatedTest}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Ask AI CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
<h4 className="font-medium text-foreground mb-1">Хотите узнать больше?</h4>
             <p className="text-xs text-muted-foreground mb-3">
               Спросите нашего ИИ-ассистента об этом конкретном анализе
             </p>
            <button
              onClick={() => onAskAI?.(`Расскажите подробнее о моем результате ${testNameTranslations[test.name] || test.name}: ${test.value} ${test.unit}`)}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              Спросить о {testNameTranslations[test.name] || test.name}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function InsightsPanel({ selectedTest, hoveredTest, allData, onAskAI }: InsightsPanelProps) {
  // Active test is selected test, or hovered test if nothing is selected
  const activeTest = selectedTest || hoveredTest
  const isHoverMode = !selectedTest && hoveredTest

  return (
    <div className="h-full">
      {/* Mode indicator */}
      {isHoverMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">Режим предпросмотра</span>
          <span className="text-xs text-muted-foreground ml-auto">Нажмите для фиксации</span>
        </motion.div>
      )}

      {selectedTest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3 py-2 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2"
        >
          <CheckCircle className="w-3.5 h-3.5 text-success" />
          <span className="text-xs text-success font-medium">Просмотр деталей</span>
          <span className="text-xs text-muted-foreground ml-auto">Нажмите снова для разблокировки</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {activeTest ? (
          <motion.div
            key={activeTest.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TestDetails test={activeTest} onAskAI={onAskAI} />
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <HealthSummary allData={allData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
