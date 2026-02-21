import { Truck } from 'lucide-react'

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative w-full max-w-[440px] animate-card-enter">
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold text-white">Fleet</span>
            <span className="text-2xl font-bold text-green-400">Flow</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>
        {children}
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
