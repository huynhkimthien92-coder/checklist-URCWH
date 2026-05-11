'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

interface ExportPDFButtonProps {
  checklistId: string
  filename?: string
}

export function ExportPDFButton({ checklistId, filename }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const exportPDF = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pdf/${checklistId}`)
      if (!res.ok) throw new Error('Lỗi tạo PDF')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `checklist_${checklistId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Không thể xuất PDF. Vui lòng thử lại.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={exportPDF}
      disabled={loading}
      className="btn-secondary text-sm no-print disabled:opacity-60"
      title="Xuất báo cáo PDF"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileDown className="w-4 h-4" />
      }
      {loading ? 'Đang tạo PDF...' : 'Xuất PDF'}
    </button>
  )
}
