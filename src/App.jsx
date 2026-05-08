import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import CandidateLogin from './pages/CandidateLogin'
import BusinessAdvisors from './pages/admin/BusinessAdvisors'
import AdminReferenceBoard from './pages/admin/ReferenceBoard'
import AdminStudents from './pages/admin/Students'
import AdminCompanies from './pages/admin/Companies'
import AdminCommissionPanel from './pages/admin/CommissionPanel'
import AdminSettings from './pages/admin/Settings'
import BADashboard from './pages/ba/Dashboard'
import BAProfile from './pages/ba/Profile'
import StudentForm from './pages/ba/StudentForm'
import CompanyForm from './pages/ba/CompanyForm'
import BAStudents from './pages/ba/Students'
import BACompanies from './pages/ba/Companies'
import BAEarnings from './pages/ba/Earnings'

import InterviewList from './pages/admin/Interviews/InterviewList'
import ApplyPage from './pages/public/ApplyPage'
import CmsCandidatesList from './candidate/pages/admin/Candidates/CandidatesList'
import CmsCandidateForm from './candidate/pages/admin/Candidates/CandidateForm'
import CmsCandidateDetails from './candidate/pages/admin/Candidates/CandidateDetails'
import CmsCompaniesList from './candidate/pages/admin/Candidates/CompaniesList'
import CmsCompanyForm from './candidate/pages/admin/Candidates/CompanyForm'
import CmsProcessPanel from './candidate/pages/admin/CommissionProcessPanel'

function HomeRedirect() {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'superAdmin' ? '/admin/references' : '/ba/dashboard'} replace />
}

function AppShell({ role, children }) {
  return <Sidebar role={role}>{children}</Sidebar>
}

export default function App() {
  if (import.meta.env.VITE_PUBLIC_APPLY_ONLY === 'true') {
    return (
      <Routes>
        <Route path="/" element={<ApplyPage />} />
        <Route path="/:code" element={<ApplyPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/apply/:code" element={<ApplyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/candidate/login" element={<CandidateLogin />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/apply/:code" element={<ApplyPage />} />
      <Route path="/candidate" element={<Navigate to="/candidate/login" replace />} />

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
        element={<Navigate to="/admin/references" replace />}
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
        path="/admin/cms/*"
        element={<Navigate to="/admin/references" replace />}
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
        path="/candidate/admin/cms/candidates"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCandidatesList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/cms/companies"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCompaniesList />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/cms/candidates/new"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCandidateForm />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/cms/candidates/:id"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCandidateDetails />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/cms/candidates/:id/edit"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCandidateForm />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/process-panel"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsProcessPanel />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/cms/companies/new"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCompanyForm />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/admin/cms/companies/:id/edit"
        element={
          <ProtectedRoute roles={['superAdmin']} loginPath="/candidate/login">
            <AppShell role="superAdmin">
              <CmsCompanyForm />
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
      <Route path="/admin/process" element={<Navigate to="/admin/references" replace />} />
      <Route path="/admin/commission-process" element={<Navigate to="/admin/references" replace />} />
      <Route path="/admin/candidates" element={<Navigate to="/admin/references" replace />} />
      <Route path="/admin/candidates/new" element={<Navigate to="/admin/references" replace />} />
      <Route path="/admin/candidates/:id" element={<Navigate to="/admin/references" replace />} />
      <Route path="/admin/companies/new" element={<Navigate to="/admin/references" replace />} />
      <Route path="/candidate/admin/process" element={<Navigate to="/candidate/admin/process-panel" replace />} />
      <Route path="/candidate/admin/commission-process" element={<Navigate to="/candidate/admin/process-panel" replace />} />
      <Route path="/candidate/admin/candidates" element={<Navigate to="/candidate/admin/cms/candidates" replace />} />
      <Route path="/candidate/admin/candidates/new" element={<Navigate to="/candidate/admin/cms/candidates/new" replace />} />
      <Route path="/candidate/admin/candidates/:id" element={<Navigate to="/candidate/admin/cms/candidates" replace />} />
      <Route path="/candidate/admin/companies/new" element={<Navigate to="/candidate/admin/cms/companies/new" replace />} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
