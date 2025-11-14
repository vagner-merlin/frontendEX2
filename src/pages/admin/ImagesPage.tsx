import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, X, MessageSquare, Upload } from 'lucide-react';
import { showToast } from '../../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface ProductImage {
  id: number;
  Producto_categoria: number;
  producto_nombre?: string;
  variant_info?: string;
  imagen: string | null;
  texto: string;
  es_principal: boolean;
}

interface ProductVariant {
  id: number;
  producto: number;
  producto_nombre?: string;
  color: string;
  talla: string;
  precio_unitario: number;
  stock: number;
}

interface Comment {
  id: number;
  usuario: string;
  comentario: string;
  fecha_creacion: string;
}

export const ImagesPage = () => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [formData, setFormData] = useState({
    Producto_categoria: 0,
    texto: '',
    es_principal: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [imagesRes, variantsRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/productos/imagenes/`),
        fetch(`${API_URL}/api/productos/variantes/`),
        fetch(`${API_URL}/api/productos/productos/`),
      ]);

      if (!imagesRes.ok || !variantsRes.ok || !productsRes.ok) {
        showToast.error('Error al cargar datos');
        setImages([]);
        setVariants([]);
        return;
      }
      
      const imagesResponse = await imagesRes.json();
      const variantsResponse = await variantsRes.json();
      const productsResponse = await productsRes.json();
      
      // Extraer datos del objeto de respuesta
      const imagesData = imagesResponse.imagenes || imagesResponse || [];
      const variantsData = variantsResponse.variantes || variantsResponse.results || variantsResponse || [];
      const productsData = productsResponse.productos || productsResponse || [];
      
      // Enriquecer variantes con nombre del producto
      const enrichedVariants = variantsData.map((variant: ProductVariant) => ({
        ...variant,
        producto_nombre: productsData.find((p: any) => p.id === variant.producto)?.nombre || 'Producto desconocido'
      }));
      
      // Enriquecer imágenes con info de variante
      const enrichedImages = imagesData.map((img: ProductImage) => {
        const variant = enrichedVariants.find((v: ProductVariant) => v.id === img.Producto_categoria);
        return {
          ...img,
          producto_nombre: variant?.producto_nombre || 'Desconocido',
          variant_info: variant ? `${variant.color} - ${variant.talla}` : ''
        };
      });
      
      setImages(enrichedImages);
      setVariants(enrichedVariants);
    } catch (error) {
      console.error('Error:', error);
      setImages([]);
      setVariants([]);
      showToast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (imageId: number) => {
    try {
      setLoadingComments(true);
      const response = await fetch(`${API_URL}/api/productos/comentarios/?imagen=${imageId}`);
      
      if (!response.ok) throw new Error('Error al cargar comentarios');
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al cargar comentarios');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Producto_categoria || formData.Producto_categoria === 0) {
      showToast.error('Debes seleccionar un producto');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast.error('No estás autenticado. Por favor inicia sesión.');
        return;
      }

      // Crear FormData para enviar archivo + datos
      const formDataToSend = new FormData();
      formDataToSend.append('Producto_categoria', formData.Producto_categoria.toString());
      formDataToSend.append('texto', formData.texto);
      formDataToSend.append('es_principal', formData.es_principal.toString());
      
      if (selectedFile) {
        formDataToSend.append('imagen', selectedFile);
      }

      let url: string;
      let method: string;
      
      if (editingImage) {
        // EDITAR: usar endpoint normal del ViewSet
        url = `${API_URL}/api/productos/imagenes/${editingImage.id}/`;
        method = 'PATCH';
      } else {
        // CREAR: usar endpoint dedicado para S3
        url = `${API_URL}/api/productos/upload-imagen/`;
        method = 'POST';
      }
      
      console.log(`📤 ${method} imagen a ${url}...`);
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          // NO incluir Content-Type - el navegador lo establece con boundary
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        console.error('❌ Debug info:', errorData.debug);
        throw new Error(errorData.error || 'Error al guardar imagen');
      }
      
      const result = await response.json();
      console.log('✅ Respuesta:', result);
      if (result.imagen) {
        console.log('📍 URL de la imagen:', result.imagen.imagen_url);
        console.log('🔧 Debug S3:', result.debug);
      }
      
      showToast.success(editingImage ? 'Imagen actualizada' : 'Imagen creada');
      loadData();
      closeModal();
    } catch (error) {
      console.error('💥 Error:', error);
      showToast.error(error instanceof Error ? error.message : 'Error al guardar imagen');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      const response = await fetch(`${API_URL}/api/productos/imagenes/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar imagen');
      
      showToast.success('Imagen eliminada');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error al eliminar imagen');
    }
  };

  const openCreateModal = () => {
    setEditingImage(null);
    setSelectedFile(null);
    setFormData({ Producto_categoria: 0, texto: '', es_principal: false });
    setShowModal(true);
  };

  const openEditModal = (image: ProductImage) => {
    setEditingImage(image);
    setSelectedFile(null);
    setFormData({
      Producto_categoria: image.Producto_categoria,
      texto: image.texto,
      es_principal: image.es_principal,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingImage(null);
    setSelectedFile(null);
  };

  const openCommentsModal = (imageId: number) => {
    setShowComments(true);
    loadComments(imageId);
  };

  const closeCommentsModal = () => {
    setShowComments(false);
    setComments([]);
  };

  const filteredImages = images.filter(img =>
    img.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.variant_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.texto?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-gray-900">Imágenes de Productos</h2>
          <p className="text-gray-600 mt-1">Gestiona las imágenes (S3) de los productos</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          Nueva Imagen
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
              <p className="text-rose-100 text-sm font-medium">Total Imágenes</p>
              <p className="text-3xl font-bold mt-2">{images.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ImageIcon className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Principales</p>
              <p className="text-3xl font-bold mt-2">{images.filter(i => i.es_principal).length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ImageIcon className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Secundarias</p>
              <p className="text-3xl font-bold mt-2">{images.filter(i => !i.es_principal).length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ImageIcon className="h-8 w-8" />
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
            placeholder="Buscar imágenes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-video bg-gray-100 relative">
              {image.imagen ? (
                <img 
                  src={image.imagen} 
                  alt={image.texto}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {image.es_principal && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-rose-600 text-white text-xs font-medium rounded-full">
                  Principal
                </span>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{image.producto_nombre}</h3>
              {image.variant_info && (
                <p className="text-xs text-gray-500 mb-1">
                  Variante: {image.variant_info}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{image.texto || 'Sin descripción'}</p>
              
              <button
                onClick={() => openCommentsModal(image.id)}
                className="w-full mb-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Ver Comentarios
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(image)}
                  className="flex-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay imágenes {searchTerm && 'que coincidan con la búsqueda'}</p>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingImage ? 'Editar Imagen' : 'Nueva Imagen'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variante del Producto *
                </label>
                <select
                  value={formData.Producto_categoria}
                  onChange={(e) => setFormData({ ...formData, Producto_categoria: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                >
                  <option value={0}>Selecciona una variante</option>
                  {variants.map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.producto_nombre} - {variant.color} ({variant.talla}) - ${variant.precio_unitario}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona la variante específica del producto (color + talla)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen {!editingImage && '*'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-rose-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="imageUpload"
                    required={!editingImage}
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click para subir imagen'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB</p>
                  </label>
                </div>
                {editingImage && !selectedFile && (
                  <p className="text-xs text-gray-500 mt-2">Deja vacío para mantener la imagen actual</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.texto}
                  onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Vestido Floral Rojo - Vista Frontal"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="es_principal"
                  checked={formData.es_principal}
                  onChange={(e) => setFormData({ ...formData, es_principal: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="es_principal" className="text-sm text-gray-700">
                  Imagen principal del producto
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
                  {editingImage ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Comments */}
      <AnimatePresence>
        {showComments && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Comentarios
                </h3>
                <button onClick={closeCommentsModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">{comment.usuario}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.fecha_creacion).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{comment.comentario}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay comentarios para esta imagen</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
