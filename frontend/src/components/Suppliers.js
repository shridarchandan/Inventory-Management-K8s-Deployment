import React, { useState, useEffect } from 'react';
import { suppliersAPI } from '../services/api';
import { FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import './Suppliers.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('Error loading suppliers. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let supplierId;
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData);
        supplierId = editingSupplier.id;
      } else {
        const response = await suppliersAPI.create(formData);
        supplierId = response.data.id;
      }

      // Upload images if any were selected
      if (selectedImages.length > 0 && supplierId) {
        await handleImageUpload(supplierId);
      }

      fetchSuppliers();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving supplier');
    }
  };

  const handleImageUpload = async (supplierId) => {
    if (selectedImages.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      await suppliersAPI.uploadImages(supplierId, formData);
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

  const handleDeleteImage = async (supplierId, imageId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await suppliersAPI.deleteImage(supplierId, imageId);
        fetchSuppliers();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting image');
      }
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setSelectedImages([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await suppliersAPI.delete(id);
        fetchSuppliers();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting supplier');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setSelectedImages([]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="suppliers-container">
      <div className="page-header">
        <h2>Suppliers</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Supplier
        </button>
      </div>

      <div className="suppliers-grid">
        {suppliers.length === 0 ? (
          <p className="empty-state">No suppliers found. Add your first supplier!</p>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card">
              {/* Supplier Images Gallery */}
              {supplier.images && supplier.images.length > 0 && (
                <div className="supplier-images">
                  <div className="supplier-image-main">
                    <img
                      src={getImageUrl(supplier.images[0].thumbnail_path || supplier.images[0].image_path)}
                      alt={supplier.name}
                      onClick={() => setShowImageGallery(supplier.id)}
                    />
                    {supplier.images.length > 1 && (
                      <div className="image-count-badge">{supplier.images.length}</div>
                    )}
                  </div>
                  {supplier.images.length > 1 && (
                    <div className="supplier-image-thumbnails">
                      {supplier.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={img.id}
                          src={getImageUrl(img.thumbnail_path || img.image_path)}
                          alt={`${supplier.name} ${idx + 1}`}
                          onClick={() => setShowImageGallery(supplier.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="supplier-header">
                <h3>{supplier.name}</h3>
                <div className="supplier-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(supplier)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(supplier.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="supplier-details">
                {supplier.email && (
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span className="value">{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="detail-item">
                    <span className="label">Address:</span>
                    <span className="value">{supplier.address}</span>
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
              <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
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
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="3"
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Supplier Images</label>
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
                {editingSupplier && editingSupplier.images && editingSupplier.images.length > 0 && (
                  <div className="existing-images">
                    <label>Existing Images:</label>
                    <div className="existing-images-grid">
                      {editingSupplier.images.map((img) => (
                        <div key={img.id} className="existing-image-item">
                          <img
                            src={getImageUrl(img.thumbnail_path || img.image_path)}
                            alt="Supplier"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={(e) => handleDeleteImage(editingSupplier.id, img.id, e)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!editingSupplier && (
                  <small className="form-hint">You can upload images after creating the supplier</small>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Update' : 'Create'}
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
              <h3>Supplier Images</h3>
              <button className="btn-close" onClick={() => setShowImageGallery(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="gallery-content">
              {suppliers.find(s => s.id === showImageGallery)?.images?.map((img) => (
                <div key={img.id} className="gallery-image-item">
                  <img
                    src={getImageUrl(img.image_path)}
                    alt="Supplier"
                  />
                  <button
                    className="gallery-delete-btn"
                    onClick={(e) => {
                      handleDeleteImage(showImageGallery, img.id, e);
                      if (suppliers.find(s => s.id === showImageGallery)?.images?.length === 1) {
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

export default Suppliers;


