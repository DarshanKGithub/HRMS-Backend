const db = require("../config/db");

class OfferLetterModel {
  // Create new offer letter
  static async create(offerData) {
    const {
      employee_id,
      position,
      department,
      salary,
      offer_date,
      joining_date,
      letter_content,
      template_id,
      created_by,
      validity_days = 30,
    } = offerData;

    const query = `
      INSERT INTO offer_letters (
        employee_id, position, department, salary, offer_date, joining_date,
        letter_content, status, created_by, validity_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', $8, $9)
      RETURNING *;
    `;

    const result = await db.query(query, [
      employee_id,
      position,
      department,
      salary,
      offer_date,
      joining_date,
      letter_content,
      created_by,
      validity_days,
    ]);

    return result.rows[0];
  }

  // Get offer letter by ID
  static async getById(id) {
    const query = `
      SELECT ol.*, e.email, e.name
      FROM offer_letters ol
      JOIN employees e ON ol.employee_id = e.id
      WHERE ol.id = $1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Get all offer letters with pagination
  static async getAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT ol.*, e.email, e.name,
             COUNT(*) OVER() AS total
      FROM offer_letters ol
      JOIN employees e ON ol.employee_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND ol.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.employee_id) {
      query += ` AND ol.employee_id = $${paramCount++}`;
      params.push(filters.employee_id);
    }

    query += ` ORDER BY ol.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return {
      offers: result.rows,
      total: result.rows[0]?.total || 0,
    };
  }

  // Get offers for employee (self-service)
  static async getByEmployeeId(employee_id, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT ol.*, e.email, e.name,
             COUNT(*) OVER() AS total
      FROM offer_letters ol
      JOIN employees e ON ol.employee_id = e.id
      WHERE ol.employee_id = $1
      ORDER BY ol.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await db.query(query, [employee_id, limit, offset]);
    return {
      offers: result.rows,
      total: result.rows[0]?.total || 0,
    };
  }

  // Update offer letter
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (
        ["position", "department", "salary", "letter_content", "status", "pdf_path"].includes(
          key
        )
      ) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE offer_letters
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Delete offer letter (only DRAFT)
  static async delete(id) {
    const query = `
      DELETE FROM offer_letters
      WHERE id = $1 AND status = 'DRAFT'
      RETURNING id;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Update status and create audit trail
  static async updateStatus(id, newStatus, userId, notes = null) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // Get current status
      const currentOffer = await client.query("SELECT status FROM offer_letters WHERE id = $1", [
        id,
      ]);
      const oldStatus = currentOffer.rows[0]?.status;

      // Update status
      await client.query(
        `UPDATE offer_letters SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStatus, id]
      );

      // Create audit trail
      await client.query(
        `INSERT INTO offer_letter_audit (offer_id, action, changed_by, old_status, new_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, `STATUS_CHANGED_TO_${newStatus}`, userId, oldStatus, newStatus, notes]
      );

      await client.query("COMMIT");

      return { id, oldStatus, newStatus };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Get audit trail for an offer
  static async getAuditTrail(offerId) {
    const query = `
      SELECT ola.*, u.email as changed_by_email
      FROM offer_letter_audit ola
      LEFT JOIN users u ON ola.changed_by = u.id
      WHERE ola.offer_id = $1
      ORDER BY ola.changed_at DESC;
    `;

    const result = await db.query(query, [offerId]);
    return result.rows;
  }
}

module.exports = OfferLetterModel;
