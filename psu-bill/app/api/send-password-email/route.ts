import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordEmail } from '@/lib/email';

/**
 * POST /api/send-password-email
 * Send password notification email to a member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, fullname, username, password, isReset } = body;

    // Validate required fields
    if (!to || !fullname || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: to, username, password',
        },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendPasswordEmail(to, fullname, username, password, isReset || false);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Password email sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending password email:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send password email',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
