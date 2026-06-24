import type { ReactNode } from 'react';

export interface ShopScreenProps {
  children: ReactNode;
}

export function ShopScreen({ children }: ShopScreenProps) {
  return <>{children}</>;
}
