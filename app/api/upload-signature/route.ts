/**
 * app/api/upload-signature/route.ts
 * 
 * Nhận base64 dataURL chữ ký từ client → upload lên Cloudinary → trả về URL.
 * 
 * ✅ Hỗ trợ 2 chế độ:
 * 
 * 1. Checklist signature:
 *    { dataUrl, checklistId, day, role }
 * 
 * 2. User profile signature:
 *    { dataUrl }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {

  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { dataUrl, checklistId, day, role } = body

  // ✅ validate dataUrl
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 })
  }

  const userId = (session.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  try {

    // ✅ xác định mode
    const isChecklistMode = checklistId && day && role

    // ✅ đặt tên file
    const publicId = isChecklistMode
      ? `${checklistId}_${day}_${role}`   // checklist
      : `user_signature_${userId}`        // profile

    // ✅ chọn folder
    const folder = isChecklistMode
      ? 'checklist-signatures'
      : 'user-signatures'

    // ✅ upload
    const result = await uploadToCloudinary(
      dataUrl,
      folder,
      publicId
    )

    const url = result.secure_url

    // ✅ nếu là profile → update bảng users
    if (!isChecklistMode) {

      const supabase = createServiceClient()

      await supabase
        .from('users')
        .update({ signature_url: url })
        .eq('id', userId)
    }

    return NextResponse.json({
      url,
      public_id: result.public_id
    })

  } catch (err: any) {
    console.error('[upload-signature]', err)

    return NextResponse.json({
      error: err.message || 'Upload failed'
    }, { status: 500 })
  }
}
