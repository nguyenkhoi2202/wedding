import { list, put } from '@vercel/blob'

/**
 * Kho cấu hình thiệp cưới trên Vercel Blob.
 *
 *   GET  /api/config?id=<slug>          -> { config, updatedAt }
 *   POST /api/config?action=verify      -> { ok } (kiểm tra mật khẩu chủ thiệp)
 *   POST /api/config  { id, config }    -> { ok, updatedAt } (cần header x-config-password)
 *
 * Mật khẩu lấy từ biến môi trường CONFIG_PASSWORD trên Vercel; chưa đặt thì
 * dùng tạm mật khẩu cũ để trang không bị chặn ngay sau khi deploy.
 */

const PASSWORD = process.env.CONFIG_PASSWORD || 'khoitn'
const PREFIX = 'wedding-configs/'
const MAX_BODY_BYTES = 2_000_000

/** Slug chỉ cho chữ thường, số và dấu gạch ngang để không đụng đường dẫn blob. */
function normalizeId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const id = raw.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(id)) return null
  return id
}

function pathFor(id: string): string {
  return `${PREFIX}${id}.json`
}

async function readStored(id: string): Promise<{ config: unknown; updatedAt: number } | null> {
  // addRandomSuffix: false nên pathname là cố định; list() trả về URL công khai để đọc.
  const { blobs } = await list({ prefix: pathFor(id), limit: 1 })
  const blob = blobs.find((b) => b.pathname === pathFor(id))
  if (!blob) return null

  // Thêm mốc upload vào URL để chắc chắn không đọc phải bản cũ trong CDN.
  const res = await fetch(`${blob.url}?v=${blob.uploadedAt.getTime()}`)
  if (!res.ok) return null
  const stored = (await res.json()) as { config?: unknown; updatedAt?: number }
  if (!stored?.config) return null
  return { config: stored.config, updatedAt: stored.updatedAt ?? 0 }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  try {
    if (req.method === 'GET') {
      const id = normalizeId(req.query?.id)
      if (!id) return res.status(400).json({ error: 'Thiếu hoặc sai tham số id' })

      const stored = await readStored(id)
      if (!stored) return res.status(404).json({ error: 'Chưa có cấu hình cho id này' })
      return res.status(200).json(stored)
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
      const password = req.headers['x-config-password'] ?? body.password

      if (password !== PASSWORD) {
        return res.status(401).json({ error: 'Sai mật khẩu' })
      }

      // Chỉ kiểm tra mật khẩu, dùng cho cổng đăng nhập /config.
      if (req.query?.action === 'verify') {
        return res.status(200).json({ ok: true })
      }

      const id = normalizeId(body.id)
      if (!id) {
        return res
          .status(400)
          .json({ error: 'id không hợp lệ (chỉ dùng chữ thường, số và dấu gạch ngang)' })
      }
      if (!body.config || typeof body.config !== 'object') {
        return res.status(400).json({ error: 'Thiếu dữ liệu config' })
      }

      const updatedAt = Date.now()
      const payload = JSON.stringify({ id, config: body.config, updatedAt })
      if (Buffer.byteLength(payload, 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({ error: 'Cấu hình quá lớn, hãy dùng link ảnh Cloudinary' })
      }

      await put(pathFor(id), payload, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        // Vercel Blob không cho nhỏ hơn 60s; đã có ?v=uploadedAt chống đọc bản cũ.
        cacheControlMaxAge: 60,
      })

      return res.status(200).json({ ok: true, id, updatedAt })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    // Chưa nối Blob store thì báo rõ để biết cần vào Vercel > Storage bật lên.
    const missingStore = /BLOB_READ_WRITE_TOKEN|No token found/i.test(message)
    return res.status(missingStore ? 503 : 500).json({
      error: missingStore
        ? 'Chưa kết nối Vercel Blob store (thiếu BLOB_READ_WRITE_TOKEN)'
        : message,
    })
  }
}
