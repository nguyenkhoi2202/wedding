import { useEffect } from 'react'

/// Thêm class .visible cho mọi .reveal khi cuộn tới — dùng IntersectionObserver
/// thay vì scroll listener để không chặn main thread. MutationObserver lo cho
/// những phần tử .reveal xuất hiện muộn (lời chúc mới, đổi tab nhà trai/nhà gái...).
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal').forEach((n) => n.classList.add('visible'))
      return
    }

    const seen = new WeakSet<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )

    const scan = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((n) => {
        if (seen.has(n)) return
        seen.add(n)
        io.observe(n)
      })
    }
    scan()

    const root = document.getElementById('main-content') ?? document.body
    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
