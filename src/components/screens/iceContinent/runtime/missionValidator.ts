import { ICE_EVENT_PATTERNS } from '../../../../config/iceContinent/iceEventPatterns';
import { ICE_MAP_TEMPLATES } from '../../../../config/iceContinent/iceMapTemplates';
import { ICE_ISSUE_TOOLS, type IceMissionConfig } from '../../../../config/iceContinent/iceMissionTypes';

export interface IceValidationResult { valid: boolean; errors: string[]; warnings: string[] }
export function validateIceMission(config: IceMissionConfig): IceValidationResult {
  const errors: string[] = []; const warnings: string[] = [];
  if (!config.id) errors.push('mission id가 없습니다.');
  const map = ICE_MAP_TEMPLATES[config.mapTemplate];
  const pattern = ICE_EVENT_PATTERNS[config.eventPatternId];
  if (!map) errors.push(`mapTemplate이 없습니다: ${config.mapTemplate}`);
  if (!pattern) errors.push(`eventPattern이 없습니다: ${config.eventPatternId}`);
  if (!(config.durationSec > 0)) errors.push('durationSec는 0보다 커야 합니다.');
  if (!config.fossilPartIds.length || config.objective.requiredParts.some(part => !config.fossilPartIds.includes(part))) errors.push('objective의 fossil part 참조가 유효하지 않습니다.');
  if (!Number.isInteger(config.production.backlogCapacity) || config.production.backlogCapacity < 1) errors.push('backlogCapacity는 1 이상의 정수여야 합니다.');
  if (![1, 2, 3].includes(config.issues.maxSimultaneous)) errors.push('maxSimultaneous는 1~3이어야 합니다.');
  for (const issue of config.issues.allowedTypes) if (!ICE_ISSUE_TOOLS[issue]) errors.push(`지원하지 않는 issue type입니다: ${issue}`);
  if (config.reward.type !== 'none' && !('id' in config.reward && config.reward.id)) errors.push('reward id가 없습니다.');
  if (map) {
    const machineIds = new Set(map.machines.map(machine => machine.id));
    for (const machineId of Object.keys(config.production.processTimes)) if (!machineIds.has(machineId)) errors.push(`processTimes machine 참조가 없습니다: ${machineId}`);
    if (pattern) {
      for (const slot of pattern.slots) for (const candidate of slot.candidates) {
        if (!config.issues.allowedTypes.includes(candidate.issueType)) errors.push(`${slot.id}의 issue가 mission에서 허용되지 않습니다: ${candidate.issueType}`);
        if (!ICE_ISSUE_TOOLS[candidate.issueType]) errors.push(`${candidate.issueType}의 required tool이 없습니다.`);
        for (const target of candidate.targetMachineIds) if (!machineIds.has(target)) errors.push(`${slot.id}의 machine 참조가 없습니다: ${target}`);
      }
    }
    if (map.queueAnchors.length < config.production.backlogCapacity) warnings.push('queue anchor가 backlogCapacity보다 적어 마지막 anchor를 공유합니다.');
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function assertIceMission(config: IceMissionConfig) {
  const result = validateIceMission(config);
  if (!result.valid) throw new Error(`[Ice mission ${config.id}] ${result.errors.join(' / ')}`);
  return result;
}
