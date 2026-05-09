'use client'

import html2pdf from 'html2pdf.js'
import { Download } from 'lucide-react'

export function ExportPDFButton() {
  const exportPDF = () => {
    const element = document.getElementById('report')
    if (!element) return

    html2pdf()
      .set({
        margin: 5,
        filename: 'checklist.pdf',
        html2canvas: {
          scale: 2,
          useCORS: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape'
        }
      })
      .from(element)
      .save()
  }

  return (
    <button onClick={exportPDF} className="btn-secondary text-sm no-print">
      <Download className="w-4 h-4" /> Xuất PDF
    </button>
  )
}
