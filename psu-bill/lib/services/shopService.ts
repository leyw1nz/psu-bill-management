import { ShopWithMember, BillRecordDisplay, CreateBillPayload, Shop } from '@/types';
import { thaiMonths } from "@/lib/utils";

/**
 * Shop Service
 * Handles all shop-related API calls
 */

export interface CreateShopRequest {
  shop_no: string;
  location: string;
  elect_account_no?: string;
  water_account_no?: string;
  member_id?: string;
  note?: string;
}

export interface UpdateShopRequest {
  shop_no?: string;
  location?: string;
  elect_account_no?: string;
  water_account_no?: string;
  member_id?: string;
  note?: string;
}

export interface ShopResponse {
  success: boolean;
  data?: ShopWithMember;
  error?: string;
}

export interface ShopsListResponse {
  success: boolean;
  data?: ShopWithMember[];
  error?: string;
}

class ShopService {
  private baseUrl = '/api/shops';

  // 1. ดึงรายชื่อร้านค้า
  async getShops(): Promise<ShopWithMember[]> {
    try {
      const res = await fetch("/api/shops", {
        method: "GET",
        cache: "no-store", // ป้องกันการดึงข้อมูลเก่าจาก Browser Cache
      });

      if (!res.ok) throw new Error("Failed to fetch shops");
      const result = await res.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching shops:", error);
      return [];
    }
  }

  // 2. ดึงประวัติบิล "ค่าไฟ" ล่าสุด
  async getRecentElectBills(): Promise<BillRecordDisplay[]> {
    try {
      const res = await fetch("/api/bills/shop?type=elect", {
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
      const res = await fetch("/api/bills/shop?type=water", {
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
  async getPreviousElectMeter(
    shopId: string,
    month: string,
    year: string
  ): Promise<string> {
    try {
      const monthIndex = thaiMonths.indexOf(month) + 1;
      const res = await fetch(
        `/api/bills/shop/${shopId}?meter=elect&month=${monthIndex}&year=${year}`,
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
    shopId: string,
    month: string,
    year: string
  ): Promise<string> {
    try {
      const monthIndex = thaiMonths.indexOf(month) + 1;
      const res = await fetch(
        `/api/bills/shop/${shopId}?meter=water&month=${monthIndex}&year=${year}`,
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

  // 6. ดึงบิลที่มีอยู่แล้วสำหรับ shop/month/year ที่เลือก
  async getExistingBill(
    shopId: string,
    month: string,
    year: string
  ): Promise<any | null> {
    try {
      const monthIndex = thaiMonths.indexOf(month) + 1;
      const res = await fetch(
        `/api/bills/shop/${shopId}?year=${year}&month=${monthIndex}`,
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
    const res = await fetch("/api/bills/shop", {
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
   * Get all shops with optional filters
   */
  async getAll(params?: {
    location?: string;
    shop_no?: string;
    search?: string;
    status?: string;
  }): Promise<ShopsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.location) queryParams.append('location', params.location);
      if (params?.shop_no) queryParams.append('shop_no', params.shop_no);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status) queryParams.append('status', params.status);

      const url = params ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching shops:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shops',
      };
    }
  }

  /**
   * Get a single shop by ID
   */
  async getById(shopId: string): Promise<ShopResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${shopId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching shop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shop',
      };
    }
  }

  /**
   * Create a new shop
   */
  async create(shopData: CreateShopRequest): Promise<ShopResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating shop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create shop',
      };
    }
  }

  /**
   * Update an existing shop
   */
  async update(shopId: string, shopData: UpdateShopRequest): Promise<ShopResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating shop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update shop',
      };
    }
  }

  /**
   * Delete a shop (soft delete)
   */
  async delete(shopId: string): Promise<ShopResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${shopId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting shop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete shop',
      };
    }
  }

  /**
   * Restore a deleted shop
   */
  async restore(shopId: string): Promise<ShopResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${shopId}`, {
        method: 'PATCH',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error restoring shop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore shop',
      };
    }
  }

  /**
   * Get the next available shop_no
   */
  async getNextShopNo(): Promise<{ success: boolean; data?: { next_shop_no: string; last_shop_no: string | null }; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/next-shop-no`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting next shop_no:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get next shop_no',
      };
    }
  }

  /**
   * Check if shop_no already exists (case-insensitive)
   */
  async checkDuplicateShopNo(shopNo: string, excludeShopId?: string): Promise<{ isDuplicate: boolean; error?: string }> {
    try {
      const response = await this.getAll({ status: 'active' });

      if (!response.success || !response.data) {
        return { isDuplicate: false, error: response.error };
      }

      const shopNoLower = shopNo.trim().toLowerCase();

      // Filter out the current shop if editing and compare case-insensitively
      const duplicates = excludeShopId
        ? response.data.filter(shop =>
            shop.shop_id !== excludeShopId &&
            shop.shop_no?.trim().toLowerCase() === shopNoLower
          )
        : response.data.filter(shop =>
            shop.shop_no?.trim().toLowerCase() === shopNoLower
          );

      return { isDuplicate: duplicates.length > 0 };
    } catch (error) {
      console.error('Error checking duplicate shop_no:', error);
      return {
        isDuplicate: false,
        error: error instanceof Error ? error.message : 'Failed to check duplicate'
      };
    }
  }

}

// Export singleton instance
export const shopService = new ShopService();

// Export with capitalized name for backward compatibility
export { shopService as ShopService };
