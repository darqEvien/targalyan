import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BannerParticleCanvas } from './hero/BannerParticleCanvas'

export function BannerSection() {
  const ref = useRef<HTMLElement>(null)
  const pointerRef = useRef({ nx: 0.5, ny: 0.5 })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const textY = useTransform(scrollYProgress, [0, 1], [40, -40])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        return
      }
      pointerRef.current = {
        nx: (e.clientX - r.left) / Math.max(1, r.width),
        ny: (e.clientY - r.top) / Math.max(1, r.height),
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <section
      ref={ref}
      id="banner"
      className="relative flex min-h-[50vh] items-center justify-center overflow-hidden py-24 sm:min-h-[60vh]"
    >
      <BannerParticleCanvas containerRef={ref} pointerRef={pointerRef} />
      <motion.div
        style={{ y: textY }}
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4"
      >
        <p className="max-w-[100vw] text-center font-display text-[clamp(32px,7vw,120px)] leading-none tracking-[0.06em] text-[rgb(240_237_230/0.07)] sm:whitespace-nowrap">
          STRUCTURE IS FORM
        </p>
      </motion.div>
      <div className="relative z-[2] max-w-[600px] px-6 text-center sm:px-12">
        <blockquote className="font-serif text-[clamp(18px,2.5vw,28px)] font-light italic leading-snug text-[#f0ede6]">
          &ldquo;Engineering is the art of directing the great sources of power in
          nature for the use and convenience of man.&rdquo;
        </blockquote>
        <cite className="mt-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-[#c8a96e] not-italic">
          — Thomas Tredgold, 1828
        </cite>
      </div>
    </section>
  )
}
