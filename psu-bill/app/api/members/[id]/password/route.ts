import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { generatePassword } from '@/lib/passwordUtils';

/**
 * POST /api/members/[id]/password
 * Reset member password
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { member_id: BigInt(id) },
    });

    if (!existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อมูลสมาชิก',
        },
        { status: 404 }
      );
    }

    // Generate new password
    const newPassword = generatePassword(8);
    const hashedPassword = await hashPassword(newPassword);

    // Update member password
    await prisma.member.update({
      where: { member_id: BigInt(id) },
      data: {
        password: hashedPassword,
        modify_date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        password: newPassword,
      },
      message: 'รีเซ็ตรหัสผ่านสำเร็จ',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
