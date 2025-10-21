"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { backend1Api } from "../services/api"
import toast from "react-hot-toast"

interface User {
  id: string
  _id?: string
  name: string
  email: string
  role_id?: {
    _id: string
    name: string
    permissions: string[]
  }
  role?: string // Keep for backward compatibility
  isActive?: boolean
}

interface AuthContextType {
  user: User | null
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUserData = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.log("🚫 No token found, skipping user data refresh")
      setLoading(false)
      return
    }

    try {
      const cleanToken = token ? token.replace(/^"(.*)"$/, "$1").trim() : ""
      if (!cleanToken) {
        console.log("🚫 Invalid token format, logging out")
        logout()
        return
      }

      console.log("🔄 Refreshing user data with token:", cleanToken.substring(0, 20) + "...")

      const response = await backend1Api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      })

      console.log("📥 User data response:", response.data)

      if (response.data.success && response.data.data) {
        const userData = response.data.data
        console.log("=== DATOS DEL USUARIO DESDE API ===")
        console.log("userData completo:", userData)

        const userRole = userData.role_id?.name || userData.role || "Usuario"

        setUser({
          id: userData._id || userData.id,
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userRole,
          role_id: userData.role_id,
          isActive: userData.isActive,
        })
        console.log("✅ User data updated successfully")
      } else {
        console.warn("⚠️ Respuesta inesperada de /api/auth/me:", response.data)
        logout()
      }
    } catch (error: any) {
      console.error("❌ Error al cargar usuario:", error)
      console.error("📊 Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })

      if (error.response?.status === 401) {
        console.log("🚪 Token expired, logging out")
        logout()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUserData()
  }, [refreshUserData])

  const login = useCallback((token: string, userData: User) => {
    console.log("🔐 EJECUTANDO LOGIN EN CONTEXT")
    console.log("🎫 Token recibido:", token ? token.substring(0, 20) + "..." : "NO TOKEN")
    console.log("👤 User data recibido:", userData)

    if (!token || token.trim() === "") {
      console.error("❌ No token provided to login function")
      toast.error("Error: No se recibió token de autenticación")
      return
    }

    let cleanToken = token
    if (typeof token === "string") {
      cleanToken = token.replace(/^"(.*)"$/, "$1").trim()
    }

    if (!cleanToken || cleanToken === "") {
      console.error("❌ Token is empty after cleaning")
      toast.error("Error: Token de autenticación inválido")
      return
    }

    const userRole = userData.role_id?.name || userData.role || "Usuario"

    const userWithId = {
      ...userData,
      id: userData._id || userData.id,
      _id: userData._id || userData.id,
      role: userRole,
    }

    console.log("=== LOGIN - DATOS DEL USUARIO ===")
    console.log("userData original:", userData)
    console.log("userWithId procesado:", userWithId)
    console.log("🏷️ Role final:", userRole)
    console.log("🎫 Clean token:", cleanToken.substring(0, 20) + "...")

    try {
      localStorage.setItem("token", cleanToken)
      localStorage.setItem("user", JSON.stringify(userWithId))
      setUser(userWithId)

      backend1Api.defaults.headers.common["Authorization"] = `Bearer ${cleanToken}`
      console.log("✅ Authorization header set")

      toast.success(`¡Bienvenido, ${userWithId.name}!`)
      console.log("🎉 Login process completed successfully")
    } catch (error) {
      console.error("❌ Error during login process:", error)
      toast.error("Error al guardar la sesión")
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)

    delete backend1Api.defaults.headers.common["Authorization"]

    toast.success("Sesión cerrada correctamente")
    window.location.href = "/login"
  }, [])

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
