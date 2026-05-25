/**
 * lib/cloudinary.ts
 * Helper upload ảnh & chữ ký lên Cloudinary.
 * Dùng ở phía SERVER (API routes) — không expose secret key ra client.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!
const API_KEY    = process.env.CLOUDINARY_API_KEY!
const API_SECRET = process.env.CLOUDINARY_API_SECRET!

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  // Chỉ throw lúc runtime, không lỗi lúc build
  console.warn('[cloudinary] Missing env variables: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET')
}

/** Tạo SHA-1 signature cho Cloudinary signed upload */
async function makeSignature(params: Record<string, string>): Promise<string> {
  // Sắp xếp params theo alphabet, nối thành chuỗi key=value&...
  const toSign =
    Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&') + API_SECRET

  const msgBuffer = new TextEncoder().encode(toSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

/**
 * Upload một file (Buffer | Blob | base64 dataURL) lên Cloudinary.
 * @param source  - Buffer, Blob, hoặc chuỗi data:image/png;base64,...
 * @param folder  - folder trong Cloudinary (vd: "checklist-signatures")
 * @param publicId - tuỳ chọn đặt tên file cố định (để overwrite)
 */
export async function uploadToCloudinary(
  source: Buffer | Blob | string,
  folder: string,
  publicId?: string,
): Promise<CloudinaryUploadResult> {
  const timestamp = String(Math.round(Date.now() / 1000))

  const sigParams: Record<string, string> = { folder, timestamp, format: 'webp',transformation: 'w_1280,c_limit'}
  if (publicId) sigParams.public_id = publicId

  const signature = await makeSignature(sigParams)

  const form = new FormData()
  form.append('api_key', API_KEY)
  form.append('timestamp', timestamp)
  form.append('signature', signature)
  form.append('folder', folder)
  if (publicId) form.append('public_id', publicId)
 
  form.append('format', 'webp')
  form.append('quality', 'auto:best')
  form.append('transformation', 'w_1280,c_limit')

  // Xử lý nhiều kiểu source
  if (typeof source === 'string' && source.startsWith('data:')) {
    // base64 dataURL — Cloudinary chấp nhận trực tiếp
    form.append('file', source)
  } else if (Buffer.isBuffer(source)) {
    const blob = new Blob([new Uint8Array(source)])
    form.append('file', blob, 'upload')
  } else {
    form.append('file', source as Blob, 'upload')
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Cloudinary upload failed: ${err}`)
  }

  const data = await res.json()
  return { secure_url: data.secure_url, public_id: data.public_id }
}

/**
 * Xoá ảnh trên Cloudinary theo public_id (dùng khi user xoá ảnh)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const timestamp = String(Math.round(Date.now() / 1000))
  const signature = await makeSignature({ public_id: publicId, timestamp })

  const form = new FormData()
  form.append('api_key', API_KEY)
  form.append('timestamp', timestamp)
  form.append('signature', signature)
  form.append('public_id', publicId)

  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: form,
  })
}
