// src/engine/matterSession.js
import Matter from 'matter-js';

export function createMatterSession({ gravityY = 1 } = {}) {
  const engine = Matter.Engine.create({ enableSleeping: true });
  engine.gravity.y = gravityY;

  const world = engine.world;
  const runner = Matter.Runner.create();

  // Listener registry for easy cleanup
  const listeners = [];
  const on = (target, evt, fn) => {
    Matter.Events.on(target, evt, fn);
    listeners.push(() => Matter.Events.off(target, evt, fn));
  };

  const start = () => Matter.Runner.run(runner, engine);

  const destroy = () => {
    // remove all listeners we attached
    for (const off of listeners.splice(0)) {
      try { off(); } catch (_) {}
    }
    try { Matter.Runner.stop(runner); } catch (_) {}
    try { Matter.World.clear(world, false); } catch (_) {}
    try { Matter.Engine.clear(engine); } catch (_) {}
  };

  return { Matter, engine, world, runner, on, start, destroy };
}


