import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const checklistId = formData.get('checklistId') as string
  const itemId = formData.get('itemId') as string
  const day = formData.get('day') as string

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `checklists/${checklistId}/${itemId}_${day}_${Date.now()}.${ext}`

  const supabase = createServiceClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('checklist-images')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get signed URL (valid 7 days)
  const { data, error: urlError } = await supabase.storage
    .from('checklist-images')
    .createSignedUrl(path, 60 * 60 * 24 * 7)
  if (urlError || !data) {
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 })
  }
  
  return NextResponse.json({ url: data.signedUrl, path })
}
