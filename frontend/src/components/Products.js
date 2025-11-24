import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, suppliersAPI } from '../services/api';
import { FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import './Products.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sku: '',
    category_id: '',
    supplier_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
      };

      let productId;
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, submitData);
        productId = editingProduct.id;
      } else {
        const response = await productsAPI.create(submitData);
        productId = response.data.id;
      }

      // Upload images if any were selected
      if (selectedImages.length > 0 && productId) {
        await handleImageUpload(productId);
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleImageUpload = async (productId) => {
    if (selectedImages.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      await productsAPI.uploadImages(productId, formData);
      setSelectedImages([]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error.response?.data?.error || 'Error uploading images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (productId, imageId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await productsAPI.deleteImage(productId, imageId);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting image');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      quantity: product.quantity || '',
      sku: product.sku || '',
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || '',
    });
    setSelectedImages([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting product');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setSelectedImages([]);
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      sku: '',
      category_id: '',
      supplier_id: '',
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Handle both relative and absolute paths
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="products-container">
      <div className="page-header">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Product
        </button>
      </div>

      <div className="products-grid">
        {products.length === 0 ? (
          <p className="empty-state">No products found. Add your first product!</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              {/* Product Images Gallery */}
              {product.images && product.images.length > 0 && (
                <div className="product-images">
                  <div className="product-image-main">
                    <img
                      src={getImageUrl(product.images[0].thumbnail_path || product.images[0].image_path)}
                      alt={product.name}
                      onClick={() => setShowImageGallery(product.id)}
                    />
                    {product.images.length > 1 && (
                      <div className="image-count-badge">{product.images.length}</div>
                    )}
                  </div>
                  {product.images.length > 1 && (
                    <div className="product-image-thumbnails">
                      {product.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={img.id}
                          src={getImageUrl(img.thumbnail_path || img.image_path)}
                          alt={`${product.name} ${idx + 1}`}
                          onClick={() => setShowImageGallery(product.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="product-header">
                <h3>{product.name}</h3>
                <div className="product-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(product)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(product.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <p className="product-description">{product.description}</p>
              <div className="product-details">
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value">${parseFloat(product.price).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantity:</span>
                  <span className={`value ${product.quantity <= 10 ? 'low-stock' : ''}`}>
                    {product.quantity}
                  </span>
                </div>
                {product.sku && (
                  <div className="detail-item">
                    <span className="label">SKU:</span>
                    <span className="value">{product.sku}</span>
                  </div>
                )}
                {product.category_name && (
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value">{product.category_name}</span>
                  </div>
                )}
                {product.supplier_name && (
                  <div className="detail-item">
                    <span className="label">Supplier:</span>
                    <span className="value">{product.supplier_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Product Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="file-input"
                />
                {selectedImages.length > 0 && (
                  <div className="selected-images-preview">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="image-preview-item">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => removeSelectedImage(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="existing-images">
                    <label>Existing Images:</label>
                    <div className="existing-images-grid">
                      {editingProduct.images.map((img) => (
                        <div key={img.id} className="existing-image-item">
                          <img
                            src={getImageUrl(img.thumbnail_path || img.image_path)}
                            alt="Product"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={(e) => handleDeleteImage(editingProduct.id, img.id, e)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!editingProduct && (
                  <small className="form-hint">You can upload images after creating the product</small>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="modal-overlay" onClick={() => setShowImageGallery(null)}>
          <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-header">
              <h3>Product Images</h3>
              <button className="btn-close" onClick={() => setShowImageGallery(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="gallery-content">
              {products.find(p => p.id === showImageGallery)?.images?.map((img) => (
                <div key={img.id} className="gallery-image-item">
                  <img
                    src={getImageUrl(img.image_path)}
                    alt="Product"
                  />
                  <button
                    className="gallery-delete-btn"
                    onClick={(e) => {
                      handleDeleteImage(showImageGallery, img.id, e);
                      if (products.find(p => p.id === showImageGallery)?.images?.length === 1) {
                        setShowImageGallery(null);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;


