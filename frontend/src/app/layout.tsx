import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleProvider from "./google-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FreshCart",
    template: "%s | FreshCart",
  },
  description: "Fresh choices, every day. Shop everyday groceries with FreshCart.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <GoogleProvider>{children}</GoogleProvider>
      </body>
    </html>
  );
}