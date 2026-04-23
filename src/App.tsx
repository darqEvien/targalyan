import { Navigate, Route, Routes } from 'react-router-dom'
import { ProjectsProvider } from './context/ProjectsContext'
import { Admin } from './pages/Admin'
import { Home } from './pages/Home'

export default function App() {
  return (
    <ProjectsProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProjectsProvider>
  )
}
