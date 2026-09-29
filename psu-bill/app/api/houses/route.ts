import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/houses
 * Fetch all houses with optional filtering and pagination
 *
 * Query params:
 * - zone_building: Filter by zone/building
 * - type: Filter by house type
 * - page: Page number (only used if limit is specified)
 * - limit: Items per page (if not specified, returns all records)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zoneBuilding = searchParams.get('zone_building');
    const type = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const hasLimit = limitParam !== null;

    // Build where clause for filtering
    const where: any = {
      delete_date: null, // Only fetch non-deleted records
    };

    if (zoneBuilding) {
      where.zone_building = zoneBuilding;
    }

    if (type) {
      where.type = type;
    }

    // If limit is specified, use pagination
    if (hasLimit) {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(limitParam || '10');
      const skip = (page - 1) * limit;

      const [houses, total] = await Promise.all([
        prisma.house.findMany({
          where,
          skip,
          take: limit,
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
          orderBy: {
            house_id: 'desc',
          },
        }),
        prisma.house.count({ where }),
      ]);

      // Convert BigInt fields to strings for JSON serialization
      const serializedHouses = houses.map((house) => ({
        ...house,
        house_id: house.house_id.toString(),
        member_id: house.member_id?.toString(),
        fee: house.fee?.toString(),
        member: house.member ? {
          member_id: house.member.member_id.toString(),
          citizen_id: house.member.citizen_id,
          staff_id: house.member.staff_id,
          email: house.member.email,
          title: house.member.title,
          name: house.member.name,
          surname: house.member.surname,
          phone: house.member.phone,
          username: house.member.username,
          role_id: house.member.role_id,
          role: house.member.role,
          create_date: house.member.create_date,
          modify_date: house.member.modify_date,
          delete_date: house.member.delete_date,
        } : null,
      }));

      return NextResponse.json({
        success: true,
        data: serializedHouses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Fetch all houses with member data using Prisma
    // Note: Prisma automatically optimizes this with a batched query using IN clause
    // which performs: SELECT FROM house + SELECT FROM member WHERE member_id IN (...)
    const [houses, total] = await Promise.all([
      prisma.house.findMany({
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
        orderBy: {
          house_no: 'asc',
        },
      }),
      prisma.house.count({ where }),
    ]);

    // Convert BigInt fields to strings for JSON serialization
    const serializedHouses = houses.map((house) => ({
      ...house,
      house_id: house.house_id.toString(),
      member_id: house.member_id?.toString(),
      fee: house.fee?.toString(),
      member: house.member ? {
        member_id: house.member.member_id.toString(),
        citizen_id: house.member.citizen_id,
        staff_id: house.member.staff_id,
        email: house.member.email,
        title: house.member.title,
        name: house.member.name,
        surname: house.member.surname,
        phone: house.member.phone,
        username: house.member.username,
        role_id: house.member.role_id,
        role: house.member.role,
        create_date: house.member.create_date,
        modify_date: house.member.modify_date,
        delete_date: house.member.delete_date,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: serializedHouses,
      total,
    });
  } catch (error) {
    console.error("Error fetching houses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch houses",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/houses
 * Create a new house
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { house_no, zone_building, type, fee, note, member_id } = body;

    // Validation
    if (!house_no) {
      return NextResponse.json(
        {
          success: false,
          error: "House number is required",
        },
        { status: 400 }
      );
    }

    // Create house
    const house = await prisma.house.create({
      data: {
        house_no,
        zone_building,
        type,
        fee,
        note,
        member_id: member_id ? BigInt(member_id) : null,
        create_date: new Date(),
        modify_date: new Date(),
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedHouse = {
      ...house,
      house_id: house.house_id.toString(),
      member_id: house.member_id?.toString(),
      fee: house.fee?.toString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: serializedHouse,
        message: 'House created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating house:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create house",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}