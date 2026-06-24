import type { ReactNode } from 'react';

export interface DinosaurRoomScreenProps {
  children: ReactNode;
}

export function DinosaurRoomScreen({ children }: DinosaurRoomScreenProps) {
  return <>{children}</>;
}
