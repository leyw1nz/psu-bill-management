import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/pay-status
 * Returns all payment status options
 */
export async function GET() {
  try {
    const payStatuses = await prisma.pay_status.findMany({
      orderBy: {
        pay_status_id: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: payStatuses,
    });
  } catch (error) {
    console.error("GET /api/pay-status Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment statuses",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
