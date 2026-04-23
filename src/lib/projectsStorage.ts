import type { Project } from '../types/project'

const STORAGE_KEY = 'targalyan_projects_v1'

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'seed-1',
    title: 'Bosphorus crossing',
    projectType: 'Bridge infrastructure',
    description:
      'Cable-supported crossing studies: aerodynamic stability, seismic isolation at towers, and marine construction windows.',
    imageUrl:
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200&q=80',
    year: '2024',
  },
  {
    id: 'seed-2',
    title: 'Atatürk cultural centre',
    projectType: 'Structural design',
    description:
      'Long-span roof and stage grids: tuned massing for acoustics, staged steel erection, and coordination with heritage envelopes.',
    imageUrl:
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
    year: '2023',
  },
  {
    id: 'seed-3',
    title: 'Kanal Istanbul segment',
    projectType: 'Urban infrastructure',
    description:
      'Earth-retention and flood routing: diaphragm wall checks, dewatering phasing, and settlement monitoring along the corridor.',
    imageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    year: '2023',
  },
  {
    id: 'seed-4',
    title: 'Mersin port expansion',
    projectType: 'Marine engineering',
    description:
      'Quay wall strengthening, berth fendering, and crane rail alignment for heavier container gear and storm surge cases.',
    imageUrl:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
    year: '2022',
  },
  {
    id: 'seed-5',
    title: 'Anatolian highway corridor',
    projectType: 'Road infrastructure',
    description:
      'Viaducts and cut-and-cover transitions: seismic joints, bearing schedules, and maintenance access strategy.',
    imageUrl:
      'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=1200&q=80',
    year: '2021',
  },
  {
    id: 'seed-6',
    title: 'Sabiha Gökçen terminal 2',
    projectType: 'Aviation infrastructure',
    description:
      'Concourse framing and roof drainage: snow drift assumptions, mezzanine transfer, and apron loading envelopes.',
    imageUrl:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80',
    year: '2020',
  },
  {
    id: 'seed-7',
    title: 'Izmir metro extension',
    projectType: 'Transit engineering',
    description:
      'Tunnel-driven alignment under dense urban fabric: settlement limits, building protection, and station box sequencing.',
    imageUrl:
      'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=1200&q=80',
    year: '2018',
  },
]

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return [...DEFAULT_PROJECTS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_PROJECTS]
    return parsed as Project[]
  } catch {
    return [...DEFAULT_PROJECTS]
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}
