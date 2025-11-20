export interface ReportData {
    usuarioId: number;
    travelId: number;
    description: string;
}
export declare class ReportService {
    createReport(reportData: ReportData): Promise<{
        success: boolean;
        report: {
            travel: {
                start_location: string | null;
                end_location: string | null;
                id: number;
                status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
                driver_id: {
                    id: number;
                    name: string;
                };
            } | null;
            usuario: {
                id: number;
                institutional_email: string;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            description: string;
            travelId: number;
            usuarioId: number;
            date: Date;
        };
        message: string;
    }>;
    getUserReports(userId: number): Promise<{
        success: boolean;
        reports: {
            travel: {
                start_location: string | null;
                end_location: string | null;
                id: number;
                status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
                driver_id: {
                    id: number;
                    name: string;
                };
            } | null;
            id: number;
            description: string;
            travelId: number;
            usuarioId: number;
            date: Date;
        }[];
        count: number;
        message: string;
    }>;
    getTravelById(travelId: number): Promise<({
        driver_id: {
            id: number;
            name: string;
        };
    } & {
        id: number;
        userId: number;
        status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
        start_location_name: string | null;
        start_latitude: number;
        start_longitude: number;
        end_location_name: string | null;
        end_latitude: number;
        end_longitude: number;
        route_waypoints: import("../../generated/prisma/runtime/library.js").JsonValue | null;
        planned_stops: import("../../generated/prisma/runtime/library.js").JsonValue | null;
        capacity: number;
        price: number;
        travel_date: Date;
        start_time: Date;
        end_time: Date | null;
        spaces_available: number;
        carId: number;
    }) | null>;
    getTravelReports(travelId: number): Promise<{
        success: boolean;
        reports: ({
            usuario: {
                id: number;
                institutional_email: string;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
        } & {
            id: number;
            description: string;
            travelId: number;
            usuarioId: number;
            date: Date;
        })[];
        count: number;
        message: string;
    }>;
    getAllReports(): Promise<{
        success: boolean;
        reports: {
            travel: {
                start_location: string | null;
                end_location: string | null;
                id: number;
                status: import("../../generated/prisma/index.js").$Enums.TravelStatus;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
                driver_id: {
                    id: number;
                    institutional_email: string;
                    name: string;
                };
            } | null;
            usuario: {
                id: number;
                institutional_email: string;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            description: string;
            travelId: number;
            usuarioId: number;
            date: Date;
        }[];
        count: number;
        message: string;
    }>;
    deleteReport(reportId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=report.service.d.ts.map