import express from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReportStatus,
  updateReport,
  deleteReport,
  getReportStats
} from '../controllers/reportController.js';

const router = express.Router();

// Rutas de reportes
router.get('/', getAllReports);
router.get('/stats', getReportStats);
router.get('/:id', getReportById);
router.post('/', createReport);
router.patch('/:id/status', updateReportStatus);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
