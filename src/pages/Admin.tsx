import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectsContext'
import { fileToResizedDataUrl } from '../lib/imageResize'
import type { Project } from '../types/project'

const SESSION_KEY = 'targalyan_admin_session'
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80'

function readSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

function writeSession(ok: boolean) {
  if (ok) sessionStorage.setItem(SESSION_KEY, '1')
  else sessionStorage.removeItem(SESSION_KEY)
}

function expectedPassword(): string {
  return import.meta.env.VITE_ADMIN_PASSWORD?.trim() || 'studio'
}

export function Admin() {
  const [authed, setAuthed] = useState(readSession)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const { projects, addProject, updateProject, removeProject, resetToSamples } =
    useProjects()

  const [title, setTitle] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [projectType, setProjectType] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [fileBusy, setFileBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)

  const logout = useCallback(() => {
    writeSession(false)
    setAuthed(false)
  }, [])

  const tryLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (password === expectedPassword()) {
        writeSession(true)
        setAuthed(true)
        setLoginError('')
        setPassword('')
      } else {
        setLoginError('Incorrect passphrase.')
      }
    },
    [password],
  )

  const onPickFile = useCallback(async (f: File | null) => {
    if (!f) return
    setFormError('')
    setFileBusy(true)
    try {
      const dataUrl = await fileToResizedDataUrl(f)
      setImageUrl(dataUrl)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not read file')
    } finally {
      setFileBusy(false)
    }
  }, [])

  const submitAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim()) {
        setFormError('Title is required.')
        return
      }
      addProject({
        title: title.trim(),
        year: year.trim() || '—',
        projectType: projectType.trim() || undefined,
        description: description.trim() || '—',
        imageUrl: imageUrl.trim() || PLACEHOLDER_IMAGE,
      })
      setTitle('')
      setProjectType('')
      setDescription('')
      setImageUrl('')
      setYear(String(new Date().getFullYear()))
      setFormError('')
    },
    [addProject, title, year, projectType, description, imageUrl],
  )

  const editing = useMemo(
    () => projects.find((p) => p.id === editingId) ?? null,
    [projects, editingId],
  )

  if (!authed) {
    return (
      <div className="min-h-dvh bg-zinc-950 px-4 py-16 text-zinc-200">
        <div className="mx-auto max-w-md border border-zinc-800 bg-zinc-900/30 p-8 shadow-[8px_8px_0_0_rgb(24_24_27)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-600/90">
            Studio
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-[0.12em]">
            Admin access
          </h1>
          <p className="mt-4 font-mono text-xs leading-relaxed text-zinc-500">
            Passphrase defaults to <span className="text-zinc-300">studio</span>{' '}
            unless you set{' '}
            <span className="text-zinc-300">VITE_ADMIN_PASSWORD</span> in{' '}
            <span className="text-zinc-300">.env</span>.
          </p>
          <form onSubmit={tryLogin} className="mt-8 space-y-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Passphrase
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/50"
                autoComplete="current-password"
              />
            </label>
            {loginError && (
              <p className="font-mono text-xs text-red-400/90">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full border border-zinc-600 bg-zinc-100 py-3 font-mono text-xs font-medium uppercase tracking-widest text-zinc-950 hover:bg-white"
            >
              Enter
            </button>
          </form>
          <Link
            to="/"
            className="mt-8 inline-block font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-600/90">
              Studio panel
            </p>
            <h1 className="font-display text-xl font-semibold uppercase tracking-[0.12em]">
              Projects
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="border border-zinc-700 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="border border-zinc-700 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
        <section className="border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            New project
          </h2>
          <form onSubmit={submitAdd} className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:col-span-2">
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/50"
              />
            </label>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Year
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/50"
              />
            </label>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:col-span-2">
              Project type
              <input
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="e.g. Bridge infrastructure"
                className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/50"
              />
            </label>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:col-span-2">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2 w-full resize-y border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/50"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Image
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  className="font-mono text-xs text-zinc-400 file:mr-3 file:border file:border-zinc-600 file:bg-zinc-900 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-widest file:text-zinc-200"
                />
                {fileBusy && (
                  <span className="font-mono text-xs text-zinc-500">
                    Processing…
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-[10px] text-zinc-600">
                Or paste an image URL (overrides file after you type):
              </p>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-600/50"
              />
            </div>
            {formError && (
              <p className="font-mono text-xs text-red-400/90 sm:col-span-2">
                {formError}
              </p>
            )}
            <button
              type="submit"
              className="border border-zinc-600 bg-zinc-100 py-3 font-mono text-xs font-medium uppercase tracking-widest text-zinc-950 hover:bg-white sm:col-span-2"
            >
              Publish project
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Library ({projects.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Reset all projects to the built-in sample set? This clears your list.',
                  )
                )
                  resetToSamples()
              }}
              className="border border-zinc-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:border-amber-700/40 hover:text-amber-600/90"
            >
              Reset samples
            </button>
          </div>

          <ul className="mt-6 space-y-4">
            {projects.map((p) => (
              <li
                key={p.id}
                className="border border-zinc-800 bg-zinc-900/20 p-4 sm:p-5"
              >
                {editingId === p.id && editing ? (
                  <EditForm
                    project={editing}
                    onSave={(patch) => {
                      updateProject(p.id, patch)
                      setEditingId(null)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-24 w-full shrink-0 overflow-hidden border border-zinc-800 sm:h-20 sm:w-32">
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-full w-full object-cover grayscale sm:grayscale-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        {p.year}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-zinc-100">
                        {p.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 font-mono text-xs text-zinc-500">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id)}
                        className="border border-zinc-700 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this project?')) removeProject(p.id)
                        }}
                        className="border border-red-900/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400/80 hover:border-red-700/60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function EditForm({
  project,
  onSave,
  onCancel,
}: {
  project: Project
  onSave: (patch: Partial<Omit<Project, 'id'>>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(project.title)
  const [year, setYear] = useState(project.year)
  const [projectType, setProjectType] = useState(project.projectType ?? '')
  const [description, setDescription] = useState(project.description)
  const [imageUrl, setImageUrl] = useState(project.imageUrl)
  const [fileBusy, setFileBusy] = useState(false)

  const onEditFile = async (f: File | null) => {
    if (!f) return
    setFileBusy(true)
    try {
      const dataUrl = await fileToResizedDataUrl(f)
      setImageUrl(dataUrl)
    } finally {
      setFileBusy(false)
    }
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          title: title.trim(),
          year: year.trim(),
          projectType: projectType.trim() || undefined,
          description: description.trim(),
          imageUrl: imageUrl.trim() || PLACEHOLDER_IMAGE,
        })
      }}
    >
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:col-span-2">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
        />
      </label>
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        Year
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
        />
      </label>
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:col-span-2">
        Project type
        <input
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
        />
      </label>
      <div className="sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Image file / URL
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onEditFile(e.target.files?.[0] ?? null)}
          className="mt-2 font-mono text-xs text-zinc-400 file:mr-3 file:border file:border-zinc-600 file:bg-zinc-900 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-widest file:text-zinc-200"
        />
        {fileBusy && (
          <span className="ml-2 font-mono text-xs text-zinc-500">Processing…</span>
        )}
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
        />
      </div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:col-span-2">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-2 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
        />
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button
          type="submit"
          className="border border-zinc-600 bg-zinc-100 px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-zinc-950"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-zinc-700 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
