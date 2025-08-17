// Minimal safe wrapper around matter-js lifecycle
import { Engine, World, Runner, Events } from 'matter-js';

export function createMatterSession(engineOpts = {}) {
  const engine = Engine.create(engineOpts);
  const runner = Runner.create();
  const world = engine.world;
  const off = [];

  const on = (target, name, fn) => {
    if (!target || !fn) return;           // <- prevents "events of null"
    Events.on(target, name, fn);
    off.push(() => {
      try { Events.off(target, name, fn); } catch {}
    });
  };

  Runner.run(runner, engine);             // correct modern API

  return {
    engine, runner, world, on, off,
    stopped: false,
    stop() {
      if (this.stopped) return;
      this.stopped = true;
      try { off.forEach(fn => fn()); } catch {}
      try { Runner.stop(runner); } catch {}
      try { World.clear(world, false); } catch {}
      try { Engine.clear(engine); } catch {}
    }
  };
}



