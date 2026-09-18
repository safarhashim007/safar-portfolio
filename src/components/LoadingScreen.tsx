import { useEffect, useState } from 'react'
import { thumb } from '../lib/image'
import './loading.css'

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const delay = (ms: number) => new Promise<void>((resolve) => {
      timers.push(setTimeout(resolve, ms))
    })
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const images = ['01', '02', '03'].map((id) => {
      const image = new Image()
      image.src = thumb('art', id)
      return image.decode()
    })

    void Promise.all([
      Promise.race([Promise.allSettled([document.fonts.ready, ...images]), delay(2500)]),
      delay(reduced ? 0 : 850),
    ]).then(async () => {
      if (cancelled) return
      setLeaving(true)
      await delay(reduced ? 0 : 650)
      if (!cancelled) onComplete()
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      document.body.style.overflow = overflow
    }
  }, [onComplete])

  return (
    <div className="loading-screen" data-leaving={leaving} data-lenis-prevent role="status" aria-live="polite">
      <div className="loading-top readout" aria-hidden="true">
        <span>Safar ©26</span><span>Portfolio / 2026</span>
      </div>
      <div className="loading-identity" aria-hidden="true">
        <p className="loading-name">Safar<br />Hashim</p>
        <p className="loading-disciplines readout">Code · Drawing · Photography</p>
      </div>
      <div className="loading-bottom readout">
        <span className="loading-status">{leaving ? 'Ready' : 'Loading portfolio'}</span>
        <span aria-hidden="true">Kochi, India</span>
      </div>
    </div>
  )
}
