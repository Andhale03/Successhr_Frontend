import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const CandidatesList = lazy(() => import('./pages/admin/Candidates/CandidatesList'))
const CandidateForm = lazy(() => import('./pages/admin/Candidates/CandidateForm'))
const CandidateDetails = lazy(() => import('./pages/admin/Candidates/CandidateDetails'))
const CmsCompaniesList = lazy(() => import('./pages/admin/Candidates/CompaniesList'))
const CmsCompanyForm = lazy(() => import('./pages/admin/Candidates/CompanyForm'))
const AdminCommissionProcessPanel = lazy(() => import('./pages/admin/CommissionProcessPanel'))

function HomeRedirect() {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'superAdmin' ? '/candidate/admin/cms/candidates' : '/login'} replace />
}

function AppShell({ role, children }) {
  return <Sidebar role={role}>{children}</Sidebar>
}

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-600">Loading…</div>}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/candidate/admin/cms/candidates"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidatesList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/companies"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CmsCompaniesList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/candidates/new"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidateForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/candidates/:id"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidateDetails />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/candidates/:id/edit"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CandidateForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/process-panel"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <AdminCommissionProcessPanel />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/companies/new"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CmsCompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/admin/cms/companies/:id/edit"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <CmsCompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/candidate/admin/candidates" element={<Navigate to="/candidate/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/candidates/new" element={<Navigate to="/candidate/admin/cms/candidates/new" replace />} />
        <Route path="/candidate/admin/candidates/:id" element={<Navigate to="/candidate/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/companies/new" element={<Navigate to="/candidate/admin/cms/companies/new" replace />} />
        <Route path="/candidate/admin/process" element={<Navigate to="/candidate/admin/process-panel" replace />} />
        <Route path="/candidate/admin/commission-process" element={<Navigate to="/candidate/admin/process-panel" replace />} />

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  )
}
