import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BookRecommendationChat from "@/components/BookRecommendationChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manos Library",
  description: "Read, Learn, Grow",
  icons: {
    icon: '/favicon.svg',
  },
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
