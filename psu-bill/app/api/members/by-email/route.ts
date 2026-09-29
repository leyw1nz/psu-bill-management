import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/members/by-email?email=xxx
 * Find member by email address
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Find member by email
    const member = await prisma.member.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive', // Case-insensitive search
        },
        delete_date: null, // Only active members
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found',
        },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...memberWithoutPassword } = member;

    // Convert BigInt to string for JSON serialization
    const memberData = {
      ...memberWithoutPassword,
      member_id: member.member_id.toString(),
    };

    return NextResponse.json({
      success: true,
      data: memberData,
    });
  } catch (error) {
    console.error('Error fetching member by email:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch member',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
