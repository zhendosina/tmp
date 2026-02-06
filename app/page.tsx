"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UploadZone from "@/components/upload-zone"
import ResultsPanel from "@/components/results-panel"
import InsightsPanel from "@/components/insights-panel"
import ChatDrawer from "@/components/chat-drawer"
import ExportModal from "@/components/export-modal"
import MobileInsightsSheet from "@/components/mobile-insights-sheet"
import {
  Upload, Download, Activity, Shield,
  HeartPulse, FileText, ArrowRight,
  Lock, Clock, Droplets, Info
} from "lucide-react"
import { OcrUnlockDialog } from "@/components/ocr-unlock-dialog"

// Organic floating shape component
function OrganicBlob({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        delay,
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`absolute rounded-full blur-3xl ${className}`}
    />
  )
}

export default function Home() {
  const [step, setStep] = useState<"upload" | "results">("upload")
  const [testData, setTestData] = useState<any>(null)
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [hoveredTest, setHoveredTest] = useState<any>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatContext, setChatContext] = useState<string>("")
  const [exportOpen, setExportOpen] = useState(false)
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false)
  const [ocrUnlocked, setOcrUnlocked] = useState(false)
  const [ocrPassphrase, setOcrPassphrase] = useState("")
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false)

  // Storage key for persisting results
  const STORAGE_KEY = "bloodparser_results"

  // Load saved results on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        // Check if data is recent (less than 24 hours old)
        const savedAt = parsed._savedAt
        const isRecent = savedAt && (Date.now() - savedAt) < 24 * 60 * 60 * 1000
        if (isRecent && parsed.tests?.length > 0) {
          setTestData(parsed)
          setStep("results")
        } else {
          // Clear stale data
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Hydrate OCR state from sessionStorage
  useEffect(() => {
    try {
      const unlocked = window.sessionStorage.getItem("ocrUnlocked") === "true"
      const phrase = window.sessionStorage.getItem("ocrPassphrase") || ""
      if (unlocked && phrase) {
        setOcrUnlocked(true)
        setOcrPassphrase(phrase)
      }
    } catch {
      // ignore
    }
  }, [])

  // Save results when they change
  useEffect(() => {
    if (testData && testData.tests?.length > 0) {
      try {
        const dataToSave = { ...testData, _savedAt: Date.now() }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      } catch {
        // Ignore quota errors
      }
    }
  }, [testData])

  const handleUploadComplete = (data: any) => {
    setTestData(data)
    setStep("results")
  }

  const handleReset = () => {
    setStep("upload")
    setTestData(null)
    setSelectedTest(null)
    setHoveredTest(null)
    // Clear saved data
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore errors
    }
  }

  const handleTestHover = useCallback((test: any) => {
    setHoveredTest(test)
  }, [])

  const handleTestSelect = useCallback((test: any) => {
    setSelectedTest(test)
    setHoveredTest(null)
    // Open mobile insights sheet on mobile devices
    if (window.innerWidth < 1024) {
      setMobileInsightsOpen(true)
    }
  }, [])

  const handleAskAI = useCallback((context: string) => {
    setChatContext(context)
    setChatOpen(true)
  }, [])

  const handleOcrUnlocked = useCallback((phrase: string) => {
    setOcrUnlocked(true)
    setOcrPassphrase(phrase)
    try {
      window.sessionStorage.setItem("ocrUnlocked", "true")
      window.sessionStorage.setItem("ocrPassphrase", phrase)
    } catch {
      // ignore
    }
  }, [])

  const activeTest = selectedTest || hoveredTest

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Warm ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary warm blob */}
        <OrganicBlob
          className="w-[600px] h-[600px] -top-48 -left-48 bg-primary/20"
          delay={0}
        />
        {/* Accent blob */}
        <OrganicBlob
          className="w-[500px] h-[500px] -bottom-32 -right-32 bg-accent/15"
          delay={2}
        />
        {/* Subtle center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-30" />

        {/* Paper texture */}
        <div className="absolute inset-0 paper-texture" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg breathe-glow"
            >
              <Droplets className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </motion.div>
            <div>
