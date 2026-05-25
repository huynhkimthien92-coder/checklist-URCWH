/**
 * Upload ảnh 5S (before / after) lên Cloudinary
 *
 * POST multipart/form-data:
 *   file     (required)
 *   issueId  (required)
 *   stage    (required) -> 'before' | 'after'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {

  // ===== AUTH =====
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ===== FORM DATA =====
  const formData = await req.formData()

  const file = formData.get('file') as File | null
  const issueId = formData.get('issueId') as string | null
  const stage = formData.get('stage') as string | null

  // ===== VALIDATE =====
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Only image files are allowed' },
      { status: 400 }
    )
  }


  if (!issueId) {
    return NextResponse.json({ error: 'Missing issueId' }, { status: 400 })
  }

  if (!stage || !['before', 'after'].includes(stage)) {
    return NextResponse.json({ error: 'Invalid stage (before/after)' }, { status: 400 })
  }

  // ✅ limit size (5MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  try {
    // ===== BUFFER =====
    const buffer = Buffer.from(await file.arrayBuffer())

    // ===== CLOUDINARY CONFIG =====
    const folder = `5s-issues/${issueId}`

    // ✅ overwrite-friendly naming
    const publicId = `${stage}`

    // ===== UPLOAD =====
    const result = await uploadToCloudinary(
      buffer,
      folder,
      publicId
    )

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id
    })

  } catch (err: any) {
    console.error('[5s-upload]', err)

    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
