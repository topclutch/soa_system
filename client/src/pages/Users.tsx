"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { backend1Api, handleApiError } from "../services/api"
import { useAuth } from "../context/AuthContext"
import type { User } from "../types"
import { UsersIcon, Plus, Edit, Trash2, Search, Shield, UserCheck, UserX, Eye } from "lucide-react"
import toast from "react-hot-toast"

const Users: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Vendedor",
    status: "active",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log("Loading users...")
      const response = await backend1Api.get("/api/users")

      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data)
        console.log(`Loaded ${response.data.data.length} users successfully`)
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array response
        setUsers(response.data)
        console.log(`Loaded ${response.data.length} users (fallback)`)
      } else {
        console.warn("Unexpected response format:", response.data)
        setUsers([])
        toast.error("Formato de respuesta inesperado")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      const errorMessage = handleApiError(error)
      toast.error(`Error al cargar usuarios: ${errorMessage}`)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = () => {
    const userRole = currentUser?.role_id?.name || currentUser?.role
    return userRole === "Administrador"
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role_id?.name || user.role)?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Helper function to get consistent user ID
  const getUserId = (user: User): string => {
    return user._id || user.id || ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enhanced validation
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    if (formData.name.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres")
      return
    }

    if (!formData.email.trim()) {
      toast.error("El email es requerido")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Por favor ingresa un email válido")
      return
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error("La contraseña es requerida para nuevos usuarios")
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    // Check for duplicate email (excluding current user when editing)
    const duplicateUser = users.find(
      (user) =>
        user.email.toLowerCase().trim() === formData.email.toLowerCase().trim() && 
        (!editingUser || getUserId(user) !== getUserId(editingUser)),
    )

    if (duplicateUser) {
      toast.error("Ya existe un usuario con este email")
      return
    }

    try {
      setSubmitting(true)
      
      // Prepare user data with exact field names expected by backend
      const userData: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        isActive: formData.status === "active",
      }

      // Only include password if it's provided
      if (formData.password.trim()) {
        userData.password = formData.password.trim()
      }

      console.log("=== USER SUBMISSION ===")
      console.log("Is editing:", !!editingUser)
      console.log("User ID:", editingUser ? getUserId(editingUser) : null)
      console.log("User data:", userData)

      let response
      if (editingUser) {
        // Ensure we have a valid user ID
        const userId = getUserId(editingUser)
        if (!userId) {
          toast.error("Error: ID del usuario no encontrado")
          return
        }

        console.log(`Updating user with ID: ${userId}`)
        response = await backend1Api.put(`/api/users/${userId}`, userData)
        console.log("User update response:", response.data)
        toast.success("Usuario actualizado exitosamente")
      } else {
        console.log("Creating new user...")
        response = await backend1Api.post("/api/auth/register", userData)
        console.log("User create response:", response.data)
        toast.success("Usuario creado exitosamente")
      }

      setShowModal(false)
      setEditingUser(null)
      resetForm()
      await loadUsers()
    } catch (error: any) {
      console.error("=== USER SAVE ERROR ===")
      console.error("Error object:", error)
      console.error("Response status:", error.response?.status)
      console.error("Response data:", error.response?.data)
      
      // Enhanced error handling for 400 errors
      if (error.response?.status === 400) {
        const errorData = error.response.data
        let errorMessage = "Error de validación"
        
        if (errorData?.message) {
          errorMessage = errorData.message
        } else if (errorData?.error) {
          errorMessage = errorData.error
        } else if (errorData?.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(", ")
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
        
        // Handle specific error types
        if (errorMessage.includes("duplicate") || errorMessage.includes("unique") || errorMessage.includes("already exists") || errorMessage.includes("email")) {
          toast.error("Ya existe un usuario con este email")
        } else if (errorMessage.includes("password") || errorMessage.includes("contraseña")) {
          toast.error("La contraseña debe tener al menos 6 caracteres")
        } else if (errorMessage.includes("required") || errorMessage.includes("requerido")) {
          toast.error("Faltan campos obligatorios o tienen formato inválido")
        } else if (errorMessage.includes("role") || errorMessage.includes("rol")) {
          toast.error("El rol especificado no es válido")
        } else if (errorMessage.includes("email")) {
          toast.error("El formato del email no es válido")
        } else {
          toast.error(`Error de validación: ${errorMessage}`)
        }
      } else if (error.response?.status === 422) {
        toast.error("Datos inválidos. Por favor revisa todos los campos.")
      } else if (error.response?.status === 409) {
        toast.error("Ya existe un usuario con este email")
      } else if (error.response?.status === 500) {
        toast.error("Error del servidor. Por favor intenta más tarde.")
      } else {
        const errorMessage = handleApiError(error)
        toast.error(`Error al guardar usuario: ${errorMessage}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "Vendedor", status: "active" })
  }

  const handleEdit = (user: User) => {
    if (!isAdmin()) {
      toast.error("No tienes permisos para editar usuarios")
      return
    }

    console.log("=== EDITING USER ===")
    console.log("User to edit:", user)
    console.log("User ID:", getUserId(user))

    setEditingUser(user)
    const userRole = user.role_id?.name || user.role || "Vendedor"
    const userStatus = user.isActive !== undefined ? (user.isActive ? "active" : "inactive") : user.status || "active"

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: userRole,
      status: userStatus,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin()) {
      toast.error("No tienes permisos para eliminar usuarios")
      return
    }

    if (!id) {
      toast.error("Error: ID de usuario no válido")
      return
    }

    if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      return
    }

    try {
      console.log("Deleting user with ID:", id)
      await backend1Api.delete(`/api/users/${id}`)
      toast.success("Usuario eliminado exitosamente")
      await loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      const errorMessage = handleApiError(error)
      toast.error(`Error al eliminar usuario: ${errorMessage}`)
    }
  }

  const toggleUserStatus = async (user: User) => {
    if (!isAdmin()) {
      toast.error("No tienes permisos para cambiar el estado de usuarios")
      return
    }

    const userId = getUserId(user)
    if (!userId) {
      toast.error("Error: ID de usuario no encontrado")
      return
    }

    try {
      const currentStatus = user.isActive !== undefined ? user.isActive : user.status === "active"
      const newIsActive = !currentStatus

      console.log("Toggling user status:", { userId, currentStatus, newIsActive })

      const response = await backend1Api.put(`/api/users/${userId}`, {
        isActive: newIsActive,
      })

      console.log("Status updated:", response.data)
      toast.success(`Usuario ${newIsActive ? "activado" : "desactivado"} exitosamente`)
      await loadUsers()
    } catch (error) {
      console.error("Error changing user status:", error)
      const errorMessage = handleApiError(error)
      toast.error(`Error al cambiar estado del usuario: ${errorMessage}`)
    }
  }

  const getStatusColor = (user: User) => {
    const isActive = user.isActive !== undefined ? user.isActive : user.status === "active"
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getUserStatus = (user: User) => {
    const isActive = user.isActive !== undefined ? user.isActive : user.status === "active"
    return isActive ? "Activo" : "Inactivo"
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrador":
        return "bg-purple-100 text-purple-800"
      case "Gerente":
        return "bg-blue-100 text-blue-800"
      case "Vendedor":
        return "bg-emerald-100 text-emerald-800"
      case "Consultor":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    resetForm()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-slate-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Gestión de Usuarios
              </h1>
              <p className="text-slate-600 mt-1">Administra los usuarios del sistema</p>
              <p className="text-sm text-slate-500 mt-1">
                {filteredUsers.length} de {users.length} usuarios | Rol actual:{" "}
                {currentUser?.role_id?.name || currentUser?.role}
              </p>
            </div>
          </div>
          {isAdmin() && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar usuarios por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-black placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-slate-200/50 text-center">
          <UsersIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm ? "Intenta ajustar el término de búsqueda" : "Comienza agregando el primer usuario al sistema"}
          </p>
          {!searchTerm && isAdmin() && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Primer Usuario
            </button>
          )}
        </div>
      )}

      {filteredUsers.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Usuario</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Rol</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Fecha de Registro</th>
                  {isAdmin() && (
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={getUserId(user)} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{user.name || "Sin nombre"}</div>
                          <div className="text-sm text-slate-500">{user.email || "Sin email"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role_id?.name || user.role || "Usuario")}`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role_id?.name || user.role || "Usuario"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}
                        >
                          {getUserStatus(user) === "Activo" ? (
                            <UserCheck className="h-3 w-3 mr-1" />
                          ) : (
                            <UserX className="h-3 w-3 mr-1" />
                          )}
                          {getUserStatus(user)}
                        </span>
                        {isAdmin() && (
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`p-1 rounded-lg transition-colors ${
                              getUserStatus(user) === "Activo"
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-green-100 text-green-600 hover:bg-green-200"
                            }`}
                            title={getUserStatus(user) === "Activo" ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {getUserStatus(user) === "Activo" ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    {isAdmin() && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(getUserId(user))}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Ingresa el nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contraseña {editingUser ? "(dejar vacío para mantener actual)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rol *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Consultor">Consultor</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estado *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                  >
                    {submitting ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users