// Utility functions

// ===== CSS Utility =====
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ===== Date & Time Utilities =====
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Thai month names array (indexed from 0, so January = thaiMonths[0])
 */
export const thaiMonths = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

/**
 * Get Thai Buddhist Era year from Gregorian year
 * @param gregorianYear - Year in Gregorian calendar (e.g., 2024)
 * @returns Year in Buddhist Era (e.g., 2567)
 */
export function getThaiYear(gregorianYear: number): number {
  return gregorianYear + 543;
}

/**
 * Format month number to Thai month name
 * @param month - Month number (1-12)
 * @returns Thai month name
 */
export function formatThaiMonth(month: string | number): string {
  const monthNumber = typeof month === 'string' ? parseInt(month) : month;
  return thaiMonths[monthNumber - 1] || '';
}

/**
 * Format date with Thai month and Buddhist Era year
 * @param year - Gregorian year or Buddhist Era year (auto-detects based on value)
 * @param month - Month number (1-12)
 * @returns Formatted date string (e.g., "มกราคม 2567")
 */
export function formatThaiDate(year: string | number, month: string | number): string {
  const yearNumber = typeof year === 'string' ? parseInt(year) : year;
  // Auto-detect: if year > 2500, it's already in Buddhist Era
  const thaiYear = yearNumber > 2500 ? yearNumber : getThaiYear(yearNumber);
  const thaiMonth = formatThaiMonth(month);
  return `${thaiMonth} ${thaiYear}`;
}

// ===== Currency Utilities =====
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}

/**
 * Format currency with custom options
 * @param amount - Amount to format
 * @param minimumFractionDigits - Minimum decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatBaht(amount: number, minimumFractionDigits: number = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ===== Number Utilities =====
/**
 * Parse string to number safely
 * @param value - String value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed number or default value
 */
export function parseNumber(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse string to integer safely
 * @param value - String value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed integer or default value
 */
export function parseInt(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return Math.floor(value);
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format number to compact notation (e.g., 1.5K, 1M)
 * Useful for charts and graphs with limited space
 * @param value - Number to format
 * @returns Formatted compact string
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return "0";
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

// ===== BigInt Utilities =====
/**
 * Convert BigInt to string for JSON serialization
 * @param value - BigInt value or null
 * @returns String representation or null
 */
export function serializeBigInt(value: bigint | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

// ===== API Response Utilities =====
/**
 * Create success API response
 */
export function apiSuccess<T>(data: T) {
  return {
    success: true,
    data,
  };
}

/**
 * Create error API response
 */
export function apiError(error: string, message?: string) {
  return {
    success: false,
    error,
    message,
  };
}

// ===== House Type Utilities =====
/**
 * House type mapping: Thai name to database code
 */
export const houseTypeMap: Record<string, string> = {
  'บ้านครอบครัว': 'home',
  'แฟลตครอบครัว': 'flat_fami',
  'แฟลตคนโสด': 'flat_sing',
};

/**
 * Reverse mapping: database code to Thai name
 */
export const houseTypeReverseMap: Record<string, string> = {
  'home': 'บ้านครอบครัว',
  'flat_fami': 'แฟลตครอบครัว',
  'flat_sing': 'แฟลตคนโสด',
};

/**
 * Array of house type Thai names for UI display
 */
export const houseTypeLabels = Object.keys(houseTypeMap);

/**
 * Get Thai label from database code
 * @param code - Database code (e.g., 'home', 'flat_fami')
 * @returns Thai label or original code if not found
 */
export function getHouseTypeLabel(code: string | null | undefined): string {
  if (!code) return 'ไม่ระบุ';
  return houseTypeReverseMap[code] || code;
}

/**
 * Get database code from Thai label
 * @param label - Thai label (e.g., 'บ้านครอบครัว')
 * @returns Database code or empty string if not found
 */
export function getHouseTypeCode(label: string | null | undefined): string {
  if (!label) return '';
  return houseTypeMap[label] || '';
}