"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UploadZone from "@/components/upload-zone"
import ResultsPanel from "@/components/results-panel"
import InsightsPanel from "@/components/insights-panel"
import ChatDrawer from "@/components/chat-drawer"
import {
  Upload, Download, Activity, Shield, Zap, Brain,
  HeartPulse, Microscope, FlaskConical, ArrowRight,
  Sparkles, Lock, Clock
} from "lucide-react"

// Floating particle component
function FloatingParticle({ delay, duration, x, y }: { delay: number; duration: number; x: string; y: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.5],
        y: [0, -30, -60, -90],
      }}
      transition={{
        delay,
        duration,
        repeat: Infinity,
        ease: "easeOut"
      }}
      className="absolute w-1 h-1 bg-primary/60 rounded-full"
      style={{ left: x, top: y }}
    />
  )
}

// Animated stat counter
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", delay: 0.5 }}
        className="text-2xl md:text-3xl font-bold text-white"
      >
        {value}{suffix}
      </motion.div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

export default function Home() {
  const [step, setStep] = useState<"upload" | "results">("upload")
  const [testData, setTestData] = useState<any>(null)
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [hoveredTest, setHoveredTest] = useState<any>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatContext, setChatContext] = useState<string>("")

  const handleUploadComplete = (data: any) => {
    setTestData(data)
    setStep("results")
  }

  const handleReset = () => {
    setStep("upload")
    setTestData(null)
    setSelectedTest(null)
    setHoveredTest(null)
  }

  const handleTestHover = useCallback((test: any) => {
    setHoveredTest(test)
  }, [])

  const handleTestSelect = useCallback((test: any) => {
    setSelectedTest(test)
    setHoveredTest(null)
  }, [])

  const handleAskAI = useCallback((context: string) => {
    setChatContext(context)
    setChatOpen(true)
  }, [])

  const activeTest = selectedTest || hoveredTest

  return (
    <main className="min-h-screen bg-[#06060a] text-foreground relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary gradient blob */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-[100px]"
        />
        {/* Accent gradient blob */}
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-accent/15 via-purple-500/5 to-transparent rounded-full blur-[100px]"
        />
        {/* Center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#06060a]/80 backdrop-blur-2xl"
      >
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
            >
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white">BloodParser</h1>
              <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium tracking-wider uppercase">AI Analysis</p>
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
                  className="px-3 md:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Export</span>
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-3 md:px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/20"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">New Report</span>
                </motion.button>
              </>
            )}
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
              <div className="container mx-auto px-4 md:px-6 pt-8 md:pt-16 pb-8">
                <div className="max-w-5xl mx-auto">
                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <FloatingParticle delay={0} duration={4} x="10%" y="20%" />
                    <FloatingParticle delay={1} duration={5} x="85%" y="30%" />
                    <FloatingParticle delay={2} duration={4.5} x="20%" y="60%" />
                    <FloatingParticle delay={0.5} duration={5.5} x="75%" y="70%" />
                    <FloatingParticle delay={1.5} duration={4} x="50%" y="40%" />
                  </div>

                  {/* Main hero content */}
                  <div className="text-center mb-10 md:mb-14 relative">
                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6 md:mb-8"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                      </motion.div>
                      <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Powered by Gemini AI
                      </span>
                    </motion.div>

                    {/* Main heading */}
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
                    >
                      <span className="text-white">Decode Your</span>
                      <br />
                      <span className="relative">
                        <span className="bg-gradient-to-r from-primary via-violet-400 to-accent bg-clip-text text-transparent">
                          Blood Report
                        </span>
                        {/* Underline accent */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.6, duration: 0.6 }}
                          className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full origin-left"
                        />
                      </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
                    >
                      Upload your lab results and instantly understand what each biomarker means.
                      Get personalized insights powered by advanced AI.
                    </motion.p>

                    {/* Trust indicators */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-muted-foreground mb-10"
                    >
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>100% Private</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Results in seconds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span>No data stored</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Upload Zone */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <UploadZone onUploadComplete={handleUploadComplete} />
                  </motion.div>

                  {/* Features section */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 md:mt-16"
                  >
                    <div className="text-center mb-8">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        How it works
                      </h3>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      {[
                        {
                          icon: Microscope,
                          title: "Upload Report",
                          description: "Drop your PDF or image of blood test results",
                          color: "from-rose-500/20 to-pink-500/20",
                          iconColor: "text-rose-400",
                          step: "01"
                        },
                        {
                          icon: Brain,
                          title: "AI Analysis",
                          description: "Gemini AI extracts and interprets every biomarker",
                          color: "from-primary/20 to-violet-500/20",
                          iconColor: "text-primary",
                          step: "02"
                        },
                        {
                          icon: HeartPulse,
                          title: "Get Insights",
                          description: "Understand your health with clear explanations",
                          color: "from-emerald-500/20 to-teal-500/20",
                          iconColor: "text-emerald-400",
                          step: "03"
                        },
                      ].map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="group relative"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl`} />
                          <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                            {/* Step number */}
                            <div className="absolute top-4 right-4 text-4xl font-bold text-white/[0.03]">
                              {feature.step}
                            </div>

                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 border border-white/10`}>
                              <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                            </div>
                            <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Bottom CTA section */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 text-center pb-8"
                  >
                    <p className="text-sm text-muted-foreground/60">
                      Your data never leaves your browser. We don't store any reports.
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
                className="hidden lg:flex lg:flex-col w-[40%] border-l border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent"
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
    </main>
  )
}
