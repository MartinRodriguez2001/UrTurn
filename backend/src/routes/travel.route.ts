import { Router } from "express";
import { TravelController } from "../controllers/travell.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const travelController = new TravelController();

// ✅ Rutas públicas (solo necesitan autenticación básica)

// GET /api/travels/available - Obtener viajes disponibles (con filtros opcionales)
router.get(
  "/available",
  authenticateToken,
  travelController.getAvailableTravels.bind(travelController)
);

// GET /api/travels/search - Buscar viajes por ubicación
router.get(
  "/search",
  authenticateToken,
  travelController.searchTravelsByLocation.bind(travelController)
);

// ✅ Rutas para conductores

// POST /api/travels - Crear nuevo viaje
router.post(
  "/",
  authenticateToken,
  travelController.createTravel.bind(travelController)
);

// POST /api/travels/requests - Registrar solicitud sin viaje asignado
router.post(
  "/requests",
  authenticateToken,
  travelController.createOpenTravelRequest.bind(travelController)
);

router.post(
  "/matching",
  authenticateToken,
  travelController.findMatchingTravels.bind(travelController)
);

// GET /api/travels/driver - Obtener viajes del conductor autenticado
router.get(
  "/driver",
  authenticateToken,
  travelController.getDriverTravels.bind(travelController)
);

// GET /api/travels/driver/:id - Obtener viajes de un conductor por su id (para vistas públicas)
router.get(
  "/driver/:id",
  authenticateToken,
  travelController.getTravelsByDriverById?.bind(travelController)
);

// GET /api/travels/:id/requests - Obtener solicitudes de un viaje específico
router.get(
  "/:id/requests",
  authenticateToken,
  travelController.getTravelRequests.bind(travelController)
);


// GET /api/travels/:id/messages - Obtener historial de chat del viaje
router.get(
  "/:id/messages",
  authenticateToken,
  travelController.getTravelMessages.bind(travelController)
);

// POST /api/travels/:id/messages - Enviar mensaje del viaje
router.post(
  "/:id/messages",
  authenticateToken,
  travelController.sendTravelMessage.bind(travelController)
);

// PUT /api/travels/:id/complete - Finalizar un viaje
router.put(
  "/:id/complete",
  authenticateToken,
  travelController.completeTravel.bind(travelController)
);

// PUT /api/travels/:id/start - Iniciar un viaje
router.put(
  "/:id/start",
  authenticateToken,
  travelController.startTravel.bind(travelController)
);

// DELETE /api/travels/:id - Cancelar viaje
router.delete(
  "/:id",
  authenticateToken,
  travelController.cancelTravel.bind(travelController)
);

// DELETE /api/travels/:id/passengers/:passengerId - Remover pasajero del viaje
router.delete(
  "/:id/passengers/:passengerId",
  authenticateToken,
  travelController.removePassenger.bind(travelController)
);

// ✅ Rutas para pasajeros

// GET /api/travels/passenger - Obtener viajes del pasajero (solicitados y confirmados)
router.get(
  "/passenger",
  authenticateToken,
  travelController.getPassengerTravels.bind(travelController)
);

// GET /api/travels/:id - Obtener un viaje por id
router.get(
  "/:id",
  authenticateToken,
  travelController.getTravelById.bind(travelController)
);

// POST /api/travels/:id/request - Solicitar unirse a un viaje
router.post(
  "/:id/request",
  authenticateToken,
  travelController.requestToJoinTravel.bind(travelController)
);

// ✅ Rutas para gestión de solicitudes

// PUT /api/travels/requests/:id/respond - Responder a una solicitud de viaje
router.put(
  "/requests/:id/respond",
  authenticateToken,
  travelController.respondToTravelRequest.bind(travelController)
);

// DELETE /api/travels/requests/:id/cancel - Cancelar solicitud de viaje (pasajero)
router.delete(
  "/requests/:id/cancel",
  authenticateToken,
  travelController.cancelTravelRequest.bind(travelController)
);

// DELETE /api/travels/:id/leave - Abandonar viaje confirmado (pasajero)
router.delete(
  "/:id/leave",
  authenticateToken,
  travelController.leaveTravel.bind(travelController)
);

export default router;
