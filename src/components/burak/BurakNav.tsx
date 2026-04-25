import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function BurakNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-7 transition-[border-color,background,backdrop-filter] duration-500 sm:px-12 ${
        scrolled
          ? 'border-b border-[rgb(255_255_255/0.07)] bg-[rgb(8_8_7/0.85)] backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <a
        href="#"
        className="font-display text-[22px] tracking-[0.12em] text-[#f0ede6] no-underline"
      >
        B<span className="text-[#c8a96e]">.</span>TARGAL
      </a>
      <div className="flex items-center gap-6 sm:gap-10">
        {[
          { href: '#about', label: 'About' },
          { href: '#projects', label: 'Projects' },
          { href: '#contact', label: 'Contact' },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="group relative hidden font-mono text-[11px] uppercase tracking-[0.2em] text-[#7a7870] transition-colors hover:text-[#f0ede6] sm:block"
          >
            {l.label}
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#c8a96e] transition-transform duration-300 group-hover:scale-x-100" />
          </a>
        ))}
        <Link
          to="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#c8a96e] no-underline sm:ml-2"
        >
          Admin ↗
        </Link>
      </div>
    </nav>
  )
}
