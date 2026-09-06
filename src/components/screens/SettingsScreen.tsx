import type { ReactNode } from 'react';

export interface SettingsScreenProps {
  children: ReactNode;
}

export function SettingsScreen({ children }: SettingsScreenProps) {
  return <>{children}</>;
}
