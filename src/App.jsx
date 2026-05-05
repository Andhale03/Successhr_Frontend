import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import BusinessAdvisors from './pages/admin/BusinessAdvisors'
import AdminReferenceBoard from './pages/admin/ReferenceBoard'
import AdminStudents from './pages/admin/Students'
import AdminCompanies from './pages/admin/Companies'
import AdminCommissionPanel from './pages/admin/CommissionPanel'
import AdminCommissionProcessPanel from './pages/admin/CommissionProcessPanel'
import AdminSettings from './pages/admin/Settings'
import BADashboard from './pages/ba/Dashboard'
import BAProfile from './pages/ba/Profile'
import StudentForm from './pages/ba/StudentForm'
import CompanyForm from './pages/ba/CompanyForm'
import BAStudents from './pages/ba/Students'
import BACompanies from './pages/ba/Companies'
import BAEarnings from './pages/ba/Earnings'

function HomeRedirect() {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'superAdmin' ? '/admin/references' : '/ba/dashboard'} replace />
}

function AppShell({ role, children }) {
  return <Sidebar role={role}>{children}</Sidebar>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin/references"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminReferenceBoard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/business-advisors"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <BusinessAdvisors />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminStudents />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/commission"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminCommissionPanel />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/commission-process"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminCommissionProcessPanel />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminCompanies />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={['superAdmin']}>
            <AppShell role="superAdmin">
              <AdminSettings />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ba/dashboard"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <BADashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ba/profile"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <BAProfile />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ba/students/new"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <StudentForm />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ba/companies/new"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <CompanyForm />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ba/students"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <BAStudents />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ba/companies"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <BACompanies />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ba/earnings"
        element={
          <ProtectedRoute roles={['businessAdvisor']}>
            <AppShell role="businessAdvisor">
              <BAEarnings />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="/ba/student/new" element={<Navigate to="/ba/students/new" replace />} />
      <Route path="/ba/company/new" element={<Navigate to="/ba/companies/new" replace />} />
      <Route path="/ba/my-references" element={<Navigate to="/ba/students" replace />} />
      <Route path="/ba/my-commission" element={<Navigate to="/ba/earnings" replace />} />
      <Route path="/admin/process" element={<Navigate to="/admin/commission-process" replace />} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
