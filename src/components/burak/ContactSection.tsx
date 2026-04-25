import { motion } from 'framer-motion'

export function ContactSection() {
  return (
    <section
      id="contact"
      className="grid grid-cols-1 gap-12 px-6 py-24 sm:grid-cols-2 sm:gap-20 sm:px-12 sm:py-[140px]"
    >
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-[#c8a96e]">
          03 — Contact
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-[clamp(60px,8vw,120px)] leading-[0.88] tracking-[0.02em] text-[#f0ede6]"
        >
          LET&apos;S
          <br />
          BUILD
          <br />
          <em className="font-display not-italic text-[#c8a96e]">TOGETHER</em>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mt-8 max-w-md font-serif text-base font-light italic leading-relaxed text-[#7a7870]"
        >
          Have a project in mind? Send a brief and let&apos;s discuss how we can
          bring it to life.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.14 }}
          className="mt-12"
        >
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8a96e]">
            Email
          </div>
          <div className="font-serif text-base text-[#7a7870]">burak@targal.com</div>
          <div className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8a96e]">
            Location
          </div>
          <div className="font-serif text-base text-[#7a7870]">Istanbul, Turkey</div>
        </motion.div>
      </div>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex flex-col gap-6 pt-0 sm:pt-5"
        onSubmit={(e) => e.preventDefault()}
      >
        {[
          { id: 'name', label: 'Full name', type: 'text', ph: 'Your name' },
          { id: 'email', label: 'Email', type: 'email', ph: 'your@email.com' },
        ].map((f) => (
          <div key={f.id} className="flex flex-col gap-2">
            <label htmlFor={f.id} className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8a96e]">
              {f.label}
            </label>
            <input
              id={f.id}
              type={f.type}
              placeholder={f.ph}
              className="w-full border-0 border-b border-[rgb(255_255_255/0.12)] bg-transparent py-2.5 font-mono text-[13px] font-light text-[#f0ede6] outline-none transition-colors focus:border-[#c8a96e]"
            />
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <label htmlFor="ptype" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8a96e]">
            Project type
          </label>
          <select
            id="ptype"
            className="w-full cursor-pointer appearance-none border-0 border-b border-[rgb(255_255_255/0.12)] bg-transparent py-2.5 font-mono text-[13px] font-light text-[#f0ede6] outline-none focus:border-[#c8a96e]"
          >
            <option value="">Select type…</option>
            <option>Bridge / infrastructure</option>
            <option>Structural design</option>
            <option>Urban development</option>
            <option>Marine engineering</option>
            <option>Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="brief" className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8a96e]">
            Brief
          </label>
          <textarea
            id="brief"
            rows={4}
            placeholder="Describe your project…"
            className="h-[100px] w-full resize-none border-0 border-b border-[rgb(255_255_255/0.12)] bg-transparent py-2.5 font-mono text-[13px] font-light text-[#f0ede6] outline-none focus:border-[#c8a96e]"
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-fit border border-[#8b6e3f] bg-transparent px-9 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-[#c8a96e] transition-colors hover:bg-[rgb(200_169_110/0.12)]"
        >
          Send brief →
        </button>
      </motion.form>
    </section>
  )
}
