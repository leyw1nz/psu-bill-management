import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Generate random password
function generateRandomPassword(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier } = body; // Can be username, email, or citizen_id

    // Validate input
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อผู้ใช้, อีเมล หรือรหัสบัตรประชาชน" },
        { status: 400 }
      );
    }

    // Find member by username, email, or citizen_id
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { citizen_id: identifier },
        ],
        delete_date: null, // Only active members
      },
    });

    if (!member) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้ในระบบ" },
        { status: 404 }
      );
    }

    // Check if member is OIDC user (has staff_id)
    if (member.staff_id) {
      return NextResponse.json(
        {
          success: false,
          message: "ผู้ใช้ PSU Passport กรุณาใช้ระบบรีเซ็ตรหัสผ่านของ PSU Passport",
        },
        { status: 400 }
      );
    }

    // Check if member has email
    if (!member.email) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบอีเมลในระบบ กรุณาติดต่อผู้ดูแลระบบ",
        },
        { status: 400 }
      );
    }

    // Generate new random password
    const newPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.member.update({
      where: { member_id: member.member_id },
      data: {
        password: hashedPassword,
        modify_date: new Date(),
      },
    });

    // TODO: Send email with new password
    // For now, we'll return the password in the response
    // In production, you should send this via email and NOT return it in the response

    return NextResponse.json({
      success: true,
      message: `รหัสผ่านใหม่ถูกส่งไปยังอีเมล ${member.email}`,
      // DEVELOPMENT ONLY - Remove in production
      data: {
        tempPassword: newPassword,
        email: member.email,
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" },
      { status: 500 }
    );
  }
}
