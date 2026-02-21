import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { XCircle, ArrowLeft, Home } from 'lucide-react'

export default function Unauthorized() {
  const { role } = useAuth()
  const navigate = useNavigate()

  const getRedirectPath = () => {
    const rolePaths = {
      manager: '/dashboard',
      dispatcher: '/trips'
    }
    return rolePaths[role] || '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-8">
          You don't have permission to view this page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#161B22] border border-[#30363D] text-white rounded-lg hover:bg-[#30363D] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <button
            onClick={() => navigate(getRedirectPath())}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
