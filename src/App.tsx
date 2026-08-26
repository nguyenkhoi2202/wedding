import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage'
import ConfigPage from './pages/ConfigPage'
import { useConfigStore } from './store'
import { getLegacySharedConfig } from './shareLink'
import { fetchRemoteConfig } from './remoteConfig'
import { guestConfigId, isGuest } from './viewMode'

type BootState = 'loading' | 'ready' | 'missing'

export default function App() {
  const [boot, setBoot] = useState<BootState>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    setBoot('loading')
    setErrorMsg('')

    // Link chia sẻ kiểu cũ: cấu hình nằm ngay trong URL, không cần gọi server.
    const legacy = getLegacySharedConfig()
    if (legacy) {
      useConfigStore.getState().adoptRemoteConfig(legacy, 0)
      setBoot('ready')
      return
    }

    const state = useConfigStore.getState()
    const id = guestConfigId ?? state.configId

    try {
      const remote = await fetchRemoteConfig(id)
      if (!remote) {
        // Khách mở link mà server chưa có gì thì báo rõ, tránh hiện thiệp mẫu.
        setBoot(isGuest ? 'missing' : 'ready')
        if (isGuest) setErrorMsg('Link này chưa có nội dung thiệp nào được phát hành.')
        return
      }

      // Khách luôn lấy bản trên server. Chủ thiệp chỉ lấy khi server mới hơn máy
      // đang dùng, để bản nháp vừa sửa ở đây không bị ghi đè.
      if (isGuest || remote.updatedAt > state.updatedAt) {
        useConfigStore.getState().adoptRemoteConfig(remote.config, remote.updatedAt)
      }
      setBoot('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định'
      if (isGuest) {
        setErrorMsg(`Không tải được thiệp: ${message}`)
        setBoot('missing')
      } else {
        // Chủ thiệp vẫn làm việc được offline với bản lưu trong máy.
        console.warn('Không tải được cấu hình từ server:', message)
        setBoot('ready')
      }
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Chỉ chặn màn hình với khách; chủ thiệp có bản trong máy nên vào được ngay.
  if (boot === 'loading' && isGuest) {
    return (
      <div className="boot-screen">
        <div className="boot-spinner" />
        <p>Đang tải thiệp cưới...</p>
      </div>
    )
  }

  if (boot === 'missing') {
    return (
      <div className="boot-screen">
        <h1>💌</h1>
        <p>{errorMsg}</p>
        <button className="boot-btn" onClick={() => void load()}>
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitationPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
