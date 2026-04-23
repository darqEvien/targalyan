import { motion } from 'framer-motion'

export function AboutSection() {
  return (
    <section
      id="about"
      className="grid grid-cols-1 items-start gap-12 px-6 py-24 sm:grid-cols-2 sm:gap-20 sm:px-12 sm:py-[140px]"
    >
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-[#c8a96e]">
          01 — About
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-display text-[clamp(52px,6vw,96px)] leading-[0.9] tracking-[0.02em] text-[#f0ede6]"
        >
          BUILT
          <br />
          ON
          <br />
          <em className="font-display not-italic text-[#c8a96e]">PRECISION</em>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="mt-10 font-serif text-[17px] font-light leading-[1.8] text-[rgb(240_237_230/0.75)]"
        >
          With over a decade of experience in structural and infrastructure
          engineering, Burak Targal brings a methodical yet visionary approach to
          every project — from conceptual design to construction oversight.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, delay: 0.14 }}
          className="mt-6 font-serif text-[17px] font-light leading-[1.8] text-[rgb(240_237_230/0.75)]"
        >
          Based in Istanbul, working globally. Specialising in complex structural
          systems, seismic-resistant design, and large-scale infrastructure
          development.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="mt-12 grid grid-cols-3 gap-px border border-[rgb(255_255_255/0.07)] bg-[rgb(255_255_255/0.07)]"
        >
          {[
            { n: '47', l: 'Projects completed' },
            { n: '12', l: 'Years experience' },
            { n: '8', l: 'Countries' },
          ].map((s) => (
            <div key={s.l} className="bg-[#0e0e0c] px-5 py-6">
              <div className="font-display text-5xl leading-none text-[#c8a96e]">{s.n}</div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7a7870]">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      <div className="pt-0 sm:pt-20">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-[#c8a96e]">
          Disciplines
        </p>
        <ul className="list-none">
          {[
            ['Structural engineering', '01'],
            ['Infrastructure design', '02'],
            ['Seismic analysis', '03'],
            ['Bridge engineering', '04'],
            ['Urban development', '05'],
            ['Geotechnical systems', '06'],
            ['Construction management', '07'],
          ].map(([label, num], i) => (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              data-cursor="hover"
              className="flex items-center justify-between border-b border-[rgb(255_255_255/0.07)] py-[18px] text-[13px] text-[#7a7870] transition-colors hover:text-[#f0ede6]"
            >
              <span>{label}</span>
              <span className="font-mono text-[10px] tracking-[0.1em] text-[#c8a96e]">{num}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
