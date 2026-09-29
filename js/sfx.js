/* =====================================================================
   VCT MANAGER — sons gerados no navegador (Web Audio), sem arquivos.
   ===================================================================== */
(function () {
"use strict";
var ctx = null, master = null, last = {}, musicTimer = null, musicStep = 0;
var cfg = { sfx:true, music:true, vol:0.6 };
try { var raw = localStorage.getItem("vct_audio"); if (raw) cfg = Object.assign(cfg, JSON.parse(raw)); } catch (e) {}
function save() { try { localStorage.setItem("vct_audio", JSON.stringify(cfg)); } catch (e) {} }
function ensure() {
  if (!ctx) {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = cfg.vol; master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone(f, dur, type, vol, when, f2) {
  var c = ensure(); if (!c) return;
  var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, q, when, type) {
  var c = ensure(); if (!c) return;
  var t = c.currentTime + (when || 0), len = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  var s = c.createBufferSource(); s.buffer = buf;
  var f = c.createBiquadFilter(); f.type = type || "bandpass"; f.frequency.value = freq || 1500; f.Q.value = q || 1;
  var g = c.createGain(); g.gain.setValueAtTime(vol || 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t);
}
var SOUNDS = {
  click:function () { tone(1400, 0.035, "square", 0.05); },
  shot:function () { noise(0.07, 0.35, 2200, 0.8); noise(0.12, 0.2, 400, 0.7, 0.005, "lowpass"); },
  hs:function () { SOUNDS.shot(); tone(2600, 0.08, "sine", 0.12, 0.04); },
  kill:function () { tone(160, 0.12, "triangle", 0.18, 0, 70); },
  smoke:function () { noise(0.5, 0.18, 500, 0.5, 0, "lowpass"); },
  flash:function () { tone(1800, 0.25, "sine", 0.08, 0, 4000); },
  molly:function () { for (var i = 0; i < 5; i++) noise(0.06, 0.12, 3000, 2, i * 0.05); },
  plant:function () { tone(1320, 0.07, "square", 0.08); tone(1320, 0.07, "square", 0.08, 0.14); },
  defuse:function () { tone(600, 0.35, "sawtooth", 0.06, 0, 1400); },
  boom:function () { noise(0.9, 0.5, 180, 0.6, 0, "lowpass"); tone(60, 0.8, "sine", 0.35, 0, 30); },
  win:function () { tone(660, 0.12, "triangle", 0.12); tone(880, 0.12, "triangle", 0.12, 0.1); tone(1100, 0.2, "triangle", 0.12, 0.2); },
  lose:function () { tone(440, 0.15, "triangle", 0.1); tone(330, 0.25, "triangle", 0.1, 0.14); },
  cash:function () { tone(1500, 0.06, "square", 0.06); tone(2000, 0.1, "square", 0.06, 0.06); }
};
function play(n) {
  if (!cfg.sfx || !SOUNDS[n]) return;
  var now = performance.now(); if (last[n] && now - last[n] < (n === "shot" ? 40 : 60)) return; last[n] = now;
  try { SOUNDS[n](); } catch (e) {}
}
/* música do menu: acordes suaves e arpejo */
var CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9]];
function musicTick() {
  var c = ensure(); if (!c || !cfg.music) return;
  var ch = CHORDS[Math.floor(musicStep / 8) % CHORDS.length], i = musicStep % 8;
  if (i === 0) ch.forEach(function (f) { tone(f, 3.2, "sine", 0.035); tone(f / 2, 3.2, "triangle", 0.02); });
  tone(ch[i % 3] * 2, 0.35, "triangle", 0.03);
  if (i % 4 === 2) noise(0.05, 0.03, 6000, 1);
  musicStep++;
}
function musicStart() { if (musicTimer || !cfg.music) return; if (!ensure()) return; musicStep = 0; musicTick(); musicTimer = setInterval(musicTick, 400); }
function musicStop() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
function set(k, v) { cfg[k] = v; if (master && k === "vol") master.gain.value = v; if (k === "music" && !v) musicStop(); save(); }
document.addEventListener("click", function (e) {
  ensure();
  var b = e.target.closest("button"); if (b && !b.disabled) play("click");
  if (window.SFX_WANT_MUSIC) musicStart();
}, true);
window.SFX = { play:play, musicStart:musicStart, musicStop:musicStop, set:set, cfg:cfg };
})();
