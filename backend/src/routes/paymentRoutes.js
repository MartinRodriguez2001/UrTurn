import express from 'express';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment,
  checkPaymentStatus,
  getTravelPendingPayments
} from '../controllers/paymentController.js';

const router = express.Router();

// Rutas de pagos
router.get('/', getAllPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.delete('/:id', deletePayment);

// Rutas relacionadas con pagos
router.get('/check/:userId/:travelId', checkPaymentStatus);
router.get('/travel/:travelId/pending', getTravelPendingPayments);

export default router;
