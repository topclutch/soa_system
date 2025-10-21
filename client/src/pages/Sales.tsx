"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { backend1Api, backend2Api, handleApiError } from "../services/api"
import { useAuth } from "../context/AuthContext"
import type { Product } from "../types"
import { ShoppingCart, Plus, Minus, Trash2, Package, User, DollarSign, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

interface CartItem extends Product {
  quantity: number
}

const Sales = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<CartItem[]>([])
  const [clientName, setClientName] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      console.log("Loading products for sales...")
      const response = await backend2Api.get("/api/products")

      if (response.data.success && Array.isArray(response.data.data)) {
        const availableProducts = response.data.data.filter((product: Product) => product.stock > 0)
        setProducts(availableProducts)
        console.log(`Loaded ${availableProducts.length} available products for sales`)
      } else if (Array.isArray(response.data)) {
        const availableProducts = response.data.filter((product: Product) => product.stock > 0)
        setProducts(availableProducts)
        console.log(`Loaded ${availableProducts.length} available products (fallback)`)
      } else {
        console.warn("Unexpected response format:", response.data)
        setProducts([])
        toast.error("Formato de respuesta inesperado")
      }
    } catch (error) {
      console.error("Error loading products:", error)
      const errorMessage = handleApiError(error)
      toast.error(`Error al cargar productos: ${errorMessage}`)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const addProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Producto sin stock disponible")
      return
    }

    const existingIndex = selectedProducts.findIndex((p) => p.id === product.id)

    if (existingIndex >= 0) {
      const currentQuantity = selectedProducts[existingIndex].quantity
      const availableStock = product.stock

      if (currentQuantity >= availableStock) {
        toast.error(`Stock insuficiente. Máximo disponible: ${availableStock}`)
        return
      }

      const updated = [...selectedProducts]
      updated[existingIndex].quantity += 1
      setSelectedProducts(updated)
      toast.success(`${product.name} agregado (${updated[existingIndex].quantity})`)
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }])
      toast.success(`${product.name} agregado al carrito`)
    }
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (!product) {
      toast.error("Producto no encontrado")
      return
    }

    if (newQuantity > product.stock) {
      toast.error(`Stock insuficiente. Máximo disponible: ${product.stock}`)
      return
    }

    const updated = selectedProducts.map((p) => (p.id === productId ? { ...p, quantity: newQuantity } : p))
    setSelectedProducts(updated)
  }

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
    toast.success("Producto eliminado del carrito")
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      const price = product.sale_price || product.price || 0
      return total + price * product.quantity
    }, 0)
  }

  const calculateTotalProfit = () => {
    return selectedProducts.reduce((totalProfit, product) => {
      const salePrice = product.sale_price || product.price || 0
      const purchasePrice = product.purchase_price || 0
      const profit = (salePrice - purchasePrice) * product.quantity
      return totalProfit + profit
    }, 0)
  }

  const calculateTotalItems = () => {
    return selectedProducts.reduce((total, product) => total + product.quantity, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // User validation
    if (!user || (!user.id && !user._id)) {
      toast.error("Usuario no autenticado. Por favor, inicia sesión nuevamente.")
      return
    }

    // Products validation
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto")
      return
    }

    // Client validation
    if (!clientName.trim()) {
      toast.error("Debe ingresar el nombre del cliente")
      return
    }

    if (clientName.trim().length < 2) {
      toast.error("El nombre del cliente debe tener al menos 2 caracteres")
      return
    }

    // Stock validation with real-time check
    const stockErrors = []
    for (const cartItem of selectedProducts) {
      const product = products.find((p) => p.id === cartItem.id)
      if (!product) {
        stockErrors.push(`Producto ${cartItem.name} no encontrado`)
        continue
      }

      if (cartItem.quantity > product.stock) {
        stockErrors.push(`${cartItem.name}: solicitado ${cartItem.quantity}, disponible ${product.stock}`)
      }
    }

    if (stockErrors.length > 0) {
      toast.error(`Errores de stock: ${stockErrors.join(", ")}`)
      return
    }

    // Business validation
    const total = calculateTotal()
    if (total <= 0) {
      toast.error("El total de la venta debe ser mayor a 0")
      return
    }

    const totalProfit = calculateTotalProfit()
    if (totalProfit < 0) {
      const confirm = window.confirm("Esta venta generará pérdidas. ¿Desea continuar?")
      if (!confirm) return
    }

    setLoading(true)

    try {
      const userId = user._id || user.id
      const combinedNotes = `Cliente: ${clientName.trim()}${notes.trim() ? ` | Notas: ${notes.trim()}` : ""}`

      const saleData = {
        user_id: userId,
        //client: clientName.trim(),
        products: selectedProducts.map((p) => ({
          productId: p.id,
          name: p.name,
          quantity: p.quantity,
          price: p.sale_price || p.price || 0,
          purchase_price: p.purchase_price || 0,
        })),
        total: Number(total.toFixed(2)),
        total_profit: Number(totalProfit.toFixed(2)),
        notes: combinedNotes,
        status: "completed",
      }

      console.log("=== DATOS DE VENTA DETALLADOS ===")
      console.log("User ID:", userId)
      console.log("Client:", clientName.trim())
      console.log("Products:", saleData.products)
      console.log("Total:", saleData.total)
      console.log("Total Profit:", saleData.total_profit)
      console.log("Datos completos a enviar:", saleData)

      const response = await backend1Api.post("/api/sales", saleData)
      console.log("=== RESPUESTA DEL SERVIDOR ===")
      console.log("Respuesta completa:", response.data)

      if (response.data.success) {
        toast.success("¡Venta registrada exitosamente!")
        console.log("Sale registered successfully:", response.data.data)

        // Clear form
        setSelectedProducts([])
        setClientName("")
        setNotes("")

        // Reload products to get updated stock
        await loadProducts()

        // Show success summary
        toast.success(`Venta por $${total.toFixed(2)} registrada. Ganancia: $${totalProfit.toFixed(2)}`)
      } else {
        const errorMsg = response.data.message || "Error al registrar la venta"
        console.error("Sale registration failed:", errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error("=== ERROR EN VENTA ===")
      console.error("Error completo:", error)

      const errorMessage = handleApiError(error)

      if (errorMessage.includes("stock")) {
        toast.error("Error de stock. Recargando productos...")
        await loadProducts()
      } else if (errorMessage.includes("user")) {
        toast.error("Error de usuario. Por favor, inicia sesión nuevamente.")
      } else {
        toast.error(`Error al registrar la venta: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-slate-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-200/50">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
            <ShoppingCart className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Nueva Venta
            </h1>
            <p className="text-slate-700 mt-1">Registra una nueva venta en el sistema</p>
            <p className="text-sm text-slate-600 mt-1">
              Vendedor: {user?.name} | Productos disponibles: {products.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Products List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Package className="h-6 w-6 mr-2 text-emerald-600" />
            Productos Disponibles
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay productos disponibles</h3>
              <p className="text-slate-600">No hay productos con stock para vender</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all duration-200"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                    <p className="text-sm text-slate-700">{product.category_name || product.category}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-lg font-bold text-emerald-600">${product.sale_price || product.price}</span>
                      {product.purchase_price && (
                        <span className="text-sm text-slate-600">Costo: ${product.purchase_price}</span>
                      )}
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          product.stock > 10
                            ? "bg-green-100 text-green-800"
                            : product.stock > 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addProduct(product)}
                    disabled={product.stock === 0}
                    className="ml-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-black px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart and Sale Form */}
        <div className="space-y-6">
          {/* Shopping Cart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2 text-orange-600" />
              Carrito de Compras
            </h2>

            {selectedProducts.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No hay productos seleccionados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProducts.map((product) => {
                  const availableStock = products.find((p) => p.id === product.id)?.stock || 0
                  const isOverStock = product.quantity > availableStock

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        isOverStock ? "bg-red-50 border border-red-200" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        <p className="text-sm text-slate-700">
                          ${product.sale_price || product.price} c/u (Cantidad: {product.quantity})
                        </p>
                        {isOverStock && (
                          <div className="flex items-center text-red-600 text-sm mt-1">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Stock insuficiente (disponible: {availableStock})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(product.id, product.quantity - 1)}
                          className="p-1 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className={`w-8 text-center font-semibold ${isOverStock ? "text-red-600" : "text-slate-900"}`}>
                          {product.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, product.quantity + 1)}
                          disabled={product.quantity >= availableStock}
                          className="p-1 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Artículos totales:</span>
                    <span className="font-semibold text-slate-900">{calculateTotalItems()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Subtotal:</span>
                    <span className="font-semibold text-slate-900">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Ganancia estimada:</span>
                    <span className="font-semibold text-green-600">${calculateTotalProfit().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold border-t border-slate-300 pt-2">
                    <span className="text-slate-900">Total:</span>
                    <span className="text-emerald-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sale Information Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <User className="h-6 w-6 mr-2 text-blue-600" />
              Información de la Venta
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Ingresa el nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas Adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  placeholder="Notas sobre la venta (opcional)"
                />
              </div>

              {/* Sale Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700">Vendedor:</span>
                  <span className="font-semibold text-slate-900">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700">Cliente:</span>
                  <span className="font-semibold text-slate-900">{clientName || "Sin especificar"}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700">Artículos totales:</span>
                  <span className="font-semibold text-slate-900">{calculateTotalItems()}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700">Ganancia:</span>
                  <span className="font-semibold text-green-600">${calculateTotalProfit().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold border-t border-slate-300 pt-2">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-emerald-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  selectedProducts.length === 0 ||
                  !clientName.trim() ||
                  clientName.trim().length < 2 ||
                  selectedProducts.some((p) => p.quantity > (products.find((prod) => prod.id === p.id)?.stock || 0))
                }
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-black py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                ) : (
                  <DollarSign className="h-6 w-6 mr-2" />
                )}
                {loading ? "Procesando Venta..." : "Registrar Venta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sales