<h1 className="text-base md:text-lg font-serif font-semibold tracking-tight text-foreground">BloodParser</h1>
<p className="text-[9px] md:text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Медицинские данные</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "results" && (
              <>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExportOpen(true)}
                  className="px-3 md:px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-all flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Экспорт</span>
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-3 md:px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center gap-2 text-sm shadow-lg glow-primary"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Новый анализ</span>
                </motion.button>
              </>
            )}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOcrDialogOpen(true)}
              className="px-3 md:px-4 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/60 transition-all flex items-center gap-2 text-xs md:text-sm"
            >
              <Lock className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-medium hidden sm:inline">
                {ocrUnlocked ? "Безопасный режим активен" : "Активировать безопасный режим"}
              </span>
              <span className="font-medium sm:hidden">
                {ocrUnlocked ? "Безопасно" : "Безопасный режим"}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="pt-14 md:pt-16 relative z-10">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]"
            >
              {/* Hero Section */}
              <div className="container mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-8">
                <div className="max-w-4xl mx-auto">
                  {/* Main hero content */}
                  <div className="text-center mb-12 md:mb-16 relative">
                    {/* Decorative element */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20 pulse-life"
                    >
                      <HeartPulse className="w-10 h-10 text-primary" />
                    </motion.div>

                    {/* Main heading - Editorial style */}
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium mb-6 leading-[1.1] tracking-tight"
                    >
<span className="text-foreground">Понимание Вашего</span>
<br />
<span className="text-gradient-primary">Анализа крови</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10"
                    >
                      Загрузите результаты анализов и сразу узнайте, что означает каждый биомаркер.
                      Получите персонализированные рекомендации для контроля вашего здоровья.
                    </motion.p>

                    {/* Trust indicators */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-success" />
                        </div>
                        <span>Конфиденциально и безопасно</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-warning" />
                        </div>
                        <span>Результаты за секунды</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <span>Данные не сохраняются</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Upload Zone */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <UploadZone
                      onUploadComplete={handleUploadComplete}
                      ocrEnabled={ocrUnlocked}
                      ocrPassphrase={ocrPassphrase}
                    />
                  </motion.div>

                  {/* How it works section */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-16 md:mt-24"
                  >
                    <div className="text-center mb-10">
<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
  Как это работает
</h3>
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      {[
                        {
                          icon: FileText,
                          title: "Загрузка анализа",
                          description: "Загрузите PDF или изображение результатов анализов крови",
                          step: "01"
                        },
                        {
                          icon: Activity,
                          title: "Мгновенный анализ",
                          description: "ИИ извлекает и интерпретирует каждый биомаркер",
                          step: "02"
                        },
                        {
                          icon: HeartPulse,
                          title: "Медицинские данные",
                          description: "Понимание вашего здоровья с четкими объяснениями",
                          step: "03"
                        },
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="group relative"
                        >
                          <div className="relative p-6 rounded-2xl card-warm hover-lift">
                            {/* Step number */}
                            <div className="absolute top-4 right-4 text-5xl font-serif font-light text-primary/10">
                              {feature.step}
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                              <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="font-serif font-medium text-lg text-foreground mb-2">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Bottom note */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="mt-16 text-center pb-8"
                  >
<p className="text-sm text-muted-foreground/60 max-w-md mx-auto">
  Ваши данные обрабатываются локально и никогда не сохраняются на наших серверах.
  Мы полностью уважаем вашу конфиденциальность.
</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "results" && testData && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] flex"
            >
              {/* Left Panel */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full lg:w-[60%] overflow-y-auto scrollbar-thin"
              >
                <div className="px-4 md:px-6 py-6">
                  <ResultsPanel
                    data={testData}
                    onTestSelect={handleTestSelect}
                    onTestHover={handleTestHover}
                    selectedTest={selectedTest}
                    hoveredTest={hoveredTest}
                  />
                </div>
              </motion.div>

              {/* Right Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:flex lg:flex-col w-[40%] border-l border-border bg-gradient-to-b from-card/50 to-transparent"
              >
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <div className="sticky top-0 p-6">
                    <InsightsPanel
                      selectedTest={selectedTest}
                      hoveredTest={hoveredTest}
                      allData={testData}
                      onAskAI={handleAskAI}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Drawer */}
      {step === "results" && testData && (
        <ChatDrawer
          testData={testData}
          selectedTest={activeTest}
          isOpen={chatOpen}
          onOpenChange={setChatOpen}
          initialContext={chatContext}
        />
      )}

      {/* OCR Unlock Dialog */}
      <OcrUnlockDialog
        open={ocrDialogOpen}
        onOpenChange={setOcrDialogOpen}
        onUnlocked={handleOcrUnlocked}
      />

      {/* Export Modal */}
      {testData && (
        <ExportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          data={testData}
        />
      )}

      {/* Mobile Insights Sheet */}
      {step === "results" && testData && (
        <MobileInsightsSheet
          isOpen={mobileInsightsOpen}
          onClose={() => setMobileInsightsOpen(false)}
          selectedTest={selectedTest}
          hoveredTest={hoveredTest}
          allData={testData}
          onAskAI={handleAskAI}
        />
      )}

      {/* Mobile Insights FAB - only on mobile when results visible */}
      {step === "results" && testData && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setMobileInsightsOpen(true)}
          className="fixed bottom-24 left-6 z-30 lg:hidden w-12 h-12 rounded-2xl bg-card border border-border shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Info className="w-5 h-5 text-primary" />
        </motion.button>
      )}
    </main>
  )
}
