import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export interface VehicleData {
  licence_plate: string;
  model: string;
  brand: string;
  year: number;
  validation?: boolean;
}

export class VehicleService {
  async forceValidateVehicle(vehicleId: number, userId?: number) {
    try {
      const whereClause: any = { id: vehicleId };

      if (userId) {
        whereClause.userId = userId;
      }

      const vehicle = await prisma.vehicle.findFirst({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
            },
          },
        },
      });

      if (!vehicle) {
        throw new Error(
          "Vehículo no encontrado o no tienes permisos para modificarlo"
        );
      }

      if (vehicle.validation) {
        return {
          success: true,
          vehicle,
          message: "El vehículo ya estaba validado",
          wasAlreadyValidated: true,
        };
      }

      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { validation: true },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: vehicle.userId },
        data: { IsDriver: true },
      });

      return {
        success: true,
        vehicle: updatedVehicle,
        message: "Vehiculo validado exitosamente",
        wasAlreadyValidated: false,
      };
    } catch (error) {
      console.error("Error en forceValidateVehicle:", error);
    }
  }
  async forceInvalidateVehicle(vehicleId: number, userId?: number) {
    try {
      // Construir condición WHERE
      const whereClause: any = { id: vehicleId };

      if (userId) {
        whereClause.userId = userId;
      }

      // Verificar que el vehículo existe
      const vehicle = await prisma.vehicle.findFirst({
        where: whereClause,
        include: {
          owner: true,
        },
      });

      if (!vehicle) {
        throw new Error(
          userId
            ? "Vehículo no encontrado o no tienes permisos para invalidarlo"
            : "Vehículo no encontrado"
        );
      }

      // Invalidar el vehículo
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { validation: false },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
            },
          },
        },
      });

      // Verificar si el usuario tiene otros vehículos validados
      const validatedVehicles = await prisma.vehicle.count({
        where: {
          userId: vehicle.userId,
          validation: true,
        },
      });

      // Si no tiene otros vehículos validados, quitar IsDriver
      if (validatedVehicles === 0) {
        await prisma.user.update({
          where: { id: vehicle.userId },
          data: { IsDriver: false },
        });
      }

      return {
        success: true,
        vehicle: updatedVehicle,
        message: "Vehículo invalidado",
        userStillDriver: validatedVehicles > 0,
      };
    } catch (error) {
      console.error("Error en forceInvalidateVehicle:", error);
      throw error;
    }
  }

  async registerVehicle(vehicleData: VehicleData, userId: number) {
    try {
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          licence_plate: vehicleData.licence_plate.toUpperCase(),
        },
      });

      if (existingVehicle) {
        throw new Error("El vehículo con esta patente ya está registrado.");
      }

      // Crear el vehículo
      const vehicle = await prisma.vehicle.create({
        data: {
          userId: userId,
          licence_plate: vehicleData.licence_plate.toUpperCase(),
          model: vehicleData.model,
          brand: vehicleData.brand,
          year: vehicleData.year,
          validation: vehicleData.validation || false,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { IsDriver: true },
      });

      return {
        success: true,
        vehicle,
        message: "Vehículo registrado exitosamente",
      };
    } catch (error) {
      console.error("Error en registerVehicle:", error);
      throw error;
    }
  }

  async getUserVehicles(userId: number) {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: {
          userId: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              phone_number: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      });

      return {
        success: true,
        vehicles,
        count: vehicles.length,
        message:
          vehicles.length > 0
            ? "Vehículos encontrados"
            : "No se encontraron vehículos",
      };
    } catch (error) {
      console.error("Error en getUserVehicles:", error);
      throw new Error("Error al obtener los vehículos del usuario");
    }
  }

  async getVehicleById(vehicleId: number, userId: number) {
    try {
      const whereClause: any = {
        id: vehicleId,
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const vehicle = await prisma.vehicle.findFirst({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              phone_number: true,
            },
          },
        },
      });

      if (!vehicle) {
        throw new Error(
          "Vehículo no encontrado o no tienes permisos para acceder a él"
        );
      }

      return {
        success: true,
        vehicle,
        message: "Vehículo encontrado",
      };
    } catch (error) {
      console.error("Error en getVehicleById:", error);
      throw error;
    }
  }

  async hasVehicles(userId: number): Promise<boolean> {
    try {
      const count = await prisma.vehicle.count({
        where: {
          userId: userId,
        },
      });

      return count > 0;
    } catch (error) {
      console.error("Error en hasVehicles:", error);
      return false;
    }
  }

  async updateVehicle(
    vehicleId: number,
    userId: number,
    updateData: Partial<VehicleData>
  ) {
    try {
      // Verificar que el vehículo pertenece al usuario
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: userId,
        },
      });

      if (!existingVehicle) {
        throw new Error(
          "Vehículo no encontrado o no tienes permisos para modificarlo"
        );
      }

      // Si se actualiza la patente, verificar que no exista otra igual
      if (
        updateData.licence_plate &&
        updateData.licence_plate !== existingVehicle.licence_plate
      ) {
        const plateExists = await prisma.vehicle.findFirst({
          where: {
            licence_plate: updateData.licence_plate.toUpperCase(),
            id: { not: vehicleId },
          },
        });

        if (plateExists) {
          throw new Error("Ya existe un vehículo registrado con esa patente");
        }
      }

      // Preparar datos para actualización
      const updateFields: any = {};
      if (updateData.licence_plate)
        updateFields.licence_plate = updateData.licence_plate.toUpperCase();
      if (updateData.model) updateFields.model = updateData.model;
      if (updateData.brand) updateFields.brand = updateData.brand;
      if (updateData.year) updateFields.year = updateData.year;
      if (updateData.validation !== undefined)
        updateFields.validation = updateData.validation;

      const updatedVehicle = await prisma.vehicle.update({
        where: {
          id: vehicleId,
        },
        data: updateFields,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              institutional_email: true,
              phone_number: true,
            },
          },
        },
      });

      return {
        success: true,
        vehicle: updatedVehicle,
        message: "Vehículo actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error en updateVehicle:", error);
      throw error;
    }
  }

  async deleteVehicle(vehicleId: number, userId: number) {
    try {
      // Verificar que el vehículo pertenece al usuario
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: userId,
        },
      });

      if (!existingVehicle) {
        throw new Error(
          "Vehículo no encontrado o no tienes permisos para eliminarlo"
        );
      }

      // Verificar si hay viajes activos con este vehículo
      // (Por ahora comentado ya que no tenemos la tabla Travel implementada completamente)
      /*
      const activeRides = await prisma.travel.findFirst({
        where: {
          carId: vehicleId,
          status: {
            in: ['pendiente', 'confirmado']
          }
        }
      });

      if (activeRides) {
        throw new Error('No puedes eliminar el vehículo mientras tengas viajes activos');
      }
      */

      await prisma.vehicle.delete({
        where: {
          id: vehicleId,
        },
      });

      // Verificar si el usuario tiene otros vehículos
      const remainingVehicles = await prisma.vehicle.findMany({
        where: {
          userId: userId,
        },
      });

      // Si no tiene más vehículos, actualizar IsDriver a false
      if (remainingVehicles.length === 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { IsDriver: false },
        });
      }

      return {
        success: true,
        message: "Vehículo eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error en deleteVehicle:", error);
      throw error;
    }
  }
}
