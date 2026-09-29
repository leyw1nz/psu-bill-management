import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/members/[id]/properties
 * Fetch houses and shops related to a member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = BigInt(id);

    // Fetch houses and shops in parallel
    const [houses, shops, member] = await Promise.all([
      prisma.house.findMany({
        where: {
          member_id: memberId,
          delete_date: null,
        },
        orderBy: {
          house_no: 'asc',
        },
      }),
      prisma.shop.findMany({
        where: {
          member_id: memberId,
          delete_date: null,
        },
        orderBy: {
          shop_no: 'asc',
        },
      }),
      prisma.member.findUnique({
        where: {
          member_id: memberId,
        },
        select: {
          member_id: true,
          citizen_id: true,
          staff_id: true,
          email: true,
          title: true,
          name: true,
          surname: true,
          phone: true,
        },
      }),
    ]);

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found',
        },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const housesData = houses.map((house) => ({
      ...house,
      house_id: house.house_id.toString(),
      member_id: house.member_id?.toString(),
      fee: house.fee?.toString(),
    }));

    const shopsData = shops.map((shop) => ({
      ...shop,
      shop_id: shop.shop_id.toString(),
      member_id: shop.member_id?.toString(),
    }));

    const memberData = {
      ...member,
      member_id: member.member_id.toString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        member: memberData,
        houses: housesData,
        shops: shopsData,
      },
    });
  } catch (error) {
    console.error('Error fetching member properties:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch member properties',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

