export type Project = {
  id: string
  title: string
  description: string
  imageUrl: string
  year: string
  /** Short label for list rows (e.g. “Bridge Infrastructure”). */
  projectType?: string
}
