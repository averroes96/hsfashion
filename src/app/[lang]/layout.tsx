import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: "HS Fashion Catalog",
  description: "Digital Showroom for HS Fashion products",
};

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

  return (
    <html lang={lang} dir={dir} className={`${inter.variable} ${cairo.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={mainFontClass}>
        {children}
      </body>
    </html>
  );
}
