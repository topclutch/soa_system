"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && !requiredRoles.includes(user?.role || "")) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
