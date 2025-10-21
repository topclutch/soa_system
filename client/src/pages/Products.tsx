"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { backend2Api, handleApiError } from "../services/api"
import type { Product } from "../types"
import { Package, Plus, Edit, Trash2, Search, Filter, Star, Eye } from "lucide-react"
import toast from "react-hot-toast"

interface Category {
  id: number
  name: string
}

interface Subcategory {
  id: number
  name: string
  category_id: number
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    purchase_price: "",
    sale_price: "",
    stock: "",
    description: "",
    category_name: "",
    subcategory_name: "",
    image_url: "",
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false)

  useEffect(() => {
    loadProducts().then(() => loadCategories())
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log("Loading products from Backend 2...")
      const response = await backend2Api.get("/api/products")

      if (response.data.success && Array.isArray(response.data.data)) {
        setProducts(response.data.data)
        console.log(`Loaded ${response.data.data.length} products successfully`)
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array response
        setProducts(response.data)
        console.log(`Loaded ${response.data.length} products (fallback)`)
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
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await backend2Api.get("/api/categories")
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadSubcategories = async (categoryId: number) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }

    try {
      const response = await backend2Api.get(`/api/categories/${categoryId}/subcategories`)
      if (response.data.success) {
        setSubcategories(response.data.data)
      }
    } catch (error) {
      console.error("Error loading subcategories:", error)
      setSubcategories([])
    }
  }

  useEffect(() => {
    if (editingProduct && categories.length > 0) {
      const category = categories.find((c) => c.name === editingProduct.category_name)
      if (category) {
        setSelectedCategoryId(category.id)
        loadSubcategories(category.id)
      }
    }
  }, [editingProduct, categories])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const productCategory = product.category_name || product.category || "Sin categoría"
    const matchesCategory = !selectedCategory || productCategory === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("El nombre del producto es requerido")
      return
    }

    if (!formData.purchase_price || Number.parseFloat(formData.purchase_price) <= 0) {
      toast.error("El precio de compra debe ser mayor a 0")
      return
    }

    if (!formData.sale_price || Number.parseFloat(formData.sale_price) <= 0) {
      toast.error("El precio de venta debe ser mayor a 0")
      return
    }

    const purchasePrice = Number.parseFloat(formData.purchase_price)
    const salePrice = Number.parseFloat(formData.sale_price)

    if (salePrice <= purchasePrice) {
      toast.error("El precio de venta debe ser mayor al precio de compra")
      return
    }

    if (!formData.stock || Number.parseInt(formData.stock) < 0) {
      toast.error("El stock debe ser mayor o igual a 0")
      return
    }

    if (!formData.category_name.trim()) {
      toast.error("La categoría es requerida")
      return
    }

    try {
      setSubmitting(true)

      let subcategoryId = null

      try {
        // First, try to find existing category and subcategory
        const categoriesResponse = await backend2Api.get("/api/categories")
        const allCategories = categoriesResponse.data.success ? categoriesResponse.data.data : categoriesResponse.data

        let targetCategory = allCategories.find(
          (cat: Category) => cat.name.toLowerCase() === formData.category_name.trim().toLowerCase(),
        )

        // If category doesn't exist, create it
        if (!targetCategory) {
          console.log("Creating new category:", formData.category_name.trim())
          const newCategoryResponse = await backend2Api.post("/api/categories/manage", {
            name: formData.category_name.trim(),
            description: `Categoría ${formData.category_name.trim()}`,
          })

          if (newCategoryResponse.data.success) {
            targetCategory = newCategoryResponse.data.data
            console.log("Category created:", targetCategory)
          } else {
            throw new Error("No se pudo crear la categoría")
          }
        }

        // Now handle subcategory
        if (formData.subcategory_name.trim()) {
          // Check if subcategory exists
          const subcategoriesResponse = await backend2Api.get(`/api/categories/${targetCategory.id}/subcategories`)
          const subcategories = subcategoriesResponse.data.success
            ? subcategoriesResponse.data.data
            : subcategoriesResponse.data

          let targetSubcategory = subcategories.find(
            (sub: Subcategory) => sub.name.toLowerCase() === formData.subcategory_name.trim().toLowerCase(),
          )

          if (!targetSubcategory) {
            // Create subcategory
            console.log("Creating new subcategory:", formData.subcategory_name.trim())
            const newSubcategoryResponse = await backend2Api.post(
              `/api/categories/${targetCategory.id}/subcategories`,
              {
                name: formData.subcategory_name.trim(),
              },
            )

            if (newSubcategoryResponse.data.success) {
              targetSubcategory = newSubcategoryResponse.data.data
              console.log("Subcategory created:", targetSubcategory)
            } else {
              throw new Error("No se pudo crear la subcategoría")
            }
          }
          subcategoryId = targetSubcategory.id
        }
      } catch (categoryError) {
        console.error("Error handling categories:", categoryError)
        toast.error("Error al procesar las categorías. Verifica que la categoría sea válida.")
        return
      }

      const productData = {
        name: formData.name.trim(),
        purchase_price: Number.parseFloat(formData.purchase_price),
        sale_price: Number.parseFloat(formData.sale_price),
        stock: Number.parseInt(formData.stock),
        description: formData.description.trim(),
        category_name: formData.category_name.trim(),
        subcategory_name: formData.subcategory_name.trim() || null,
        subcategory_id: subcategoryId,
        image_url: formData.image_url.trim() || "/placeholder.svg?height=200&width=300",
      }

      console.log("📤 Submitting product data:", productData)

      let response
      if (editingProduct) {
        response = await backend2Api.put(`/api/products/${editingProduct.id}`, productData)
        toast.success("Producto actualizado exitosamente")
      } else {
        response = await backend2Api.post("/api/products", productData)
        toast.success("Producto creado exitosamente")
      }

      console.log("✅ Product saved:", response.data)

      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      await loadProducts()
      await loadCategories()
    } catch (error: any) {
      console.error("❌ Error saving product:", error)
      const errorMessage = handleApiError(error)

      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.message?.includes("duplicate") || errorData.message?.includes("unique")) {
          toast.error("Ya existe un producto con este nombre")
        } else if (errorData.message?.includes("category")) {
          toast.error("Error con la categoría. Verifica que sea válida.")
        } else {
          toast.error(`Error de validación: ${errorData.message || "Datos inválidos"}`)
        }
      } else if (error.response?.status === 500) {
        toast.error("Error del servidor. Contacta al administrador.")
      } else {
        toast.error(`Error al guardar producto: ${errorMessage}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      purchase_price: "",
      sale_price: "",
      stock: "",
      description: "",
      category_name: "",
      subcategory_name: "",
      image_url: "",
    })
    setSelectedCategoryId(null)
    setSubcategories([])
    setIsCreatingCategory(false)
    setIsCreatingSubcategory(false)
  }

  const handleEdit = (product: Product) => {
    console.log("=== EDITING PRODUCT ===")
    console.log("Product to edit:", product)

    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      purchase_price: (product.purchase_price || product.price || 0).toString(),
      sale_price: (product.sale_price || product.price || 0).toString(),
      stock: (product.stock || 0).toString(),
      description: product.description || "",
      category_name: product.category_name || product.category || "",
      subcategory_name: product.subcategory_name || "",
      image_url: product.image_url || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return
    }

    try {
      console.log(`Deleting product with ID: ${id}`)
      await backend2Api.delete(`/api/products/${id}`)
      toast.success("Producto eliminado exitosamente")
      await loadProducts()
      await loadCategories()
    } catch (error) {
      console.error("Error deleting product:", error)
      const errorMessage = handleApiError(error)
      toast.error(`Error al eliminar producto: ${errorMessage}`)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    resetForm()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Cargando productos...</p>
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
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Gestión de Productos
              </h1>
              <p className="text-slate-600 mt-1">Administra el catálogo de productos del sistema</p>
              <p className="text-sm text-slate-500 mt-1">
                {filteredProducts.length} de {products.length} productos
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-black placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-slate-200/50 text-center">
          <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchTerm || selectedCategory ? "No se encontraron productos" : "No hay productos registrados"}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || selectedCategory
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza agregando tu primer producto al catálogo"}
          </p>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Primer Producto
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200/50"
            >
              <div className="relative">
                <img
                  src={product.image_url || "/placeholder.svg?height=200&width=300"}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-slate-700">4.5</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{product.name}</h3>
                  <span className="text-2xl font-bold text-emerald-600">${product.sale_price || product.price}</span>
                </div>
                {product.purchase_price && (
                  <p className="text-sm text-slate-500 mb-2">
                    Costo: ${product.purchase_price} | Margen: $
                    {(product.sale_price || product.price || 0) - product.purchase_price}
                  </p>
                )}
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full font-medium">
                    {product.category_name || product.category || "Sin categoría"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm text-slate-600">Stock: {product.stock}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all duration-200 flex items-center justify-center text-sm font-medium"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button className="px-3 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder="Ingresa el nombre del producto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Precio de Compra *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.purchase_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchase_price: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Precio de Venta *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.sale_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sale_price: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descripción *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none"
                    placeholder="Describe el producto..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría *</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCategoryId || ""}
                      onChange={(e) => {
                        const categoryId = Number(e.target.value)
                        setSelectedCategoryId(categoryId)

                        if (categoryId) {
                          const category = categories.find((c) => c.id === categoryId)
                          setFormData((prev) => ({
                            ...prev,
                            category_name: category?.name || "",
                          }))
                          loadSubcategories(categoryId)
                          setIsCreatingCategory(false)
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Seleccionar categoría existente</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(true)
                        setSelectedCategoryId(null)
                        setSubcategories([])
                        setFormData((prev) => ({ ...prev, category_name: "" }))
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200"
                    >
                      Nueva
                    </button>
                  </div>

                  {isCreatingCategory && (
                    <input
                      type="text"
                      placeholder="Nombre de nueva categoría"
                      value={formData.category_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subcategoría</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.subcategory_name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          subcategory_name: e.target.value,
                        }))
                        setIsCreatingSubcategory(false)
                      }}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-black bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      disabled={!selectedCategoryId && !isCreatingCategory}
                    >
                      <option value="">Seleccionar subcategoría</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSubcategory(true)
                        setFormData((prev) => ({ ...prev, subcategory_name: "" }))
                      }}
                      className="px-3 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200"
                      disabled={!selectedCategoryId && !isCreatingCategory}
                    >
                      Nueva
                    </button>
                  </div>

                  {isCreatingSubcategory && (
                    <input
                      type="text"
                      placeholder="Nombre de nueva subcategoría"
                      value={formData.subcategory_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subcategory_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL de Imagen</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-black placeholder-gray-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder="https://ejemplo.com/imagen.jpg (opcional)"
                  />
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                  >
                    {submitting ? "Guardando..." : editingProduct ? "Actualizar" : "Crear"}
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

export default Products
