import type { ShippingAddress } from './orderService';

const API_URL = import.meta.env.VITE_API_URL || 'http://3.86.0.53:8000';

// Tipo para dirección guardada (extiende ShippingAddress con ID)
export interface SavedAddress extends ShippingAddress {
  id: number;
  es_principal?: boolean;
  etiqueta?: string; // 'Casa', 'Trabajo', 'Otro'
}

export interface CreateAddressData {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  calle: string;
  ciudad: string;
  departamento?: string;
  estado: string;
  codigo_postal?: string;
  referencias?: string;
  Pais: string;
  Cliente?: number;
  es_principal?: boolean;
  etiqueta?: string;
}

// Interfaz para la dirección del backend de Django
interface BackendDireccion {
  id: number;
  calle: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  Pais: string;
  Cliente: number;
}

// Obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Obtener el cliente ID del usuario actual
const getClienteId = (): number | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return user.cliente_id || null;
  } catch {
    return null;
  }
};

/**
 * Obtener todas las direcciones del usuario
 */
export const getAddresses = async (): Promise<SavedAddress[]> => {
  try {
    const token = getAuthToken();
    const clienteId = getClienteId();
    
    if (!clienteId) {
      console.warn('No se encontró el cliente ID del usuario');
      return [];
    }

    const response = await fetch(`${API_URL}/api/clientes/direcciones_envio/`, {
      headers: {
        'Authorization': token ? `Token ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener direcciones');
    }

    const data: BackendDireccion[] = await response.json();
    
    // Filtrar direcciones del cliente actual y mapear al formato del frontend
    return data
      .filter(dir => dir.Cliente === clienteId)
      .map(dir => ({
        id: dir.id,
        nombre_completo: '',
        telefono: '',
        direccion: dir.calle,
        direccion_completa: `${dir.calle}, ${dir.ciudad}, ${dir.estado}`,
        ciudad: dir.ciudad,
        departamento: dir.estado,
        estado: dir.estado,
        codigo_postal: dir.codigo_postal,
        Pais: dir.Pais,
        referencias: '',
        es_principal: false,
        etiqueta: 'Casa',
      }));
  } catch (error) {
    console.error('Error al cargar direcciones:', error);
    return [];
  }
};

/**
 * Obtener una dirección por ID
 */
export const getAddressById = async (id: number): Promise<SavedAddress | null> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/clientes/direcciones_envio/${id}/`, {
      headers: {
        'Authorization': token ? `Token ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Dirección no encontrada');
    }

    const dir: BackendDireccion = await response.json();
    
    return {
      id: dir.id,
      nombre_completo: '',
      telefono: '',
      direccion: dir.calle,
      direccion_completa: `${dir.calle}, ${dir.ciudad}, ${dir.estado}`,
      ciudad: dir.ciudad,
      departamento: dir.estado,
      estado: dir.estado,
      codigo_postal: dir.codigo_postal,
      Pais: dir.Pais,
      referencias: '',
      es_principal: false,
      etiqueta: 'Casa',
    };
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    return null;
  }
};

/**
 * Crear una nueva dirección
 */
export const createAddress = async (data: CreateAddressData): Promise<SavedAddress> => {
  try {
    const token = getAuthToken();
    const clienteId = getClienteId();
    
    if (!clienteId) {
      throw new Error('No se encontró el cliente ID del usuario. Debes completar tu perfil primero.');
    }

    // Mapear datos del frontend al formato del backend
    const backendData = {
      calle: data.calle || data.direccion || '',
      ciudad: data.ciudad,
      estado: data.estado || data.departamento || '',
      codigo_postal: data.codigo_postal || '0000',
      Pais: data.Pais || 'Bolivia',
      Cliente: clienteId,
    };

    const response = await fetch(`${API_URL}/api/clientes/direcciones_envio/`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Token ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear dirección');
    }

    const dir: BackendDireccion = await response.json();
    
    return {
      id: dir.id,
      nombre_completo: data.nombre_completo || '',
      telefono: data.telefono || '',
      direccion: dir.calle,
      direccion_completa: `${dir.calle}, ${dir.ciudad}, ${dir.estado}`,
      ciudad: dir.ciudad,
      departamento: dir.estado,
      estado: dir.estado,
      codigo_postal: dir.codigo_postal,
      Pais: dir.Pais,
      referencias: data.referencias || '',
      es_principal: data.es_principal || false,
      etiqueta: data.etiqueta || 'Casa',
    };
  } catch (error) {
    console.error('Error al crear dirección:', error);
    throw error;
  }
};

/**
 * Actualizar una dirección existente
 */
export const updateAddress = async (
  id: number,
  data: Partial<CreateAddressData>
): Promise<SavedAddress> => {
  try {
    const token = getAuthToken();
    const clienteId = getClienteId();
    
    if (!clienteId) {
      throw new Error('No se encontró el cliente ID del usuario');
    }

    // Mapear datos del frontend al formato del backend
    const backendData: Partial<BackendDireccion> = {};
    
    if (data.calle || data.direccion) backendData.calle = data.calle || data.direccion;
    if (data.ciudad) backendData.ciudad = data.ciudad;
    if (data.estado || data.departamento) backendData.estado = data.estado || data.departamento;
    if (data.codigo_postal) backendData.codigo_postal = data.codigo_postal;
    if (data.Pais) backendData.Pais = data.Pais;
    backendData.Cliente = clienteId;

    const response = await fetch(`${API_URL}/api/clientes/direcciones_envio/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Token ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar dirección');
    }

    const dir: BackendDireccion = await response.json();
    
    return {
      id: dir.id,
      nombre_completo: data.nombre_completo || '',
      telefono: data.telefono || '',
      direccion: dir.calle,
      direccion_completa: `${dir.calle}, ${dir.ciudad}, ${dir.estado}`,
      ciudad: dir.ciudad,
      departamento: dir.estado,
      estado: dir.estado,
      codigo_postal: dir.codigo_postal,
      Pais: dir.Pais,
      referencias: data.referencias || '',
      es_principal: data.es_principal || false,
      etiqueta: data.etiqueta || 'Casa',
    };
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    throw error;
  }
};

/**
 * Eliminar una dirección
 */
export const deleteAddress = async (id: number): Promise<void> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/clientes/direcciones_envio/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Token ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al eliminar dirección');
    }
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    throw error;
  }
};

/**
 * Marcar una dirección como principal (implementación local)
 */
export const setPrincipalAddress = async (id: number): Promise<void> => {
  // Esta funcionalidad se puede manejar localmente o agregar al backend
  console.log('Marcando dirección como principal:', id);
};

const addressService = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrincipalAddress,
};

export default addressService;
