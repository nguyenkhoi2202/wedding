import type { WeddingConfig } from './store'

const API = '/api/config'

export interface RemoteConfig {
  config: Partial<WeddingConfig>
  updatedAt: number
}

export class RemoteError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    return data?.error || fallback
  } catch {
    return fallback
  }
}

/** Chuẩn hoá slug ở phía client giống hệt luật của API. */
export function normalizeConfigId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
}

/** Tải cấu hình đã lưu trên server. Trả null nếu id chưa có gì. */
export async function fetchRemoteConfig(id: string): Promise<RemoteConfig | null> {
  const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new RemoteError(await readError(res, 'Không tải được cấu hình'), res.status)

  const data = (await res.json()) as RemoteConfig
  if (!data?.config) return null
  return { config: data.config, updatedAt: data.updatedAt ?? 0 }
}

/** Lưu cấu hình lên server, trả về mốc thời gian server ghi nhận. */
export async function saveRemoteConfig(
  id: string,
  config: WeddingConfig,
  password: string
): Promise<number> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-config-password': password },
    body: JSON.stringify({ id, config }),
  })
  if (!res.ok) throw new RemoteError(await readError(res, 'Không lưu được cấu hình'), res.status)

  const data = (await res.json()) as { updatedAt?: number }
  return data.updatedAt ?? Date.now()
}

/** Kiểm tra mật khẩu chủ thiệp ở phía server (mật khẩu không nằm trong bundle). */
export async function verifyPassword(password: string): Promise<boolean> {
  const res = await fetch(`${API}?action=verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-config-password': password },
    body: '{}',
  })
  if (res.ok) return true
  if (res.status === 401) return false
  throw new RemoteError(await readError(res, 'Không kiểm tra được mật khẩu'), res.status)
}
