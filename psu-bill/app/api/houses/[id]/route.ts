import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/houses/[id]
 * Fetch a single house by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const houseId = BigInt(id);

    const house = await prisma.house.findUnique({
      where: {
        house_id: houseId,
      },
    });

    if (!house) {
      return NextResponse.json(
        {
          success: false,
          error: 'House not found',
        },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const houseData = {
      ...house,
      house_id: house.house_id.toString(),
      member_id: house.member_id?.toString(),
      fee: house.fee?.toString(),
    };

    return NextResponse.json({
      success: true,
      data: houseData,
    });
  } catch (error) {
    console.error('Error fetching house:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch house',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/houses/[id]
 * Update a house
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const houseId = BigInt(id);
    const body = await request.json();
    const { house_no, zone_building, type, fee, note, member_id } = body;

    // Check if house exists
    const existingHouse = await prisma.house.findUnique({
      where: { house_id: houseId },
    });

    if (!existingHouse) {
      return NextResponse.json(
        {
          success: false,
          error: 'House not found',
        },
        { status: 404 }
      );
    }

    // Update house
    const updatedHouse = await prisma.house.update({
      where: {
        house_id: houseId,
      },
      data: {
        house_no,
        zone_building,
        type,
        fee,
        note,
        member_id: member_id ? BigInt(member_id) : null,
        modify_date: new Date(),
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedHouse = {
      ...updatedHouse,
      house_id: updatedHouse.house_id.toString(),
      member_id: updatedHouse.member_id?.toString(),
      fee: updatedHouse.fee?.toString(),
    };

    return NextResponse.json({
      success: true,
      data: serializedHouse,
      message: 'House updated successfully',
    });
  } catch (error) {
    console.error('Error updating house:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update house',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/houses/[id]
 * Soft delete a house (set delete_date)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const houseId = BigInt(id);

    // Check if house exists
    const existingHouse = await prisma.house.findUnique({
      where: { house_id: houseId },
    });

    if (!existingHouse) {
      return NextResponse.json(
        {
          success: false,
          error: 'House not found',
        },
        { status: 404 }
      );
    }

    // Soft delete by setting delete_date
    const deletedHouse = await prisma.house.update({
      where: {
        house_id: houseId,
      },
      data: {
        delete_date: new Date(),
        modify_date: new Date(),
      },
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedHouse = {
      ...deletedHouse,
      house_id: deletedHouse.house_id.toString(),
      member_id: deletedHouse.member_id?.toString(),
      fee: deletedHouse.fee?.toString(),
    };

    return NextResponse.json({
      success: true,
      data: serializedHouse,
      message: 'House deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting house:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete house',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
