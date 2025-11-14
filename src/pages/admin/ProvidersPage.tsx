import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Truck, X, Phone, Mail, MapPin } from 'lucide-react';
import { showToast } from '../../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://3.86.0.53:8000';

interface Provider {
  id: number;
  nombre: string;
  nombre_contacto: string;
  telefono: string;
  email: string;
  direccion: string;
}

export const ProvidersPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/compras/proveedores/`);
      
      if (!response.ok) {
        console.warn('Error al cargar proveedores:', response.status);
        setProviders([]);
        return;
      }
      
      const data = await response.json();
      const providersData = data.proveedores || data || [];
      setProviders(providersData);
    } catch (error) {
      console.error('Error:', error);
      setProviders([]);
      showToast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.email.trim()) {
      showToast.error('Nombre y email son obligatorios');
      return;
    }

    try {
      const url = editingProvider 
        ? `${API_URL}/api/compras/proveedores/${editingProvider.id}/`
        : `${API_URL}/api/compras/proveedores/`;
      
      const response = await fetch(url, {
        method: editingProvider ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar proveedor');
      
      showToast.success(editingProvider ? 'Proveedor actualizado' : 'Proveedor creado');
      loadProviders();
      closeModal();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al guardar proveedor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
      const response = await fetch(`${API_URL}/api/compras/proveedores/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar proveedor');
      
      showToast.success('Proveedor eliminado');
      loadProviders();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al eliminar proveedor');
    }
  };

  const openCreateModal = () => {
    setEditingProvider(null);
    setFormData({ nombre: '', nombre_contacto: '', telefono: '', email: '', direccion: '' });
    setShowModal(true);
  };

  const openEditModal = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      nombre: provider.nombre,
      nombre_contacto: provider.nombre_contacto || '',
      telefono: provider.telefono || '',
      email: provider.email,
      direccion: provider.direccion || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProvider(null);
  };

  const filteredProviders = providers.filter(p =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre_contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-gray-900">Proveedores</h2>
          <p className="text-gray-600 mt-1">Gestiona los proveedores de la tienda</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-rose-100 text-sm font-medium">Total Proveedores</p>
            <p className="text-3xl font-bold mt-2">{providers.length}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <Truck className="h-8 w-8" />
          </div>
        </div>
      </motion.div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar proveedores..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProviders.map((provider) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-gradient-to-br from-rose-100 to-rose-200 p-3 rounded-lg">
                  <Truck className="h-6 w-6 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{provider.nombre}</h3>
                  <p className="text-sm text-gray-500">{provider.nombre_contacto}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{provider.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{provider.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="line-clamp-2">{provider.direccion || 'Sin dirección'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(provider)}
                className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(provider.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay proveedores {searchTerm && 'que coincidan con la búsqueda'}</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                  placeholder="Textiles La Moda S.A.S"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  value={formData.nombre_contacto}
                  onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Carlos Martínez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                  placeholder="ventas@textilesmoda.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="+57 601 234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Calle 100 #50-25, Bogotá, Colombia"
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
                  {editingProvider ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
