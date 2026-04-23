import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Project } from '../types/project'
import {
  DEFAULT_PROJECTS,
  loadProjects,
  saveProjects,
} from '../lib/projectsStorage'

type ProjectsContextValue = {
  projects: Project[]
  addProject: (p: Omit<Project, 'id'>) => void
  updateProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  removeProject: (id: string) => void
  resetToSamples: () => void
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

function newId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects())

  const persist = useCallback((next: Project[]) => {
    setProjects(next)
    saveProjects(next)
  }, [])

  const addProject = useCallback(
    (p: Omit<Project, 'id'>) => {
      persist([{ ...p, id: newId() }, ...projects])
    },
    [persist, projects],
  )

  const updateProject = useCallback(
    (id: string, patch: Partial<Omit<Project, 'id'>>) => {
      persist(
        projects.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      )
    },
    [persist, projects],
  )

  const removeProject = useCallback(
    (id: string) => {
      persist(projects.filter((x) => x.id !== id))
    },
    [persist, projects],
  )

  const resetToSamples = useCallback(() => {
    const fresh = [...DEFAULT_PROJECTS]
    setProjects(fresh)
    saveProjects(fresh)
  }, [])

  const value = useMemo(
    () => ({
      projects,
      addProject,
      updateProject,
      removeProject,
      resetToSamples,
    }),
    [projects, addProject, updateProject, removeProject, resetToSamples],
  )

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
