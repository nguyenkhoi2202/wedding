import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TimelineItem {
  id: string
  date: string
  time: string
  title: string
  note: string
}

export interface WeddingConfig {
  // Hero
  heroTitle: string
  heroSubtitle: string

  // Cặp đôi
  groomName: string
  groomFullName: string
  brideName: string
  brideFullName: string
  groomRole: string
  brideRole: string
  groomOrder: string
  brideOrder: string
  groomFather: string
  groomMother: string
  brideFather: string
  brideMother: string
  groomHometown: string
  brideHometown: string
  groomImage: string
  brideImage: string
  coupleQuote: string

  // Thiệp
  invitationIntro: string
  eventBadge: string
  eventDate: string
  eventTime: string
  eventWeekday: string
  eventLunarDate: string

  // Nhà trai / nhà gái
  groomHouseAddress: string
  brideHouseAddress: string

  // Địa điểm tiệc
  venueName: string
  venueAddress: string
  venueMapUrl: string
  venueNotes: string

  // Lời mời
  guestName: string
  invitationMessage: string

  // Lịch trình
  timeline: TimelineItem[]

  // Album
  album: string[]

  // Chuyển tiền
  bankName: string
  bankAccount: string
  bankOwner: string
  qrCode: string
  phoneContact: string

  // Email / RSVP
  emailReceiver: string
  emailjsServiceId: string
  emailjsTemplateId: string
  emailjsPublicKey: string

  // Giao diện
  accentColor: string
  backgroundColor: string
}

export const defaultConfig: WeddingConfig = {
  heroTitle: 'Trân Trọng Báo Tin Lễ Cưới',
  heroSubtitle: 'Sự hiện diện của Quý Khách là niềm vinh hạnh cho gia đình chúng tôi!',

  groomName: 'Quốc Thịnh',
  groomFullName: 'Lê Quốc Thịnh',
  brideName: 'Giai Nhân',
  brideFullName: 'Đống Giai Nhân',
  groomRole: 'Chú Rể',
  brideRole: 'Cô Dâu',
  groomOrder: 'Trưởng nam của',
  brideOrder: 'Trưởng nữ của',
  groomFather: 'Lê Văn Minh',
  groomMother: 'Võ Thị Hồng Liên',
  brideFather: 'Đống Văn Điều',
  brideMother: 'Mai Ngọc Hiền',
  groomHometown: 'TP. HCM',
  brideHometown: 'Đồng Nai',
  groomImage: '',
  brideImage: '',
  coupleQuote: 'Trăm năm tình viên mãn,\nbạc đầu nghĩa phu thê.',

  invitationIntro:
    'Trân trọng báo tin lễ cưới của chúng tôi và kính mời Quý Khách đến chung vui.',
  eventBadge: 'Ngày Nhà Gái',
  eventDate: '02/05/2027',
  eventTime: '11:00',
  eventWeekday: 'Chủ Nhật',
  eventLunarDate: 'Nhằm ngày 27 tháng 03 năm Đinh Mùi',

  groomHouseAddress: '844 Ấp Bình Thắng, Xã Phú Giáo, TP. HCM',
  brideHouseAddress: 'Hẻm 72 Nguyễn Thị Tồn, P. Biên Hòa, Tỉnh Đồng Nai',

  venueName: 'Nhà hàng tiệc cưới Lộc Vừng',
  venueAddress:
    'Hẻm 703, K1 - 129 - Đường Bùi Hữu Nghĩa, phường Biên Hòa, tỉnh Đồng Nai',
  venueMapUrl: '',
  venueNotes: 'Vui lòng đến trước giờ cử hành 15 phút',

  guestName: 'Quý khách',
  invitationMessage:
    'Sự hiện diện của Quý Khách là niềm vinh hạnh cho gia đình chúng tôi!',

  timeline: [
    {
      id: 't1',
      date: '02/05/2027',
      time: '10:00',
      title: 'Lễ Vu Quy Nhà Gái',
      note: 'Nhằm ngày 27 tháng 03 năm Đinh Mùi',
    },
    {
      id: 't2',
      date: '02/05/2027',
      time: '11:00',
      title: 'Tiệc nhà gái',
      note: 'Hẻm 703, K1 - 129 - Đường Bùi Hữu Nghĩa, phường Biên Hòa, tỉnh Đồng Nai',
    },
  ],

  album: [],

  bankName: 'Vietcombank',
  bankAccount: '0123456789',
  bankOwner: 'LE QUOC THINH',
  qrCode: '',
  phoneContact: '0123456789',

  emailReceiver: 'khoitn2202@gmail.com',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',

  accentColor: '#E8175D',
  backgroundColor: '#FFF5F7',
}

interface ConfigStore {
  config: WeddingConfig
  updateConfig: (updates: Partial<WeddingConfig>) => void
  resetConfig: () => void
  replaceConfig: (config: WeddingConfig) => void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      updateConfig: (updates) =>
        set((state) => ({ config: { ...state.config, ...updates } })),
      resetConfig: () => set({ config: defaultConfig }),
      replaceConfig: (config) => set({ config: { ...defaultConfig, ...config } }),
    }),
    {
      name: 'wedding-web-config',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        config: {
          ...defaultConfig,
          ...((persisted as { config?: Partial<WeddingConfig> })?.config ?? {}),
        },
      }),
    }
  )
)

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Không đọc được tệp ảnh'))
    reader.readAsDataURL(file)
  })
}

/// Nén ảnh trước khi lưu vì localStorage chỉ chứa được ~5MB cho toàn bộ album.
export async function compressImage(file: File, maxSize = 1400, quality = 0.82) {
  const dataUrl = await imageToBase64(file)
  const img = new Image()
  img.src = dataUrl
  await img.decode()

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}
