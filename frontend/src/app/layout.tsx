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
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: 58mm 210mm;
            margin: 0;
          }
          @media print {
            html, body {
              width: 58mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-[#121214] text-gray-100 font-sans print:block print:min-h-0 print:bg-white print:w-[58mm] print:mx-auto">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
