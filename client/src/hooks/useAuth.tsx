import { useState, useEffect, useCallback } from 'react'
import { backend1Api } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null
  })

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verificar si el token es válido
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          setState(prev => ({
            ...prev,
            user: {
              id: payload.userId,
              name: payload.name,
              email: payload.email,
              role: payload.role
            },
            isAuthenticated: true,
            loading: false
          }))
        } else {
          localStorage.removeItem('token')
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        localStorage.removeItem('token')
        setState(prev => ({ ...prev, loading: false }))
      }
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await backend1Api.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    login,
    logout
  }
}