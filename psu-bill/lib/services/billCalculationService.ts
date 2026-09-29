/**
 * Bill Calculation Service
 * Centralized service for bill amount calculations and related API calls
 */

export type BillType = 'electricity' | 'water';
export type PropertyType = 'house' | 'shop';

export interface CalculationResult {
  difference: number;
  amount: number;
  formattedAmount: string;
}

export interface UnitPrices {
  electricity: number;
  water: number;
}

export interface TieredRate {
  min: number;
  max: number | null;
  rate: string;
}

class BillCalculationService {
  // Default unit prices (fallback values)
  private readonly DEFAULT_ELECTRICITY_PRICE = 5;
  private readonly DEFAULT_WATER_PRICE = 24;

  /**
   * Calculate bill amount based on meter difference
   * @param previousMeter - Previous meter reading
   * @param currentMeter - Current meter reading
   * @param unitPrice - Price per unit
   * @returns Calculation result with difference and amount
   */
  calculateAmount(
    previousMeter: string | number,
    currentMeter: string | number,
    unitPrice: number
  ): CalculationResult {
    const prev = parseFloat(previousMeter?.toString() || "0");
    const curr = parseFloat(currentMeter?.toString() || "0");

    // Calculate difference (ensure non-negative)
    const diff = curr > prev ? curr - prev : 0;

    // Calculate amount
    const amount = diff * unitPrice;

    return {
      difference: diff,
      amount: amount,
      formattedAmount: amount.toFixed(2),
    };
  }

  /**
   * Calculate tiered electricity amount for shops
   * @param units - Number of units consumed
   * @param tiers - Tiered pricing structure
   * @returns Total amount based on tiered pricing
   */
  calculateTieredAmount(units: number, tiers: TieredRate[]): number {
    if (units <= 0) return 0;

    let totalAmount = 0;
    let remainingUnits = units;

    // Sort tiers by min value to ensure correct calculation
    const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

    for (const tier of sortedTiers) {
      if (remainingUnits <= 0) break;

      const rate = parseFloat(tier.rate);

      // Calculate units in this tier
      let unitsInTier: number;
      if (tier.max === null) {
        // Last tier (no max limit)
        unitsInTier = remainingUnits;
      } else {
        const tierRange = tier.max - tier.min + 1;
        unitsInTier = Math.min(remainingUnits, tierRange);
      }

      totalAmount += unitsInTier * rate;
      remainingUnits -= unitsInTier;
    }

    return parseFloat(totalAmount.toFixed(2));
  }

