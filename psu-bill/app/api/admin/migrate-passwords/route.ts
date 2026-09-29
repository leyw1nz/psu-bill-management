import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-server';

/**
 * API Route to migrate plain text passwords to bcrypt hashed passwords
 * This should be run once to migrate existing user passwords
 *
 * SECURITY: In production, this route should be protected with admin authentication
 */
export async function POST(request: Request) {
  try {
    // Get all members with non-hashed passwords
    const members = await prisma.member.findMany({
      where: {
        password: {
          not: null,
        },
        delete_date: null,
      },
    });

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const member of members) {
      if (!member.password) {
        skippedCount++;
        continue;
      }

      // Skip if already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (member.password.startsWith('$2a$') || member.password.startsWith('$2b$')) {
        skippedCount++;
        continue;
      }

      try {
        // Hash the plain text password
        const hashedPassword = await hashPassword(member.password);

        // Update the member's password
        await prisma.member.update({
          where: {
            member_id: member.member_id,
          },
          data: {
            password: hashedPassword,
            modify_date: new Date(),
          },
        });

        migratedCount++;
      } catch (error) {
        errors.push(`Failed to migrate password for member ${member.member_id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password migration completed',
      data: {
        total: members.length,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Password migration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to migrate passwords',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
