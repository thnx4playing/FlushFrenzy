import Matter from 'matter-js';

// Self-contained constants so this file works without other imports
const MAX_AIM_LEN = 160;    // px clamp for slingshot pull
const MAX_IMPULSE = 0.10;   // tune 0.06–0.14 if throws feel weak/strong

export default function Input(entities, { touches }) {
  const state = entities.state;         // your HUD/charge state object
  const tpEnt = entities.tp;            // toilet paper entity key (renderer uses entities.tp)
  if (!tpEnt?.body) return entities;    // safety

  const tp = tpEnt.body;

  // START: begin aiming + charging, freeze current velocity
  touches.filter(t => t.type === 'start').forEach(t => {
    state.aiming = true;
    state.isCharging = true;
    state.charge = 0;
    state.chargeDir = 1;

    // "Anchor" at current toilet paper position; drag from finger
    state.dragStart = { x: tp.position.x, y: tp.position.y };
    state.dragCurrent = { x: t.event.pageX, y: t.event.pageY };

    Matter.Body.setVelocity(tp, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(tp, 0);
  });

  // MOVE: update current drag point
  touches.filter(t => t.type === 'move').forEach(t => {
    state.dragCurrent = { x: t.event.pageX, y: t.event.pageY };
  });

  // END: compute slingshot vector and launch
  touches.filter(t => t.type === 'end').forEach(() => {
    const start = state.dragStart || { x: tp.position.x, y: tp.position.y };
    const cur   = state.dragCurrent || start;

    const dx = start.x - cur.x;
    const dy = start.y - cur.y;
    const len = Math.min(Math.hypot(dx, dy), MAX_AIM_LEN);

    if (len > 4) {
      const nx = dx / (len || 1);
      const ny = dy / (len || 1);
      const strength = len / MAX_AIM_LEN; // 0..1
      const power = strength * (Math.max(0, Math.min(100, state.charge || 0)) / 100) * MAX_IMPULSE;

      // Matter forces are tiny-units; set velocity to zero then push
      Matter.Body.setVelocity(tp, { x: 0, y: 0 });
      Matter.Body.applyForce(tp, tp.position, { x: nx * power, y: ny * power });

      // tiny spin for fun (optional)
      Matter.Body.setAngularVelocity(tp, 0.2 * power);
    }

    state.isCharging = false;
    state.aiming = false;
  });

  return entities;
}
