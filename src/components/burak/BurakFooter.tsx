export function BurakFooter() {
  return (
    <footer className="flex flex-col items-start justify-between gap-5 border-t border-[rgb(255_255_255/0.07)] px-6 py-10 sm:flex-row sm:items-center sm:px-12 sm:py-10">
      <div className="font-mono text-[11px] tracking-[0.1em] text-[#7a7870]">
        © {new Date().getFullYear()} Burak Targal. All rights reserved.
      </div>
      <div className="flex flex-wrap gap-8">
        {['LinkedIn', 'Instagram', 'CV / Resume'].map((l) => (
          <a
            key={l}
            href="#"
            data-cursor="hover"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7a7870] no-underline transition-colors hover:text-[#c8a96e]"
          >
            {l}
          </a>
        ))}
      </div>
    </footer>
  )
}
