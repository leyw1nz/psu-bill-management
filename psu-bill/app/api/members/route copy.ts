import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// helper ตัด password ออก
function stripPassword(member: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = member;
  return rest;
}

/**
 * GET /api/members/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = BigInt(params.id);

    const member = await prisma.member.findUnique({
      where: { member_id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // ดึง role แยก (ไม่ใช้ include)
    const role = member.role_id
      ? await prisma.role.findUnique({ where: { role_id: member.role_id } })
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...stripPassword(member),
        member_id: member.member_id.toString(),
        role: role
          ? { role_id: role.role_id, role_name: role.role_name, note: role.note }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch member",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/members/[id]
 * Restore (clear delete_date)
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = BigInt(params.id);

    const existing = await prisma.member.findUnique({
      where: { member_id: memberId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    await prisma.member.update({
      where: { member_id: memberId },
      data: { delete_date: null, modify_date: new Date() },
    });

    return NextResponse.json({ success: true, message: "Member restored successfully" });
  } catch (error) {
    console.error("Error restoring member:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore member",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/members/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = BigInt(params.id);
    const body = await req.json();

    const { email, role_id, title, name, surname, phone, citizen_id } = body;

    const existing = await prisma.member.findUnique({
      where: { member_id: memberId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // email ซ้ำไหม
    if (email && email !== existing.email) {
      const emailExists = await prisma.member.findFirst({
        where: { email, delete_date: null, member_id: { not: memberId } },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.member.update({
      where: { member_id: memberId },
      data: {
        email: email ?? existing.email,
        role_id: role_id ?? existing.role_id,
        title: title ?? existing.title,
        name: name ?? existing.name,
        surname: surname ?? existing.surname,
        phone: phone ?? existing.phone,
        citizen_id: citizen_id ?? existing.citizen_id,
        modify_date: new Date(),
      },
    });

    // ดึง role แยก
    const role = updated.role_id
      ? await prisma.role.findUnique({ where: { role_id: updated.role_id } })
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...stripPassword(updated),
        member_id: updated.member_id.toString(),
        role: role
          ? { role_id: role.role_id, role_name: role.role_name, note: role.note }
          : null,
      },
      message: "Member updated successfully",
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update member",
        message: error instanceof Error ? error.message : "Unknown error",
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
  { params }: { params: { id: string } }
) {
  try {
    const memberId = BigInt(params.id);

    const existing = await prisma.member.findUnique({
      where: { member_id: memberId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    await prisma.member.update({
      where: { member_id: memberId },
      data: { delete_date: new Date(), modify_date: new Date() },
    });

    return NextResponse.json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete member",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
