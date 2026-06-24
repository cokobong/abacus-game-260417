import type { ReactNode } from 'react';

export interface HatcheryScreenProps {
  children: ReactNode;
}

export function HatcheryScreen({ children }: HatcheryScreenProps) {
  return <>{children}</>;
}
