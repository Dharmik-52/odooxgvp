export default function FormField({ label, type = 'text', value, onChange, error, options, required, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-ff-red">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3 bg-ff-bg border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-ff-green/50 ${
            error ? 'border-ff-red' : 'border-ff-border'
          }`}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-ff-bg border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-ff-green/50 ${
            error ? 'border-ff-red' : 'border-ff-border'
          }`}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-ff-red">{error}</p>
      )}
    </div>
  )
}
