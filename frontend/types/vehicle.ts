export interface Vehicle {
    id: number;
    license_plate: string
    model: string
    brand: string
    year: number
    validation: boolean
    userId: number
}

export interface VehicleData {
    license_plate: string
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