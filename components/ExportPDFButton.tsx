'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

interface ExportPDFButtonProps {
  checklistId: string
  filename?: string
}

export function ExportPDFButton({
  checklistId,
  filename,
  className,
  children
}: ExportPDFButtonProps & { 
  className?: string
  children?: React.ReactNode
}) {

  const [loading, setLoading] = useState(false)

  const exportPDF = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/pdf/${checklistId}`)
      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = filename || `checklist_${checklistId}.pdf`
      a.click()

      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={exportPDF}
      disabled={loading}
      className={cn(
        'btn-secondary text-xs px-2 py-1.5',
        className
      )}
      title="Xuất PDF"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        children || <FileDown className="w-3.5 h-3.5" />
      )}
    </button>
  )
}
