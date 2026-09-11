import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import Couple from '../sections/Couple'
import Invitation from '../sections/Invitation'
import Venue from '../sections/Venue'
import Album from '../sections/Album'
import Rsvp from '../sections/Rsvp'
import HeartRain from '../components/HeartRain'
import FloatingPetals from '../components/FloatingPetals'
import FairytaleCanvas from '../components/FairytaleCanvas'
import CelebrationCannon from '../components/CelebrationCannon'
import LiveLoveReactions from '../components/LiveLoveReactions'
import MusicPlayer from '../components/MusicPlayer'
import WeddingGate from '../components/WeddingGate'
import SparkleTrail from '../components/SparkleTrail'
import ScrollLoveSpreader from '../components/ScrollLoveSpreader'
import { useConfigStore } from '../store'
import { useReveal } from '../hooks/useReveal'

import '../styles/layout.css'
import '../styles/hero.css'
import '../styles/couple.css'
import '../styles/invitation.css'
import '../styles/venue.css'
import '../styles/album.css'
import '../styles/rsvp.css'
import '../styles/animations.css'
import '../styles/gate.css'

export default function InvitationPage() {
  const { config } = useConfigStore()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useReveal([config])

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scroll = windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0
      setScrollProgress(scroll)
      setShowScrollTop(totalScroll > 350)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="wedding-app-wrapper">
      <style>{`:root{--accent:${config.accentColor};--bg:${config.backgroundColor};}`}</style>

      {/* Cổng hoa đón khách & mở thiệp cưới hoàng gia */}
      <WeddingGate
        onOpen={() => {
          // Dispatches custom event to guarantee immediate audio playback on tap
          window.dispatchEvent(new CustomEvent('wedding:play-music'))
        }}
      />

      {/* Hiệu ứng chạm ngón tay / di chuột sao rơi lấp lánh thần tiên */}
      <SparkleTrail />

      {/* Hiệu ứng cuộn tới đâu rải hoa và trái tim tình yêu tới đó & chạm nổ tim */}
      <ScrollLoveSpreader />

      {/* Vệt sao băng tình yêu lãng mạn */}
      <div className="shooting-star-container" aria-hidden="true">
        <span className="shooting-star star-1" />
        <span className="shooting-star star-2" />
      </div>

      {/* Top Reading Progress Bar */}
      <div
        className="progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Background Image Layer if configured */}
      {config.backgroundImage && (
        <div className="page-bg-layer" aria-hidden="true">
          <img
            className="page-bg-image"
            src={config.backgroundImage}
            alt=""
            loading="lazy"
          />
          <div className="page-bg-overlay" />
        </div>
      )}

      {/* Pháo hoa kim tuyến & cánh hoa ăn mừng hoàng gia khi mở thiệp và RSVP */}
      <CelebrationCannon />

      {/* Hiệu ứng hạt bụi tiên & cánh hoa hồng 3D rơi chuyển động theo gió mượt mà */}
      <FairytaleCanvas />

      {/* Romantic Ambient Particles */}
      <FloatingPetals />
      <HeartRain />

      {/* Navigation */}
      <Nav />

      {/* Main Wedding Sections */}
      <main id="main-content">
        <Hero />
        <Couple />
        <Invitation />
        <Venue />
        <Album />
        <Rsvp />
      </main>

      {/* Floating Background Music Player */}
      <MusicPlayer url={config.musicUrl} />

      {/* Widget Bắn Tim Chúc Phúc Tương Tác Sống Động (Viral Live Love Reactions) */}
      <LiveLoveReactions />

      {/* Scroll to top button (shows after scrolling down) */}
      <div className={`floating-actions ${showScrollTop ? 'visible' : ''}`}>
        <button
          type="button"
          className="scroll-top-btn"
          onClick={scrollToTop}
          title="Lên đầu trang"
          aria-label="Cuộn lên đầu trang"
        >
          <span className="scroll-arrow">↑</span>
        </button>
      </div>
    </div>
  )
}
