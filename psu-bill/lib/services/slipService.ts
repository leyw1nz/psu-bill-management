// @/lib/services/slipService.ts
import type {
  AdminSlipRow,
  SlipDecisionAction,
  SlipKind,
  SlipStatusFilter,
  ApiResponse,
  SlipDecisionBody,
} from "@/types";

type DecidePayloadLoose =
  | SlipDecisionBody
  | {
      billId?: number | string;
      bill_id?: number | string;
      id?: number | string;

      kind?: SlipKind | string;
      billKind?: SlipKind | string;
      bill_kind?: SlipKind | string;

      action?: SlipDecisionAction | string;
      decision?: SlipDecisionAction | string;
      status?: SlipDecisionAction | string;
    };

export class SlipService {
  private static SLIPS_LIST_ENDPOINTS = ["/api/admin/slips", "/api/slips"];
  private static SLIPS_DECISION_ENDPOINTS = ["/api/admin/slips/decision", "/api/slips/decision"];

  private static normalizeKind(k: any): SlipKind {
    const s = String(k || "").toUpperCase().trim();
    if (s === "ELECT") return "ELECT";
    if (s === "WATER") return "WATER";
    throw new Error("ข้อมูลไม่ครบถ้วน: kind ต้องเป็น ELECT หรือ WATER");
  }

  private static normalizeAction(a: any): SlipDecisionAction {
    const s = String(a || "").toLowerCase().trim();
    if (s === "approve") return "approve";
    if (s === "deny") return "deny";
    throw new Error("ข้อมูลไม่ครบถ้วน: action ต้องเป็น approve หรือ deny");
  }

  private static normalizeBillId(v: any): number {
    const n = Number(v);
    if (!n || Number.isNaN(n)) throw new Error("ข้อมูลไม่ครบถ้วน: billId ไม่ถูกต้อง");
    return n;
  }

  private static async safeReadError(res: Response): Promise<string> {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = (await res.json()) as any;
        return j?.message || j?.error || JSON.stringify(j);
      }
      const t = await res.text();
      return (t || "").slice(0, 300);
    } catch {
      return "";
    }
  }

  private static async fetchFirstOk(urlCandidates: string[], init?: RequestInit) {
    let lastStatus = 0;
    let lastErr = "";

    for (const url of urlCandidates) {
      const res = await fetch(url, init);

      if (res.ok) return res;

      lastStatus = res.status;
      lastErr = await this.safeReadError(res);

      if (res.status !== 404) {
        throw new Error(`API Error: ${res.status}${lastErr ? ` - ${lastErr}` : ""}`);
      }
    }

    throw new Error(`API Not Found (tried: ${urlCandidates.join(", ")})`);
  }

  static async getAdminSlips(params?: {
    q?: string;
    status?: SlipStatusFilter;
    kind?: SlipKind | "ALL";
  }): Promise<AdminSlipRow[]> {
    const sp = new URLSearchParams();
    sp.set("q", params?.q ?? "");
    sp.set("status", params?.status ?? "all");
    sp.set("kind", params?.kind ?? "ALL");

    const urls = this.SLIPS_LIST_ENDPOINTS.map((base) => `${base}?${sp.toString()}`);

    const res = await this.fetchFirstOk(urls, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = (await res.json()) as ApiResponse<AdminSlipRow[]>;
    if (!json.success) throw new Error(json.message || json.error || "โหลดข้อมูลไม่สำเร็จ");
    return json.data ?? [];
  }

  static async decideSlip(body: DecidePayloadLoose): Promise<{ success: true }> {
    const billId = this.normalizeBillId((body as any).billId ?? (body as any).bill_id ?? (body as any).id);
    const kind = this.normalizeKind((body as any).kind ?? (body as any).billKind ?? (body as any).bill_kind);
    const action = this.normalizeAction((body as any).action ?? (body as any).decision ?? (body as any).status);

    const payload: SlipDecisionBody = { billId, kind, action };

    const res = await this.fetchFirstOk(this.SLIPS_DECISION_ENDPOINTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as ApiResponse<any>;
    if (json && !json.success) throw new Error(json.message || json.error || "ทำรายการไม่สำเร็จ");
    return { success: true };
  }

  static async changeStatus(params: {
    billId: number;
    kind: SlipKind;
    statusId: number;
  }): Promise<{ success: true }> {
    const billId = this.normalizeBillId(params.billId);
    const kind = this.normalizeKind(params.kind);
    const statusId = Number(params.statusId);

    if (![1, 2, 3, 4].includes(statusId)) {
      throw new Error("statusId ต้องเป็น 1, 2, 3, หรือ 4");
    }

    const res = await fetch("/api/slips/change-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billId, kind, statusId }),
    });

    if (!res.ok) {
      const errorText = await this.safeReadError(res);
      throw new Error(`API Error: ${res.status}${errorText ? ` - ${errorText}` : ""}`);
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (json && !json.success) throw new Error(json.message || json.error || "ทำรายการไม่สำเร็จ");
    return { success: true };
  }
}
