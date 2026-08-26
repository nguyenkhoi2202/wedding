/**
 * Xác định người đang mở trang là chủ thiệp hay khách, một lần duy nhất lúc
 * khởi động. Khách là người vào bằng link chia sẻ (?id=... hoặc link cũ
 * ?shared=true). Cờ này được ghi vào sessionStorage để khách bấm chuyển trang
 * (mất query string) vẫn không lọt vào được khu vực cấu hình.
 */

const GUEST_ID_KEY = 'wedding-guest-id'
const GUEST_LEGACY_KEY = 'wedding-guest-legacy'

function safeSession(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const params = new URLSearchParams(window.location.search)
const session = safeSession()

const idFromUrl = params.get('id')?.trim().toLowerCase() || null
const legacyFromUrl = params.get('shared') === 'true'

if (idFromUrl) session?.setItem(GUEST_ID_KEY, idFromUrl)
if (legacyFromUrl) session?.setItem(GUEST_LEGACY_KEY, '1')

/** Slug cấu hình cần tải từ server khi khách mở link chia sẻ. */
export const guestConfigId: string | null =
  idFromUrl ?? session?.getItem(GUEST_ID_KEY) ?? null

/** Link chia sẻ kiểu cũ: config nhồi thẳng trong URL. */
export const isLegacyShared: boolean =
  legacyFromUrl || session?.getItem(GUEST_LEGACY_KEY) === '1'

/** true = chỉ được xem thiệp, không được vào /config và không ghi localStorage. */
export const isGuest: boolean = Boolean(guestConfigId) || isLegacyShared

/** Thoát chế độ khách (dùng khi chính chủ muốn quay lại bản nháp của mình). */
export function leaveGuestMode() {
  session?.removeItem(GUEST_ID_KEY)
  session?.removeItem(GUEST_LEGACY_KEY)
  window.location.href = window.location.origin + '/config'
}
