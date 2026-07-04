/**
 * app/api/upload-signature/route.ts
 *
 * Nhận base64 dataURL chữ ký từ client → upload lên Cloudinary → trả về URL.
 *
 * ✅ Hỗ trợ 3 chế độ, xác định TƯỜNG MINH qua payload (không suy luận):
 *
 * 1. Checklist signature (ký theo ngày/vai trò trong 1 checklist cụ thể):
 *    { dataUrl, checklistId, day, role }
 *    → không đụng tới hồ sơ user, chỉ trả về URL để FE lưu vào checklist.
 *
 * 2. Khai báo / cập nhật chữ ký cá nhân (profile):
 *    { dataUrl, saveAsProfile: true }
 *    → overwrite ảnh cố định của user, ghi vào users.signature_url.
 *
 * 3. Adhoc (ký một lần, không thuộc 2 loại trên — vd: driver ký Truck Exit):
 *    { dataUrl }
 *    → KHÔNG ghi vào hồ sơ user, mỗi lần upload là 1 file mới (không overwrite).
 *
 * ⚠️ Trước đây chế độ (2) và (3) bị gộp chung bằng cách suy luận "thiếu
 * checklistId/day/role thì coi là profile", khiến chữ ký adhoc (vd. Truck Exit)
 * vô tình ghi đè chữ ký cá nhân đã khai báo của user. Đã tách rõ bằng cờ
 * `saveAsProfile` để tránh lặp lại lỗi này.
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
  const { dataUrl, checklistId, day, role, saveAsProfile } = body

  // ✅ validate dataUrl
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 })
  }

  const userId = (session.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  try {
    const isChecklistMode = Boolean(checklistId && day && role)
    const isProfileMode = !isChecklistMode && saveAsProfile === true

    let folder: string
    let publicId: string | undefined

    if (isChecklistMode) {
      folder = 'checklist-signatures'
      publicId = `${checklistId}_${day}_${role}`
    } else if (isProfileMode) {
      folder = 'user-signatures'
      publicId = `user_signature_${userId}` // ✅ fixed → khai báo lại sẽ overwrite
    } else {
      // adhoc: mỗi lần ký là 1 ảnh riêng, không overwrite, không đụng hồ sơ user
      folder = 'adhoc-signatures'
      publicId = `adhoc_${userId}_${Date.now()}`
    }

    const result = await uploadToCloudinary(dataUrl, folder, publicId)
    const url = result.secure_url

    // ✅ chỉ khi ĐÚNG là profile mode mới ghi vào bảng users
    if (isProfileMode) {
      const supabase = createServiceClient()

      const { error } = await supabase
        .from('users')
        .update({
          signature_url: url,
          signature_public_id: result.public_id,
          signature_updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('[upload-signature] failed to save profile signature:', error)
        return NextResponse.json(
          { error: 'Upload ảnh thành công nhưng lưu hồ sơ thất bại: ' + error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      url,
      public_id: result.public_id,
    })
  } catch (err: any) {
    console.error('[upload-signature]', err)

    return NextResponse.json(
      {
        error: err.message || 'Upload failed',
      },
      { status: 500 }
    )
  }
}
