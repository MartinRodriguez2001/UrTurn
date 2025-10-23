
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

export interface UserProfileWithStats extends UserProfile {
  rating?: {
    average: number | null;
    total: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  stats?: {
    asDriver?: {
      totalTrips: number;
      completedTrips: number;
      totalEarnings: number;
      totalPassengersTransported: number;
    };
    asPassenger?: {
      totalRequests: number;
      completedTrips: number;
      totalSpent: number;
    };
  };
  travelHistory?: {
    recent: any[];
    total: number;
  };
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

