export interface RegisterRequest {
    name: string;
    institutional_email: string;
    password: string;
    institution_credential: string;
    student_certificate: string;
    phone_number: string;
    IsDriver?: boolean;
    profile_picture?: string;
    description?: string;
}
export interface LoginRequest {
    institutional_email: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: number;
        name: string;
        institutional_email: string;
        IsDriver: boolean;
        active: boolean;
    };
    token: string;
}
export interface JwtPayload {
    userId: number;
    email: string;
}
//# sourceMappingURL=Auth.d.ts.map