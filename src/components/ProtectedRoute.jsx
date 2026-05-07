import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const defaultPath = (role) => (role === 'superAdmin' ? '/admin/dashboard' : '/ba/dashboard')

export default function ProtectedRoute({ roles, children }) {
  const { token, user } = useSelector((state) => state.auth)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={defaultPath(user?.role)} replace />
  }

  return children
}
