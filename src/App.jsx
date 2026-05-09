import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const BusinessAdvisors = lazy(() => import('./pages/admin/BusinessAdvisors'))
const AdminReferenceBoard = lazy(() => import('./pages/admin/ReferenceBoard'))
const AdminStudents = lazy(() => import('./pages/admin/Students'))
const AdminCompanies = lazy(() => import('./pages/admin/Companies'))
const AdminCommissionPanel = lazy(() => import('./pages/admin/CommissionPanel'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))
const BADashboard = lazy(() => import('./pages/ba/Dashboard'))
const BAProfile = lazy(() => import('./pages/ba/Profile'))
const StudentForm = lazy(() => import('./pages/ba/StudentForm'))
const CompanyForm = lazy(() => import('./pages/ba/CompanyForm'))
const BAStudents = lazy(() => import('./pages/ba/Students'))
const BACompanies = lazy(() => import('./pages/ba/Companies'))
const BAEarnings = lazy(() => import('./pages/ba/Earnings'))

const InterviewList = lazy(() => import('./pages/admin/Interviews/InterviewList'))
const ApplyPage = lazy(() => import('./pages/public/ApplyPage'))
const CmsCandidatesList = lazy(() => import('./candidate/pages/admin/Candidates/CandidatesList'))
const CmsCandidateForm = lazy(() => import('./candidate/pages/admin/Candidates/CandidateForm'))
const CmsAddCandidate = lazy(() => import('./candidate/pages/admin/Candidates/AddCandidate'))
const CmsCandidateDetail = lazy(() => import('./candidate/pages/admin/Candidates/CandidateDetail'))
const CmsCompaniesList = lazy(() => import('./candidate/pages/admin/Candidates/CompaniesList'))
const CmsCompanyForm = lazy(() => import('./candidate/pages/admin/Candidates/CompanyForm'))
const CmsProcessPanel = lazy(() => import('./candidate/pages/admin/CommissionProcessPanel'))
const CmsInterviewList = lazy(() => import('./candidate/pages/admin/Interviews/InterviewList'))
const CmsInterviewDetails = lazy(() => import('./candidate/pages/admin/Interviews/InterviewDetails'))

function HomeRedirect() {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'superAdmin') return <Navigate to="/admin/references" replace />
  if (user?.role === 'candidateAdmin') return <Navigate to="/admin/cms/candidates" replace />
  return <Navigate to="/ba/dashboard" replace />
}

function AppShell({ role, children }) {
  return <Sidebar role={role}>{children}</Sidebar>
}

function SettingsShell() {
  const role = useSelector((state) => state.auth.user?.role)
  const sidebarRole = role === 'candidateAdmin' ? 'candidateAdmin' : 'superAdmin'
  return (
    <AppShell role={sidebarRole}>
      <AdminSettings />
    </AppShell>
  )
}

export default function App() {
  const routeFallback = <div className="p-6 text-slate-600">Loading…</div>

  if (import.meta.env.VITE_PUBLIC_APPLY_ONLY === 'true') {
    return (
      <Suspense fallback={routeFallback}>
        <Routes>
          <Route path="/" element={<ApplyPage />} />
          <Route path="/:code" element={<ApplyPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/apply/:code" element={<ApplyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/apply/:code" element={<ApplyPage />} />

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
        <Route path="/admin/dashboard" element={<Navigate to="/admin/references" replace />} />
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
          path="/admin/cms/candidates"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsCandidatesList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/companies"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsCompaniesList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/new"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsCandidateForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/add"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsAddCandidate />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/:id"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsCandidateDetail />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/candidates/:id/edit"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsAddCandidate />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/process-panel"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsProcessPanel />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/companies/new"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsCompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/companies/:id/edit"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsCompanyForm />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/interviews"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsInterviewList />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cms/interviews/:id"
          element={
            <ProtectedRoute roles={['candidateAdmin']}>
              <AppShell role="candidateAdmin">
                <CmsInterviewDetails />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/interviews"
          element={
            <ProtectedRoute roles={['superAdmin']}>
              <AppShell role="superAdmin">
                <InterviewList />
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
        <Route path="/admin/process-panel" element={<Navigate to="/admin/references" replace />} />
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
            <ProtectedRoute roles={['superAdmin', 'candidateAdmin']}>
              <SettingsShell />
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

        <Route path="/admin/cms/companies/new" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/cms/companies/:id/edit" element={<Navigate to="/admin/references" replace />} />
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
        <Route
          path="/ba/settings"
          element={
            <ProtectedRoute roles={['businessAdvisor']}>
              <AppShell role="businessAdvisor">
                <AdminSettings />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route path="/ba/student/new" element={<Navigate to="/ba/students/new" replace />} />
        <Route path="/ba/company/new" element={<Navigate to="/ba/companies/new" replace />} />
        <Route path="/ba/my-references" element={<Navigate to="/ba/students" replace />} />
        <Route path="/ba/my-commission" element={<Navigate to="/ba/earnings" replace />} />
        <Route path="/admin/process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/admin/commission-process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/admin/candidates" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/candidates/new" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/candidates/:id" element={<Navigate to="/admin/references" replace />} />
        <Route path="/admin/companies/new" element={<Navigate to="/admin/cms/companies/new" replace />} />
        <Route path="/candidate" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/candidate/admin/commission-process" element={<Navigate to="/admin/process-panel" replace />} />
        <Route path="/candidate/admin/candidates" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/candidates/new" element={<Navigate to="/admin/cms/candidates/new" replace />} />
        <Route path="/candidate/admin/candidates/:id" element={<Navigate to="/admin/cms/candidates" replace />} />
        <Route path="/candidate/admin/companies/new" element={<Navigate to="/admin/cms/companies/new" replace />} />

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  )
}
