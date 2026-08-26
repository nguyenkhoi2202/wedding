import type { WeddingConfig } from './store'

const PARAM = 'd'

/// Ảnh base64 quá lớn để nhét vào URL, nên link chia sẻ chỉ mang phần chữ.
const OMITTED_KEYS = ['album', 'qrCode', 'groomImage', 'brideImage'] as const

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function buildShareUrl(config: WeddingConfig) {
  const slim: Record<string, unknown> = { ...config }
  for (const key of OMITTED_KEYS) delete slim[key]
  return `${window.location.origin}/?${PARAM}=${toBase64Url(JSON.stringify(slim))}`
}

export function readConfigFromUrl(): Partial<WeddingConfig> | null {
  const raw = new URLSearchParams(window.location.search).get(PARAM)
  if (!raw) return null
  try {
    const parsed = JSON.parse(fromBase64Url(raw))
    return typeof parsed === 'object' && parsed ? (parsed as Partial<WeddingConfig>) : null
  } catch {
    return null
  }
}
