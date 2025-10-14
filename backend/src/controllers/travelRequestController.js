import { query } from '../config/database.js';

// Obtener todas las solicitudes de viaje
export const getAllTravelRequests = async (req, res) => {
  try {
    const { status, passenger_id, travel_id } = req.query;

    let queryText = `
      SELECT tr.*,
             u.names as passenger_name, u.email as passenger_email,
             t.start_location, t.end_location, t.start_time
      FROM travel_request tr
      JOIN users u ON tr.passenger_id = u.id
      JOIN travel t ON tr.travel_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND tr.status = $${params.length}`;
    }

    if (passenger_id) {
      params.push(passenger_id);
      queryText += ` AND tr.passenger_id = $${params.length}`;
    }

    if (travel_id) {
      params.push(travel_id);
      queryText += ` AND tr.travel_id = $${params.length}`;
    }

    queryText += ' ORDER BY tr.created_at DESC';

    const result = await query(queryText, params);

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

// Obtener una solicitud por ID
export const getTravelRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT tr.*,
              u.names as passenger_name, u.email as passenger_email, u.phone_number as passenger_phone,
              t.start_location, t.end_location, t.start_time, t.end_time, t.price,
              d.names as driver_name, d.email as driver_email, d.phone_number as driver_phone
       FROM travel_request tr
       JOIN users u ON tr.passenger_id = u.id
       JOIN travel t ON tr.travel_id = t.id
       JOIN users d ON t.driver_id = d.id
       WHERE tr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud',
      error: error.message
    });
  }
};

// Crear una nueva solicitud de viaje
export const createTravelRequest = async (req, res) => {
  try {
    const { passenger_id, travel_id, location } = req.body;

    // Verificar que el pasajero exista
    const passengerCheck = await query(
      'SELECT id FROM users WHERE id = $1',
      [passenger_id]
    );

    if (passengerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pasajero no encontrado'
      });
    }

    // Verificar que el viaje exista y tenga espacios disponibles
    const travelCheck = await query(
      'SELECT id, spaces_available, status FROM travel WHERE id = $1',
      [travel_id]
    );

    if (travelCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    if (travelCheck.rows[0].spaces_available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay espacios disponibles en este viaje'
      });
    }

    if (travelCheck.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Este viaje ya no acepta solicitudes'
      });
    }

    // Verificar que el pasajero no haya solicitado ya este viaje
    const existingRequest = await query(
      'SELECT id FROM travel_request WHERE passenger_id = $1 AND travel_id = $2',
      [passenger_id, travel_id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya has solicitado este viaje'
      });
    }

    const result = await query(
      `INSERT INTO travel_request (passenger_id, travel_id, location, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [passenger_id, travel_id, location]
    );

    res.status(201).json({
      success: true,
      message: 'Solicitud creada correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud',
      error: error.message
    });
  }
};

// Actualizar estado de solicitud (aceptar/rechazar)
export const updateTravelRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    // Obtener información de la solicitud
    const requestInfo = await query(
      'SELECT travel_id, passenger_id FROM travel_request WHERE id = $1',
      [id]
    );

    if (requestInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const { travel_id, passenger_id } = requestInfo.rows[0];

    // Actualizar el estado de la solicitud
    const result = await query(
      'UPDATE travel_request SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    // Si se acepta, crear confirmación y reducir espacios disponibles
    if (status === 'accepted') {
      // Verificar espacios disponibles
      const travelCheck = await query(
        'SELECT spaces_available FROM travel WHERE id = $1',
        [travel_id]
      );

      if (travelCheck.rows[0].spaces_available <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay espacios disponibles'
        });
      }

      // Crear confirmación
      await query(
        'INSERT INTO confirmation (travel_id, user_id) VALUES ($1, $2)',
        [travel_id, passenger_id]
      );

      // Reducir espacios disponibles
      await query(
        'UPDATE travel SET spaces_available = spaces_available - 1 WHERE id = $1',
        [travel_id]
      );
    }

    res.json({
      success: true,
      message: `Solicitud ${status === 'accepted' ? 'aceptada' : 'rechazada'} correctamente`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar solicitud',
      error: error.message
    });
  }
};

// Cancelar solicitud (solo el pasajero puede cancelarla)
export const cancelTravelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información de la solicitud
    const requestInfo = await query(
      'SELECT travel_id, passenger_id, status FROM travel_request WHERE id = $1',
      [id]
    );

    if (requestInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const { travel_id, passenger_id, status } = requestInfo.rows[0];

    // Si la solicitud estaba aceptada, liberar el espacio
    if (status === 'accepted') {
      await query(
        'UPDATE travel SET spaces_available = spaces_available + 1 WHERE id = $1',
        [travel_id]
      );

      // Eliminar confirmación
      await query(
        'DELETE FROM confirmation WHERE travel_id = $1 AND user_id = $2',
        [travel_id, passenger_id]
      );
    }

    // Eliminar la solicitud
    await query('DELETE FROM travel_request WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Solicitud cancelada correctamente'
    });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar solicitud',
      error: error.message
    });
  }
};

// Obtener mensajes de una solicitud
export const getTravelRequestMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM travel_message WHERE request_id = $1 ORDER BY id ASC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes',
      error: error.message
    });
  }
};

// Crear mensaje en una solicitud
export const createTravelRequestMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Verificar que la solicitud exista
    const requestCheck = await query(
      'SELECT travel_id FROM travel_request WHERE id = $1',
      [id]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const result = await query(
      'INSERT INTO travel_message (request_id, travel_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, requestCheck.rows[0].travel_id, content]
    );

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear mensaje',
      error: error.message
    });
  }
};
