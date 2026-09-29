import type {
  ApiResponse,
  ShopBill,
  ShopBillLatestData,
  UploadSlipPayload,
  UploadSlipResult,
  ShopBillHistoryData,
} from "@/types";

export class ShopBillService {
  private static async parseJson<T>(res: Response): Promise<ApiResponse<T>> {
    const raw = await res.text();
    let json: any = null;

    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (json && typeof json.success === "boolean") {
      return json as ApiResponse<T>;
    }

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `HTTP ${res.status}`,
        message: json?.message,
      };
    }

    return {
      success: true,
      data: json as T,
      message: json?.message,
    };
  }

  static async getLatest(shopId: number | string, year: string, month: string) {
    const res = await fetch(
      `/api/bills/shop/${shopId}?year=${year}&month=${month}`,
      {
        cache: "no-store",
      }
    );
    return this.parseJson<ShopBillLatestData>(res);
  }

  static async getUnpaid(shopId: number | string) {
    const res = await fetch(`/api/bills/shop/${shopId}/unpaid`, {
      cache: "no-store",
    });
    return this.parseJson<ShopBill[]>(res);
  }

  // ✅ ใหม่: ดึงประวัติทั้งหมด
  static async getHistoryAll(shopId: number | string) {
    const res = await fetch(`/api/bills/shop/${shopId}?all=true`, {
      cache: "no-store",
    });
    return this.parseJson<ShopBillHistoryData>(res);
  }

  static async uploadSlip(payload: UploadSlipPayload) {
    const fd = new FormData();
    fd.append("bill_id", String(payload.billId));
    fd.append("bill_kind", payload.billKind);

    const ext = payload.file.name.split(".").pop() || "jpg";
    const newFileName = `slip-${payload.billId}-${Date.now()}.${ext}`;
    const renamedFile = new File([payload.file], newFileName, {
      type: payload.file.type,
    });

    fd.append("slip", renamedFile);

    const res = await fetch(`/api/bills/shop/upload-slip`, {
      method: "POST",
      body: fd,
    });

    return this.parseJson<UploadSlipResult>(res);
  }
}
