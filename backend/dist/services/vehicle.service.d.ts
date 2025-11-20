export interface VehicleData {
    licence_plate: string;
    model: string;
    brand: string;
    year: number;
    validation?: boolean;
}
export declare class VehicleService {
    forceValidateVehicle(vehicleId: number, userId?: number): Promise<{
        success: boolean;
        vehicle: {
            owner: {
                id: number;
                institutional_email: string;
                name: string;
            };
        } & {
            year: number;
            id: number;
            licence_plate: string;
            model: string;
            brand: string;
            validation: boolean;
            userId: number;
        };
        message: string;
        wasAlreadyValidated: boolean;
    } | undefined>;
    forceInvalidateVehicle(vehicleId: number, userId?: number): Promise<{
        success: boolean;
        vehicle: {
            owner: {
                id: number;
                institutional_email: string;
                name: string;
            };
        } & {
            year: number;
            id: number;
            licence_plate: string;
            model: string;
            brand: string;
            validation: boolean;
            userId: number;
        };
        message: string;
        userStillDriver: boolean;
    }>;
    registerVehicle(vehicleData: VehicleData, userId: number): Promise<{
        success: boolean;
        vehicle: {
            owner: {
                id: number;
                institutional_email: string;
                name: string;
            };
        } & {
            year: number;
            id: number;
            licence_plate: string;
            model: string;
            brand: string;
            validation: boolean;
            userId: number;
        };
        message: string;
    }>;
    getUserVehicles(userId: number): Promise<{
        success: boolean;
        vehicles: ({
            owner: {
                id: number;
                institutional_email: string;
                name: string;
                phone_number: string;
            };
        } & {
            year: number;
            id: number;
            licence_plate: string;
            model: string;
            brand: string;
            validation: boolean;
            userId: number;
        })[];
        count: number;
        message: string;
    }>;
    getVehicleById(vehicleId: number, userId: number): Promise<{
        success: boolean;
        vehicle: {
            owner: {
                id: number;
                institutional_email: string;
                name: string;
                phone_number: string;
            };
        } & {
            year: number;
            id: number;
            licence_plate: string;
            model: string;
            brand: string;
            validation: boolean;
            userId: number;
        };
        message: string;
    }>;
    hasVehicles(userId: number): Promise<boolean>;
    updateVehicle(vehicleId: number, userId: number, updateData: Partial<VehicleData>): Promise<{
        success: boolean;
        vehicle: {
            owner: {
                id: number;
                institutional_email: string;
                name: string;
                phone_number: string;
            };
        } & {
            year: number;
            id: number;
            licence_plate: string;
            model: string;
            brand: string;
            validation: boolean;
            userId: number;
        };
        message: string;
    }>;
    deleteVehicle(vehicleId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=vehicle.service.d.ts.map