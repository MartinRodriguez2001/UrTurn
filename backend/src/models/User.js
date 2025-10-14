import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

const SALT_ROUNDS = 10;

class User {
  /**
   * Crear un nuevo usuario
   */
  static async create({ email, password, name, isDriver = false, phone_number = null, description = null }) {
    try {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const text = `
        INSERT INTO users (email, password, name, isDriver, phone_number, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, name, isDriver, phone_number, description, created_at
      `;

      const values = [email.toLowerCase(), hashedPassword, name, isDriver, phone_number, description];
      const result = await query(text, values);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    try {
      const text = 'SELECT * FROM users WHERE email = $1';
      const result = await query(text, [email.toLowerCase()]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    try {
      const text = 'SELECT id, email, name, isDriver, phone_number, description, created_at, updated_at FROM users WHERE id = $1';
      const result = await query(text, [id]);

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar contraseña
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar información del usuario
   */
  static async update(id, { name, isDriver, phone_number, description }) {
    try {
      const text = `
        UPDATE users
        SET name = COALESCE($1, name),
            isDriver = COALESCE($2, isDriver),
            phone_number = COALESCE($3, phone_number),
            description = COALESCE($4, description),
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, email, name, isDriver, phone_number, description, updated_at
      `;

      const values = [name, isDriver, phone_number, description, id];
      const result = await query(text, values);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default User;
