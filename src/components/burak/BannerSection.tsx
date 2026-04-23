import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BannerParticleCanvas } from './hero/BannerParticleCanvas'

export function BannerSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const textY = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section
      ref={ref}
      id="banner"
      className="relative flex min-h-[50vh] items-center justify-center overflow-hidden py-24 sm:min-h-[60vh]"
    >
      <BannerParticleCanvas />
      <motion.div
        style={{ y: textY }}
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
      >
        <p className="whitespace-nowrap text-center font-display text-[clamp(40px,8vw,120px)] tracking-[0.06em] text-[rgb(240_237_230/0.06)]">
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
