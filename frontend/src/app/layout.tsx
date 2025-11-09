import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BookRecommendationChat from "@/components/BookRecommendationChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Library Management System",
  description: "Manage your library books, inventory, and borrowing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <BookRecommendationChat />
      </body>
    </html>
  );
}
