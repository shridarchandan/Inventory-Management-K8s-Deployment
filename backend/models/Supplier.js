const pool = require('../database/db');

class Supplier {
  static async getAll() {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(supplierData) {
    const { name, email, phone, address } = supplierData;
    const result = await pool.query(
      'INSERT INTO suppliers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, address]
    );
    return result.rows[0];
  }

  static async update(id, supplierData) {
    const { name, email, phone, address } = supplierData;
    const result = await pool.query(
      'UPDATE suppliers SET name = $1, email = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, email, phone, address, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Image methods
  static async getSupplierImages(supplierId) {
    const result = await pool.query(
      'SELECT * FROM supplier_images WHERE supplier_id = $1 ORDER BY display_order ASC, created_at ASC',
      [supplierId]
    );
    return result.rows;
  }

  static async addSupplierImage(supplierId, imagePath, thumbnailPath, displayOrder = 0) {
    const result = await pool.query(
      'INSERT INTO supplier_images (supplier_id, image_path, thumbnail_path, display_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [supplierId, imagePath, thumbnailPath, displayOrder]
    );
    return result.rows[0];
  }

  static async deleteSupplierImage(imageId) {
    const result = await pool.query(
      'DELETE FROM supplier_images WHERE id = $1 RETURNING *',
      [imageId]
    );
    return result.rows[0];
  }

  static async updateImageOrder(imageId, displayOrder) {
    const result = await pool.query(
      'UPDATE supplier_images SET display_order = $1 WHERE id = $2 RETURNING *',
      [displayOrder, imageId]
    );
    return result.rows[0];
  }
}

module.exports = Supplier;


