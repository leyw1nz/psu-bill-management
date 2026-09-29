import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/shops/[id]
 * Fetch a single shop by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const shopId = BigInt(id);

    const shop = await prisma.shop.findUnique({
      where: { shop_id: shopId },
      include: {
        member: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อมูลร้านค้า',
        },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const shopData = {
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
    };

    return NextResponse.json({
      success: true,
      data: shopData,
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
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
 * PUT /api/shops/[id]
 * Update an existing shop
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const shopId = BigInt(id);
    const body = await request.json();
    const { shop_no, location, elect_account_no, water_account_no, member_id, note } = body;

    // Check if shop exists
    const existingShop = await prisma.shop.findUnique({
      where: { shop_id: shopId },
    });

    if (!existingShop || existingShop.delete_date !== null) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อมูลร้านค้า',
        },
        { status: 404 }
      );
    }

    // Check if shop_no is being changed and already exists
    if (shop_no && shop_no !== existingShop.shop_no) {
      const duplicateShop = await prisma.shop.findFirst({
        where: {
          shop_no,
          delete_date: null,
          shop_id: { not: shopId },
        },
      });

      if (duplicateShop) {
        return NextResponse.json(
          {
            success: false,
            error: 'เลขที่ร้านนี้มีอยู่ในระบบแล้ว',
          },
          { status: 409 }
        );
      }
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

    // Update shop
    const shop = await prisma.shop.update({
      where: { shop_id: shopId },
      data: {
        shop_no: shop_no || existingShop.shop_no,
        location: location || existingShop.location,
        elect_account_no: elect_account_no !== undefined ? elect_account_no : existingShop.elect_account_no,
        water_account_no: water_account_no !== undefined ? water_account_no : existingShop.water_account_no,
        member_id: member_id !== undefined ? (member_id ? BigInt(member_id) : null) : existingShop.member_id,
        note: note !== undefined ? note : existingShop.note,
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
      message: 'แก้ไขข้อมูลร้านค้าสำเร็จ',
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถแก้ไขข้อมูลร้านค้าได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shops/[id]
 * Soft delete a shop
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const shopId = BigInt(id);

    // Check if shop exists
    const existingShop = await prisma.shop.findUnique({
      where: { shop_id: shopId },
    });

    if (!existingShop) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อมูลร้านค้า',
        },
        { status: 404 }
      );
    }

    if (existingShop.delete_date !== null) {
      return NextResponse.json(
        {
          success: false,
          error: 'ร้านค้านี้ถูกลบไปแล้ว',
        },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.shop.update({
      where: { shop_id: shopId },
      data: {
        delete_date: new Date(),
        modify_date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบร้านค้าสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถลบร้านค้าได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shops/[id]
 * Restore a soft-deleted shop
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const shopId = BigInt(id);

    // Check if shop exists
    const existingShop = await prisma.shop.findUnique({
      where: { shop_id: shopId },
    });

    if (!existingShop) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อมูลร้านค้า',
        },
        { status: 404 }
      );
    }

    if (existingShop.delete_date === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'ร้านค้านี้ยังไม่ได้ถูกลบ',
        },
        { status: 400 }
      );
    }

    // Restore
    await prisma.shop.update({
      where: { shop_id: shopId },
      data: {
        delete_date: null,
        modify_date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'กู้คืนร้านค้าสำเร็จ',
    });
  } catch (error) {
    console.error('Error restoring shop:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถกู้คืนร้านค้าได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
