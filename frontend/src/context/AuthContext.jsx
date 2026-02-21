import { createContext, useContext, useReducer, useEffect } from 'react'
import { login as apiLogin, getMe } from '../api/auth'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        isAuthenticated: true,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
      }
    case 'RESTORE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        isAuthenticated: true,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('fleetflow_token')
    const userStr = localStorage.getItem('fleetflow_user')
    const role = localStorage.getItem('fleetflow_role')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch({ type: 'RESTORE', payload: { token, user, role } })
      } catch (e) {
        localStorage.removeItem('fleetflow_token')
        localStorage.removeItem('fleetflow_user')
        localStorage.removeItem('fleetflow_role')
      }
    }
  }, [])

  const login = async (email, password) => {
    const response = await apiLogin(email, password)
    const { access_token, role, full_name, email: userEmail } = response
    
    const userPayload = { 
      full_name, 
      email: userEmail 
    }
    
    localStorage.setItem('fleetflow_token', access_token)
    localStorage.setItem('fleetflow_user', JSON.stringify(userPayload))
    localStorage.setItem('fleetflow_role', role)
    
    dispatch({ type: 'LOGIN', payload: { user: userPayload, token: access_token, role } })
    
    const redirectPath = getRoleRedirectPath(role)
    navigate(redirectPath)
    
    return { user: userPayload, role }
  }

  const logout = () => {
    localStorage.removeItem('fleetflow_token')
    localStorage.removeItem('fleetflow_user')
    localStorage.removeItem('fleetflow_role')
    dispatch({ type: 'LOGOUT' })
    navigate('/login')
  }

  const hasRole = (roles) => {
    if (!state.user) return false
    return roles.includes(state.role)
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

function getRoleRedirectPath(role) {
  const rolePaths = {
    manager: '/dashboard',
    dispatcher: '/trips',
    safety_officer: '/drivers',
    analyst: '/analytics'
  }
  return rolePaths[role] || '/dashboard'
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
