import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: "HS Fashion Catalog",
  description: "Digital Showroom for HS Fashion products",
};

import prisma from '@/lib/prisma';

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
  try {
    settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' }
    });
  } catch (e) {
    // ignore
  }

  return (
    <html lang={lang} dir={dir} className={`${inter.variable} ${cairo.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={mainFontClass}>
        {settings?.promoMessage && (
          <div style={{ 
            background: 'var(--primary)', 
            color: 'white', 
            textAlign: 'center', 
            padding: '0.75rem', 
            fontSize: '0.9rem', 
            fontWeight: 600,
            position: 'relative',
            zIndex: 1000,
            width: '100%'
          }}>
            {settings.promoMessage}
          </div>
        )}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
