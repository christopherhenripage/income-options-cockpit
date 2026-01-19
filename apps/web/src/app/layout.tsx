import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DemoBanner } from '@/components/ui/demo-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Income Options Cockpit',
  description: 'Generate income-focused options trade candidates with defined risk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <TooltipProvider>
          <DemoBanner />
          <div className="flex h-screen bg-background grid-bg">
            <Sidebar />
            <main className="flex-1 overflow-auto pt-14 md:pt-0">
              {children}
            </main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
