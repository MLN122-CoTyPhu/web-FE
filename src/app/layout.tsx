import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cờ Tỷ Phú Toàn Cầu",
  description: "Game học tập về Tư Bản Tài Chính & Toàn Cầu Hóa — Chương 4 Mác-Lênin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
