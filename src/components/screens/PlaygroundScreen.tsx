import type { ReactNode } from 'react';

export interface PlaygroundScreenProps {
  children: ReactNode;
}

export function PlaygroundScreen({ children }: PlaygroundScreenProps) {
  return <>{children}</>;
}
