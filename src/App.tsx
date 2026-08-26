import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage'
import ConfigPage from './pages/ConfigPage'
import { useConfigStore } from './store'
import { getSharedConfig } from './shareLink'

export default function App() {
  useEffect(() => {
    const sharedConfig = getSharedConfig()
    if (sharedConfig) {
      const { replaceConfig } = useConfigStore.getState()
      replaceConfig(sharedConfig)
    }
  }, [])

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