  /**
   * Get unit price from system settings
   * @param propertyType - 'house' or 'shop'
   * @param billType - 'electricity' or 'water'
   * @returns Unit price
   */
  async getUnitPrice(
    propertyType: PropertyType,
    billType: BillType
  ): Promise<number> {
    try {
      const codeMap: Record<PropertyType, Record<BillType, string>> = {
        house: {
          electricity: 'HOUSE_ELECT_UNIT_PRICE',
          water: 'HOUSE_WATER_UNIT_PRICE',
        },
        shop: {
          electricity: 'SHOP_ELECT_UNIT_PRICE',
          water: 'SHOP_WATER_UNIT_PRICE',
        },
      };

      const code = codeMap[propertyType][billType];
      const res = await fetch(`/api/system-settings?code=${code}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`Failed to fetch ${code}, using default value`);
        return billType === 'electricity'
          ? this.DEFAULT_ELECTRICITY_PRICE
          : this.DEFAULT_WATER_PRICE;
      }

      const result = await res.json();
      if (result.success && result.data?.value) {
        const price = parseFloat(result.data.value);
        return isNaN(price)
          ? (billType === 'electricity'
              ? this.DEFAULT_ELECTRICITY_PRICE
              : this.DEFAULT_WATER_PRICE)
          : price;
      }

      return billType === 'electricity'
        ? this.DEFAULT_ELECTRICITY_PRICE
        : this.DEFAULT_WATER_PRICE;
    } catch (error) {
      console.error(`Error fetching unit price for ${propertyType} ${billType}:`, error);
      return billType === 'electricity'
        ? this.DEFAULT_ELECTRICITY_PRICE
        : this.DEFAULT_WATER_PRICE;
    }
  }

  /**
   * Get tiered pricing structure for shop electricity
   * @returns Array of tiered rates
   */
  async getElectricityTiers(): Promise<TieredRate[]> {
    try {
      const res = await fetch('/api/system-settings?code=SHOP_ELECT_UNIT_PRICE_TIERS', {
        cache: "no-store",
      });

      if (!res.ok) {
        return this.getDefaultTiers();
      }

      const result = await res.json();
      if (result.success && result.data?.value) {
        const tiers = JSON.parse(result.data.value);
        return Array.isArray(tiers) ? tiers : this.getDefaultTiers();
      }

      return this.getDefaultTiers();
    } catch (error) {
      console.error('Error fetching electricity tiers:', error);
      return this.getDefaultTiers();
    }
  }

  /**
   * Get default tiered rates
   * @returns Default tiered rate structure
   */
  private getDefaultTiers(): TieredRate[] {
    return [
      { min: 1, max: 150, rate: '5' },
      { min: 151, max: 500, rate: '6' },
      { min: 501, max: null, rate: '7' },
    ];
  }

  /**
   * Get all unit prices for house
   * @returns Object with electricity and water prices
   */
  async getHouseUnitPrices(): Promise<UnitPrices> {
    const [electricity, water] = await Promise.all([
      this.getUnitPrice('house', 'electricity'),
      this.getUnitPrice('house', 'water'),
    ]);

    return { electricity, water };
  }

  /**
   * Get all unit prices for shop
   * @returns Object with electricity and water prices
   */
  async getShopUnitPrices(): Promise<UnitPrices> {
    const [electricity, water] = await Promise.all([
      this.getUnitPrice('shop', 'electricity'),
      this.getUnitPrice('shop', 'water'),
    ]);

    return { electricity, water };
  }

  /**
   * Calculate and format bill based on meter readings
   * @param previousMeter - Previous meter reading
   * @param currentMeter - Current meter reading
   * @param propertyType - 'house' or 'shop'
   * @param billType - 'electricity' or 'water'
   * @param useTieredPricing - Whether to use tiered pricing (for shop electricity)
   * @returns Calculation result
   */
  async calculateBill(
    previousMeter: string | number,
    currentMeter: string | number,
    propertyType: PropertyType,
    billType: BillType,
    useTieredPricing: boolean = false
  ): Promise<CalculationResult> {
    const prev = parseFloat(previousMeter?.toString() || "0");
    const curr = parseFloat(currentMeter?.toString() || "0");
    const diff = curr > prev ? curr - prev : 0;

    let amount: number;

    if (useTieredPricing && propertyType === 'shop' && billType === 'electricity') {
      // Use tiered pricing for shop electricity
      const tiers = await this.getElectricityTiers();
      amount = this.calculateTieredAmount(diff, tiers);
    } else {
      // Use flat rate pricing
      const unitPrice = await this.getUnitPrice(propertyType, billType);
      amount = diff * unitPrice;
    }

    return {
      difference: diff,
      amount: amount,
      formattedAmount: amount.toFixed(2),
    };
  }

  /**
   * Validate meter readings
   * @param previousMeter - Previous meter reading
   * @param currentMeter - Current meter reading
   * @returns Validation result with error message if invalid
   */
  validateMeterReadings(
    previousMeter: string | number,
    currentMeter: string | number
  ): { isValid: boolean; error?: string } {
    const prev = parseFloat(previousMeter?.toString() || "0");
    const curr = parseFloat(currentMeter?.toString() || "0");

    if (isNaN(prev) || isNaN(curr)) {
      return { isValid: false, error: "เลขมิเตอร์ไม่ถูกต้อง" };
    }

    if (curr < prev) {
      return { isValid: false, error: "เลขมิเตอร์ปัจจุบันต้องมากกว่าหรือเท่ากับเลขมิเตอร์ครั้งก่อน" };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const billCalculationService = new BillCalculationService();

// Export with capitalized name for consistency
export { billCalculationService as BillCalculationService };
