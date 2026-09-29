import { Member } from "@/types";

/**
 * Member Service
 * Handles all member-related API calls
 */

export interface CreateMemberRequest {
  citizen_id?: string;
  staff_id?: string;
  email: string;
  title?: string;
  name: string;
  surname: string;
  phone?: string;
  username?: string;
  role_id: number;
  password?: string;
}

export interface UpdateMemberRequest {
  username: string;
  citizen_id?: string;
  email: string;
  title?: string;
  name: string;
  surname: string;
  phone?: string;
  role_id: number;
  password?: string;
}

export interface MemberResponse {
  success: boolean;
  data?: Member;
  error?: string;
}

export interface MembersListResponse {
  success: boolean;
  data?: Member[];
  error?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  data?: {
    password: string;
  };
  error?: string;
}

class MemberService {
  private baseUrl = "/api/members";

  /**
   * Get all members with optional filters
   */
  async getAll(params?: {
    role_id?: string;
    search?: string;
    email?: string;
    status?: string;
  }): Promise<MembersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.role_id) queryParams.append("role_id", params.role_id);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.email) queryParams.append("email", params.email);
      if (params?.status) queryParams.append("status", params.status);

      const url = params
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching members:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch members",
      };
    }
  }

  /**
   * Get a single member by ID
   */
  async getById(memberId: string): Promise<MemberResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching member:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch member",
      };
    }
  }

  /**
   * Create a new member
   */
  async create(memberData: CreateMemberRequest): Promise<MemberResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating member:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create member",
      };
    }
  }

  /**
   * Update an existing member
   */
  async update(
    memberId: string,
    memberData: UpdateMemberRequest
  ): Promise<MemberResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating member:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update member",
      };
    }
  }

  /**
   * Delete a member (soft delete)
   */
  async delete(memberId: string): Promise<MemberResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error deleting member:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete member",
      };
    }
  }

  /**
   * Reset member password
   */
  async resetPassword(memberId: string): Promise<PasswordResetResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}/password`, {
        method: "POST",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to reset password",
      };
    }
  }

  /**
   * Restore a deleted member
   */
  async restore(memberId: string): Promise<MemberResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${memberId}`, {
        method: "PATCH",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error restoring member:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to restore member",
      };
    }
  }

  /**
   * Get the next available member_id for username generation
   */
  async getNextMemberId(): Promise<{ success: boolean; data?: { next_member_id: string; padded_username: string }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/next-member-id`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting next member_id:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get next member_id',
      };
    }
  }
}

// Export singleton instance
export const memberService = new MemberService();
