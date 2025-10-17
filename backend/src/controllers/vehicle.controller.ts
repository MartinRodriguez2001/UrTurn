import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { VehicleData, VehicleService } from "../services/vehicle.service.js";

const vehicleService = new VehicleService();

export class VehicleController {
  async registerVehicle(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const { licence_plate, model, brand, year } = req.body;

      if (!licence_plate || !model || !brand || !year) {
        res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos: licence_plate, model, brand, year"
        });
        return;
      }

      const plateRegex = /^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/;
      if (!plateRegex.test(licence_plate.toUpperCase())) {
        res.status(400).json({
          success: false,
          message: "Formato de patente inválido. Use formato chileno (ej: AB1234 o ABCD12)"
        });
        return;
      }

      const currentYear = new Date().getFullYear();
      const vehicleYear = parseInt(year);
      if (isNaN(vehicleYear) || vehicleYear < 1990 || vehicleYear > currentYear + 1) {
        res.status(400).json({
          success: false,
          message: `El año debe estar entre 1990 y ${currentYear + 1}`
        });
        return;
      }

      const vehicleData: VehicleData = {
        licence_plate: licence_plate.trim(),
        model: model.trim(),
        brand: brand.trim(),
        year: vehicleYear,
        validation: req.body.validation || false
      };

      const result = await vehicleService.registerVehicle(vehicleData, req.user.id);
      
      res.status(201).json({
        success: true,
        message: "Vehículo registrado exitosamente",
        data: result,
      });
    } catch (error) {
      console.error('Error en registerVehicle controller:', error);
      
      if (error instanceof Error && error.message.includes('ya está registrado')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor al registrar vehículo",
      });
    }
  }

  async getUserVehicles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const result = await vehicleService.getUserVehicles(req.user.id);
   
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error en getUserVehicles controller:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor al obtener vehículos",
      });
    }
  }

  async getVehicleById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const vehicleId = parseInt(req.params.id || "");

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      if (isNaN(vehicleId)) {
        res.status(400).json({
          success: false,
          message: "ID de vehículo inválido",
        });
        return;
      }

      const result = await vehicleService.getVehicleById(vehicleId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error en getVehicleById controller:', error);
      
      if (error instanceof Error && (error.message.includes('no encontrado') || error.message.includes('no autorizado'))) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor al obtener vehículo",
      });
    }
  }

  async updateVehicle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const vehicleId = parseInt(req.params.id || "");

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      if (isNaN(vehicleId)) {
        res.status(400).json({
          success: false,
          message: "ID de vehículo inválido",
        });
        return;
      }

      const { licence_plate, model, brand, year } = req.body;

      // Validar campos si se proporcionan
      if (licence_plate) {
        const plateRegex = /^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/;
        if (!plateRegex.test(licence_plate.toUpperCase())) {
          res.status(400).json({
            success: false,
            message: "Formato de patente inválido"
          });
          return;
        }
      }

      if (year) {
        const currentYear = new Date().getFullYear();
        const vehicleYear = parseInt(year);
        if (isNaN(vehicleYear) || vehicleYear < 1990 || vehicleYear > currentYear + 1) {
          res.status(400).json({
            success: false,
            message: `El año debe estar entre 1990 y ${currentYear + 1}`
          });
          return;
        }
      }

      const updateData: Partial<VehicleData> = {};
      if (licence_plate) updateData.licence_plate = licence_plate.trim();
      if (model) updateData.model = model.trim();
      if (brand) updateData.brand = brand.trim();
      if (year) updateData.year = parseInt(year);

      const result = await vehicleService.updateVehicle(vehicleId, userId, updateData);

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {
      console.error('Error en updateVehicle controller:', error);
      
      if (error instanceof Error && error.message.includes('no encontrado')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('ya existe')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar el vehículo",
      });
    }
  }

  async deleteVehicle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const vehicleId = parseInt(req.params.id || "");

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      if (isNaN(vehicleId)) {
        res.status(400).json({
          success: false,
          message: "ID de vehículo inválido",
        });
        return;
      }

      const result = await vehicleService.deleteVehicle(vehicleId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {
      console.error('Error en deleteVehicle controller:', error);
      
      if (error instanceof Error && error.message.includes('no encontrado')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error instanceof Error && error.message.includes('viajes activos')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar el vehículo",
      });
    }
  }

  async checkUserHasVehicles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const hasVehicles = await vehicleService.hasVehicles(userId);

      res.status(200).json({
        success: true,
        hasVehicles,
        message: hasVehicles ? "El usuario tiene vehículos" : "El usuario no tiene vehículos"
      });

    } catch (error) {
      console.error('Error en checkUserHasVehicles controller:', error);
      
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}