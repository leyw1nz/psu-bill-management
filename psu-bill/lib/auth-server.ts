// Server-side authentication utilities (use only in API routes and server components)
import { User } from '@/types';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface LoginResult {
  success: boolean;
  user?: Omit<User, 'password'>;
  message?: string;
}

export async function validateUser(username: string, password: string): Promise<LoginResult> {
  try {
    // Find user by username in the database
    const member = await prisma.member.findFirst({
      where: {
        username: username,
        delete_date: null, // Only get active members
      },
    });

    if (!member) {
      return {
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      };
    }

    // Check if password exists
    if (!member.password) {
      return {
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      };
    }

    // Check password - support both plain text (for migration) and bcrypt
    let isPasswordValid = false;

    // First try bcrypt
    if (member.password.startsWith('$2a$') || member.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, member.password);
    } else {
      // Fallback to plain text comparison for existing passwords
      isPasswordValid = member.password === password;
    }

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      };
    }

    // Map member data to User type
    const user: Omit<User, 'password'> = {
      member_id: member.member_id.toString(),
      citizen_id: member.citizen_id,
      staff_id: member.staff_id,
      email: member.email || '',
      title: member.title,
      name: member.name || '',
      surname: member.surname || '',
      phone: member.phone,
      username: member.username || '',
      role_id: member.role_id,
      create_date: member.create_date,
      modify_date: member.modify_date,
      delete_date: member.delete_date,
      // Backward compatibility fields
      id: member.member_id.toString(),
      firstName: member.name || '',
      lastName: member.surname || '',
      phoneNumber: member.phone || '',
      createdAt: member.create_date?.toISOString() || new Date().toISOString(),
      updatedAt: member.modify_date?.toISOString() || new Date().toISOString(),
    };

    return {
      success: true,
      user,
      message: 'เข้าสู่ระบบสำเร็จ'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    };
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}
