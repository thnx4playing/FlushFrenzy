import Matter from 'matter-js';

const MAX_AIM_LEN = 160;    // px clamp for slingshot pull
const MAX_LAUNCH_V = 18;    // pixels per frame (try 14–22 to taste)

export default function Input(entities, { touches }) {
  const state = entities.state;
  const tpEnt = entities.tp;
  if (!tpEnt?.body) return entities;
  const tp = tpEnt.body;

  // START: begin aiming + charging, freeze current velocity
  touches.filter(t => t.type === 'start').forEach(t => {
    state.aiming = true;
    state.isCharging = true;
    state.charge = 0;
    state.chargeDir = 1;

    state.dragStart   = { x: tp.position.x, y: tp.position.y };
    state.dragCurrent = { x: t.event.pageX, y: t.event.pageY };

    Matter.Body.setVelocity(tp, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(tp, 0);
  });

  // MOVE: update current drag point
  touches.filter(t => t.type === 'move').forEach(t => {
    state.dragCurrent = { x: t.event.pageX, y: t.event.pageY };
  });

  // END: compute slingshot vector and launch with initial velocity
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
      const power = strength * (Math.max(0, Math.min(100, state.charge || 0)) / 100);

      // Set an immediate launch velocity instead of applyForce
      const vx = nx * (power * MAX_LAUNCH_V);
      const vy = ny * (power * MAX_LAUNCH_V);
      Matter.Body.setVelocity(tp, { x: vx, y: vy });

      // A little spin for flair
      Matter.Body.setAngularVelocity(tp, 0.15 * power);
    }

    state.isCharging = false;
    state.aiming = false;
  });

  return entities;
}
