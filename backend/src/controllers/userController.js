import { query } from '../config/database.js';

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, names, isDriver, phone_number, descriptions, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, email, names, isDriver, phone_number, descriptions, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { names, phone_number, descriptions, isDriver } = req.body;

    const result = await query(
      'UPDATE users SET names = $1, phone_number = $2, descriptions = $3, isDriver = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, names, isDriver, phone_number, descriptions',
      [names, phone_number, descriptions, isDriver, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// Obtener vehículos de un usuario
export const getUserVehicles = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM vehicle WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
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

// Obtener viajes de un usuario (como conductor)
export const getUserTripsAsDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT t.*, v.license_plate, v.model, v.brand FROM travel t LEFT JOIN vehicle v ON t.car_id = v.id WHERE t.driver_id = $1 ORDER BY t.start_time DESC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener viajes como conductor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener viajes',
      error: error.message
    });
  }
};

// Obtener viajes de un usuario (como pasajero)
export const getUserTripsAsPassenger = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, tr.status as request_status, tr.location as pickup_location
       FROM travel_request tr
       JOIN travel t ON tr.travel_id = t.id
       WHERE tr.passenger_id = $1
       ORDER BY t.start_time DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener viajes como pasajero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener viajes',
      error: error.message
    });
  }
};
