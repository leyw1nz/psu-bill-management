// @/types/index.ts
import type { ReactNode } from "react";

// ===== User & Authentication =====
export interface Address {
  houseNumber?: string;
  building?: string;
  floor?: string;
  room?: string;
  zone?: string;
  shopNumber?: string;
}

export interface MeterNumber {
  water: string;
  electricity: string;
}

export interface User {
  member_id: string;
  citizen_id?: string | null;
  staff_id?: string | null;
  email?: string | null;
  title?: string | null;
  name?: string | null;
  surname?: string | null;
  phone?: string | null;
  username?: string | null;
  password?: string | null;
  role_id?: number | null;
  role?: Role | null;
  create_date?: Date | null;
  modify_date?: Date | null;
  delete_date?: Date | null;

  // Computed/mapped fields for backward compatibility
  id?: string; // Alias for member_id
  firstName?: string; // Alias for name
  lastName?: string; // Alias for surname
  phoneNumber?: string; // Alias for phone
  createdAt?: string; // Alias for create_date
  updatedAt?: string; // Alias for modify_date

  // Legacy fields - kept for backward compatibility
  businessName?: string;
  businessType?: string;
  address?: Address;
  meterNumber?: MeterNumber;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// ==========================================
// 2. Database Models (Prisma Mapped)
// ==========================================
export interface Role {
  role_id: number;
  role_name: string | null;
  note: string | null;
}

export interface Member {
  member_id: string;
  citizen_id?: string | null;
  staff_id?: string | null;
  email?: string | null;
  title?: string | null;
  name?: string | null;
  surname?: string | null;
  phone?: string | null;
  username?: string | null;
  password?: string | null;
  role_id?: number | null;
  role?: Role | null;
  delete_date?: Date | null;
  faculty_id?: string | null;
  faculty_name?: string | null;
  // เพิ่ม field ที่อาจจะ Join มา
  businessName?: string | null;
}

// --- House Models ---
export interface House {
  house_id: string;
  house_no?: string | null;
  zone_building?: string | null;
  type?: string | null;
  fee?: string | null;
  create_date?: Date | null;
  modify_date?: Date | null;
  delete_date?: Date | null;
  note?: string | null;
  temp_staff_id?: string | null;
  temp_citizen_id?: string | null;
  member_id?: string | null;
  member_id_history?: string | null;
}

export interface HouseWithMember extends House {
  member?: Member;
}

// --- Shop Models ---
export interface Shop {
  shop_id: string;
  shop_no?: string | null;
  location?: string | null;
  elect_account_no?: string | null;
  water_account_no?: string | null;
  create_date?: Date | null;
  modify_date?: Date | null;
  delete_date?: Date | null;
  note?: string | null;
  member_id?: string | null;
  member_id_history?: string | null;
}

export interface ShopWithMember extends Shop {
  member?: Member;
}

// ==========================================
// 3. Bill & Record Models (Universal)
// ==========================================

// ✅ Universal Bill Record Display
// ใช้แสดงผลในตาราง ทั้งหน้าบ้านและหน้าร้านค้า (แก้ปัญหา r.shop, r.businessName แดง)
export interface BillRecordDisplay {
  bill_id: string;
  year: string;
  month: string; // ค่าจาก DB (เช่น "1", "มกราคม")
  displayMonth?: string; // ค่าที่แปลงแล้ว (ถ้า API ส่งมา)

  // --- ข้อมูลไฟฟ้า ---
  elect_unit_previous?: string;
  elect_unit_current?: string;
  elect_unit_diff?: number;
  elect_amount?: number;
  elect_record_date?: string | null;

  // --- ข้อมูลน้ำประปา ---
  water_unit_previous?: string;
  water_unit_current?: string;
  water_unit_diff?: number;
  water_amount?: number;
  water_record_date?: string | null;

  // --- ความสัมพันธ์ (Optional เพราะบางบิลเป็นของบ้าน บางบิลเป็นของร้าน) ---
  house?: {
    house_no: string | null;
    zone_building: string | null;
  };

  shop?: {
    shop_no: string | null;
    location: string | null;
  };

  member: {
    name: string | null;
    surname: string | null;
    businessName?: string | null; // ✅ เพิ่มตรงนี้เพื่อให้รองรับร้านค้า
  };

  note?: string; // เผื่อใช้ debug
}

// ✅ Payload สำหรับการบันทึก (POST)
// ใช้ร่วมกันได้ทั้ง House และ Shop (ส่ง ID ตัวใดตัวหนึ่ง)
export interface CreateBillPayload {
  // Identify Target
  house_id?: string;
  shop_id?: string;

  month: string;
  year: string;

  // Electricity Data
  elect_unit_previous?: string;
  elect_unit_current?: string;
  elect_unit_diff?: string;
  elect_amount?: string;

  // Water Data
  water_unit_previous?: string;
  water_unit_current?: string;
  water_unit_diff?: string;
  water_amount?: string;

