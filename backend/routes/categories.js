const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const { upload, uploadsDir } = require('../middleware/upload');
const { processImage, deleteImageFiles } = require('../utils/imageProcessor');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getAll();
    // Fetch images for each category
    for (let category of categories) {
      const images = await Category.getCategoryImages(category.id);
      category.images = images;
    }
    res.json(categories);
  } catch (error) {
    console.error('Categories GET error:', error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
      res.status(503).json({ 
        error: 'Database connection failed', 
        message: 'Please ensure PostgreSQL is running and the database is set up. See SETUP_DATABASE.md for instructions.' 
      });
    } else {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});

// GET category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    // Fetch images for the category
    const images = await Category.getCategoryImages(category.id);
    category.images = images;
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new category
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// UPDATE category
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = await Category.update(req.params.id, { name, description });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Category with this name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    // Get all images before deleting category (cascade will delete from DB)
    const images = await Category.getCategoryImages(req.params.id);
    
    const category = await Category.delete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete image files from filesystem
    images.forEach(img => {
      deleteImageFiles(img.image_path, img.thumbnail_path);
    });

    res.json({ message: 'Category deleted successfully', category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPLOAD category images
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const categoryId = req.params.id;
    const category = await Category.getById(categoryId);
    if (!category) {
      // Delete uploaded files if category doesn't exist
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Category not found' });
    }

    const uploadedImages = [];
    const errors = [];

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        // Process and resize image
        const { thumbnailPath, resizedPath } = await processImage(file.path, uploadsDir);
        
        // Delete original file after processing
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        // Get current image count for display order
        const existingImages = await Category.getCategoryImages(categoryId);
        const displayOrder = existingImages.length;

        // Save to database
        const imageRecord = await Category.addCategoryImage(
          categoryId,
          resizedPath,
          thumbnailPath,
          displayOrder
        );

        uploadedImages.push(imageRecord);
      } catch (error) {
        console.error(`Error processing image ${file.originalname}:`, error);
        errors.push({ file: file.originalname, error: error.message });
        // Delete the file if processing failed
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({ 
        error: 'Failed to upload images', 
        details: errors 
      });
    }

    res.status(201).json({ 
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE category image
router.delete('/:categoryId/images/:imageId', async (req, res) => {
  try {
    const { categoryId, imageId } = req.params;
    
    // Verify category exists
    const category = await Category.getById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get image record before deleting
    const image = await Category.deleteCategoryImage(imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete image files from filesystem
    deleteImageFiles(image.image_path, image.thumbnail_path);

    res.json({ message: 'Image deleted successfully', image });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE image display order
router.put('/:categoryId/images/:imageId/order', async (req, res) => {
  try {
    const { categoryId, imageId } = req.params;
    const { display_order } = req.body;

    if (display_order === undefined) {
      return res.status(400).json({ error: 'display_order is required' });
    }

    // Verify category exists
    const category = await Category.getById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const image = await Category.updateImageOrder(imageId, display_order);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

