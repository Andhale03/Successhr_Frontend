import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const defaultPath = (role) => (role === 'superAdmin' ? '/admin/dashboard' : '/ba/dashboard')

export default function ProtectedRoute({ roles, children, loginPath = '/login' }) {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) {
    return <Navigate to={loginPath} replace />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={defaultPath(user?.role)} replace />
  }

  return children
}
