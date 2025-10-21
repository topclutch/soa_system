export interface User {
  id?: string
  _id?: string // Agregar esta línea
  name: string
  email: string
  password?: string
  role_id?: {
    _id: string
    name: string
    permissions: string[]
  }
  role?: "Administrador" | "Vendedor" | "Consultor" | "Gerente" | "Usuario" // Keep for backward compatibility
  isActive?: boolean
  status?: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: number
  name: string
  purchase_price: number
  sale_price: number
  price?: number // Keep for backward compatibility
  stock: number
  description: string
  category_name: string
  subcategory_name?: string
  category?: string // Keep for backward compatibility
  image_url: string
  specifications?: Record<string, any>
}

export interface Sale {
  id: string
  _id?: string
  user_id: string | User
  client?: string
  products: SaleProduct[]
  total: number
  total_profit?: number
  date?: string
  createdAt?: string
  status: "pending" | "completed" | "cancelled" | "failed"
  notes?: string
}

export interface SaleProduct {
  productId: number
  name?: string
  quantity: number
  price: number
  purchase_price?: number
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
