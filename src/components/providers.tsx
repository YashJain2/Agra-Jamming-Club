"use client";

import { createContext, useContext, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

interface AppContextType {
  // Add any global state here
  theme?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppContext.Provider value={{}}>
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within a Providers');
  }
  return context;
}