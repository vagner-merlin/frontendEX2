import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { showToast } from '../../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Inventory {
  id: number;
  stock: number;
  stock_minimo: number;
  stock_maximo: number;
  ubicacion_almacen: string;
  variantes?: Array<{
    id: number;
    producto_nombre: string;
    color: string;
    talla: string;
    precio_unitario: string;
  }>;
}

export const InventoryPage = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({
    stock: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    ubicacion_almacen: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const inventoryRes = await fetch(`${API_URL}/api/productos/inventario/`);

      if (!inventoryRes.ok) {
        showToast.error('Error al cargar datos');
        setInventory([]);
        return;
      }
      
      const inventoryResponse = await inventoryRes.json();
      
      // Extraer datos del objeto de respuesta
      const inventoryData = inventoryResponse.inventario || inventoryResponse || [];
      
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error:', error);
      setInventory([]);
      showToast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.stock < 0 || formData.stock_minimo < 0 || formData.stock_maximo < 0) {
      showToast.error('Los stocks no pueden ser negativos');
      return;
    }
    if (formData.stock_maximo < formData.stock_minimo) {
      showToast.error('El stock máximo debe ser mayor al mínimo');
      return;
    }

    try {
      const url = editingItem 
        ? `${API_URL}/api/productos/inventario/${editingItem.id}/`
        : `${API_URL}/api/productos/inventario/`;
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar inventario');
      
      showToast.success(editingItem ? 'Inventario actualizado' : 'Inventario creado');
      loadData();
      closeModal();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al guardar inventario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro de inventario?')) return;

    try {
      const response = await fetch(`${API_URL}/api/productos/inventario/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar inventario');
      
      showToast.success('Inventario eliminado');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al eliminar inventario');
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ stock: 0, stock_minimo: 0, stock_maximo: 0, ubicacion_almacen: '' });
    setShowModal(true);
  };

  const openEditModal = (item: Inventory) => {
    setEditingItem(item);
    setFormData({
      stock: item.stock,
      stock_minimo: item.stock_minimo,
      stock_maximo: item.stock_maximo,
      ubicacion_almacen: item.ubicacion_almacen || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const getStockStatus = (item: Inventory) => {
    if (item.stock <= item.stock_minimo) return 'low';
    if (item.stock >= item.stock_maximo) return 'high';
    return 'normal';
  };

  const filteredInventory = inventory.filter(item => {
    const variantesMatch = item.variantes?.some(v => 
      v.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.talla?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return variantesMatch || item.ubicacion_almacen?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const lowStockCount = inventory.filter(i => i.stock <= i.stock_minimo).length;
  const highStockCount = inventory.filter(i => i.stock >= i.stock_maximo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Inventario</h2>
          <p className="text-gray-600 mt-1">Gestiona el stock de productos</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Nuevo Inventario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Total Items</p>
              <p className="text-3xl font-bold mt-2">{inventory.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Package className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Stock Bajo</p>
              <p className="text-3xl font-bold mt-2">{lowStockCount}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Stock Alto</p>
              <p className="text-3xl font-bold mt-2">{highStockCount}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Stock Normal</p>
              <p className="text-3xl font-bold mt-2">{inventory.length - lowStockCount - highStockCount}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en inventario..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variantes Asociadas
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Min/Max
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
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
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {item.variantes && item.variantes.length > 0 ? (
                          item.variantes.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                              <Package className="h-4 w-4 text-rose-600" />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{v.producto_nombre}</p>
                                <p className="text-xs text-gray-500">
                                  {v.color} | {v.talla} | ${v.precio_unitario}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 italic">Sin variantes asignadas</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-2xl font-bold text-gray-900">{item.stock}</p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Min:</span> {item.stock_minimo}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Max:</span> {item.stock_maximo}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{item.ubicacion_almacen || 'Sin ubicación'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === 'low' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Bajo
                        </span>
                      )}
                      {status === 'high' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Alto
                        </span>
                      )}
                      {status === 'normal' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay registros de inventario {searchTerm && 'que coincidan con la búsqueda'}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingItem ? 'Editar Inventario' : 'Nuevo Inventario'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {editingItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Este inventario será asignado a variantes desde la página de Variantes.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Actual *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Máximo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_maximo}
                    onChange={(e) => setFormData({ ...formData, stock_maximo: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación en Almacén
                </label>
                <input
                  type="text"
                  value={formData.ubicacion_almacen}
                  onChange={(e) => setFormData({ ...formData, ubicacion_almacen: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Ej: Bodega A - Estante 3"
                />
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
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
