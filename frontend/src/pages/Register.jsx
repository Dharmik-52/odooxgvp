import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import toast from 'react-hot-toast'
import {
  Truck, Eye, EyeOff, Loader2, Check,
  ShieldCheck, AlertTriangle, BarChart2
} from 'lucide-react'
import AuthCard from '../components/auth/AuthCard'
import AuthInput from '../components/auth/AuthInput'
import PasswordInput from '../components/auth/PasswordInput'
import { registerSchema, validateForm } from '../utils/validation'

const roles = [
  {
    value: 'manager',
    label: 'Manager',
    description: 'Full system access',
    icon: ShieldCheck,
    iconColor: 'text-green-400'
  },
  {
    value: 'dispatcher',
    label: 'Dispatcher',
    description: 'Manage trips & vehicles',
    icon: Truck,
    iconColor: 'text-blue-400'
  },
]

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [termsError, setTermsError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [registeredName, setRegisteredName] = useState('')
  const [registeredRole, setRegisteredRole] = useState('')

  const navigate = useNavigate()

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const isStrongPassword = (pwd) =>
    pwd.length >= 8 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return 0
    if (pwd.length < 6) return 1
    if (isStrongPassword(pwd)) return 3
    return 2
  }

  const passwordStrength = getPasswordStrength(password)

  const getStrengthColor = (level) => {
    if (level === 1) return 'bg-red-500'
    if (level === 2) return 'bg-yellow-500'
    if (level === 3) return 'bg-green-500'
    return 'bg-[#30363D]'
  }

  const getStrengthLabel = (level) => {
    if (level === 1) return 'text-red-400'
    if (level === 2) return 'text-yellow-400'
    if (level === 3) return 'text-green-400'
    return ''
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    const formPayload = {
      full_name: fullName,
      email,
      password,
      confirmPassword: confirmPassword,
      role: selectedRole,
      terms: termsAccepted,
    }
    const { success, errors } = validateForm(registerSchema, formPayload)

    setNameError(errors?.full_name || '')
    setEmailError(errors?.email || '')
    setRoleError(errors?.role || '')
    setPasswordError(errors?.password || '')
    setConfirmError(errors?.confirmPassword || '')
    setTermsError(errors?.terms || '')

    if (!success) return

    setIsLoading(true)

    try {
      const res = await register(fullName, email, password, selectedRole)
      setRegisteredName(res.full_name)
      setRegisteredRole(res.role)
      setIsSuccess(true)

    } catch (err) {
      if (err.response?.status === 409) {
        setEmailError('An account with this email already exists')
      } else if (err.response?.status === 422) {
        toast.error('Please check your input and try again.')
      } else {
        toast.error('Server error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameBlur = () => {
    if (fullName && fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters')
    } else {
      setNameError('')
    }
  }

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  const handleConfirmBlur = () => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmError('Passwords do not match')
    } else {
      setConfirmError('')
    }
  }

  const selectedRoleData = roles.find(r => r.value === registeredRole || r.value === selectedRole)

  const isFormValid = fullName.trim().length >= 2 &&
    isValidEmail(email) &&
    selectedRole &&
    isStrongPassword(password) &&
    password === confirmPassword &&
    termsAccepted

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4 relative overflow-hidden overflow-y-auto">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #30363D 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative w-full max-w-[480px] animate-card-enter">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-10 shadow-2xl text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center animate-check-draw">
                <svg className="w-20 h-20" viewBox="0 0 52 52">
                  <circle
                    className="check-circle-bg"
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  <path
                    className="check-mark"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-gray-400 text-sm mb-3">
              Welcome to FleetFlow, {registeredName}!
            </p>

            <div className="inline-block px-4 py-1 bg-green-400/20 text-green-400 border border-green-400/30 rounded-full text-sm">
              {selectedRoleData?.label || registeredRole.replace('_', ' ')}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-all duration-200 mt-8 flex items-center justify-center"
            >
              Go to Login
            </button>
          </div>
        </div>

        <style>{`
          @keyframes card-enter {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-card-enter {
            animation: card-enter 0.4s ease;
          }
          @keyframes check-draw {
            0% { stroke-dasharray: 0, 166; }
            100% { stroke-dasharray: 166, 0; }
          }
          .check-circle-bg {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            animation: check-draw 0.6s ease forwards;
          }
          .check-mark {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: check-draw 0.3s ease 0.4s forwards;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4 py-8 relative overflow-hidden overflow-y-auto">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #30363D 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <AuthCard subtitle="Create your account" className="max-w-[480px]">

        <form onSubmit={handleRegister} className="space-y-5">
          <AuthInput
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="John Smith"
            error={nameError}
          />

          <AuthInput
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="you@company.com"
            error={emailError}
          />

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => {
                const Icon = role.icon
                const isActive = selectedRole === role.value
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.value)
                      setRoleError('')
                    }}
                    className={`p-3 rounded-lg text-left transition-all duration-200 border ${isActive
                      ? 'border-green-400 bg-green-400/10'
                      : 'bg-[#0D1117] border-[#30363D] hover:border-gray-500'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-[18px] h-[18px] ${role.iconColor} mt-0.5`} />
                      <div>
                        <p className="text-white text-sm font-semibold">{role.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{role.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {roleError && (
              <p className="text-red-400 text-xs mt-1">{roleError}</p>
            )}
          </div>

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={passwordError}
            showStrengthBar={true}
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={handleConfirmBlur}
            placeholder="••••••••"
            error={confirmError}
            showStrengthBar={false}
            rightIcon={
              confirmPassword && password === confirmPassword ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : null
            }
          />

          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked)
                  if (e.target.checked) setTermsError('')
                }}
                // Make sure the checkbox has the exact required styling
                className="mt-0.5 w-4 h-4 rounded border-[#30363D] accent-green-400 bg-[#0D1117]"
              />
              <span className="text-gray-400 text-sm">
                I agree to the{' '}
                <span className="text-green-400 hover:underline cursor-pointer">Terms of Service</span>{' '}
                and{' '}
                <span className="text-green-400 hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
            {termsError && (
              <p className="text-red-400 text-xs mt-1">{termsError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full h-11 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin border-2 border-black border-t-transparent rounded-full" />
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300">
              Sign In →
            </Link>
          </p>
        </form>
      </AuthCard>

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
