  import axios from 'axios';

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  //const API_BASE_URL = "http://a482944cbd6d94306ad2e043f89aabc8-1616021472.us-east-1.elb.amazonaws.com:5000/api";


  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach token from localStorage if present (for non-React usage)
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Products API
  export const productsAPI = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
    getLowStock: (threshold) => api.get(`/products/low-stock/${threshold}`),
    // Image upload methods
    uploadImages: (productId, formData) => {
      return axios.post(`${API_BASE_URL}/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    deleteImage: (productId, imageId) => api.delete(`/products/${productId}/images/${imageId}`),
    updateImageOrder: (productId, imageId, displayOrder) => 
      api.put(`/products/${productId}/images/${imageId}/order`, { display_order: displayOrder }),
  };

  // Categories API
  export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    // Image upload methods
    uploadImages: (categoryId, formData) => {
      return axios.post(`${API_BASE_URL}/categories/${categoryId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    deleteImage: (categoryId, imageId) => api.delete(`/categories/${categoryId}/images/${imageId}`),
    updateImageOrder: (categoryId, imageId, displayOrder) => 
      api.put(`/categories/${categoryId}/images/${imageId}/order`, { display_order: displayOrder }),
  };

  // Suppliers API
  export const suppliersAPI = {
    getAll: () => api.get('/suppliers'),
    getById: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`),
    // Image upload methods
    uploadImages: (supplierId, formData) => {
      return axios.post(`${API_BASE_URL}/suppliers/${supplierId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    deleteImage: (supplierId, imageId) => api.delete(`/suppliers/${supplierId}/images/${imageId}`),
    updateImageOrder: (supplierId, imageId, displayOrder) => 
      api.put(`/suppliers/${supplierId}/images/${imageId}/order`, { display_order: displayOrder }),
  };
  // Auth API helpers
  export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
  };

  export default api;

