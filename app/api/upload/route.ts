/**
 * app/api/upload/route.ts
 * Upload ảnh checklist item lên Cloudinary (thay thế Supabase Storage).
 *
 * POST multipart/form-data:
 *   file, checklistId, itemId, day
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file        = formData.get('file') as File | null
  const checklistId = formData.get('checklistId') as string
  const itemId      = formData.get('itemId') as string
  const day         = formData.get('day') as string

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Only image files are allowed' },
      { status: 400 }
    )
  }


  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const folder   = `checklist-images/${checklistId}`
    const publicId = `${itemId}_${day}_${Date.now()}`

    const result = await uploadToCloudinary(buffer, folder, publicId)

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
  } catch (err: any) {
    console.error('[upload]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
