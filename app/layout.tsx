import type React from "react"
import type { Metadata } from "next"
import { Source_Sans_3, Newsreader, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// Primary body font - Humanist sans-serif for readability
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

// Display font - Elegant serif for headings
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

// Monospace font - For values and data
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BloodParser - Понимание Вашего Анализа Крови",
  description:
    "Загрузите результаты анализов крови и сразу узнайте, что означает каждый биомаркер. Получите персонализированные рекомендации здоровья с помощью ИИ.",
  keywords: ["анализ крови", "результаты лаборатории", "анализ здоровья", "биомаркеры", "медицинский отчет"],
  authors: [{ name: "BloodParser" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
      </head>
      <body className={`${sourceSans.variable} ${newsreader.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
