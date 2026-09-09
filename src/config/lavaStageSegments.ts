export type LavaRoute = 'lower' | 'upper' | 'transition' | 'secret';
export interface LavaPlatform { id: number; x: number; width: number; height: number; route?: Exclude<LavaRoute, 'lower'> }
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

export function getLavaLandingHeight(platforms: readonly LavaPlatform[], playerX: number, previousY: number, nextY: number, velocity: number): number | null {
  if (velocity > 0) return null;
  let landing: number | null = nextY <= 0 ? 0 : null;
  for (const platform of platforms) {
    if (playerX >= platform.x && playerX <= platform.x + platform.width && previousY >= platform.height && nextY <= platform.height) {
      landing = Math.max(landing ?? 0, platform.height);
    }
  }
  return landing;
}

export function isOnLavaPlatform(platforms: readonly LavaPlatform[], playerX: number, y: number) {
  return y === 0 || platforms.some(platform => playerX >= platform.x && playerX <= platform.x + platform.width && Math.abs(y - platform.height) < .01);
}

export function isInLavaReservedZone(platforms: readonly LavaPlatform[], x: number, padding = 8) {
  return platforms.some(platform => platform.route === 'transition' && x >= platform.x - padding && x <= platform.x + platform.width + padding);
}
