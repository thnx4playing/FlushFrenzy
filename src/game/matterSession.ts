import Matter, { Engine, World, Bodies, Body, Events, Runner } from 'matter-js';

export type MatterSession = {
  engine: Matter.Engine;
  runner: Matter.Runner;
  world: Matter.World;
  teardown: () => void;
};

export function createMatterSession(): MatterSession {
  const engine = Engine.create({ enableSleeping: false });
  const world  = engine.world;
  const runner = Runner.create();

  // You'll attach listeners outside and keep references so we can remove them
  const attached: Array<{ target: any; event: string; handler: Function }> = [];

  function on(target: any, event: string, handler: any) {
    Events.on(target, event, handler);
    attached.push({ target, event, handler });
  }

  // expose helper
  (engine as any).__on = on;

  function teardown() {
    try {
      // remove every event we attached
      attached.forEach(({ target, event, handler }) =>
        Events.off(target, event, handler)
      );
      attached.length = 0;
    } catch {}

    try { Runner.stop(runner); } catch {}
    try { World.clear(world, false); } catch {}
    try { Engine.clear(engine); } catch {}

    // If you ever used Render (web), also stop & clear it here.
    // If you used any requestAnimationFrame loops, cancel them here as well.
  }

  return { engine, runner, world, teardown };
}

// Utility: rebuild the four walls every time; no "isBuilt" flags.
export function addWalls(world: Matter.World, W: number, H: number) {
  const thickness = 80;
  const halfT = thickness / 2;
  const opts: Matter.IBodyDefinition = {
    isStatic: true,
    label: 'BOUNDARY',
    restitution: 0.2,
    friction: 0.8,
  };
  const walls = [
    Bodies.rectangle(W / 2, H + halfT, W, thickness, opts), // floor
    Bodies.rectangle(W / 2, -halfT,  W, thickness, opts),   // ceiling
    Bodies.rectangle(-halfT, H / 2,  thickness, H * 2, opts), // left
    Bodies.rectangle(W + halfT, H / 2, thickness, H * 2, opts), // right
  ];
  World.add(world, walls);
}
