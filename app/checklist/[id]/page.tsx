import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { ChecklistForm } from '@/components/forms/checklistForm'
import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { cn, checklistStatusColor, checklistStatusLabel } from '@/lib/utils'

export default async function ChecklistDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const supabase = createServiceClient()
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !checklist) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/checklist" className="btn-secondary p-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  Tuần {checklist.week_number}/{checklist.year}
                </h1>
                <span className={cn('badge', checklistStatusColor(checklist.status))}>
                  {checklistStatusLabel(checklist.status)}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {checklist.forklift_model && `${checklist.forklift_model} · `}
                {checklist.forklift_number && `Xe ${checklist.forklift_number} · `}
                Ca {checklist.shift}
              </p>
            </div>
          </div>
          <a href={`/api/reports/${checklist.id}`} className="btn-secondary text-sm no-print">
            <Download className="w-4 h-4" /> Xuất Excel
          </a>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          <strong>Hướng dẫn:</strong> Đánh dấu <strong>"P"</strong> nếu tình trạng đạt, <strong>"X"</strong> nếu không đạt.
          Có thể thêm ảnh và ghi chú chi tiết cho từng hạng mục. Ký tên sau khi hoàn thành mỗi ngày.
        </div>

        <ChecklistForm checklist={checklist} />
      </main>
    </div>
  )
}
