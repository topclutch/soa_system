"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { ShieldX, ArrowLeft, Home } from "lucide-react"

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-200/50">
          {/* Icon */}
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <ShieldX className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
            Acceso Denegado
          </h1>

          {/* Message */}
          <p className="text-slate-600 mb-8">
            No tienes permisos para acceder a esta página. Contacta con tu administrador si crees que esto es un error.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Home className="h-5 w-5 mr-2" />
              Ir al Dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver Atrás
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500">
              <strong>Código de Error:</strong> 403 - Forbidden
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
