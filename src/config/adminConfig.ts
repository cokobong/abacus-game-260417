export const ADMIN_PIN = '9545';

export const ADMIN_LIMITS = {
  coins: { min: 0, max: 9_999_999 },
  quantity: { min: 0, max: 999 },
  maxChangeLogs: 50,
} as const;
