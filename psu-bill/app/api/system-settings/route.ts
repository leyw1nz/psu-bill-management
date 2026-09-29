import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/system-settings
 * Query params:
 *   - code: string (optional) - specific setting code to retrieve
 *
 * Returns system setting(s) from the database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      // Get specific setting by code
      const setting = await prisma.system_setting.findUnique({
        where: { code },
      });

      if (!setting) {
        return NextResponse.json(
          { success: false, error: "Setting not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: setting,
      });
    }

    // Get all settings
    const settings = await prisma.system_setting.findMany();

    // Convert to key-value object matching the page expectations
    const settingsObj: Record<string, any> = {};
    settings.forEach((setting) => {
      // Map database codes to page field names
      if (setting.code === 'HOUSE_ELECT_UNIT_PRICE') {
        settingsObj['house_electricity_rate'] = setting.value || '';
      } else if (setting.code === 'HOUSE_WATER_UNIT_PRICE') {
        settingsObj['house_water_rate'] = setting.value || '';
      } else if (setting.code === 'SHOP_ELECT_UNIT_PRICE_TIERS') {
        // Parse tiered pricing JSON
        try {
          settingsObj['shop_electricity_tiers'] = setting.value ? JSON.parse(setting.value) : [
            { min: 1, max: 150, rate: '5' },
            { min: 151, max: 500, rate: '6' },
            { min: 501, max: null, rate: '7' },
          ];
        } catch (e) {
          settingsObj['shop_electricity_tiers'] = [
            { min: 1, max: 150, rate: '5' },
            { min: 151, max: 500, rate: '6' },
            { min: 501, max: null, rate: '7' },
          ];
        }
      } else if (setting.code === 'SHOP_WATER_UNIT_PRICE') {
        settingsObj['shop_water_rate'] = setting.value || '';
      }
    });

    // Set default values if not found
    if (!settingsObj['house_electricity_rate']) settingsObj['house_electricity_rate'] = '';
    if (!settingsObj['house_water_rate']) settingsObj['house_water_rate'] = '';
    if (!settingsObj['shop_electricity_tiers']) {
      settingsObj['shop_electricity_tiers'] = [
        { min: 1, max: 150, rate: '5' },
        { min: 151, max: 500, rate: '6' },
        { min: 501, max: null, rate: '7' },
      ];
    }
    if (!settingsObj['shop_water_rate']) settingsObj['shop_water_rate'] = '';

    return NextResponse.json({
      success: true,
      data: settingsObj,
    });
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch system settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/system-settings
 * Body: { house_electricity_rate, house_water_rate, shop_electricity_tiers, shop_water_rate }
 *
 * Updates system settings using upsert
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { house_electricity_rate, house_water_rate, shop_electricity_tiers, shop_water_rate } = body;

    // Upsert each setting separately for house and shop
    await Promise.all([
      // House electricity rate
      prisma.system_setting.upsert({
        where: { code: 'HOUSE_ELECT_UNIT_PRICE' },
        update: { value: house_electricity_rate },
        create: { code: 'HOUSE_ELECT_UNIT_PRICE', value: house_electricity_rate },
      }),
      // House water rate
      prisma.system_setting.upsert({
        where: { code: 'HOUSE_WATER_UNIT_PRICE' },
        update: { value: house_water_rate },
        create: { code: 'HOUSE_WATER_UNIT_PRICE', value: house_water_rate },
      }),
      // Shop electricity tiered rates (stored as JSON)
      prisma.system_setting.upsert({
        where: { code: 'SHOP_ELECT_UNIT_PRICE_TIERS' },
        update: { value: JSON.stringify(shop_electricity_tiers) },
        create: { code: 'SHOP_ELECT_UNIT_PRICE_TIERS', value: JSON.stringify(shop_electricity_tiers) },
      }),
      // Shop water rate
      prisma.system_setting.upsert({
        where: { code: 'SHOP_WATER_UNIT_PRICE' },
        update: { value: shop_water_rate },
        create: { code: 'SHOP_WATER_UNIT_PRICE', value: shop_water_rate },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error("Error updating system settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update system settings" },
      { status: 500 }
    );
  }
}
