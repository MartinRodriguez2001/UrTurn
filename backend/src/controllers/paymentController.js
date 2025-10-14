import { query } from '../config/database.js';

// Obtener todos los pagos
export const getAllPayments = async (req, res) => {
  try {
    const { user_id, travel_id } = req.query;

    let queryText = `
      SELECT p.*,
             u.names as user_name, u.email as user_email,
             t.start_location, t.end_location, t.price
      FROM payment p
      JOIN users u ON p.user_id = u.id
      JOIN travel t ON p.travel_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      params.push(user_id);
      queryText += ` AND p.user_id = $${params.length}`;
    }

    if (travel_id) {
      params.push(travel_id);
      queryText += ` AND p.travel_id = $${params.length}`;
    }

    queryText += ' ORDER BY p.id DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

// Obtener un pago por ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*,
              u.names as user_name, u.email as user_email,
              t.start_location, t.end_location, t.price, t.start_time,
              d.names as driver_name
       FROM payment p
       JOIN users u ON p.user_id = u.id
       JOIN travel t ON p.travel_id = t.id
       JOIN users d ON t.driver_id = d.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
};

// Crear un nuevo pago
export const createPayment = async (req, res) => {
  try {
    const { user_id, travel_id } = req.body;

    // Verificar que el usuario exista
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el viaje exista
    const travelCheck = await query(
      'SELECT id, status FROM travel WHERE id = $1',
      [travel_id]
    );

    if (travelCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    // Verificar que el usuario esté confirmado en el viaje
    const confirmationCheck = await query(
      'SELECT id FROM confirmation WHERE user_id = $1 AND travel_id = $2',
      [user_id, travel_id]
    );

    if (confirmationCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no está confirmado en este viaje'
      });
    }

    // Verificar que no exista ya un pago
    const existingPayment = await query(
      'SELECT id FROM payment WHERE user_id = $1 AND travel_id = $2',
      [user_id, travel_id]
    );

    if (existingPayment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un pago registrado para este usuario en este viaje'
      });
    }

    const result = await query(
      'INSERT INTO payment (user_id, travel_id) VALUES ($1, $2) RETURNING *',
      [user_id, travel_id]
    );

    res.status(201).json({
      success: true,
      message: 'Pago registrado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pago',
      error: error.message
    });
  }
};

// Eliminar pago
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM payment WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pago eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar pago',
      error: error.message
    });
  }
};

// Verificar si un usuario ha pagado un viaje
export const checkPaymentStatus = async (req, res) => {
  try {
    const { userId, travelId } = req.params;

    const result = await query(
      'SELECT * FROM payment WHERE user_id = $1 AND travel_id = $2',
      [userId, travelId]
    );

    res.json({
      success: true,
      paid: result.rows.length > 0,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar pago',
      error: error.message
    });
  }
};

// Obtener pagos pendientes de un viaje
export const getTravelPendingPayments = async (req, res) => {
  try {
    const { travelId } = req.params;

    // Obtener pasajeros confirmados que no han pagado
    const result = await query(
      `SELECT u.id, u.names, u.email, u.phone_number, c.confirmation_date
       FROM confirmation c
       JOIN users u ON c.user_id = u.id
       WHERE c.travel_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM payment p
         WHERE p.user_id = u.id AND p.travel_id = $1
       )
       ORDER BY c.confirmation_date ASC`,
      [travelId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos pendientes',
      error: error.message
    });
  }
};
