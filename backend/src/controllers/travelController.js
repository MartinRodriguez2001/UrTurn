import { query } from '../config/database.js';

// Obtener todos los viajes
export const getAllTravels = async (req, res) => {
  try {
    const { status, available } = req.query;

    let queryText = `
      SELECT t.*,
             u.names as driver_name,
             v.license_plate, v.model, v.brand
      FROM travel t
      JOIN users u ON t.driver_id = u.id
      LEFT JOIN vehicle v ON t.car_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND t.status = $${params.length}`;
    }

    if (available === 'true') {
      queryText += ` AND t.spaces_available > 0 AND t.status = 'pending'`;
    }

    queryText += ' ORDER BY t.start_time DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener viajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener viajes',
      error: error.message
    });
  }
};

// Obtener un viaje por ID
export const getTravelById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*,
              u.names as driver_name, u.email as driver_email, u.phone_number as driver_phone,
              v.license_plate, v.model, v.brand, v.year
       FROM travel t
       JOIN users u ON t.driver_id = u.id
       LEFT JOIN vehicle v ON t.car_id = v.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener viaje',
      error: error.message
    });
  }
};

// Crear un nuevo viaje
export const createTravel = async (req, res) => {
  try {
    const {
      driver_id,
      car_id,
      start_location,
      end_location,
      capacity,
      price,
      start_time,
      end_time
    } = req.body;

    // Verificar que el conductor exista y sea conductor
    const driverCheck = await query(
      'SELECT id, isDriver FROM users WHERE id = $1',
      [driver_id]
    );

    if (driverCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado'
      });
    }

    if (!driverCheck.rows[0].isdriver) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es conductor'
      });
    }

    // Verificar que el vehículo exista y pertenezca al conductor
    if (car_id) {
      const vehicleCheck = await query(
        'SELECT id FROM vehicle WHERE id = $1 AND user_id = $2',
        [car_id, driver_id]
      );

      if (vehicleCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El vehículo no existe o no pertenece al conductor'
        });
      }
    }

    const result = await query(
      `INSERT INTO travel (driver_id, car_id, start_location, end_location, capacity, price, start_time, end_time, spaces_available, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $5, 'pending')
       RETURNING *`,
      [driver_id, car_id, start_location, end_location, capacity, price, start_time, end_time]
    );

    res.status(201).json({
      success: true,
      message: 'Viaje creado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear viaje',
      error: error.message
    });
  }
};

// Actualizar viaje
export const updateTravel = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_location,
      end_location,
      capacity,
      price,
      start_time,
      end_time,
      status
    } = req.body;

    const result = await query(
      `UPDATE travel
       SET start_location = $1, end_location = $2, capacity = $3, price = $4,
           start_time = $5, end_time = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [start_location, end_location, capacity, price, start_time, end_time, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Viaje actualizado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar viaje',
      error: error.message
    });
  }
};

// Actualizar estado del viaje
export const updateTravelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'finalized'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const result = await query(
      'UPDATE travel SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado del viaje actualizado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Eliminar viaje
export const deleteTravel = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM travel WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Viaje eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar viaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar viaje',
      error: error.message
    });
  }
};

// Obtener solicitudes de un viaje
export const getTravelRequests = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT tr.*, u.names as passenger_name, u.email as passenger_email, u.phone_number as passenger_phone
       FROM travel_request tr
       JOIN users u ON tr.passenger_id = u.id
       WHERE tr.travel_id = $1
       ORDER BY tr.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

// Obtener pasajeros confirmados de un viaje
export const getTravelPassengers = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.names, u.email, u.phone_number, c.confirmation_date
       FROM confirmation c
       JOIN users u ON c.user_id = u.id
       WHERE c.travel_id = $1
       ORDER BY c.confirmation_date ASC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener pasajeros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pasajeros',
      error: error.message
    });
  }
};
