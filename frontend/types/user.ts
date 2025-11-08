
export interface User {
  id: number;
  name: string;
  institutional_email: string;
  IsDriver: boolean;
  active: boolean;
  phone_number: string;
  profile_picture?: string;
  description?: string;
  created_at: string;
}

export interface UserProfile extends User {
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  description?: string;
  institution_credential: string;
  student_certificate: string;
  IsDriver?: boolean;
  profile_picture?: string;
}

export interface LoginData {
  institutional_email: string;
  password: string;
}

