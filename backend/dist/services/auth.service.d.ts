import { AuthResponse, LoginRequest, RegisterRequest } from '../types/Auth.js';
export declare class UserService {
    register(userData: RegisterRequest): Promise<AuthResponse>;
    login(credentials: LoginRequest): Promise<AuthResponse>;
    getAllUsers(): Promise<{
        id: number;
        institutional_email: string;
        name: string;
        IsDriver: boolean;
        phone_number: string;
        active: boolean;
        profile_picture: Uint8Array<ArrayBufferLike> | null;
        description: string | null;
        created_at: Date;
    }[]>;
    getUserById(id: number): Promise<{
        id: number;
        institutional_email: string;
        name: string;
        IsDriver: boolean;
        phone_number: string;
        active: boolean;
        profile_picture: Uint8Array<ArrayBufferLike> | null;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    } | null>;
    updateUser(id: number, data: Partial<RegisterRequest>): Promise<{
        id: number;
        institutional_email: string;
        name: string;
        password_hash: string;
        institution_credential: string;
        student_certificate: string;
        IsDriver: boolean;
        phone_number: string;
        active: boolean;
        profile_picture: Uint8Array | null;
        profile_picture_mime: string | null;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        expo_push_token: string | null;
        notifications_enabled: boolean;
        chat_notifications_enabled: boolean;
        travel_notifications_enabled: boolean;
        quiet_hours_enabled: boolean;
        quiet_hours_start: string | null;
        quiet_hours_end: string | null;
        last_active_at: Date;
    }>;
    deleteUser(id: number): Promise<{
        id: number;
        institutional_email: string;
        name: string;
        password_hash: string;
        institution_credential: string;
        student_certificate: string;
        IsDriver: boolean;
        phone_number: string;
        active: boolean;
        profile_picture: Uint8Array | null;
        profile_picture_mime: string | null;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        expo_push_token: string | null;
        notifications_enabled: boolean;
        chat_notifications_enabled: boolean;
        travel_notifications_enabled: boolean;
        quiet_hours_enabled: boolean;
        quiet_hours_start: string | null;
        quiet_hours_end: string | null;
        last_active_at: Date;
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        institutional_email: string;
        name: string;
        IsDriver: boolean;
        phone_number: string;
        active: boolean;
        profile_picture: Uint8Array<ArrayBufferLike> | null;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    } | null>;
}
//# sourceMappingURL=auth.service.d.ts.map