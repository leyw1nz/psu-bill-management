import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { generatePassword } from '@/lib/passwordUtils';

/**
 * GET /api/members/[id]
 * Fetch a specific member by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const member = await prisma.member.findUnique({
      where: {
        member_id: BigInt(id),
      },
      include: {
        role: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อมูลสมาชิก',
        },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const memberData = {
      ...member,
      member_id: member.member_id.toString(),
      password: undefined, // Never send password
      role: member.role ? {
        role_id: member.role.role_id,
        role_name: member.role.role_name,
        note: member.role.note,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: memberData,
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถดึงข้อมูลสมาชิกได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/members/[id]
 * Update a member
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, email, role_id, title, name, surname, phone, citizen_id, password } = body;

    // Validate required fields (password is optional for updates)
    if (!username || !email || !role_id || !name || !surname) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลที่จำเป็นไม่ครบถ้วน: username, email, role_id, name, surname',
        },
        { status: 400 }
      );
    }

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

    // Check if username is taken by another member
    if (username !== existingMember.username) {
      const usernameCheck = await prisma.member.findFirst({
        where: {
          username,
          member_id: { not: BigInt(id) },
          delete_date: null,
        },
      });

      if (usernameCheck) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username นี้มีอยู่ในระบบแล้ว',
          },
          { status: 409 }
        );
      }
    }

    // Check if email is taken by another member
    if (email !== existingMember.email) {
      const emailCheck = await prisma.member.findFirst({
        where: {
          email,
          member_id: { not: BigInt(id) },
          delete_date: null,
        },
      });

      if (emailCheck) {
        return NextResponse.json(
          {
            success: false,
            error: 'อีเมลนี้มีอยู่ในระบบแล้ว',
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      username,
      email,
      role_id,
      title: title || null,
      name,
      surname,
      phone: phone || null,
      citizen_id: citizen_id || null,
      modify_date: new Date(),
    };

    // Only update password if provided
    if (password && password.trim()) {
      if (password.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
          },
          { status: 400 }
        );
      }
      updateData.password = await hashPassword(password);
    }

    // Update member
    const member = await prisma.member.update({
      where: { member_id: BigInt(id) },
      data: updateData,
      include: {
        role: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    const memberData = {
      ...member,
      member_id: member.member_id.toString(),
      password: undefined, // Never send password
      role: member.role ? {
        role_id: member.role.role_id,
        role_name: member.role.role_name,
        note: member.role.note,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: memberData,
      message: 'แก้ไขข้อมูลสมาชิกสำเร็จ',
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถแก้ไขข้อมูลสมาชิกได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/members/[id]
 * Soft delete (set delete_date)
 */
export async function DELETE(
  _req: NextRequest,
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

    await prisma.member.update({
      where: { member_id: BigInt(id) },
      data: {
        delete_date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ลบสมาชิกสำเร็จ',
    });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถลบสมาชิกได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/members/[id]
 * Restore a deleted member (clear delete_date)
 */
export async function PATCH(
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

    // Restore by clearing delete_date
    await prisma.member.update({
      where: { member_id: BigInt(id) },
      data: {
        delete_date: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'กู้คืนสมาชิกสำเร็จ',
    });
  } catch (error) {
    console.error('Error restoring member:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถกู้คืนสมาชิกได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
