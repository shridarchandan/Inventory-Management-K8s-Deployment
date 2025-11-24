const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Process and resize image, creating thumbnail
 * @param {string} imagePath - Path to the original image
 * @param {string} outputDir - Directory to save processed images
 * @returns {Promise<{thumbnailPath: string, resizedPath: string}>}
 */
async function processImage(imagePath, outputDir) {
  const filename = path.basename(imagePath);
  const nameWithoutExt = path.parse(filename).name;
  const ext = path.parse(filename).ext;

  // Create thumbnail (300x300, fit inside, maintain aspect ratio)
  const thumbnailPath = path.join(outputDir, 'thumbnails', `thumb-${filename}`);
  
  // Create resized version (800x800, fit inside, maintain aspect ratio)
  const resizedPath = path.join(outputDir, `resized-${filename}`);

  try {
    // Process thumbnail
    await sharp(imagePath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);

    // Process resized image
    await sharp(imagePath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toFile(resizedPath);

    return {
      thumbnailPath: path.relative(path.join(__dirname, '..'), thumbnailPath),
      resizedPath: path.relative(path.join(__dirname, '..'), resizedPath)
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Delete image files
 * @param {string} imagePath - Path to the resized image file (stored in DB)
 * @param {string} thumbnailPath - Path to the thumbnail file (stored in DB)
 */
function deleteImageFiles(imagePath, thumbnailPath) {
  const baseDir = path.join(__dirname, '..');
  
  const filesToDelete = [
    path.join(baseDir, imagePath),
    path.join(baseDir, thumbnailPath)
  ];

  filesToDelete.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }
  });
}

module.exports = {
  processImage,
  deleteImageFiles
};

