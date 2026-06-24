import type { ReactNode } from 'react';

export interface DexScreenProps {
  children: ReactNode;
}

export function DexScreen({ children }: DexScreenProps) {
  return <>{children}</>;
}
