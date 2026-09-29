import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/stats
 * Get dashboard statistics
 */
export async function GET() {
  try {
    // Get house statistics
    const totalHouses = await prisma.house.count();

    // Get unique houses with electric bills (latest month)
    const housesWithElectric = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT house_id) as count
      FROM bill_house
      WHERE elect_record_date IS NOT NULL
    `;

    // Get unique houses with water bills (latest month)
    const housesWithWater = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT house_id) as count
      FROM bill_house
      WHERE water_record_date IS NOT NULL
    `;

    // Get shop statistics
    const totalShops = await prisma.shop.count();

    // Get unique shops with electric bills
    const shopsWithElectric = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT shop_id) as count
      FROM bill_shop
      WHERE elect_record_date IS NOT NULL
    `;

    // Get unique shops with water bills
    const shopsWithWater = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT shop_id) as count
      FROM bill_shop
      WHERE water_record_date IS NOT NULL
    `;

    // Get shops with pending payment verification (status 2 = รอตรวจสอบ)
    const shopsWithPendingPayment = await prisma.bill_shop.count({
      where: {
        OR: [
          { elect_pay_status_id: 2 }, // 2 = pending verification
          { water_pay_status_id: 2 },
        ],
      },
    });

    // Get member statistics (active members only)
    const totalMembers = await prisma.member.count({
      where: {
        delete_date: null,
        username: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        houses: {
          total: totalHouses,
          withElectric: Number(housesWithElectric[0]?.count || 0),
          withWater: Number(housesWithWater[0]?.count || 0),
        },
        shops: {
          total: totalShops,
          withElectric: Number(shopsWithElectric[0]?.count || 0),
          withWater: Number(shopsWithWater[0]?.count || 0),
          pendingPayment: shopsWithPendingPayment,
        },
        members: {
          total: totalMembers,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลสถิติได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
