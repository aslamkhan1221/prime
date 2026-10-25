import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Prime Studio | Invoice & CRM Suite',
  description: 'Production-ready Invoice Billing and CRM web application for Graphic Design Studios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.className}`}>
      <body className="font-sans antialiased bg-[#0b0f19] text-slate-100 selection:bg-brand-500 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
