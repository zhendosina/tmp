"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Info } from "lucide-react"
import InsightsPanel from "./insights-panel"

interface MobileInsightsSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedTest: any
  hoveredTest: any
  allData: any
  onAskAI?: (context: string) => void
}

export default function MobileInsightsSheet({
  isOpen,
  onClose,
  selectedTest,
  hoveredTest,
  allData,
  onAskAI
}: MobileInsightsSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

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
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden max-h-[85vh] flex flex-col"
          >
            <div className="bg-card rounded-t-3xl border-t border-border shadow-2xl flex flex-col h-full">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-12 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-medium text-foreground text-sm">
                      {selectedTest ? selectedTest.name : "Health Overview"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedTest ? "Test Details" : "Tap a test for details"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
                <InsightsPanel
                  selectedTest={selectedTest}
                  hoveredTest={hoveredTest}
                  allData={allData}
                  onAskAI={onAskAI}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
