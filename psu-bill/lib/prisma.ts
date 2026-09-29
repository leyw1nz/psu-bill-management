import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// ✅ Export ได้ทั้ง 2 แบบ
export { prisma };
export default prisma;

// ❌ ลบ export async function disconnectPrisma() ออก
// สาเหตุ: การสั่ง disconnect แบบ manual ใน Serverless/Next.js environment
// จะทำให้ Connection Pool ถูกปิด และ Request ถัดไปจะพังทันทีครับ

// ✅ ปรับปรุงฟังก์ชันเช็ค Connection ให้ปลอดภัย
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // ใช้วิธี Query ข้อมูลเล็กๆ แทนการ connect/disconnect
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}