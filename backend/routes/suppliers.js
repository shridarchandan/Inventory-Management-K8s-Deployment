const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Supplier = require('../models/Supplier');
const { upload, uploadsDir } = require('../middleware/upload');
const { processImage, deleteImageFiles } = require('../utils/imageProcessor');

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.getAll();
    // Fetch images for each supplier
    for (let supplier of suppliers) {
      const images = await Supplier.getSupplierImages(supplier.id);
      supplier.images = images;
    }
    res.json(suppliers);
  } catch (error) {
    console.error('Suppliers GET error:', error);
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

// GET supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.getById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    // Fetch images for the supplier
    const images = await Supplier.getSupplierImages(supplier.id);
    supplier.images = images;
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new supplier
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const supplier = await Supplier.create({ name, email, phone, address });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const supplier = await Supplier.update(req.params.id, { name, email, phone, address });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    // Get all images before deleting supplier (cascade will delete from DB)
    const images = await Supplier.getSupplierImages(req.params.id);
    
    const supplier = await Supplier.delete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Delete image files from filesystem
    images.forEach(img => {
      deleteImageFiles(img.image_path, img.thumbnail_path);
    });

    res.json({ message: 'Supplier deleted successfully', supplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPLOAD supplier images
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const supplierId = req.params.id;
    const supplier = await Supplier.getById(supplierId);
    if (!supplier) {
      // Delete uploaded files if supplier doesn't exist
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Supplier not found' });
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
        const existingImages = await Supplier.getSupplierImages(supplierId);
        const displayOrder = existingImages.length;

        // Save to database
        const imageRecord = await Supplier.addSupplierImage(
          supplierId,
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

// DELETE supplier image
router.delete('/:supplierId/images/:imageId', async (req, res) => {
  try {
    const { supplierId, imageId } = req.params;
    
    // Verify supplier exists
    const supplier = await Supplier.getById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Get image record before deleting
    const image = await Supplier.deleteSupplierImage(imageId);
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
router.put('/:supplierId/images/:imageId/order', async (req, res) => {
  try {
    const { supplierId, imageId } = req.params;
    const { display_order } = req.body;

    if (display_order === undefined) {
      return res.status(400).json({ error: 'display_order is required' });
    }

    // Verify supplier exists
    const supplier = await Supplier.getById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const image = await Supplier.updateImageOrder(imageId, display_order);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

