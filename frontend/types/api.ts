export interface RegisterData {
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

export type ApiResponse<T extends object = {}> = {
  success: boolean;
  message?: string;
} & T;

export interface AuthData {
  user: {
    id: number;
    name: string;
    institutional_email: string;
    IsDriver: boolean;
    active: boolean;
  };
  token: string;
}
