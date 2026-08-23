import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PromoBanner from "@/components/PromoBanner";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: '--font-cairo' });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "HS Fashion Catalog",
  description: "Digital Showroom for HS Fashion products",
};

import prisma from '@/lib/prisma';
import { getDictionary, Locale } from '@/lib/dictionaries';
import AppBottomNav from "@/components/AppBottomNav";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const mainFontClass = lang === 'ar' ? cairo.className : inter.className;
  
  let settings = null;
  let dict = null;
  try {
    const [fetchedSettings, fetchedDict] = await Promise.all([
      prisma.storeSettings.findUnique({ where: { id: 'default' } }),
      getDictionary(lang as Locale)
    ]);
    settings = fetchedSettings;
    dict = fetchedDict;
  } catch (e) {
    // ignore
  }

  return (
    <html lang={lang} dir={dir} className={`${inter.variable} ${cairo.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={mainFontClass}>
        <CartProvider>
          <PromoBanner message={settings?.promoMessage} />
          {children}
          <AppBottomNav lang={lang} dict={dict} phoneNumber={settings?.phoneNumber} />
          <CartDrawer lang={lang} dict={dict} />
          <Analytics />
          <SpeedInsights />
        </CartProvider>
      </body>
    </html>
  );
}
