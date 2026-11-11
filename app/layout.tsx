import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Cairo } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["800", "900"],
});

export const metadata: Metadata = {
  title: "AutoParts Hub",
  description: "نظام إدارة قطع غيار السيارات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      {/* suppressHydrationWarning هنا يتجاهل فقط الخصائص اللي تضيفها إضافات المتصفح على هذا العنصر */}
      <body className={`${plex.variable} ${cairo.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
