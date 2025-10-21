"use client"

import type React from "react"
import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Home, Package, Users, ShoppingCart, BarChart3, LogOut, Menu, X, Bell, Search, Zap } from "lucide-react"

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["Administrador", "Vendedor", "Consultor"],
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Productos",
      href: "/products",
      icon: Package,
      roles: ["Administrador"],
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      name: "Usuarios",
      href: "/users",
      icon: Users,
      roles: ["Administrador"],
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Ventas",
      href: "/sales",
      icon: ShoppingCart,
      roles: ["Administrador", "Vendedor"],
      gradient: "from-orange-500 to-red-500",
    },
    {
      name: "Reportes",
      href: "/reports",
      icon: BarChart3,
      roles: ["Administrador", "Consultor"],
      gradient: "from-indigo-500 to-purple-500",
    },
  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || ""))

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white/80 backdrop-blur-xl shadow-2xl border-r border-slate-200/50">
          {/* Logo */}
          <div className="flex h-24 flex-shrink-0 items-center bg-gradient-to-r from-slate-900 to-slate-800 px-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">SOA System</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-1 flex-col overflow-y-auto py-8">
            <nav className="flex-1 space-y-3 px-6">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-5 py-4 text-base font-medium rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-105`
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:scale-105"
                    }`}
                  >
                    <Icon
                      className={`mr-4 h-6 w-6 flex-shrink-0 transition-transform duration-300 ${
                        isActive ? "text-white scale-110" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span className="tracking-wide">{item.name}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
                  </Link>
                )
              })}
            </nav>

            {/* User info */}
            <div className="flex flex-shrink-0 border-t border-slate-200/50 p-6 mt-6">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-base font-semibold text-slate-900 tracking-wide">{user?.name}</p>
                    <p className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block mt-2">
                      {user?.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                  >
                    <LogOut className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Mobile */}
      <div className={`lg:hidden ${sidebarOpen ? "fixed inset-0 z-50" : ""}`}>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <div
          className={`fixed inset-y-0 left-0 flex w-80 flex-col bg-white/95 backdrop-blur-xl transform transition-transform duration-300 ease-in-out z-50 shadow-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 flex-shrink-0 items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SOA System</h1>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-slate-300 p-2 rounded-lg">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto py-6">
            <nav className="flex-1 space-y-2 px-4">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`mr-4 h-5 w-5 flex-shrink-0 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="flex flex-shrink-0 border-t border-slate-200/50 p-4 mt-6">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full inline-block mt-1">
                      {user?.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-20 flex-shrink-0 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
          <button
            type="button"
            className="border-r border-slate-200/50 px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden hover:bg-slate-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {menuItems.find((item) => item.href === location.pathname)?.name || "Dashboard"}
                </h2>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-500">Sistema activo</span>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 relative">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">Bienvenido,</p>
                  <p className="text-xs text-slate-500">{user?.name}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
