import { getItemConfig } from '../config/itemConfig';
import type { AdventureArea, AdventureRewardCandidate } from '../data/adventures';

export type AdventureReward = AdventureRewardCandidate & {
  name: string;
};

export type AdventureRunResult = {
  areaId: string;
  areaTitle: string;
  message: string;
  companionMessage: string;
  rewards: AdventureReward[];
  hasDexHint: boolean;
  ranAt: number;
};

export function createAdventureResult(area: AdventureArea, companionName: string, seed = Date.now()): AdventureRunResult {
  const rewardCount = area.id === 'forest-walk' ? 2 : 3;
  const startIndex = area.rewardCandidates.length > 0 ? seed % area.rewardCandidates.length : 0;
  const rewards = Array.from({ length: Math.min(rewardCount, area.rewardCandidates.length) }, (_, index) => area.rewardCandidates[(startIndex + index) % area.rewardCandidates.length]).map(toAdventureReward);

  return {
    areaId: area.id,
    areaTitle: area.title,
    message: `${area.title}을 탐험하고 보물을 찾았어요!`,
    companionMessage: createCompanionMessage(area.id, companionName),
    rewards,
    hasDexHint: rewards.some((reward) => reward.type === 'dexHint'),
    ranAt: seed,
  };
}

function createCompanionMessage(areaId: string, companionName: string) {
  if (areaId === 'forest-walk') return `${companionName}와 함께 숲길을 걸었어요. 풀숲에서 반짝이는 조각이 보였어요.`;
  if (areaId === 'sparkle-river') return `${companionName}가 물가의 반짝임을 보고 신기해했어요. 도감 단서도 찾은 것 같아요.`;
  return `${companionName}와 함께 낯선 길을 살펴봤어요.`;
}

function toAdventureReward(candidate: AdventureRewardCandidate): AdventureReward {
  const item = candidate.itemId ? getItemConfig(candidate.itemId) : null;
  return {
    ...candidate,
    name: item?.name ?? candidate.label,
  };
}
