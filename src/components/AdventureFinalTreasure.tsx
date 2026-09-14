export type AdventureFinalTreasurePhase = 'hidden' | 'closed' | 'opening' | 'open';

interface AdventureFinalTreasureProps {
  phase: AdventureFinalTreasurePhase;
  closedImage: string;
  openImage: string;
  effectImage: string;
  onOpen: () => void;
  className?: string;
}

export function AdventureFinalTreasure({ phase, closedImage, openImage, effectImage, onOpen, className = '' }: AdventureFinalTreasureProps) {
  if (phase === 'hidden') return null;
  return <button type="button" className={`lava-core-final-treasure-button ${className}`} disabled={phase !== 'closed'} onClick={onOpen} aria-label={phase === 'closed' ? '최종 보물상자 열기' : '열린 최종 보물상자'}><img className="lava-core-final-treasure" src={phase === 'open' ? openImage : closedImage} alt="" draggable={false} />{phase === 'opening' && <img className="lava-core-final-treasure-effect" src={effectImage} alt="" aria-hidden="true" />}</button>;
}
