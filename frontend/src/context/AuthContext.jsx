import { createContext, useContext, useReducer, useEffect } from 'react'
import { login as apiLogin } from '../api/auth'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      }
    case 'RESTORE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem('fleetflow_token')
    const userStr = localStorage.getItem('fleetflow_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch({ type: 'RESTORE', payload: { token, user } })
      } catch (e) {
        localStorage.removeItem('fleetflow_token')
        localStorage.removeItem('fleetflow_user')
      }
    }
  }, [])

  const login = async (email, password) => {
    const response = await apiLogin(email, password)
    const token = response.access_token
    
    const userPayload = { email, role: 'manager' }
    
    localStorage.setItem('fleetflow_token', token)
    localStorage.setItem('fleetflow_user', JSON.stringify(userPayload))
    
    dispatch({ type: 'LOGIN', payload: { user: userPayload, token } })
    
    return userPayload
  }

  const logout = () => {
    localStorage.removeItem('fleetflow_token')
    localStorage.removeItem('fleetflow_user')
    dispatch({ type: 'LOGOUT' })
  }

  const hasRole = (roles) => {
    if (!state.user) return false
    return roles.includes(state.user.role)
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
