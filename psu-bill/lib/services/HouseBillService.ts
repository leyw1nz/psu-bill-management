// src/lib/services/HouseBillService.ts
import type {
  ApiResponse,
  HouseBillLatestData,
  HouseBillHistoryData,
} from "@/types";

export class HouseBillService {
  static async getLatest(
    houseId: string,
    year: string,
    month: string
  ): Promise<ApiResponse<HouseBillLatestData>> {
    try {
      const res = await fetch(
        `/api/bills/house/${houseId}?year=${encodeURIComponent(
          year
        )}&month=${encodeURIComponent(month)}`,
        { method: "GET", cache: "no-store" }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${res.status}`,
          message: json?.message,
        };
      }

      if (!json?.success) {
        return {
          success: false,
          error: json?.error || "โหลดข้อมูลไม่สำเร็จ",
          message: json?.message,
        };
      }

      return {
        success: true,
        data: {
          house: json.data.house,
          latestBill: json.data.latestBill ?? null,
        },
        message: json?.message,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || "Network error",
      };
    }
  }

  static async getHistoryAll(
    houseId: string
  ): Promise<ApiResponse<HouseBillHistoryData>> {
    try {
      const res = await fetch(`/api/bills/house/${houseId}?all=true`, {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          error: json?.error || `HTTP ${res.status}`,
          message: json?.message,
        };
      }

      if (!json?.success) {
        return {
          success: false,
          error: json?.error || "โหลดข้อมูลไม่สำเร็จ",
          message: json?.message,
        };
      }

      return {
        success: true,
        data: {
          house: json.data.house,
          bills: json.data.bills ?? [],
        },
        message: json?.message,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || "Network error",
      };
    }
  }
}
