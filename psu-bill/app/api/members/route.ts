// /app/api/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

/**
 * GET /api/members
 * Query params:
 * - role_id: number
 * - search: string
 * - email: string
 * - status: active | deleted | all (default: active)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roleId = searchParams.get("role_id");
    const search = searchParams.get("search");
    const email = searchParams.get("email");
    const status = searchParams.get("status") || "active";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // status filter
    if (status === "active") where.delete_date = null;
    else if (status === "deleted") where.delete_date = { not: null };
    // status === "all" -> ไม่ใส่เงื่อนไข

    if (roleId) {
      const roleIdNum = parseInt(roleId, 10);
      if (!Number.isFinite(roleIdNum)) {
        return NextResponse.json(
          { success: false, error: "role_id must be a number" },
          { status: 400 }
        );
      }
      where.role_id = roleIdNum;
    }

    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { surname: { contains: search, mode: "insensitive" } },
        { staff_id: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { citizen_id: { contains: search } },
      ];
    }

    // ✅ ไม่ใช้ include role (กัน error)
    const members = await prisma.member.findMany({
      where,
      include: {
        role: true, // Include role information
      },
      orderBy: [
        { member_id: 'desc' },
      ],
    });

    // Convert BigInt to string for JSON serialization
    const membersData = members.map((member) => ({
      ...member,
      member_id: member.member_id.toString(),
      password: undefined, // Never send password
      role: member.role ? {
        role_id: member.role.role_id,
        role_name: member.role.role_name,
        note: member.role.note,
      } : null,
    }));

    return NextResponse.json({ success: true, data: membersData });
  } catch (error) {
    console.error("Error fetching members:", error);
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
 * POST /api/members
 * Create member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, role_id, title, name, surname, phone, citizen_id, staff_id, password } = body;

    // Validate required fields
    if (!email || !role_id || !name || !surname) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลที่จำเป็นไม่ครบถ้วน: email, role_id, name, surname',
        },
        { status: 400 }
      );
    }

    // Validate password length if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
        },
        { status: 400 }
      );
    }

    // Check if username already exists (only if username is provided)
    if (username) {
      const existingUsername = await prisma.member.findFirst({
        where: { username, delete_date: null },
      });

      if (existingUsername) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username นี้มีอยู่ในระบบแล้ว',
          },
          { status: 409 }
        );
      }
    }

    // Check email exists
    const existingEmail = await prisma.member.findFirst({
      where: { email, delete_date: null },
    });
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'อีเมลนี้มีอยู่ในระบบแล้ว',
        },
        { status: 409 }
      );
    }

    // Check if staff_id already exists (only if staff_id is provided)
    if (staff_id) {
      const existingStaffId = await prisma.member.findFirst({
        where: { staff_id, delete_date: null },
      });

      if (existingStaffId) {
        return NextResponse.json(
          {
            success: false,
            error: 'รหัสบุคลากรนี้มีอยู่ในระบบแล้ว',
          },
          { status: 409 }
        );
      }
    }

    // Hash the provided password (if provided)
    const hashedPassword = password ? await hashPassword(password) : null;

    const member = await prisma.member.create({
      data: {
        username: username || null,
        email,
        role_id: parseInt(role_id),
        title: title || null,
        name,
        surname,
        phone: phone || null,
        citizen_id: citizen_id || null,
        staff_id: staff_id || null,
        password: hashedPassword,
        create_date: new Date(),
        modify_date: new Date(),
      },
    });

    // ✅ ดึง role มาแปะให้ (โดยไม่ใช้ include)
    const role = await prisma.role.findUnique({
      where: { role_id: parseInt(role_id) },
    });

    return NextResponse.json({
      success: true,
      data: {
        member_id: member.member_id.toString(),
        username: member.username,
        email: member.email,
        role: role ?? null,
      },
      message: 'เพิ่มสมาชิกสำเร็จ',
    });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถเพิ่มสมาชิกได้',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
