import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useProjects } from '../../context/ProjectsContext'
import type { Project } from '../../types/project'

function padIndex(i: number) {
  return String(i + 1).padStart(3, '0')
}

function sortProjects(list: Project[]) {
  return [...list].sort((a, b) => {
    const ya = parseInt(a.year, 10)
    const yb = parseInt(b.year, 10)
    if (!Number.isNaN(ya) && !Number.isNaN(yb) && ya !== yb) return yb - ya
    return a.title.localeCompare(b.title)
  })
}

export function ProjectsSection() {
  const { projects } = useProjects()
  const sorted = useMemo(() => sortProjects(projects), [projects])
  const [hovered, setHovered] = useState<Project | null>(null)
  const previewPos = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const raf = useRef(0)
  const previewEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX + 20, y: e.clientY - 100 }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    const tick = () => {
      previewPos.current.x += (target.current.x - previewPos.current.x) * 0.12
      previewPos.current.y += (target.current.y - previewPos.current.y) * 0.12
      const el = previewEl.current
      if (el) {
        el.style.left = `${previewPos.current.x}px`
        el.style.top = `${previewPos.current.y}px`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const yearSpan = useMemo(() => {
    const years = sorted.map((p) => parseInt(p.year, 10)).filter((n) => !Number.isNaN(n))
    if (!years.length) return '—'
    const min = Math.min(...years)
    const max = Math.max(...years)
    return min === max ? String(min) : `${min} — ${max}`
  }, [sorted])

  return (
    <section id="projects" className="px-6 pb-24 sm:px-12 sm:pb-[140px]">
      <div className="mb-20 h-px w-full bg-[rgb(255_255_255/0.07)]" />

      <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(48px,6vw,88px)] leading-[0.9] text-[#f0ede6]"
        >
          SELECTED
          <br />
          WORK
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-right font-mono text-[11px] tracking-[0.15em] text-[#7a7870]"
        >
          <div>{yearSpan}</div>
          <div className="mt-1 text-[#c8a96e]">{String(sorted.length).padStart(2, '0')} projects</div>
        </motion.div>
      </div>

      <div className="flex flex-col">
        {sorted.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ delay: Math.min(i, 4) * 0.04, duration: 0.5 }}
            data-cursor="hover"
            className="group relative grid cursor-none grid-cols-[48px_1fr] items-center gap-4 overflow-hidden border-b border-[rgb(255_255_255/0.07)] py-8 sm:grid-cols-[80px_1fr_240px_120px] sm:gap-8 sm:py-8"
            onPointerEnter={() => setHovered(p)}
            onPointerLeave={() => setHovered(null)}
          >
            <span
              className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[rgb(200_169_110/0.12)] transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-x-100"
              aria-hidden
            />
            <span className="relative z-[1] font-mono text-[11px] tracking-[0.1em] text-[#c8a96e]">
              {padIndex(i)}
            </span>
            <span className="relative z-[1] font-display text-2xl tracking-[0.04em] text-[#f0ede6] transition-colors group-hover:text-[#c8a96e] sm:text-[28px]">
              {p.title.toUpperCase()}
            </span>
            <span className="relative z-[1] hidden font-mono text-[11px] uppercase tracking-[0.15em] text-[#7a7870] sm:block">
              {p.projectType ?? 'Structural'}
            </span>
            <span className="relative z-[1] hidden text-right text-xs text-[#7a7870] sm:block">
              {p.year}
            </span>
          </motion.div>
        ))}
      </div>

      <div
        ref={previewEl}
        className={`pointer-events-none fixed z-[45] h-[200px] w-[300px] overflow-hidden border border-[rgb(255_255_255/0.12)] transition-opacity duration-300 max-sm:hidden ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      >
        {hovered && (
          <img
            src={hovered.imageUrl}
            alt=""
            className="h-full w-full object-cover brightness-[0.82] grayscale-[40%]"
          />
        )}
      </div>
    </section>
  )
}
