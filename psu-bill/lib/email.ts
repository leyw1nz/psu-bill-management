// Server-side email utilities
import nodemailer from 'nodemailer';

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

/**
 * Create email transporter using configuration from .env
 */
function createEmailTransporter() {
  const port = parseInt(process.env.EMAIL_PORT || '587');

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}


export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Recipient email address is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    if (!options.text && !options.html) {
      throw new Error('Email content (text or html) is required');
    }

    // Validate email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_HOST_USER || !process.env.EMAIL_HOST_PASSWORD) {
      throw new Error('Email configuration is missing in .env file');
    }

    // Create transporter
    const transporter = createEmailTransporter();

    // Send email
    const info = await transporter.sendMail({
      from: `"PSU Bill System" <${process.env.EMAIL_SEND || process.env.EMAIL_HOST_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function sendPasswordEmail(
  to: string,
  fullname: string,
  username: string,
  password: string,
  isReset: boolean = false
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const subject = isReset ? 'PSU Bill - แจ้งรหัสผ่านใหม่' : 'PSU Bill - ข้อมูลบัญชีผู้ใช้';

  const html = ``;

  const text = `
เรียน ${fullname}

${isReset
      ? 'รหัสผ่านของคุณได้รับการรีเซ็ตเรียบร้อยแล้ว นี่คือข้อมูลการเข้าสู่ระบบใหม่ของคุณ:'
      : 'บัญชีผู้ใช้ของคุณได้ถูกสร้างเรียบร้อยแล้ว นี่คือข้อมูลการเข้าสู่ระบบของคุณ:'
    }

ชื่อผู้ใช้: ${username}
รหัสผ่าน: ${password}

⚠️ สำคัญ:
- กรุณาเก็บรักษาข้อมูลนี้ไว้เป็นความลับ
- แนะนำให้เปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก
- อย่าแชร์รหัสผ่านให้กับผู้อื่น

หากคุณมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อผู้ดูแลระบบ

© ${new Date().getFullYear()} PSU Bill System. All rights reserved.
อีเมลนี้ถูกส่งอัตโนมัติ กรุณาอย่าตอบกลับ
  `;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}
