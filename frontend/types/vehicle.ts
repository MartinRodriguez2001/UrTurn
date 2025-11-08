export interface Vehicle {
    id: number;
    licence_plate: string
    model: string
    brand: string
    year: number
    validation: boolean
    userId: number
}

export interface VehicleData {
    licence_plate: string
    model: string
    brand: string
    year: number
    validation?: boolean
}

export interface VehicleWithOwner {
    id: number
    license_plate: string
    model: string
    brand: string
    year: number
    validation: boolean
    owener: {
        id: number
        name: string
        institutional_email: string
        phone_number?: string
    }
}

export interface VehicleResponse {
    success: boolean
    message: string
    vehicle?: Vehicle
    vechicles?: Vehicle[]
    count?: number
}

export interface BecomeDriverData extends VehicleData {
    phoneNumber?: string
    licenseNumber?: string
}

export interface VehicleFormData {
    licence_plate: string
    model: string
    brand: string
    year: string
    validation?: boolean
}

export interface HasVehicleResponse {
    success: boolean
    hasVehicles: boolean
    message: string
}