import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/app-shell';
import { LearningProvider } from '@/contexts/learning-context';
import { PaperTradingProvider } from '@/contexts/paper-trading-context';

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
        <LearningProvider>
          <PaperTradingProvider>
            <TooltipProvider>
              <AppShell>
                {children}
              </AppShell>
            </TooltipProvider>
          </PaperTradingProvider>
        </LearningProvider>
      </body>
    </html>
  );
}
