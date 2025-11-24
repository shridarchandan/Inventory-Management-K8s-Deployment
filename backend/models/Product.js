const pool = require('../database/db');

class Product {
  static async getAll() {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(productData) {
    const { name, description, price, quantity, sku, category_id, supplier_id } = productData;
    const result = await pool.query(
      `INSERT INTO products (name, description, price, quantity, sku, category_id, supplier_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, price, quantity, sku, category_id || null, supplier_id || null]
    );
    return result.rows[0];
  }

  static async update(id, productData) {
    const { name, description, price, quantity, sku, category_id, supplier_id } = productData;
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, quantity = $4, sku = $5, 
           category_id = $6, supplier_id = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 RETURNING *`,
      [name, description, price, quantity, sku, category_id || null, supplier_id || null, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async getByCategory(categoryId) {
    const result = await pool.query(
      'SELECT * FROM products WHERE category_id = $1 ORDER BY name',
      [categoryId]
    );
    return result.rows;
  }

  static async getLowStock(threshold = 10) {
    const result = await pool.query(
      'SELECT * FROM products WHERE quantity <= $1 ORDER BY quantity ASC',
      [threshold]
    );
    return result.rows;
  }

  // Image methods
  static async getProductImages(productId) {
    const result = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order ASC, created_at ASC',
      [productId]
    );
    return result.rows;
  }

  static async addProductImage(productId, imagePath, thumbnailPath, displayOrder = 0) {
    const result = await pool.query(
      'INSERT INTO product_images (product_id, image_path, thumbnail_path, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [productId, imagePath, thumbnailPath, displayOrder]
    );
    return result.rows[0];
  }

  static async deleteProductImage(imageId) {
    const result = await pool.query(
      'DELETE FROM product_images WHERE id = $1 RETURNING *',
      [imageId]
    );
    return result.rows[0];
  }

  static async updateImageOrder(imageId, displayOrder) {
    const result = await pool.query(
      'UPDATE product_images SET display_order = $1 WHERE id = $2 RETURNING *',
      [displayOrder, imageId]
    );
    return result.rows[0];
  }
}

module.exports = Product;


