// src/game/aimMath.ts
export type Point = { x: number; y: number };
export type AimState = { dir: { dx: number; dy: number }; power: number; origin: Point };

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function computeAimFromAbsolute(
  absX: number,
  absY: number,
  center: Point,
  radius: number,
  invert = false // false = joystick style (arrow points where finger is)
) : AimState {
  const dx = absX - center.x;
  const dy = absY - center.y; // screen coords: down is +y
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    // Default to "up" with zero power so the arrow doesn't snap left
    return { dir: { dx: 0, dy: -1 }, power: 0, origin: center };
  }
  const ux = dx / len;
  const uy = dy / len;
  const dir = invert ? { dx: -ux, dy: -uy } : { dx: ux, dy: uy };
  const power = clamp(len / radius, 0, 1);
  return { dir, power, origin: center };
}

export function aimToVelocity(aim: AimState, baseSpeed: number) {
  const mag = Math.hypot(aim.dir.dx, aim.dir.dy) || 1;
  return {
    x: (aim.dir.dx / mag) * baseSpeed * aim.power,
    y: (aim.dir.dy / mag) * baseSpeed * aim.power,
  };
}



