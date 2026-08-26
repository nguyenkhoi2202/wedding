import type { WeddingConfig } from './store'

function decodeBase64UTF8(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Link chia sẻ ngắn và cố định: chỉ chứa slug, còn cấu hình nằm trên server.
 * Chủ thiệp sửa /config rồi bấm "Lưu & phát hành" là mọi người mở lại link cũ
 * sẽ thấy nội dung mới, không cần gửi lại link.
 */
export function buildShareUrl(configId: string): string {
  // Luôn trỏ về gốc site, kể cả khi đang đứng ở /config.
  return `${window.location.origin}/?id=${encodeURIComponent(configId)}`
}

/**
 * Giải mã link chia sẻ kiểu cũ (?shared=true&config=<base64>) để những link đã
 * gửi đi trước đây vẫn mở được.
 */
export function getLegacySharedConfig(): Partial<WeddingConfig> | null {
  const params = new URLSearchParams(window.location.search)
  if (params.get('shared') !== 'true') return null

  const configStr = params.get('config')
  if (!configStr) return null

  try {
    return JSON.parse(decodeBase64UTF8(configStr)) as Partial<WeddingConfig>
  } catch (e) {
    console.error('Không giải mã được link chia sẻ cũ:', e)
    return null
  }
}
