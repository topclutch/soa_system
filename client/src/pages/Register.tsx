"use client"

import type React from "react"
import { useState } from "react"
import { Navigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { backend1Api } from "../services/api"
import { UserPlus, User, Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles, Shield } from "lucide-react"
import toast from "react-hot-toast"

const Register: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Vendedor", // Valor inicial con mayúscula
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsSubmitting(false)
      return
    }

    try {
      // Preparar datos para enviar (mantener las mayúsculas como en el modelo)
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role, // Enviar el rol exactamente como está en el estado
      }

      console.log("Datos a enviar:", userData)

      const response = await backend1Api.post("/api/auth/register", userData)

      if (response.data.success) {
        toast.success("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.")
        console.log("Respuesta del servidor:", response.data)
        
        // Redirect to login
        window.location.href = "/login"
      } else {
        const errorMsg = response.data.message || "Error al crear la cuenta"
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("Error completo:", error)
      const errorMessage = error.response?.data?.message || "Error al crear la cuenta"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              Crear Cuenta
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </h2>
            <p className="text-blue-200">Únete al SOA System</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Register form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-blue-200 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/90 border border-white/20 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 backdrop-blur-sm transition-all duration-200"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/90 border border-white/20 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 backdrop-blur-sm transition-all duration-200"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-12 py-4 bg-white/90 border border-white/20 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 backdrop-blur-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-12 py-4 bg-white/90 border border-white/20 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 backdrop-blur-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-blue-300 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-blue-200 mb-2">
                  Rol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-blue-300" />
                  </div>
                  // En el formulario, asegurar que los valores de las opciones coincidan exactamente
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/90 border border-white/20 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="Vendedor">Vendedor</option>
                    <option value="Consultor">Consultor</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Almacenista">Almacenista</option>
                  </select>
                                  
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Crear Cuenta
                  </>
                )}
              </button>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm text-blue-200">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register