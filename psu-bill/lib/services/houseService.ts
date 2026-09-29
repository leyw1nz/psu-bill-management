import { House, HouseWithMember, BillRecordDisplay, CreateBillPayload } from '@/types';
import { thaiMonths } from "@/lib/utils";

/**
 * House Service
 * Handles all house-related API calls
 */

export interface CreateHouseRequest {
  house_no: string;
  zone_building?: string;
  type?: string;
  fee?: string;
  note?: string;
}

export interface UpdateHouseRequest {
  house_no?: string;
  zone_building?: string;
  type?: string;
  fee?: string;
  note?: string;
  member_id?: string;
}

export interface HouseResponse {
  success: boolean;
  data?: House;
  error?: string;
  message?: string;
}

export interface HousesListResponse {
  success: boolean;
  data?: House[];
  total?: number; // Total count (present when no pagination)
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

class HouseService {
  private baseUrl = '/api/houses';

  // 1. ดึงรายชื่อบ้าน
  async getHouses(): Promise<HouseWithMember[]> {
    try {
      const res = await fetch("/api/houses", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch houses");
      const result = await res.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching houses:", error);
      return [];
    }
  }

  // 2. ดึงประวัติบิล "ค่าไฟ" ล่าสุด
  async getRecentBills(): Promise<BillRecordDisplay[]> {
    try {
      const res = await fetch("/api/bills/house?type=elect", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch elect bills");
      return await res.json();
    } catch (error) {
      console.error("Error fetching elect bills:", error);
      return [];
    }
  }

  // 3. ดึงประวัติบิล "ค่าน้ำ" ล่าสุด
  async getRecentWaterBills(): Promise<BillRecordDisplay[]> {
    try {
      const res = await fetch("/api/bills/house?type=water", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch water bills");
      return await res.json();
    } catch (error) {
      console.error("Error fetching water bills:", error);
      return [];
    }
  }

  // 4. ดึงเลขมิเตอร์ "ไฟ" ครั้งก่อน
  async getPreviousMeter(
    houseId: string,
    month: string,
    year: string
  ): Promise<string> {
    try {
      const monthIndex = thaiMonths.indexOf(month) + 1;
      const res = await fetch(
        `/api/bills/house/${houseId}?meter=elect&month=${monthIndex}&year=${year}`,
        { cache: "no-store" }
      );
      if (!res.ok) return "0";
      const data = await res.json();
      return data.previousMeter || "0";
    } catch (error) {
      console.error("Error fetching previous elect meter:", error);
      return "0";
    }
  }

  // 5. ดึงเลขมิเตอร์ "น้ำ" ครั้งก่อน
  async getPreviousWaterMeter(
    houseId: string,
    month: string,
    year: string
  ): Promise<string> {
    try {
      const monthIndex = thaiMonths.indexOf(month) + 1;
      const res = await fetch(
        `/api/bills/house/${houseId}?meter=water&month=${monthIndex}&year=${year}`,
        { cache: "no-store" }
      );
      if (!res.ok) return "0";
      const data = await res.json();
      return data.previousMeter || "0";
    } catch (error) {
      console.error("Error fetching previous water meter:", error);
      return "0";
    }
  }

  // 6. ดึงบิลที่มีอยู่แล้วสำหรับ house/month/year ที่เลือก
  async getExistingBill(
    houseId: string,
    month: string,
    year: string
  ): Promise<any | null> {
    try {
      const monthIndex = thaiMonths.indexOf(month) + 1;
      const res = await fetch(
        `/api/bills/house/${houseId}?year=${year}&month=${monthIndex}`,
        { cache: "no-store" }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.latestBill || null;
    } catch (error) {
      console.error("Error fetching existing bill:", error);
      return null;
    }
  }

  // 7. บันทึกบิล (ค่าน้ำ/ค่าไฟ)
  async saveBill(payload: CreateBillPayload) {
    const res = await fetch("/api/bills/house", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to save bill");
    }
    return await res.json();
  }

  // 8. ดึงราคาต่อหน่วยไฟฟ้าจาก system_setting
  async getElectricityUnitPrice(): Promise<number> {
    try {
      const res = await fetch("/api/system-settings?code=HOUSE_ELECT_UNIT_PRICE", {
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("Failed to fetch HOUSE_ELECT_UNIT_PRICE, using default value 5");
        return 5;
      }
      const result = await res.json();
      if (result.success && result.data?.value) {
        const price = parseFloat(result.data.value);
        return isNaN(price) ? 5 : price;
      }
      return 5;
    } catch (error) {
      console.error("Error fetching electricity unit price:", error);
      return 5;
    }
  }

  // 9. ดึงราคาต่อหน่วยน้ำจาก system_setting
  async getWaterUnitPrice(): Promise<number> {
    try {
      const res = await fetch("/api/system-settings?code=HOUSE_WATER_UNIT_PRICE", {
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("Failed to fetch HOUSE_WATER_UNIT_PRICE, using default value 24");
        return 24;
      }
      const result = await res.json();
      if (result.success && result.data?.value) {
        const price = parseFloat(result.data.value);
        return isNaN(price) ? 24 : price;
      }
      return 24;
    } catch (error) {
      console.error("Error fetching water unit price:", error);
      return 24;
    }
  }

  /**
   * Get all houses with optional filters and pagination
   * If limit is not specified, returns all records without pagination
   */
  async getAll(params?: {
    zone_building?: string;
    type?: string;
    house_no?: string;
    page?: number;
    limit?: number;
  }): Promise<HousesListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.zone_building) queryParams.append('zone_building', params.zone_building);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.house_no) queryParams.append('house_no', params.house_no);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching houses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch houses',
      };
    }
  }

  /**
   * Get a single house by ID
   */
  async getById(houseId: string): Promise<HouseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${houseId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching house:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch house',
      };
    }
  }

  /**
   * Create a new house
   */
  async create(houseData: CreateHouseRequest): Promise<HouseResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(houseData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating house:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create house',
      };
    }
  }

  /**
   * Update an existing house
   */
  async update(houseId: string, houseData: UpdateHouseRequest): Promise<HouseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${houseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(houseData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating house:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update house',
      };
    }
  }

  /**
   * Delete a house (soft delete)
   */
  async delete(houseId: string): Promise<HouseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${houseId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting house:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete house',
      };
    }
  }
}

// Export singleton instance
export const houseService = new HouseService();

// Export with capitalized name for backward compatibility
export { houseService as HouseService };
