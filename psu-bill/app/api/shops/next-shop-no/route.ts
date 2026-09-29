import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/shops/next-shop-no
 * Generate the next available shop_no based on the last shop_no in the database
 */
export async function GET() {
  try {
    // Get the last shop ordered by shop_no descending
    const lastShop = await prisma.shop.findFirst({
      where: {
        shop_no: { not: null },
      },
      orderBy: {
        shop_no: 'desc',
      },
      select: {
        shop_no: true,
      },
    });

    let nextShopNo = 'S001';

    if (lastShop?.shop_no) {
      // Extract numeric part from shop_no (e.g., "S145" -> 145)
      const match = lastShop.shop_no.match(/^S(\d+)$/);

      if (match) {
        const currentNumber = parseInt(match[1], 10);
        const nextNumber = currentNumber + 1;
        // Pad with zeros to maintain 3 digits
        nextShopNo = `S${nextNumber.toString().padStart(3, '0')}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        next_shop_no: nextShopNo,
        last_shop_no: lastShop?.shop_no || null,
      },
    });
  } catch (error) {
    console.error('Error generating next shop_no:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถสร้างรหัสร้านถัดไปได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
