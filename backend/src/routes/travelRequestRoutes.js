import express from 'express';
import {
  getAllTravelRequests,
  getTravelRequestById,
  createTravelRequest,
  updateTravelRequestStatus,
  cancelTravelRequest,
  getTravelRequestMessages,
  createTravelRequestMessage
} from '../controllers/travelRequestController.js';

const router = express.Router();

// Rutas de solicitudes de viaje
router.get('/', getAllTravelRequests);
router.get('/:id', getTravelRequestById);
router.post('/', createTravelRequest);
router.patch('/:id/status', updateTravelRequestStatus);
router.delete('/:id', cancelTravelRequest);

// Rutas de mensajes en solicitudes
router.get('/:id/messages', getTravelRequestMessages);
router.post('/:id/messages', createTravelRequestMessage);

export default router;
