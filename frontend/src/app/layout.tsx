import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { SaasSettingsProvider } from "@/contexts/SaasSettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "NexPos System",
  description: "Modern POS System",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch once on the server — no flash, no extra client round-trip
  const { data: saasSettings } = await supabase
    .from('saas_settings')
    .select('app_name, app_logo, logo_show_background, support_email, support_phone, maintenance_mode, plan_starter_price, plan_pro_price, plan_enterprise_price')
    .limit(1)
    .maybeSingle();

  const settings = saasSettings || { app_name: '', app_logo: '', logo_show_background: false };
  const faviconUrl = settings.app_logo || null;
  const pageTitle = settings.app_name ? `${settings.app_name}` : 'NexPos System';

  return (
    <html lang="en" className="h-full antialiased print:h-auto">
      <head>
        {/* Dynamic favicon — uses the app logo set by super admin */}
        {faviconUrl ? (
          <link rel="icon" href={faviconUrl} type="image/png" />
        ) : (
          <link rel="icon" href="/favicon.ico" />
        )}
        <title>{pageTitle}</title>
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
      <body className="min-h-full w-full max-w-full overflow-x-hidden flex flex-col bg-background text-text-primary font-sans print:block print:min-h-0 print:bg-white print:w-[58mm] print:mx-auto print:overflow-visible transition-colors duration-300">
        <ThemeProvider>
          <SaasSettingsProvider settings={settings}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SaasSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
