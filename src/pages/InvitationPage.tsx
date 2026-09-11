import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import Couple from '../sections/Couple'
import Invitation from '../sections/Invitation'
import Venue from '../sections/Venue'
import Album from '../sections/Album'
import Rsvp from '../sections/Rsvp'
import HeartRain from '../components/HeartRain'
import FloatingPetals from '../components/FloatingPetals'
import { useConfigStore } from '../store'
import { useReveal } from '../hooks/useReveal'
import { isGuest } from '../viewMode'

import '../styles/layout.css'
import '../styles/hero.css'
import '../styles/couple.css'
import '../styles/invitation.css'
import '../styles/venue.css'
import '../styles/album.css'
import '../styles/rsvp.css'
import '../styles/animations.css'

export default function InvitationPage() {
  const { config } = useConfigStore()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.has('preview')
  const isShared = isGuest
  const [scrollProgress, setScrollProgress] = useState(0)

  useReveal([config])

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scroll = `${(totalScroll / windowHeight) * 100}`
      setScrollProgress(Number(scroll))
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <style>{`:root{--accent:${config.accentColor};--bg:${config.backgroundColor};}`}</style>
      
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

      {config.backgroundImage && (
        <div className="page-bg-layer" aria-hidden="true">
          <img
            className="page-bg-image"
            src={config.backgroundImage}
            alt=""
          />
          <div className="page-bg-overlay" />
        </div>
      )}
      <FloatingPetals />
      <HeartRain />

      <Nav />
      <Hero />
      <Couple />
      <Invitation />
      <Venue />
      <Album />
      <Rsvp />

      <div className="fab-stack" style={isPreview ? { right: '20px' } : {}}>
        {!isPreview && isShared && (
          <button
            className="fab"
            title="Chế độ xem"
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            👁️
          </button>
        )}
        <button
          className="fab"
          title="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ⬆️
        </button>
      </div>
    </>
  )
}
