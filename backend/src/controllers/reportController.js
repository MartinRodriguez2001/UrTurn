import { query } from '../config/database.js';

// Obtener todos los reportes
export const getAllReports = async (req, res) => {
  try {
    const { status, user_id, travel_id } = req.query;

    let queryText = `
      SELECT ri.*,
             u.names as reporter_name, u.email as reporter_email,
             t.start_location, t.end_location, t.start_time,
             d.names as driver_name
      FROM report_incident ri
      JOIN users u ON ri.user_id = u.id
      JOIN travel t ON ri.travel_id = t.id
      JOIN users d ON t.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND ri.status = $${params.length}`;
    }

    if (user_id) {
      params.push(user_id);
      queryText += ` AND ri.user_id = $${params.length}`;
    }

    if (travel_id) {
      params.push(travel_id);
      queryText += ` AND ri.travel_id = $${params.length}`;
    }

    queryText += ' ORDER BY ri.created_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes',
      error: error.message
    });
  }
};

// Obtener un reporte por ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT ri.*,
              u.names as reporter_name, u.email as reporter_email, u.phone_number as reporter_phone,
              t.start_location, t.end_location, t.start_time, t.end_time,
              d.names as driver_name, d.email as driver_email, d.phone_number as driver_phone
       FROM report_incident ri
       JOIN users u ON ri.user_id = u.id
       JOIN travel t ON ri.travel_id = t.id
       JOIN users d ON t.driver_id = d.id
       WHERE ri.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte',
      error: error.message
    });
  }
};

// Crear un nuevo reporte
export const createReport = async (req, res) => {
  try {
    const { user_id, travel_id, description } = req.body;

    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La descripción del incidente es obligatoria'
      });
    }

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
      'SELECT id FROM travel WHERE id = $1',
      [travel_id]
    );

    if (travelCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    // Verificar que el usuario esté relacionado con el viaje (como conductor o pasajero)
    const relationCheck = await query(
      `SELECT 1 FROM travel WHERE id = $1 AND driver_id = $2
       UNION
       SELECT 1 FROM confirmation WHERE travel_id = $1 AND user_id = $2`,
      [travel_id, user_id]
    );

    if (relationCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No tienes relación con este viaje'
      });
    }

    const result = await query(
      `INSERT INTO report_incident (user_id, travel_id, description, status)
       VALUES ($1, $2, $3, 'open')
       RETURNING *`,
      [user_id, travel_id, description]
    );

    res.status(201).json({
      success: true,
      message: 'Reporte creado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear reporte',
      error: error.message
    });
  }
};

// Actualizar estado de reporte
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in_review', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: open, in_review o resolved'
      });
    }

    const result = await query(
      'UPDATE report_incident SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado del reporte actualizado',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado del reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Actualizar descripción de reporte
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La descripción no puede estar vacía'
      });
    }

    const result = await query(
      'UPDATE report_incident SET description = $1 WHERE id = $2 RETURNING *',
      [description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Reporte actualizado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar reporte',
      error: error.message
    });
  }
};

// Eliminar reporte
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM report_incident WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Reporte eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reporte',
      error: error.message
    });
  }
};

// Obtener estadísticas de reportes
export const getReportStats = async (req, res) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) as total_reports,
         COUNT(CASE WHEN status = 'open' THEN 1 END) as open_reports,
         COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_reports,
         COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports
       FROM report_incident`
    );

    res.json({
      success: true,
      data: {
        total_reports: parseInt(result.rows[0].total_reports),
        open_reports: parseInt(result.rows[0].open_reports),
        in_review_reports: parseInt(result.rows[0].in_review_reports),
        resolved_reports: parseInt(result.rows[0].resolved_reports)
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
