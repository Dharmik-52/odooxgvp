import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin, forgotPassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Check, Truck } from 'lucide-react'
import AuthInput from '../components/auth/AuthInput'
import AuthCard from '../components/auth/AuthCard'
import PasswordInput from '../components/auth/PasswordInput'
import { loginSchema, validateForm } from '../utils/validation'

function useScreenSize() {
  const [size, setSize] = useState({ width: 1200, isMobile: false })
  useEffect(() => {
    const handle = () => setSize({ width: window.innerWidth, isMobile: window.innerWidth < 768 })
    handle()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])
  return size
}

export default function Login() {
  const { isMobile } = useScreenSize()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPanel, setShowForgotPanel] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const { login } = useAuth()
  const handleLogin = async (e) => {
    e.preventDefault()

    const { success, errors } = validateForm(loginSchema, { email, password })
    setEmailError(errors?.email || '')
    setPasswordError(errors?.password || '')
    if (!success) return

    setIsLoading(true)
    setApiError('')

    try {
      const res = await apiLogin(email, password)
      const { access_token, role, full_name } = res

      authLogin(access_token, { role, full_name })
      toast.success(`Welcome back, ${full_name}!`)
    } catch (err) {
      if (err.response?.status === 401) {
        setApiError('Invalid email or password. Please try again.')
      } else {
        toast.error('Server error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error('Please enter your email')
      return
    }

    setForgotLoading(true)
    try {
      await forgotPassword(forgotEmail)
      setForgotSuccess(true)
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleEmailBlur = () => {
    const { errors } = validateForm(loginSchema, { email, password: password || 'x' })
    setEmailError(errors?.email || '')
  }

  const handlePasswordBlur = () => {
    const { errors } = validateForm(loginSchema, { email: email || 'x@x.x', password })
    setPasswordError(errors?.password || '')
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#0D1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "16px" : "24px",
    position: "relative",
    overflow: "hidden"
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4 relative overflow-hidden" style={pageStyle}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #30363D 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className={`relative w-full max-w-[440px] animate-card-enter ${isMobile ? 'p-5' : ''}`} style={isMobile ? { width: '100%', maxWidth: '100%', margin: 0, borderRadius: 0 } : {}}>
        <AuthCard title="Sign in" subtitle="Sign in to your account">
          <form onSubmit={handleLogin} className="space-y-5">
            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              error={emailError}
              placeholder="you@company.com"
            />

            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              error={passwordError}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#30363D] accent-green-400 bg-[#0D1117]"
                />
                <span className="text-gray-400 text-sm">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPanel(!showForgotPanel)}
                className="text-green-400 text-sm hover:text-green-300 cursor-pointer underline-offset-2 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin border-2 border-black border-t-transparent rounded-full" />
              ) : (
                'Sign In'
              )}
            </button>

            {apiError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
                <p className="text-red-400 text-sm text-center">{apiError}</p>
              </div>
            )}

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border border-[#30363D]" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 border border-[#30363D]" />
            </div>

            <p className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-400 hover:text-green-300">
                Create one →
              </Link>
            </p>
          </form>

          <div
            className={`overflow-hidden transition-all duration-400 ease-in-out ${showForgotPanel ? 'mt-4 max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-4">
              {forgotSuccess ? (
                <div className="text-center py-2">
                  <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm font-medium">Check your inbox!</p>
                  <p className="text-gray-400 text-xs mt-1">
                    A reset link has been sent to {forgotEmail}
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="text-white text-sm font-semibold">Reset your password</h4>
                  <p className="text-gray-400 text-xs mt-1 mb-3">
                    Enter your email and we'll send you a reset link.
                  </p>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full h-9 px-3 bg-[#0D1117] text-white border border-[#30363D] rounded-md placeholder-gray-500 focus:outline-none focus:border-green-400 text-sm"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPanel(false)
                        setForgotSuccess(false)
                        setForgotEmail('')
                      }}
                      className="flex-1 h-9 bg-transparent border border-[#30363D] text-gray-400 text-sm font-medium rounded-md hover:bg-[#30363D] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="flex-1 h-9 bg-green-500 hover:bg-green-400 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {forgotLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </AuthCard>
      </div>

      <style>{`
        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-card-enter {
          animation: card-enter 0.4s ease;
        }
      `}</style>
    </div>
  )
}
