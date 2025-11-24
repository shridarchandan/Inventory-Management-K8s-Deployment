import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import { FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import './Categories.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Error loading categories. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let categoryId;
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        categoryId = editingCategory.id;
      } else {
        const response = await categoriesAPI.create(formData);
        categoryId = response.data.id;
      }

      // Upload images if any were selected
      if (selectedImages.length > 0 && categoryId) {
        await handleImageUpload(categoryId);
      }

      fetchCategories();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving category');
    }
  };

  const handleImageUpload = async (categoryId) => {
    if (selectedImages.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      await categoriesAPI.uploadImages(categoryId, formData);
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

  const handleDeleteImage = async (categoryId, imageId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await categoriesAPI.deleteImage(categoryId, imageId);
        fetchCategories();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting image');
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setSelectedImages([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesAPI.delete(id);
        fetchCategories();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting category');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setSelectedImages([]);
    setFormData({
      name: '',
      description: '',
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
    <div className="categories-container">
      <div className="page-header">
        <h2>Categories</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Category
        </button>
      </div>

      <div className="categories-grid">
        {categories.length === 0 ? (
          <p className="empty-state">No categories found. Add your first category!</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-card">
              {/* Category Images Gallery */}
              {category.images && category.images.length > 0 && (
                <div className="category-images">
                  <div className="category-image-main">
                    <img
                      src={getImageUrl(category.images[0].thumbnail_path || category.images[0].image_path)}
                      alt={category.name}
                      onClick={() => setShowImageGallery(category.id)}
                    />
                    {category.images.length > 1 && (
                      <div className="image-count-badge">{category.images.length}</div>
                    )}
                  </div>
                  {category.images.length > 1 && (
                    <div className="category-image-thumbnails">
                      {category.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={img.id}
                          src={getImageUrl(img.thumbnail_path || img.image_path)}
                          alt={`${category.name} ${idx + 1}`}
                          onClick={() => setShowImageGallery(category.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="category-header">
                <h3>{category.name}</h3>
                <div className="category-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(category)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(category.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
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
              
              {/* Image Upload Section */}
              <div className="form-group">
                <label>Category Images</label>
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
                {editingCategory && editingCategory.images && editingCategory.images.length > 0 && (
                  <div className="existing-images">
                    <label>Existing Images:</label>
                    <div className="existing-images-grid">
                      {editingCategory.images.map((img) => (
                        <div key={img.id} className="existing-image-item">
                          <img
                            src={getImageUrl(img.thumbnail_path || img.image_path)}
                            alt="Category"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={(e) => handleDeleteImage(editingCategory.id, img.id, e)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!editingCategory && (
                  <small className="form-hint">You can upload images after creating the category</small>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
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
              <h3>Category Images</h3>
              <button className="btn-close" onClick={() => setShowImageGallery(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="gallery-content">
              {categories.find(c => c.id === showImageGallery)?.images?.map((img) => (
                <div key={img.id} className="gallery-image-item">
                  <img
                    src={getImageUrl(img.image_path)}
                    alt="Category"
                  />
                  <button
                    className="gallery-delete-btn"
                    onClick={(e) => {
                      handleDeleteImage(showImageGallery, img.id, e);
                      if (categories.find(c => c.id === showImageGallery)?.images?.length === 1) {
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

export default Categories;


