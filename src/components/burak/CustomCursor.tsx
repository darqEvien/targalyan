import { useEffect, useRef, useState } from 'react'

/**
 * Crosshair cursor from the reference design. Disabled on small screens.
 * Mark interactive elements with `data-cursor="hover"`.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const hLine = useRef<HTMLDivElement>(null)
  const vLine = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const pos = useRef({ x: 0, y: 0 })
  const raf = useRef<number>(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)')
    const apply = () => {
      const on = mq.matches
      setEnabled(on)
      document.body.classList.toggle('cursor-site', on)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      document.body.classList.remove('cursor-site')
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const set = (v: boolean) => setHover(v)
    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('[data-cursor="hover"]')) set(true)
    }
    const onOut = (e: Event) => {
      const t = e.target as HTMLElement | null
      const rel = e.relatedTarget as HTMLElement | null
      if (t?.closest?.('[data-cursor="hover"]') && !rel?.closest?.('[data-cursor="hover"]'))
        set(false)
    }
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      const { x, y } = pos.current
      const t = `translate(${x}px,${y}px)`
      if (dot.current) dot.current.style.transform = `${t} translate(-50%,-50%)`
      if (hLine.current) hLine.current.style.transform = `${t} translate(-50%,-50%)`
      if (vLine.current) vLine.current.style.transform = `${t} translate(-50%,-50%)`
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden
    >
      <div
        ref={hLine}
        className="absolute left-0 top-0 h-px bg-[#c8a96e] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: hover ? 28 : 18,
          opacity: hover ? 0.9 : 0.55,
        }}
      />
      <div
        ref={vLine}
        className="absolute left-0 top-0 w-px bg-[#c8a96e] transition-[height,opacity] duration-200 ease-out"
        style={{
          height: hover ? 28 : 18,
          opacity: hover ? 0.9 : 0.55,
        }}
      />
      <div
        ref={dot}
        className="absolute left-0 top-0 h-[5px] w-[5px] rounded-full bg-[#c8a96e]"
      />
    </div>
  )
}
