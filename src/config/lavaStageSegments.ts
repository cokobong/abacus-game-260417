export type LavaRoute = 'lower' | 'middle' | 'high' | 'top' | 'upper' | 'secret';
export type LavaPlatformBehavior = 'static' | 'moving' | 'crumbling';
export interface LavaPlatform { id: number; x: number; width: number; height: number; route?: Exclude<LavaRoute, 'lower'>; behavior?: LavaPlatformBehavior; baseHeight?: number; motionPhase?: number; crumbleStartedAt?: number; collapsed?: boolean }
export interface LavaSegment { kind: 'ground' | 'upper' | 'branch' | 'return'; length: number; platforms: ReadonlyArray<{ offset: number; width: number; height: number }> }

// Coordinates use playfield width/height percentages, like the existing runner.
// One-way surfaces: rising jumps pass through, descending feet land on top.
export const LAVA_STAGE_TWO_SEGMENTS: readonly LavaSegment[] = [
  { kind: 'ground', length: 150, platforms: [] },
  { kind: 'upper', length: 150, platforms: [{ offset: 0, width: 65, height: 14 }] },
  { kind: 'branch', length: 180, platforms: [{ offset: 0, width: 45, height: 14 }, { offset: 57, width: 60, height: 18 }] },
  { kind: 'return', length: 130, platforms: [{ offset: 0, width: 45, height: 14 }] },
];
export const LAVA_STAGE_TWO_MAX_PLATFORMS = 4;

export const LAVA_STAGE_THREE_SEGMENTS = [
  { phase: 'opening', length: 142, platforms: [{ offset: 8, width: 36, height: 12, route: 'middle', behavior: 'static' }, { offset: 57, width: 31, height: 21, route: 'high', behavior: 'moving' }] },
  { phase: 'opening', length: 148, platforms: [{ offset: 0, width: 43, height: 13, route: 'middle', behavior: 'static' }, { offset: 55, width: 30, height: 22, route: 'high', behavior: 'crumbling' }] },
  { phase: 'middle', length: 158, platforms: [{ offset: 3, width: 34, height: 13, route: 'middle', behavior: 'moving' }, { offset: 46, width: 30, height: 23, route: 'high', behavior: 'static' }, { offset: 88, width: 25, height: 32, route: 'top', behavior: 'crumbling' }] },
  { phase: 'middle', length: 162, platforms: [{ offset: 0, width: 35, height: 14, route: 'middle', behavior: 'crumbling' }, { offset: 45, width: 31, height: 23, route: 'high', behavior: 'moving' }, { offset: 87, width: 26, height: 32, route: 'top', behavior: 'static' }] },
  { phase: 'final', length: 168, platforms: [{ offset: 0, width: 32, height: 14, route: 'middle', behavior: 'moving' }, { offset: 42, width: 29, height: 23, route: 'high', behavior: 'crumbling' }, { offset: 81, width: 27, height: 32, route: 'top', behavior: 'moving' }] },
] as const;
export const LAVA_STAGE_THREE_MAX_PLATFORMS = 7;

export function getLavaLandingHeight(platforms: readonly LavaPlatform[], playerX: number, previousY: number, nextY: number, velocity: number): number | null {
  if (velocity > 0) return null;
  let landing: number | null = nextY <= 0 ? 0 : null;
  for (const platform of platforms) {
    if (platform.collapsed) continue;
    if (playerX >= platform.x && playerX <= platform.x + platform.width && previousY >= platform.height && nextY <= platform.height) {
      landing = Math.max(landing ?? 0, platform.height);
    }
  }
  return landing;
}

export function isOnLavaPlatform(platforms: readonly LavaPlatform[], playerX: number, y: number) {
  return y === 0 || platforms.some(platform => !platform.collapsed && playerX >= platform.x && playerX <= platform.x + platform.width && Math.abs(y - platform.height) < .1);
}

export function getLavaPlatformAt(platforms: readonly LavaPlatform[], playerX: number, height: number) {
  return platforms.find(platform => !platform.collapsed && playerX >= platform.x && playerX <= platform.x + platform.width && Math.abs(height - platform.height) < .25);
}
