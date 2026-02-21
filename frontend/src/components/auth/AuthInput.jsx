export default function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  rightIcon,
  inputRef
}) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full h-11 px-4 bg-[#0D1117] text-white border rounded-lg transition-all duration-200 placeholder-gray-500 focus:outline-none ${
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
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
