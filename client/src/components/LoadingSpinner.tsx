import type React from "react"
import { Loader2 } from "lucide-react"

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-slate-600 animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
