import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PromoBanner from "@/components/PromoBanner";
import AppSplashScreen from "@/components/AppSplashScreen";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: '--font-cairo' });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "H.S.Fashion",
  applicationName: "H.S.Fashion",
  description: "H.S.Fashion - Digital Wholesale Footwear & Bags Showroom",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "H.S.Fashion",
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
        <meta name="apple-mobile-web-app-title" content="H.S.Fashion" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={mainFontClass}>
        <AppSplashScreen />
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
