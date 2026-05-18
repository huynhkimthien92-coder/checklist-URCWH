// app/api/robot-checklist/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('robot_checklists')
    .select('*, operator:users!robot_checklists_created_by_fkey(id,name,email,role)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('robot_checklists')
    .update({
      ...(body.day_entries           !== undefined && { day_entries: body.day_entries }),
      ...(body.operator_signatures   !== undefined && { operator_signatures: body.operator_signatures }),
      ...(body.supervisor_signatures !== undefined && { supervisor_signatures: body.supervisor_signatures }),
      ...(body.incidents             !== undefined && { incidents: body.incidents }),
      ...(body.notes                 !== undefined && { notes: body.notes }),
      ...(body.status                !== undefined && { status: body.status }),
      ...(body.robot_number          !== undefined && { robot_number: body.robot_number }),
      ...(body.area                  !== undefined && { area: body.area }),
      updated_at: new Date().toISOString(),
    })
    .eq('id',String(params.id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('robot_checklists').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
