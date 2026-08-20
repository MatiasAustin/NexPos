import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexPos System",
  description: "Modern POS System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#121214] text-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}
