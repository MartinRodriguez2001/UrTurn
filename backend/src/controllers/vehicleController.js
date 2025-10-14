import { query } from '../config/database.js';

// Obtener todos los vehículos
export const getAllVehicles = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.*, u.names as owner_name, u.email as owner_email
       FROM vehicle v
       JOIN users u ON v.user_id = u.id
       ORDER BY v.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vehículos',
      error: error.message
    });
  }
};

// Obtener un vehículo por ID
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT v.*, u.names as owner_name, u.email as owner_email
       FROM vehicle v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vehículo',
      error: error.message
    });
  }
};

// Crear un nuevo vehículo
export const createVehicle = async (req, res) => {
  try {
    const { user_id, license_plate, model, brand, year, validations } = req.body;

    // Verificar que el usuario exista
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const result = await query(
      `INSERT INTO vehicle (user_id, license_plate, model, brand, year, validations)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, license_plate, model, brand, year, validations || false]
    );

    res.status(201).json({
      success: true,
      message: 'Vehículo creado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear vehículo',
      error: error.message
    });
  }
};

// Actualizar vehículo
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { license_plate, model, brand, year, validations } = req.body;

    const result = await query(
      `UPDATE vehicle
       SET license_plate = $1, model = $2, brand = $3, year = $4, validations = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [license_plate, model, brand, year, validations, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Vehículo actualizado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar vehículo',
      error: error.message
    });
  }
};

// Eliminar vehículo
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM vehicle WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Vehículo eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar vehículo',
      error: error.message
    });
  }
};

// Obtener viajes de un vehículo
export const getVehicleTrips = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, u.names as driver_name
       FROM travel t
       JOIN users u ON t.driver_id = u.id
       WHERE t.car_id = $1
       ORDER BY t.start_time DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener viajes del vehículo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener viajes',
      error: error.message
    });
  }
};
