// src/game/physics.ts
import Matter from 'matter-js';
const { Engine, Render, World, Runner, Events, Composite } = Matter;

export type WorldHandles = {
  engine: Matter.Engine;
  runner: Matter.Runner | null;
  unsubscribe: () => void; // remove any Events.* listeners you registered
};

export function buildWorld(
  canvasEl: HTMLCanvasElement | null,
  size: { width: number; height: number },
  cfg: { gravityY: number; haveWalls: boolean }
): WorldHandles {
  const engine = Engine.create();
  engine.world.gravity.y = cfg.gravityY;

  // If you use your own renderer layer, skip Render.create/start.
  // If you render with Matter.Render (web/dev), keep this guarded.
  let runner: Matter.Runner | null = null;

  // Walls
  if (cfg.haveWalls) {
    const thick = 80;
    const w = size.width;
    const h = size.height;
    const opts = { isStatic: true, label: 'BOUNDARY' };
    const bodies = [
      Matter.Bodies.rectangle(w / 2, h + thick / 2, w, thick, opts), // floor
      Matter.Bodies.rectangle(w / 2, -thick / 2, w, thick, opts),     // ceiling
      Matter.Bodies.rectangle(-thick / 2, h / 2, thick, h, opts),     // left
      Matter.Bodies.rectangle(w + thick / 2, h / 2, thick, h, opts),  // right
    ];
    World.add(engine.world, bodies);
  }

  // Example: centralize your event subscriptions so they're easy to remove
  const onAfterUpdate = () => {
    // per-frame logic here
  };
  Events.on(engine, 'afterUpdate', onAfterUpdate);

  // If you use Matter.Runner
  runner = Runner.create();
  Runner.run(runner, engine);

  return {
    engine,
    runner,
    unsubscribe: () => Events.off(engine, 'afterUpdate', onAfterUpdate),
  };
}

export function destroyWorld(handles: WorldHandles) {
  try {
    handles.unsubscribe?.();
  } catch {}
  try {
    if (handles.runner) {
      Matter.Runner.stop(handles.runner);
    }
  } catch {}
  try {
    // Clear all bodies/constraints & the engine
    Matter.Composite.clear(handles.engine.world, true);
    Matter.Engine.clear(handles.engine);
  } catch {}
}


