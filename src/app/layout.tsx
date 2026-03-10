import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "教学管理系统",
  description: "学生、班级、考勤、缴费、作业管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`${inter.className} h-full bg-gradient-to-br from-gray-50 to-gray-100`}>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-4">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
            © 2026 教学管理系统. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
