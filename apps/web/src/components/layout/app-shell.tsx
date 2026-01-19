'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { DemoBanner } from '@/components/ui/demo-banner';

// Pages that should NOT show the sidebar (full-page layouts)
const FULL_PAGE_ROUTES = ['/', '/login', '/signup'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage = FULL_PAGE_ROUTES.includes(pathname);

  if (isFullPage) {
    return <>{children}</>;
  }

  return (
    <>
      <DemoBanner />
      <div className="flex h-screen bg-background grid-bg">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </>
  );
}
