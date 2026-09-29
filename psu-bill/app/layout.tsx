import type { Metadata } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "@/styles/globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";

const baiJamjuree = Bai_Jamjuree({
  weight: ['200', '300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: "--font-bai-jamjuree",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PSU Bill - ระบบคิดค่าน้ำค่าไฟ",
  description: "ระบบคำนวณค่าน้ำค่าไฟ Prince of Songkla University",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${baiJamjuree.variable} antialiased`}
      >
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
