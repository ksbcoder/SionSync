import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export function Layout({ children, hideBottomNav = false }: LayoutProps) {
  return (
    <div className="min-h-svh bg-gray-50">
      {children}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
