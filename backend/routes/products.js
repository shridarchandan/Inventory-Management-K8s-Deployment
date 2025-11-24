const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { upload, uploadsDir } = require('../middleware/upload');
const { processImage, deleteImageFiles } = require('../utils/imageProcessor');

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    // Fetch images for each product
    for (let product of products) {
      const images = await Product.getProductImages(product.id);
      product.images = images;
    }
    res.json(products);
  } catch (error) {
    console.error('Products GET error:', error);
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

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Fetch images for the product
    const images = await Product.getProductImages(product.id);
    product.images = images;
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const products = await Product.getByCategory(req.params.categoryId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET low stock products
router.get('/low-stock/:threshold?', async (req, res) => {
  try {
    const threshold = parseInt(req.params.threshold) || 10;
    const products = await Product.getLowStock(threshold);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, quantity, sku, category_id, supplier_id } = req.body;
    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Name, price, and quantity are required' });
    }
    if (price < 0 || quantity < 0) {
      return res.status(400).json({ error: 'Price and quantity must be non-negative' });
    }
    const product = await Product.create({ name, description, price, quantity, sku, category_id, supplier_id });
    res.status(201).json(product);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Product with this SKU already exists' });
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid category or supplier ID' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// UPDATE product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, quantity, sku, category_id, supplier_id } = req.body;
    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Name, price, and quantity are required' });
    }
    if (price < 0 || quantity < 0) {
      return res.status(400).json({ error: 'Price and quantity must be non-negative' });
    }
    const product = await Product.update(req.params.id, { name, description, price, quantity, sku, category_id, supplier_id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Product with this SKU already exists' });
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid category or supplier ID' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    // Get all images before deleting product (cascade will delete from DB)
    const images = await Product.getProductImages(req.params.id);
    
    const product = await Product.delete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete image files from filesystem
    images.forEach(img => {
      deleteImageFiles(img.image_path, img.thumbnail_path);
    });

    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPLOAD product images
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const productId = req.params.id;
    const product = await Product.getById(productId);
    if (!product) {
      // Delete uploaded files if product doesn't exist
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Product not found' });
    }

    const uploadedImages = [];
    const errors = [];

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        // Process and resize image
        const { thumbnailPath, resizedPath } = await processImage(file.path, uploadsDir);
        
        // Delete original file after processing (we keep resized and thumbnail)
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        // Get current image count for display order
        const existingImages = await Product.getProductImages(productId);
        const displayOrder = existingImages.length;

        // Save to database
        const imageRecord = await Product.addProductImage(
          productId,
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

// DELETE product image
router.delete('/:productId/images/:imageId', async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    
    // Verify product exists
    const product = await Product.getById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get image record before deleting
    const image = await Product.deleteProductImage(imageId);
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
router.put('/:productId/images/:imageId/order', async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const { display_order } = req.body;

    if (display_order === undefined) {
      return res.status(400).json({ error: 'display_order is required' });
    }

    // Verify product exists
    const product = await Product.getById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const image = await Product.updateImageOrder(imageId, display_order);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

