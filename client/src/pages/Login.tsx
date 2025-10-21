"use client"

import type React from "react"
import { useState } from "react"
import { Navigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { backend1Api } from "../services/api"
import { LogIn, User, Lock, AlertCircle, Eye, EyeOff, Zap, Sparkles } from "lucide-react"
import toast from "react-hot-toast"

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const from = location.state?.from?.pathname || "/dashboard"

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    console.log("🔐 INICIANDO PROCESO DE LOGIN")
    console.log("📧 Email:", formData.email)
    console.log("🔒 Password length:", formData.password.length)
    console.log("🌐 Backend URL:", backend1Api.defaults.baseURL)

    if (!formData.email || !formData.password) {
      setError("Por favor completa todos los campos")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await backend1Api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      })

      console.log("✅ LOGIN RESPONSE STATUS:", response.status)
      console.log("✅ LOGIN RESPONSE DATA:", response.data)

      if (response.data && response.data.success) {
        const { token, user } = response.data.data // Token y user están en response.data.data

        console.log("🎫 Token received:", token ? "YES" : "NO")
        console.log("👤 User received:", user ? "YES" : "NO")
        console.log("🔍 Full response.data.data:", response.data.data)

        if (!token) {
          console.error("❌ No token in response.data.data")
          setError("Error: No se recibió token del servidor")
          toast.error("Error: No se recibió token del servidor")
          return
        }

        if (!user) {
          console.error("❌ No user data in response.data.data")
          setError("Error: No se recibieron datos del usuario")
          toast.error("Error: No se recibieron datos del usuario")
          return
        }

        console.log("🎉 Login exitoso, procesando datos...")
        login(token, user)

        setFormData({ email: "", password: "" })
      } else {
        const errorMsg = response.data?.message || "Error al iniciar sesión"
        console.error("❌ Login falló:", errorMsg)
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error("💥 LOGIN ERROR COMPLETO:", error)
      console.error("📊 Error Response:", error.response?.data)
      console.error("🔢 Status Code:", error.response?.status)
      console.error("📝 Error Message:", error.message)

      let errorMessage = "Error al iniciar sesión"

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.status === 401) {
        errorMessage = "Credenciales incorrectas"
      } else if (error.response?.status === 500) {
        errorMessage = "Error del servidor. Intenta más tarde."
      } else if (error.message) {
        errorMessage = error.message
      }

      console.error("🚨 MENSAJE DE ERROR FINAL:", errorMessage)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
      console.log("🏁 Proceso de login finalizado")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const demoAccounts = [
    { role: "Administrador", email: "admin@example.com", password: "admin123", color: "from-red-500 to-pink-500" },
    { role: "Vendedor", email: "juan@ventas.com", password: "vendedor123", color: "from-blue-500 to-cyan-500" },
    {
      role: "Consultor",
      email: "ana@consultoria.com",
      password: "consultor123",
      color: "from-emerald-500 to-teal-500",
    },
  ]

  const fillDemoAccount = (email: string, password: string) => {
    setFormData({ email, password })
    toast.success("Cuenta demo cargada")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              SOA System
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </h2>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Login form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/90 border border-white/20 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200"
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
                    className="block w-full pl-12 pr-12 py-4 bg-white/90 border border-white/20 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200"
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
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>

            {/* Register link */}
            <div className="text-center">
              <p className="text-sm text-blue-200">
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <h3 className="text-sm font-medium text-blue-200 mb-4 text-center">Cuentas de demostración:</h3>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoAccount(account.email, account.password)}
                  className={`w-full text-left px-4 py-3 text-xs bg-gradient-to-r ${account.color} bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all duration-200 border border-white/10 backdrop-blur-sm hover:scale-105`}
                >
                  <div className="font-medium text-white">{account.role}</div>
                  <div className="text-blue-200">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
