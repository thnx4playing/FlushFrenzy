const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
 const state={musicMuted:false,musicVolume:0.6,sfxMuted:false,sfxVolume:0.4};
 let subscriber, modes=0;
 const sounds=[];
 const sound=()=>{const s={status:{shouldPlay:false},replays:0,
 async setStatusAsync(update){Object.assign(this.status,update)},
 async stopAsync(){this.status.shouldPlay=false},
 async replayAsync(){this.replays++;this.status.shouldPlay=true},
 async unloadAsync(){this.status.shouldPlay=false}};sounds.push(s);return s};
 const context={Audio:{async setAudioModeAsync(){modes++},Sound:{async createAsync(){return {sound:sound()}}}},
 useAudioStore:{getState:()=>state,subscribe:fn=>{subscriber=fn;return()=>{}}},require:()=>0};
 let source=fs.readFileSync(require('node:path').join(__dirname,'../src/audio/AudioManager.js'),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const AudioManager =','globalThis.manager =');
 vm.runInNewContext(source,context);
 return {manager:context.manager,state,sounds,change:async patch=>{Object.assign(state,patch);subscriber?.(state);await Promise.resolve()},modes:()=>modes};
}
test('initialization and volume changes do not start idle menu music',async()=>{
 const f=setup();await f.manager.init();await f.change({musicVolume:1});assert.equal(f.sounds[0].status.shouldPlay,false);
});
test('overlay pauses and mutes all game sounds, blocks replay and preserves call audio session',async()=>{
 const f=setup();await f.manager.playGameMusic();await f.manager.playSfx('ding');
 const hold=f.manager.acquireSilence();await hold.ready;const modes=f.modes();
 await f.change({musicVolume:1,sfxVolume:1});await f.manager.resumeMusic();await f.manager.playSfx('ding');
 for(const s of [f.manager._music,...Object.values(f.manager._sfx)]){assert.equal(s.status.shouldPlay,false);assert.equal(s.status.isMuted,true);assert.equal(s.status.volume,0)}
 assert.equal(f.modes(),modes);assert.equal(f.sounds[1].replays,1);
 hold.release();await Promise.resolve();assert.equal(f.manager._music.status.shouldPlay,true);assert.equal(f.sounds[1].status.shouldPlay,false);
});
test('stop while open prevents music restarting on close; holds release independently',async()=>{
 const f=setup();await f.manager.playGameMusic();const a=f.manager.acquireSilence(),b=f.manager.acquireSilence();await Promise.all([a.ready,b.ready]);
 a.release();a.release();assert.equal(f.manager._music.status.shouldPlay,false);
 await f.manager.stopMusic();b.release();await f.change({musicVolume:0.8});assert.equal(f.manager._music.status.shouldPlay,false);
});
test('opening before initialization does not configure shared audio or create sounds',async()=>{
 const f=setup();const h=f.manager.acquireSilence();await h.ready;await f.manager.playSfx('ding');await f.manager.stopMusic();assert.equal(f.modes(),0);assert.equal(f.sounds.length,0);h.release();
});
test('silence acquired during a pending music restart wins',async()=>{
 const f=setup();await f.manager.playGameMusic();let finish;f.manager._music.stopAsync=()=>new Promise(resolve=>{finish=resolve});
 const playing=f.manager.playGameMusic();await Promise.resolve();await Promise.resolve();assert.ok(finish);
 const h=f.manager.acquireSilence();await h.ready;finish();await playing;assert.equal(f.manager._music.status.shouldPlay,false);assert.equal(f.manager._music.status.volume,0);
});
