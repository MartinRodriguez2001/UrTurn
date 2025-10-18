import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { TravelData, TravelService } from "../services/travel.service.js";

const travelService = new TravelService();

export class TravelController {

  // ✅ POST /travels - Crear nuevo viaje
  async createTravel(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelData: TravelData = {
        start_location: req.body.start_location,
        end_location: req.body.end_location,
        capacity: parseInt(req.body.capacity),
        price: parseFloat(req.body.price),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        spaces_available: parseInt(req.body.spaces_available),
        carId: parseInt(req.body.carId),
        status: req.body.status
      };

      const result = await travelService.registerTravel(travelData, driverId);
      
      res.status(201).json(result);

    } catch (error) {
      console.error("Error in createTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al crear viaje"
      });
    }
  }

  // ✅ GET /travels/driver - Obtener viajes del conductor
  async getDriverTravels(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const result = await travelService.getDriverTravels(driverId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getDriverTravels:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener viajes del conductor"
      });
    }
  }

  // ✅ GET /travels/available - Obtener viajes disponibles (con filtros)
  async getAvailableTravels(req: AuthRequest, res: Response) {
    try {
      const filters = {
        start_location: req.query.start_location as string,
        end_location: req.query.end_location as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        min_spaces: req.query.min_spaces ? parseInt(req.query.min_spaces as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : 999999
      };

      // Filtrar valores undefined
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ) as {
        start_location?: string;
        end_location?: string;
        start_date?: Date;
        min_spaces?: number;
        max_price: number;
      };

      const result = await travelService.getAvaibleTravels(cleanFilters);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getAvailableTravels:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener viajes disponibles"
      });
    }
  }

  // ✅ POST /travels/:id/request - Solicitar unirse a un viaje
  async requestToJoinTravel(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");
      const { pickupLocation } = req.body;

      if (!pickupLocation?.trim()) {
        return res.status(400).json({
          success: false,
          message: "La ubicación de recogida es requerida"
        });
      }

      const result = await travelService.requestToJoinTravel(
        travelId, 
        passengerId, 
        pickupLocation
      );
      
      res.status(201).json(result);

    } catch (error) {
      console.error("Error in requestToJoinTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al solicitar viaje"
      });
    }
  }

  // ✅ PUT /travels/requests/:id/respond - Responder solicitud de viaje
  async respondToTravelRequest(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const requestId = parseInt(req.params.id || "");
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "El campo 'accept' es requerido y debe ser boolean"
        });
      }

      const result = await travelService.respondToTravelRequest(
        requestId, 
        driverId, 
        accept
      );
      
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in respondToTravelRequest:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al responder solicitud"
      });
    }
  }

  // ✅ DELETE /travels/:id - Cancelar viaje
  async cancelTravel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");
      const { reason } = req.body;

      const result = await travelService.cancelTravel(travelId, userId, reason);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in cancelTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al cancelar viaje"
      });
    }
  }

  // ✅ PUT /travels/:id/complete - Finalizar viaje
  async completeTravel(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");

      const result = await travelService.completeTravel(travelId, driverId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in completeTravel:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al finalizar viaje"
      });
    }
  }

  // ✅ GET /travels/:id/requests - Obtener solicitudes de un viaje
  async getTravelRequests(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");

      const result = await travelService.getTravelRequests(travelId, driverId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getTravelRequests:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener solicitudes del viaje"
      });
    }
  }

  // ✅ GET /travels/passenger - Obtener viajes del pasajero
  async getPassengerTravels(req: AuthRequest, res: Response) {
    try {
      const passengerId = req.user?.id;
      if (!passengerId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const result = await travelService.getPassengerTravels(passengerId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getPassengerTravels:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener viajes del pasajero"
      });
    }
  }

  // ✅ DELETE /travels/:id/passengers/:passengerId - Remover pasajero
  async removePassenger(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const travelId = parseInt(req.params.id || "");
      const passengerId = parseInt(req.params.passengerId || "");

      const result = await travelService.removePassenger(
        travelId, 
        passengerId, 
        driverId
      );
      
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in removePassenger:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al remover pasajero"
      });
    }
  }

  // ✅ GET /travels/search - Buscar viajes por ubicación
  async searchTravelsByLocation(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: "El parámetro 'query' es requerido"
        });
      }

      const result = await travelService.searchTravelsByLocation(query);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in searchTravelsByLocation:", error);
      res.status(500).json({
        success: false,
        message: "Error en la búsqueda de viajes"
      });
    }
  }
}