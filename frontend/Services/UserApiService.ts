import { ApiResponse, RegisterData } from "@/api";
import { User, UserProfile } from "@/types/user";
import BaseApiService from "./BaseApiService";

class UserApiService extends BaseApiService {
  async getAllUsers(): Promise<ApiResponse<{ data?: User[] }>> {
    return this.makeRequest<{ data?: User[] }>('/users');
  }


  async getUserById(id: number): Promise<ApiResponse<{ data?: User }>> {
    return this.makeRequest<{ data?: User }>(`/users/${id}`);
  }


  async getProfile(): Promise<ApiResponse<{ data?: UserProfile }>> {
    return this.makeRequest<{ data?: UserProfile }>('/users/profile');
  }


  async updateUser(id: number, userData: Partial<RegisterData>): Promise<ApiResponse<{ data?: User }>> {
    return this.makeRequest<{ data?: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.makeRequest('/users/me', {
      method: 'DELETE',
    });
  }

  async searchUsers(query: string): Promise<ApiResponse<{ data?: User[] }>> {
    const users = await this.getAllUsers();
    
    if (users.success && users.data) {
      const filteredUsers = users.data.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.institutional_email.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        success: true,
        message: 'Búsqueda completada',
        data: filteredUsers
      };
    }
    
    return users;
  }
  async getUsersByType(isDriver: boolean): Promise<ApiResponse<{ data?: User[] }>> {
    const users = await this.getAllUsers();
    
    if (users.success && users.data) {
      const filteredUsers = users.data.filter(user => user.IsDriver === isDriver);
      
      return {
        success: true,
        message: `${isDriver ? 'Conductores' : 'Pasajeros'} obtenidos`,
        data: filteredUsers
      };
    }
    
    return users;
  }
}

export const userApi = new UserApiService();
export default UserApiService;
