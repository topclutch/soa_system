import React, { Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Toaster } from "react-hot-toast"

import Layout from "./components/Layout"
import LoadingSpinner from "./components/LoadingSpinner"

// Páginas principales
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Unauthorized from "./pages/Unauthorized"

// Páginas lazy-loaded
const Products = React.lazy(() => import("./pages/Products"))
const Users = React.lazy(() => import("./pages/Users"))
const Sales = React.lazy(() => import("./pages/Sales"))
const Reports = React.lazy(() => import("./pages/Reports"))

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #334155",
              },
            }}
          />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Rutas protegidas con Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />

              <Route
                path="products"
                element={
                  <ProtectedRoute requiredRoles={["Administrador"]}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Products />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRoles={["Administrador"]}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Users />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="sales"
                element={
                  <ProtectedRoute requiredRoles={["Vendedor", "Administrador"]}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Sales />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="reports"
                element={
                  <ProtectedRoute requiredRoles={["Consultor", "Administrador"]}>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Reports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
