import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { HeroBuildCanvas } from './hero/HeroBuildCanvas'

export function HeroSection() {
  const wrapRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const canvasY = useTransform(scrollY, [0, 900], [0, 220])

  return (
    <section
      id="hero"
      ref={wrapRef}
      className="relative flex min-h-[max(100dvh,700px)] items-end overflow-hidden"
    >
      <motion.div className="absolute inset-0" style={{ y: canvasY }}>
        <HeroBuildCanvas />
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0.35) 72%, transparent 100%)',
        }}
      />

      <div className="relative z-[2] w-full px-6 pb-16 pt-28 sm:px-12 sm:pb-[72px]">
        <p className="animate-[fadeUp_0.8s_0.3s_forwards] font-mono text-[11px] uppercase tracking-[0.3em] text-[#c8a96e] opacity-0">
          Civil engineer &amp; project designer
        </p>
        <h1 className="animate-[fadeUp_0.9s_0.5s_forwards] font-display text-[clamp(80px,12vw,180px)] leading-[0.88] tracking-[0.02em] text-[#f0ede6] opacity-0">
          BURAK
          <br />
          <em className="font-display not-italic text-[#c8a96e]">TARGAL</em>
        </h1>
        <div className="mt-8 flex flex-col gap-8 animate-[fadeUp_0.8s_0.8s_forwards] opacity-0 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[420px] font-serif text-lg font-light italic leading-snug text-[#7a7870]">
            Designing structures that endure — where precision engineering meets
            architectural vision.
          </p>
          <a
            href="#projects"
            className="inline-flex items-center gap-4 border border-[#8b6e3f] px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#c8a96e] no-underline transition-colors duration-300 hover:bg-[rgb(200_169_110/0.12)]"
          >
            View projects
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-6 z-[2] flex flex-col items-center gap-2 opacity-0 animate-[fadeIn_1s_1.2s_forwards] sm:right-12">
   
     
        <div
          className="h-[60px] w-px bg-gradient-to-b from-[#c8a96e] to-transparent"
          style={{ animation: 'scrollPulse 2s 1.5s infinite' }}
        />
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
      `}</style>
    </section>
  )
}
