import type { RewardBundleConfig } from '../config/rewardConfig';
import type { DinosaurState, EggState, PlayerState, Reward, RewardReason, RewardType } from '../types/game';

export interface DummyGameState {
  player: PlayerState;
  dinosaur: DinosaurState;
  egg: EggState;
}

let rewardSequence = 0;

const rewardLabels: Record<RewardType, string> = {
  coin: '코인',
  exp: '공룡 EXP',
  hatch_progress: '알 부화 게이지',
  dinosaur_mood: '공룡 기분',
};

function formatRewardAmount(type: RewardType, amount: number) {
  return type === 'hatch_progress' ? `+${amount}%` : `+${amount}`;
}

function createReward(reason: RewardReason, type: RewardType, amount: number, targetId: string | null): Reward {
  rewardSequence += 1;

  return {
    id: `reward-${Date.now()}-${rewardSequence}`,
    reason,
    type,
    amount,
    targetId,
    label: `${rewardLabels[type]} ${formatRewardAmount(type, amount)}`,
    grantedAt: null,
  };
}

export function createRewardsFromBundle(reason: RewardReason, bundle: RewardBundleConfig, targets: { dinosaurId: string; eggId: string }): Reward[] {
  const rewards: Reward[] = [
    createReward(reason, 'coin', bundle.coins, null),
    createReward(reason, 'hatch_progress', bundle.hatchProgress, targets.eggId),
    createReward(reason, 'exp', bundle.dinoExp, targets.dinosaurId),
  ];

  if (bundle.dinosaurMood > 0) {
    rewards.push(createReward(reason, 'dinosaur_mood', bundle.dinosaurMood, targets.dinosaurId));
  }

  return rewards.filter((reward) => reward.amount !== 0);
}

export function applyRewardsToDummyState(state: DummyGameState, rewards: Reward[]): DummyGameState {
  return rewards.reduce<DummyGameState>(
    (nextState, reward) => {
      if (reward.type === 'coin') {
        return {
          ...nextState,
          player: {
            ...nextState.player,
            coins: nextState.player.coins + reward.amount,
          },
        };
      }

      if (reward.type === 'hatch_progress') {
        return {
          ...nextState,
          egg: {
            ...nextState.egg,
            hatchProgress: Math.min(100, nextState.egg.hatchProgress + reward.amount),
          },
        };
      }

      if (reward.type === 'exp') {
        return {
          ...nextState,
          dinosaur: {
            ...nextState.dinosaur,
            exp: Math.min(100, nextState.dinosaur.exp + reward.amount),
          },
        };
      }

      if (reward.type === 'dinosaur_mood') {
        return {
          ...nextState,
          dinosaur: {
            ...nextState.dinosaur,
            mood: Math.min(100, nextState.dinosaur.mood + reward.amount),
          },
        };
      }

      return nextState;
    },
    state,
  );
}

export function formatRewardSummary(rewards: Reward[]) {
  return rewards.map((reward) => reward.label).join(', ');
}

export function formatRewardBundleSummary(bundle: RewardBundleConfig) {
  const parts = [bundle.coins ? `코인 +${bundle.coins}` : null, bundle.hatchProgress ? `알 부화 게이지 +${bundle.hatchProgress}%` : null, bundle.dinoExp ? `공룡 EXP +${bundle.dinoExp}` : null].filter(Boolean) as string[];

  if (bundle.dinosaurMood > 0) {
    parts.push(`공룡 기분 +${bundle.dinosaurMood}`);
  }

  return parts.join(', ') || '보상 없음';
}
