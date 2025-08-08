export default function ChargeSystem(entities, { time }) {
  const state = entities.state;
  if (!state?.isCharging) return entities;

  const dt = (time?.delta || 16.6) / 1000;
  const SPEED = 170; // percent per second, 0↔100 ping-pong

  state.charge += state.chargeDir * SPEED * dt;
  if (state.charge >= 100) { state.charge = 100; state.chargeDir = -1; }
  if (state.charge <= 0)   { state.charge = 0;   state.chargeDir =  1; }

  return entities;
}
