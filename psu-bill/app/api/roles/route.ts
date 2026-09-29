import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/roles
 * Fetch all roles from the database
 */
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        role_id: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch roles',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
