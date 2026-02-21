import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'

// Layout
import AdminLayout from '@/components/layout/AdminLayout'

// Pages
import LoginPage        from '@/pages/LoginPage'
import DashboardPage    from '@/pages/DashboardPage'
import FacultyPage      from '@/pages/FacultyPage'
import StudentsPage     from '@/pages/StudentsPage'
import ActivitiesPage   from '@/pages/ActivitiesPage'
import CertificatesPage from '@/pages/CertificatesPage'
import NotFoundPage     from '@/pages/NotFoundPage'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/admin" replace /> : children
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />

    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

    <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index           element={<DashboardPage />} />
      <Route path="faculty"      element={<FacultyPage />} />
      <Route path="students"     element={<StudentsPage />} />
      <Route path="activities"   element={<ActivitiesPage />} />
      <Route path="certificates" element={<CertificatesPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)

/**
 * App
 * ───
 * ThemeProvider must wrap everything so CSS vars are applied on <html>
 * before any component renders.
 */
const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

export default App
