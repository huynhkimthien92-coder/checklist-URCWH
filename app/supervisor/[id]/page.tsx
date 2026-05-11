import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { ChecklistForm } from '@/components/forms/checklistForm'
import { createServiceClient } from '@/lib/supabase'
import { ExportPDFButton } from '@/components/ExportPDFButton'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { cn, checklistStatusColor, checklistStatusLabel } from '@/lib/utils'

export default async function SupervisorChecklistPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  const role = (session.user as any)?.role
  if (role !== 'supervisor' && role !== 'admin') redirect('/')

  const supabase = createServiceClient()
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select('*, operator:users!checklists_created_by_fkey(id,name,email,role)')
    .eq('id', params.id)
    .single()

  if (error || !checklist) notFound()

  const failCount = checklist.items?.reduce((acc: number, item: any) =>
    acc + Object.values(item.days || {}).filter((d: any) => d.status === 'fail').length, 0) || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/supervisor" className="btn-secondary p-2">
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
                Tài xế: <strong>{(checklist as any).operator?.name}</strong>
                {checklist.forklift_number && ` · Xe ${checklist.forklift_number}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <a href={`/api/reports/${checklist.id}`} className="btn-secondary text-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </a>
            <ExportPDFButton
              checklistId={checklist.id}
              filename={`XeNang_Tuan${checklist.week_number}_${checklist.year}_${checklist.forklift_number || 'xe'}.pdf`}
            />
          </div>
        </div>

        {failCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
            <span className="text-base">⚠️</span>
            <span>Có <strong>{failCount} hạng mục không đạt</strong> cần xem xét trước khi xét duyệt.</span>
          </div>
        )}

        {checklist.status === 'submitted' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 text-sm">
            Kiểm tra từng hạng mục, ký tên xác nhận theo từng ngày, sau đó nhấn <strong>"Xác nhận & Duyệt"</strong>.
          </div>
        )}

        <ChecklistForm checklist={checklist} isSupervisor />
      </main>
    </div>
  )
}
