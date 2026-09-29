import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
        },
        { status: 400 }
      );
    }

    const result = await validateUser(username, password);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      },
      { status: 500 }
    );
  }
}
