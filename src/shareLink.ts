import type { WeddingConfig } from './store'

function encodeBase64UTF8(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i])
  }
  // base64url: an toàn khi đặt trong query string (không có + / =)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64UTF8(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

export function buildShareUrl(config: WeddingConfig): string {
  const json = JSON.stringify(config)
  const encoded = encodeBase64UTF8(json)
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?shared=true&config=${encoded}`
}

export function getSharedConfig(): WeddingConfig | null {
  const params = new URLSearchParams(window.location.search)
  const isShared = params.get('shared') === 'true'
  const configStr = params.get('config')
  if (!isShared || !configStr) return null
  try {
    const decoded = decodeBase64UTF8(configStr)
    const partial = JSON.parse(decoded)
    return partial as WeddingConfig
  } catch (e) {
    console.error('Failed to decode shared config:', e)
    return null
  }
}

export function isSharedMode(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('shared') === 'true'
}
