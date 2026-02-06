import { jsPDF } from "jspdf"
import "jspdf-autotable"

export interface TestResult {
  test_name: string
  value: number | string
  unit: string
  normal_range: string
  status: "Normal" | "High" | "Low"
  category: string
}

export interface ReportData {
  patient_info?: {
    name?: string
    age?: string
    gender?: string
    date?: string
  }
  tests: TestResult[]
}

// Generate CSV export
export function generateCSV(data: ReportData): string {
  const headers = ["Test Name", "Value", "Unit", "Normal Range", "Status", "Category"]
  const rows = data.tests.map(test => [
    test.test_name,
    String(test.value),
    test.unit,
    test.normal_range,
    test.status,
    test.category
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n")

  return csvContent
}

// Download CSV file
export function downloadCSV(data: ReportData, filename = "blood-report") {
  const csv = generateCSV(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate JSON export
export function downloadJSON(data: ReportData, filename = "blood-report") {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate PDF report
// Updated to support Russian/Cyrillic characters in PDF output
export async function generatePDF(data: ReportData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true
  })
  
  // Ensure proper UTF-8 encoding for Russian text
  doc.setLanguage("ru")

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // Colors
  const primaryColor: [number, number, number] = [139, 58, 74] // #8B3A4A
  const textColor: [number, number, number] = [51, 51, 51]
  const mutedColor: [number, number, number] = [128, 128, 128]
  const successColor: [number, number, number] = [34, 139, 34]
  const dangerColor: [number, number, number] = [178, 34, 34]
  const warningColor: [number, number, number] = [184, 134, 11]

  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 35, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("Анализ крови", margin, 20)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Сгенерировано BloodParser ${new Date().toLocaleDateString('ru-RU')}`, margin, 28)

  y = 45

  // Patient info if available
  if (data.patient_info && Object.keys(data.patient_info).length > 0) {
    doc.setTextColor(...textColor)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Patient Information", margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...mutedColor)

    const patientInfo = data.patient_info
    const infoItems = [
      patientInfo.name && `Name: ${patientInfo.name}`,
      patientInfo.age && `Age: ${patientInfo.age}`,
      patientInfo.gender && `Gender: ${patientInfo.gender}`,
      patientInfo.date && `Date: ${patientInfo.date}`
    ].filter(Boolean)

    if (infoItems.length > 0) {
      doc.text(infoItems.join("  |  "), margin, y)
      y += 12
    }
  }

  // Summary section
  const totalTests = data.tests.length
  const normalCount = data.tests.filter(t => t.status === "Normal").length
  const abnormalCount = totalTests - normalCount

  doc.setTextColor(...textColor)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Сводка", margin, y)
  y += 8

  // Summary boxes
  const boxWidth = (contentWidth - 10) / 3
  const boxHeight = 20

  // Total tests box
  doc.setFillColor(240, 240, 240)
  doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, "F")
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...textColor)
  doc.text(String(totalTests), margin + boxWidth / 2, y + 10, { align: "center" })
  doc.setFontSize(8)
  doc.setTextColor(...mutedColor)
  doc.text("Всего анализов", margin + boxWidth / 2, y + 16, { align: "center" })

  // Normal tests box
  doc.setFillColor(220, 252, 231)
  doc.roundedRect(margin + boxWidth + 5, y, boxWidth, boxHeight, 3, 3, "F")
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...successColor)
  doc.text(String(normalCount), margin + boxWidth + 5 + boxWidth / 2, y + 10, { align: "center" })
  doc.setFontSize(8)
  doc.text("Норма", margin + boxWidth + 5 + boxWidth / 2, y + 16, { align: "center" })

  // Abnormal tests box
  doc.setFillColor(254, 226, 226)
  doc.roundedRect(margin + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 3, 3, "F")
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...dangerColor)
  doc.text(String(abnormalCount), margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 10, { align: "center" })
  doc.setFontSize(8)
  doc.text("Внимание", margin + (boxWidth + 5) * 2 + boxWidth / 2, y + 16, { align: "center" })

  y += boxHeight + 15

  // Group tests by category
  const categories = data.tests.reduce((acc, test) => {
    const cat = test.category || "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(test)
    return acc
  }, {} as Record<string, TestResult[]>)

  // Table header
  const colWidths = [contentWidth * 0.35, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.2, contentWidth * 0.15]

  for (const [category, tests] of Object.entries(categories)) {
    // Check if we need a new page
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
    }

    // Category header
    doc.setFillColor(248, 248, 248)
    doc.rect(margin, y, contentWidth, 8, "F")
    doc.setTextColor(...primaryColor)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(category, margin + 3, y + 5.5)
    y += 12

    // Table headers
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, y, contentWidth, 7, "F")
    doc.setTextColor(...mutedColor)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")

    let x = margin + 3
    const headers = ["Название анализа", "Значение", "Ед. изм.", "Норма", "Статус"]
    headers.forEach((header, i) => {
      doc.text(header, x, y + 5)
      x += colWidths[i]
    })
    y += 10

    // Test rows
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    for (const test of tests) {
      // Check if we need a new page
      if (y > pageHeight - 20) {
        doc.addPage()
        y = margin

        // Repeat category header on new page
        doc.setFillColor(248, 248, 248)
        doc.rect(margin, y, contentWidth, 8, "F")
        doc.setTextColor(...primaryColor)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(`${category} (continued)`, margin + 3, y + 5.5)
        y += 12

        // Repeat table headers
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, y, contentWidth, 7, "F")
        doc.setTextColor(...mutedColor)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")

        let headerX = margin + 3
        headers.forEach((header, i) => {
          doc.text(header, headerX, y + 5)
          headerX += colWidths[i]
        })
        y += 10
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
      }

      // Alternate row background
      if (tests.indexOf(test) % 2 === 0) {
        doc.setFillColor(252, 252, 252)
        doc.rect(margin, y - 3, contentWidth, 8, "F")
      }

      x = margin + 3
      doc.setTextColor(...textColor)

      // Test name
      doc.text(test.test_name.substring(0, 30), x, y + 2)
      x += colWidths[0]

      // Value
      doc.setFont("helvetica", "bold")
      doc.text(String(test.value), x, y + 2)
      doc.setFont("helvetica", "normal")
      x += colWidths[1]

      // Unit
      doc.setTextColor(...mutedColor)
      doc.text(test.unit || "-", x, y + 2)
      x += colWidths[2]

      // Normal range
      doc.text(test.normal_range || "-", x, y + 2)
      x += colWidths[3]

      // Status with color
      const statusColor = test.status === "Normal" ? successColor :
                          test.status === "High" ? dangerColor : warningColor
      doc.setTextColor(...statusColor)
      doc.setFont("helvetica", "bold")
      doc.text(test.status, x, y + 2)
      doc.setFont("helvetica", "normal")

      y += 8
    }

    y += 8
  }

  // Footer
  const footerY = pageHeight - 15
  doc.setTextColor(...mutedColor)
  doc.setFontSize(8)
  doc.text(
    "Этот отчет предназначен только для информационных целей. Пожалуйста, проконсультируйтесь с врачом.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  )
  doc.text(
    "Сгенерировано BloodParser",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  )

  return doc
}

// Download PDF file
export async function downloadPDF(data: ReportData, filename = "blood-report") {
  const doc = await generatePDF(data)
  doc.save(`${filename}-${new Date().toISOString().split("T")[0]}.pdf`)
}

// Print-friendly view (opens in new tab for printing)
export function openPrintView(data: ReportData) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const styles = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; padding: 40px; }
      .header { background: linear-gradient(135deg, #8B3A4A, #C9756C); color: white; padding: 24px; margin: -40px -40px 24px; }
      .header h1 { font-size: 24px; margin-bottom: 4px; }
      .header p { font-size: 12px; opacity: 0.9; }
      .summary { display: flex; gap: 16px; margin-bottom: 24px; }
      .summary-box { flex: 1; padding: 16px; border-radius: 8px; text-align: center; }
      .summary-box.total { background: #f5f5f5; }
      .summary-box.normal { background: #dcfce7; color: #166534; }
      .summary-box.abnormal { background: #fee2e2; color: #991b1b; }
      .summary-box .value { font-size: 28px; font-weight: bold; }
      .summary-box .label { font-size: 12px; opacity: 0.8; }
      .category { margin-bottom: 24px; }
      .category-header { background: #f8f8f8; padding: 8px 12px; font-weight: 600; color: #8B3A4A; margin-bottom: 8px; border-radius: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #f5f5f5; padding: 8px; text-align: left; font-weight: 600; color: #666; }
      td { padding: 8px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) { background: #fafafa; }
      .status { font-weight: 600; padding: 2px 8px; border-radius: 4px; }
      .status.Normal { color: #166534; background: #dcfce7; }
      .status.High { color: #991b1b; background: #fee2e2; }
      .status.Low { color: #92400e; background: #fef3c7; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #666; text-align: center; }
      @media print { body { padding: 20px; } .header { margin: -20px -20px 20px; } }
    </style>
  `

  const totalTests = data.tests.length
  const normalCount = data.tests.filter(t => t.status === "Normal").length
  const abnormalCount = totalTests - normalCount

  const categories = data.tests.reduce((acc, test) => {
    const cat = test.category || "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(test)
    return acc
  }, {} as Record<string, TestResult[]>)

  const categoriesHTML = Object.entries(categories).map(([category, tests]) => `
    <div class="category">
      <div class="category-header">${category}</div>
      <table>
        <thead>
          <tr>
<th>Название анализа</th>
              <th>Значение</th>
              <th>Ед. изм.</th>
              <th>Норма</th>
              <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          ${tests.map(test => `
            <tr>
              <td>${test.test_name}</td>
              <td><strong>${test.value}</strong></td>
              <td>${test.unit || '-'}</td>
              <td>${test.normal_range || '-'}</td>
              <td><span class="status ${test.status}">${test.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Blood Report - BloodParser</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>Анализ крови</h1>
          <p>Сгенерировано BloodParser ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>

        <div class="summary">
          <div class="summary-box total">
<div class="value">${totalTests}</div>
              <div class="label">Всего анализов</div>
          </div>
          <div class="summary-box normal">
<div class="value">${normalCount}</div>
              <div class="label">Норма</div>
          </div>
          <div class="summary-box abnormal">
<div class="value">${abnormalCount}</div>
              <div class="label">Внимание</div>
          </div>
        </div>

        ${categoriesHTML}

        <div class="footer">
          <p>Этот отчет предназначен только для информационных целей. Пожалуйста, проконсультируйтесь с врачом.</p>
          <p style="margin-top: 4px;">Сгенерировано BloodParser</p>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
