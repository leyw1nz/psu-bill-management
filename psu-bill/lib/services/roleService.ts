import { Role } from "@/types";

/**
 * Role Service
 * Handles all role-related API calls
 */

export interface RolesListResponse {
  success: boolean;
  data?: Role[];
  error?: string;
}

export interface RoleResponse {
  success: boolean;
  data?: Role;
  error?: string;
}

class RoleService {
  private baseUrl = "/api/roles";

  /**
   * Get all roles
   */
  async getAll(): Promise<RolesListResponse> {
    try {
      const response = await fetch(this.baseUrl);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching roles:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch roles",
      };
    }
  }

  /**
   * Get a single role by ID
   */
  async getById(roleId: number): Promise<RoleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${roleId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching role:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch role",
      };
    }
  }
}

// Export singleton instance
export const roleService = new RoleService();
