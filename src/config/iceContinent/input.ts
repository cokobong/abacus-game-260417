export type IceAction = 'up' | 'down' | 'left' | 'right' | 'actionA' | 'actionB';
export type IceInputSource = 'keyboard' | 'touch' | 'gamepad';

export const ICE_KEYBOARD_ACTIONS: Readonly<Record<string, IceAction>> = {
  KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right',
  KeyK: 'actionA', KeyL: 'actionB',
};

// Inputs from a future touch or gamepad adapter use the same actions. Only the keyboard
// and touch adapters are connected in the Stage 1 prototype.
export function createIceInput() {
  const held = new Set<string>();
  let actionAPresses = 0;
  let actionBPresses = 0;
  const key = (source: IceInputSource, action: IceAction) => `${source}:${action}`;
  const isHeld = (action: IceAction) => (['keyboard', 'touch', 'gamepad'] as const).some(source => held.has(key(source, action)));
  return {
    set(source: IceInputSource, action: IceAction, pressed: boolean) {
      const before = isHeld(action);
      if (pressed) held.add(key(source, action)); else held.delete(key(source, action));
      if (action === 'actionA' && !before && isHeld(action)) actionAPresses += 1;
      if (action === 'actionB' && !before && isHeld(action)) actionBPresses += 1;
    },
    clearSource(source: IceInputSource) {
      for (const entry of held) if (entry.startsWith(`${source}:`)) held.delete(entry);
    },
    held: isHeld,
    consumeActionA() {
      if (!actionAPresses) return false;
      actionAPresses -= 1;
      return true;
    },
    consumeActionB() {
      if (!actionBPresses) return false;
      actionBPresses -= 1;
      return true;
    },
  };
}

export type IceInput = ReturnType<typeof createIceInput>;
