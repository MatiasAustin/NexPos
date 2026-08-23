import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "NexPos System",
  description: "Modern POS System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased print:h-auto">
      <body className="min-h-full flex flex-col bg-[#121214] text-gray-100 font-sans print:block print:min-h-0 print:bg-white">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
