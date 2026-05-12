import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../src/pages/Login'
import authReducer from '../../src/store/authSlice'

const renderLogin = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer
    }
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>
  )
}

describe('Login page', () => {
  test('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/admin@consultancy.com/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  test('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  test('password field is type=password', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
  })
})
