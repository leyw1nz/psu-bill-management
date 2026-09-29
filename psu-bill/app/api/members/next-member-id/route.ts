import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/members/next-member-id
 * Get the next available member_id for username generation
 */
export async function GET() {
  try {
    // Get the maximum member_id
    const lastMember = await prisma.member.findFirst({
      orderBy: {
        member_id: 'desc',
      },
      select: {
        member_id: true,
      },
    });

    let nextMemberId = BigInt(1);

    if (lastMember) {
      nextMemberId = lastMember.member_id + BigInt(1);
    }

    // Pad to 6 characters
    const paddedMemberId = nextMemberId.toString().padStart(6, '0');

    return NextResponse.json({
      success: true,
      data: {
        next_member_id: nextMemberId.toString(),
        padded_username: paddedMemberId,
      },
    });
  } catch (error) {
    console.error('Error generating next member_id:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถสร้างรหัสสมาชิกถัดไปได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
