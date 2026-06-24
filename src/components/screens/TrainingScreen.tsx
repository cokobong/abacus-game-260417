import type { ReactNode } from 'react';

export interface TrainingScreenProps {
  children: ReactNode;
}

export function TrainingScreen({ children }: TrainingScreenProps) {
  return <>{children}</>;
}
