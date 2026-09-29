import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { memberId, currentPassword, newPassword } = body;

    // Validate input
    if (!memberId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    // Get member from database
    const member = await prisma.member.findUnique({
      where: { member_id: BigInt(memberId) },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้ใช้" },
        { status: 404 }
      );
    }

    // Check if member is OIDC user (has staff_id)
    if (member.staff_id) {
      return NextResponse.json(
        { success: false, message: "ผู้ใช้ PSU Passport ไม่สามารถเปลี่ยนรหัสผ่านในระบบนี้ได้" },
        { status: 400 }
      );
    }

    // Verify current password
    if (!member.password) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรหัสผ่านในระบบ" },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, member.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.member.update({
      where: { member_id: BigInt(memberId) },
      data: {
        password: hashedPassword,
        modify_date: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" },
      { status: 500 }
    );
  }
}
