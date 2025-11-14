import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Palette, X, DollarSign } from 'lucide-react';
import { showToast } from '../../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Variant {
  id: number;
  producto: number;
  producto_nombre?: string;
  color: string;
  talla: string;
  precio_unitario: string;
  activo: boolean;
  Inventario_id?: number | null;
  inventario_info?: {
    stock: number;
    stock_minimo: number;
    stock_maximo: number;
    ubicacion_almacen: string;
  };
}

interface Product {
  id: number;
  nombre: string;
}

interface Inventory {
  id: number;
  stock: number;
  stock_minimo: number;
  stock_maximo: number;
  ubicacion_almacen: string;
}

export const VariantsPage = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [formData, setFormData] = useState({
    producto: 0,
    color: '',
    talla: '',
    precio_unitario: '',
    activo: true,
    Inventario_id: null as number | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [variantsRes, productsRes, inventoriesRes] = await Promise.all([
        fetch(`${API_URL}/api/productos/variantes/`),
        fetch(`${API_URL}/api/productos/productos/`),
        fetch(`${API_URL}/api/productos/inventario/`),
      ]);

      if (!variantsRes.ok || !productsRes.ok || !inventoriesRes.ok) {
        showToast.error('Error al cargar datos');
        setVariants([]);
        setProducts([]);
        setInventories([]);
        return;
      }
      
      const variantsResponse = await variantsRes.json();
      const productsResponse = await productsRes.json();
      const inventoriesResponse = await inventoriesRes.json();
      
      // Extraer datos del objeto de respuesta
      const variantsData = variantsResponse.variantes || variantsResponse || [];
      const productsData = productsResponse.productos || productsResponse || [];
      const inventoriesData = inventoriesResponse.inventario || inventoriesResponse || [];
      
      const enrichedVariants = variantsData.map((v: Variant) => ({
        ...v,
        producto_nombre: productsData.find((p: Product) => p.id === v.producto)?.nombre || 'Producto desconocido'
      }));
      
      setVariants(enrichedVariants);
      setProducts(productsData);
      setInventories(inventoriesData);
    } catch (error) {
      console.error('Error:', error);
      setVariants([]);
      setProducts([]);
      setInventories([]);
      showToast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.producto || formData.producto === 0) {
      showToast.error('Debes seleccionar un producto');
      return;
    }
    if (!formData.color.trim() || !formData.talla.trim()) {
      showToast.error('Color y talla son obligatorios');
      return;
    }
    if (!formData.precio_unitario || parseFloat(formData.precio_unitario) <= 0) {
      showToast.error('El precio debe ser mayor a 0');
      return;
    }

    try {
      const url = editingVariant 
        ? `${API_URL}/api/productos/variantes/${editingVariant.id}/`
        : `${API_URL}/api/productos/variantes/`;
      
      const response = await fetch(url, {
        method: editingVariant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar variante');
      
      showToast.success(editingVariant ? 'Variante actualizada' : 'Variante creada');
      loadData();
      closeModal();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al guardar variante');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta variante?')) return;

    try {
      const response = await fetch(`${API_URL}/api/productos/variantes/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar variante');
      
      showToast.success('Variante eliminada');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al eliminar variante');
    }
  };

  const openCreateModal = () => {
    setEditingVariant(null);
    setFormData({ producto: 0, color: '', talla: '', precio_unitario: '', activo: true, Inventario_id: null });
    setShowModal(true);
  };

  const openEditModal = (variant: Variant) => {
    setEditingVariant(variant);
    setFormData({
      producto: variant.producto,
      color: variant.color,
      talla: variant.talla,
      precio_unitario: variant.precio_unitario,
      activo: variant.activo,
      Inventario_id: variant.Inventario_id || null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVariant(null);
  };

  const filteredVariants = variants.filter(v =>
    v.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.talla?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Variantes de Productos</h2>
          <p className="text-gray-600 mt-1">Gestiona colores, tallas y precios</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Nueva Variante
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Total Variantes</p>
              <p className="text-3xl font-bold mt-2">{variants.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Palette className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Activas</p>
              <p className="text-3xl font-bold mt-2">{variants.filter(v => v.activo).length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Palette className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Inactivas</p>
              <p className="text-3xl font-bold mt-2">{variants.filter(v => !v.activo).length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Palette className="h-8 w-8" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar variantes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Talla
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventario
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVariants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-gray-900">{variant.producto_nombre}</p>
                    <p className="text-xs text-gray-500">ID: {variant.producto}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {variant.color}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {variant.talla}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <p className="font-bold text-gray-900">{parseFloat(variant.precio_unitario).toLocaleString('es-CO')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {variant.inventario_info ? (
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">Stock: {variant.inventario_info.stock}</p>
                        <p className="text-xs text-gray-500">
                          Min: {variant.inventario_info.stock_minimo} | Max: {variant.inventario_info.stock_maximo}
                        </p>
                        <p className="text-xs text-gray-500">{variant.inventario_info.ubicacion_almacen || 'Sin ubicación'}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Sin inventario</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      variant.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {variant.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(variant)}
                        className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVariants.length === 0 && (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay variantes {searchTerm && 'que coincidan con la búsqueda'}</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <select
                  value={formData.producto}
                  onChange={(e) => setFormData({ ...formData, producto: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value={0}>Selecciona un producto</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                  placeholder="Ej: Rojo Floral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talla *
                </label>
                <input
                  type="text"
                  value={formData.talla}
                  onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                  placeholder="Ej: M, L, XL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_unitario}
                  onChange={(e) => setFormData({ ...formData, precio_unitario: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                  placeholder="189900.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventario (Opcional)
                </label>
                <select
                  value={formData.Inventario_id || ''}
                  onChange={(e) => setFormData({ ...formData, Inventario_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="">Sin inventario asignado</option>
                  {inventories.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      ID {inv.id} - Stock: {inv.stock} ({inv.ubicacion_almacen || 'Sin ubicación'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Asigna un registro de inventario a esta variante
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">
                  Variante activa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingVariant ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
