import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, UserCheck, UserX, Trash2 } from 'lucide-react';
import { showToast } from '../../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://3.86.0.53:8000';

interface Client {
  id: number;
  telefono: string;
  fecha_creacion: string;
  fecha_nacimiento: string;
  usuario: number;
  usuario_info: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    date_joined: string;
    last_login: string | null;
  };
  usuario_email: string;
  usuario_nombre_completo: string;
  usuario_activo: boolean;
}

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadClients();
  }, [filterStatus]);

  const loadClients = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/clientes/clientes/`;
      
      if (filterStatus === 'active') {
        url = `${API_URL}/api/clientes/clientes/activos/`;
      } else if (filterStatus === 'inactive') {
        url = `${API_URL}/api/clientes/clientes/inactivos/`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('Error al cargar clientes:', response.status);
        setClients([]);
        return;
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos del backend:', data);
      const clientsData = data.clientes || data || [];
      console.log('👥 Total clientes recibidos:', clientsData.length);
      
      // Filtrar solo clientes con correo @gmail.cli
      const gmailCliClients = clientsData.filter((client: Client) => {
        const email = client.usuario_email || client.usuario_info?.email || '';
        const hasGmailCli = email.toLowerCase().endsWith('@gmail.cli');
        console.log(`  Cliente ${client.id}: ${email} -> ${hasGmailCli ? '✅' : '❌'}`);
        return hasGmailCli;
      });
      
      console.log('✅ Clientes con @gmail.cli:', gmailCliClients.length);
      setClients(gmailCliClients);
    } catch (error) {
      console.error('Error:', error);
      setClients([]);
      showToast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const action = client.usuario_activo ? 'desactivar_cuenta' : 'activar_cuenta';
    const confirmMsg = client.usuario_activo 
      ? '¿Desactivar esta cuenta de cliente?' 
      : '¿Activar esta cuenta de cliente?';
    
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch(`${API_URL}/api/clientes/clientes/${client.id}/${action}/`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al cambiar estado');
      
      showToast.success(client.usuario_activo ? 'Cliente desactivado' : 'Cliente activado');
      loadClients();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al cambiar estado del cliente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/api/clientes/clientes/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar cliente');
      
      showToast.success('Cliente eliminado');
      loadClients();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al eliminar cliente');
    }
  };

  const filteredClients = clients.filter(c =>
    c.usuario_info?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.usuario_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.usuario_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.usuario_info?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = clients.filter(c => c.usuario_activo).length;
  const inactiveCount = clients.filter(c => !c.usuario_activo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
        <p className="text-gray-600 mt-1">Gestiona clientes con correo @gmail.cli - Puedes desactivar o eliminar cuentas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Total Clientes</p>
              <p className="text-3xl font-bold mt-2">{clients.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Users className="h-8 w-8" />
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
              <p className="text-green-100 text-sm font-medium">Activos</p>
              <p className="text-3xl font-bold mt-2">{activeCount}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <UserCheck className="h-8 w-8" />
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
              <p className="text-gray-100 text-sm font-medium">Inactivos</p>
              <p className="text-3xl font-bold mt-2">{inactiveCount}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <UserX className="h-8 w-8" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar clientes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
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
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-rose-100 to-rose-200 p-2 rounded-full">
                        <Users className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {client.usuario_info?.first_name} {client.usuario_info?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">ID: {client.id} | Tel: {client.telefono}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{client.usuario_email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-600">@{client.usuario_info?.username}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.usuario_activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.usuario_activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(client)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          client.usuario_activo
                            ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={client.usuario_activo ? 'Desactivar' : 'Activar'}
                      >
                        {client.usuario_activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Eliminar"
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

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm 
                ? 'No hay clientes con @gmail.cli que coincidan con la búsqueda' 
                : 'No hay clientes registrados con correo @gmail.cli'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
