import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "드론 장비 대여관리시스템",
  description: "드론 장비 대여관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>
        <AuthSessionProvider>
          <Navbar />
          <main>{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
