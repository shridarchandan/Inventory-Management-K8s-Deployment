const pool = require('../database/db');

class Category {
  static async getAll() {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(categoryData) {
    const { name, description } = categoryData;
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async update(id, categoryData) {
    const { name, description } = categoryData;
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Image methods
  static async getCategoryImages(categoryId) {
    const result = await pool.query(
      'SELECT * FROM category_images WHERE category_id = $1 ORDER BY display_order ASC, created_at ASC',
      [categoryId]
    );
    return result.rows;
  }

  static async addCategoryImage(categoryId, imagePath, thumbnailPath, displayOrder = 0) {
    const result = await pool.query(
      'INSERT INTO category_images (category_id, image_path, thumbnail_path, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [categoryId, imagePath, thumbnailPath, displayOrder]
    );
    return result.rows[0];
  }

  static async deleteCategoryImage(imageId) {
    const result = await pool.query(
      'DELETE FROM category_images WHERE id = $1 RETURNING *',
      [imageId]
    );
    return result.rows[0];
  }

  static async updateImageOrder(imageId, displayOrder) {
    const result = await pool.query(
      'UPDATE category_images SET display_order = $1 WHERE id = $2 RETURNING *',
      [displayOrder, imageId]
    );
    return result.rows[0];
  }
}

module.exports = Category;


