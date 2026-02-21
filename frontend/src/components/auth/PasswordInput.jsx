import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function PasswordInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  showStrengthBar = false,
  inputRef
}) {
  const [showPassword, setShowPassword] = useState(false)

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return 0
    if (pwd.length < 6) return 1
    const hasNumber = /[0-9]/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    if (pwd.length >= 8 && hasNumber && hasSpecial) return 3
    return 2
  }

  const strength = getPasswordStrength(value)

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

  return (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full h-11 px-4 pr-12 bg-[#0D1117] text-white border rounded-lg transition-all duration-200 placeholder-gray-500 focus:outline-none ${
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-0'
              : 'border-[#30363D] focus:border-green-400 focus:ring-0'
          }`}
          style={{
            boxShadow: error
              ? 'none'
              : '0 0 0 3px rgba(74,222,128,0.1)'
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {showStrengthBar && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  level <= strength ? getStrengthColor(strength) : 'bg-[#30363D]'
                }`}
              />
            ))}
          </div>
          <span className={`text-xs mt-1 inline-block ${getStrengthLabel(strength)}`}>
            {strength === 1 && 'Weak'}
            {strength === 2 && 'Fair'}
            {strength === 3 && 'Strong'}
          </span>
        </div>
      )}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