  // Amount Edit Tracking
  amount_edited?: boolean;
}

// (Optional) Type ดั้งเดิม ถ้ายังมีการใช้อยู่ในจุดอื่น
export interface Bill {
  id: string;
  userId: string;
  type: "water" | "electricity";
  amount: number;
  month: number;
  year: number;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseBill {
  bill_id: string;
  house_id?: string;
  year: number;
  month: number;

  elect_unit_previous: string;
  elect_unit_current: string;
  elect_unit_diff: number;
  elect_amount: string;

  water_unit_previous: string;
  water_unit_current: string;
  water_unit_diff: string;
  water_amount: string;
}

export interface ShopBill {
  bill_id: number;
  shop_id?: string;
  year: number;
  month: number;

  elect_unit_previous: number;
  elect_unit_current: number;
  elect_unit_diff: number;
  elect_amount: number;

  water_unit_previous: number;
  water_unit_current: number;
  water_unit_diff: number;
  water_amount: number;

  elect_pay_status_id?: number;
  water_pay_status_id?: number;
  elect_pay_slip_image?: string;
  water_pay_slip_image?: string;
}

// ===== Admin Models =====
export interface SlipRecord {
  id: number;
  shopId: string;
  shopName: string;
  zone: string;
  month: string;
  amount: string;
  submitDate: string;
  status: "รอพิจารณา" | "ผ่านการตรวจสอบ" | "ไม่ผ่านการตรวจสอบ";
  slipImage: string;
}

export interface MemberFilters {
  role_id: string;
  searchText: string;
  email: string;
  status: 'active' | 'deleted' | 'all';
  memberType: 'all' | 'staff' | 'external';
}

// ===== Component Props & UI =====
export interface MainLayoutProps {
  children: ReactNode;
  IsMobile?: boolean;
}

export interface HouseInfoCardProps {
  user: Omit<User, "password">;
}

export interface ShopInfoCardProps {
  user?: Omit<User, "password">;
  shop?: Shop;
  mode?: "default" | "pending";
  totalUnpaidAmount?: number;
}

export interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

// ===== PSU Open API Models =====
export interface StaffDetails {
  // Staff Identification
  staffId?: string;
  username?: string;
  staffEmail?: string;

  // Thai Name
  titleNameThai?: string;
  staffNameThai?: string;
  staffSnameThai?: string;

  // English Name
  titleNameEng?: string;
  titleShortEng?: string;
  staffNameEng?: string;
  staffSnameEng?: string;

  // Campus Information
  campId?: string;
  campNameThai?: string;

  // Faculty/Department Information
  facId?: string;
  facNameThai?: string;
  deptId?: string;
  deptNameThai?: string;

  // Staff Type and Position
  staffTypeName?: string;
  staffType?: string;
  staffDepart?: string;
  posId?: string;
  posNameThai?: string;
  posNameEng?: string;
  posTypeName?: string;

  // Additional Information
  isDoctor?: string;
  workTelephone?: string | null;
}

export interface PSUAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== UI Bill Types =====
export type BillStatus = "unpaid" | "pending" | "paid";
export type BillTypeUI = "electric" | "water";
export type BillKind = "ELECT" | "WATER";

export interface PaymentDialogPayload {
  billId: number;
  billKind: BillKind;
  monthLabel: string;
  billType: string;
  amount: number;
}

// ===== Common API Response =====
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFail {
  success: false;
  error: string;
  message?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFail;

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ===== Dialog =====
export type AppDialogSeverity = "success" | "info" | "warning" | "error";

export interface AppDialogState {
  open: boolean;
  severity: AppDialogSeverity;
  title: string;
  message: string;
}

// ===== Service payloads =====
export interface ShopBillLatestData {
  shop: Shop;
  latestBill: ShopBill | null;
}

export interface UploadSlipPayload {
  billId: number;
  billKind: BillKind;
  file: File;
}

export interface UploadSlipResult {
  message?: string;
}

export interface ShopBillHistoryData {
  shop: Shop;
  bills: ShopBill[] | null;
}

export interface HouseBillLatestData {
  house: House;
  latestBill: HouseBill | null;
}

export interface HouseBillHistoryData {
  house: House;
  bills: HouseBill[] | null;
}

// ==========================================
// ===== Slip/Admin Review Types (Updated) =====
// ==========================================

export type SlipKind = BillKind;
export type SlipDecisionAction = "approve" | "deny";

// ✅ เอา "rejected" ออกตาม requirement
export type SlipStatusFilter = "all" | "unpaid" | "pending" | "paid";

export type AdminSlipRow = {
  bill_id: number;
  shop_id: string;
  bill_month: number;
  bill_year: number;

  elect_amount: number;
  elect_status_name?: string | null;
  elect_pay_slip_image?: string | null;

  water_amount: number;
  water_status_name?: string | null;
  water_pay_slip_image?: string | null;

  shop_name?: string | null;
  zone?: string | null;
  submit_date?: string | null;
};

export type SlipListParams = {
  status?: SlipStatusFilter;
  q?: string;
  kind?: SlipKind | "ALL";
};

export type SlipDecisionBody = {
  billId: number;
  kind: SlipKind;
  action: SlipDecisionAction;
};
