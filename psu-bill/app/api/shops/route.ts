import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/shops
 * Fetch all shops with optional filtering
 * Query params:
 * - location: Filter by location/building
 * - shop_no: Filter by shop number
 * - search: Search by shop_no, location, member name
 * - status: Filter by status (active, deleted, all) - default: active
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location');
    const shopNo = searchParams.get('shop_no');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Handle status filter
    if (status === 'active') {
      where.delete_date = null; // Only active shops
    } else if (status === 'deleted') {
      where.delete_date = { not: null }; // Only deleted shops
    }
    // If status === 'all', don't filter by delete_date

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (shopNo) {
      where.shop_no = {
        contains: shopNo,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        { shop_no: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { member: { name: { contains: search, mode: 'insensitive' } } },
        { member: { surname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const shops = await prisma.shop.findMany({
      where,
      include: {
        member: {
          select: {
            member_id: true,
            citizen_id: true,
            staff_id: true,
            email: true,
            title: true,
            name: true,
            surname: true,
            phone: true,
            username: true,
            role_id: true,
            role: true,
            create_date: true,
            modify_date: true,
            delete_date: true,
          },
        },
      },
      orderBy: [
        { shop_id: 'desc' },
      ],
    });

    // Convert BigInt to string for JSON serialization
    const shopsData = shops.map((shop) => ({
      ...shop,
      shop_id: shop.shop_id.toString(),
      member_id: shop.member_id?.toString() || null,
      member: shop.member ? {
        member_id: shop.member.member_id.toString(),
        citizen_id: shop.member.citizen_id,
        staff_id: shop.member.staff_id,
        email: shop.member.email,
        title: shop.member.title,
        name: shop.member.name,
        surname: shop.member.surname,
        phone: shop.member.phone,
        username: shop.member.username,
        role_id: shop.member.role_id,
        role: shop.member.role,
        create_date: shop.member.create_date,
        modify_date: shop.member.modify_date,
        delete_date: shop.member.delete_date,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: shopsData,
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลร้านค้าได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shops
 * Create a new shop
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_no, location, elect_account_no, water_account_no, member_id, note } = body;

    // Validate required fields
    if (!shop_no || !location) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลที่จำเป็นไม่ครบถ้วน: shop_no, location',
        },
        { status: 400 }
      );
    }

    // Check if shop_no already exists
    const existingShop = await prisma.shop.findFirst({
      where: {
        shop_no,
        delete_date: null,
      },
    });

    if (existingShop) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสร้านนี้มีอยู่ในระบบแล้ว',
        },
        { status: 409 }
      );
    }

    // If member_id is provided, verify it exists
    if (member_id) {
      const member = await prisma.member.findUnique({
        where: { member_id: BigInt(member_id) },
      });

      if (!member || member.delete_date !== null) {
        return NextResponse.json(
          {
            success: false,
            error: 'ไม่พบข้อมูลสมาชิกที่เลือก',
          },
          { status: 404 }
        );
      }
    }

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        shop_no,
        location,
        elect_account_no: elect_account_no || null,
        water_account_no: water_account_no || null,
        member_id: member_id ? BigInt(member_id) : null,
        note: note || null,
        create_date: new Date(),
        modify_date: new Date(),
      },
      include: {
        member: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...shop,
        shop_id: shop.shop_id.toString(),
        member_id: shop.member_id?.toString() || null,
        member: shop.member ? {
          ...shop.member,
          member_id: shop.member.member_id.toString(),
        } : null,
      },
      message: 'เพิ่มร้านค้าสำเร็จ',
    });
  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถเพิ่มร้านค้าได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
