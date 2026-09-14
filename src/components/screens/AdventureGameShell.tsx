import type { OwnedDinosaur } from '../../types/game';
import { LavaPathPrototype } from './LavaPathPrototype';
import { SkyIslandPrototype } from './SkyIslandPrototype';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import type { AdventureStageNumber } from '../../config/adventureStageCatalog';

export interface AdventureGameShellProps {
  key?: string;
  gameId: string;
  stageNumber: AdventureStageNumber;
  dinosaur: OwnedDinosaur;
  onExit: () => void;
  runId: string;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
  relicPartCount?: number;
  fossilFragmentIds?: number[];
  externalMainModalOpen?: boolean;
}

export function AdventureGameShell({ gameId, stageNumber, dinosaur, onExit, runId, onFinishRun, onRetry, relicPartCount, fossilFragmentIds, externalMainModalOpen }: AdventureGameShellProps) {
  if (gameId === 'lava-stepping-stones') {
    return <LavaPathPrototype stageNumber={stageNumber} dinosaur={dinosaur} onExit={onExit} runId={runId} onFinishRun={onFinishRun} onRetry={onRetry} relicPartCount={relicPartCount} fossilFragmentIds={fossilFragmentIds} externalMainModalOpen={externalMainModalOpen} />;
  }

  if (gameId === 'sky-number-clouds') {
    return <SkyIslandPrototype stageNumber={stageNumber} dinosaur={dinosaur} onExit={onExit} runId={runId} onFinishRun={onFinishRun} onRetry={onRetry} relicPartCount={relicPartCount} fossilFragmentIds={fossilFragmentIds} externalMainModalOpen={externalMainModalOpen} />;
  }

  return (
    <section className="grid h-full min-h-0 place-items-center bg-amber-50 p-5 text-center">
      <div>
        <h1 className="text-2xl font-black text-amber-950">모험을 준비하고 있어요</h1>
        <button type="button" onClick={onExit} className="mt-5 min-h-12 rounded-[18px] bg-emerald-500 px-5 font-black text-white">
          탐험 지도로 돌아가기
        </button>
      </div>
    </section>
  );
}
