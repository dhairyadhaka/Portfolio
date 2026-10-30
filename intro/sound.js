/* Intro music: a small Web Audio synth that plays the film's score (kit.score in the film file).
   Everything is generated in the browser; there are no sound files. */
window.DDSound = (function () {
  var VOLUME = 0.5; // overall music volume (1 = full)
  var STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(name) {
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    var midi = (+m[3] + 1) * 12 + STEPS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function amp(vel) { return Math.pow((vel == null ? 64 : vel) / 127, 1.6); }
  function db(v) { return Math.pow(10, v / 20); }

  function noiseBuffer(c) {
    var b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function impulse(c, secs) {
    var n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    }
    return b;
  }

  // attack, then settle to a sustain level, then release after dur
  function env(p, at, peak, att, sus, dec, dur, rel) {
    p.setValueAtTime(0, at);
    p.linearRampToValueAtTime(peak, at + att);
    p.setTargetAtTime(peak * sus, at + att, dec);
    p.setTargetAtTime(0, at + Math.max(dur, att), rel / 3);
  }
  function osc(c, type, f, at, stop) {
    var o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    o.start(at); o.stop(stop);
    return o;
  }
  function filter(c, type, f, q) {
    var x = c.createBiquadFilter();
    x.type = type; x.frequency.value = f; if (q != null) x.Q.value = q;
    return x;
  }

  /* ---------- instruments: play(context, destination, frequency, start, duration, level) ---------- */
  var INSTR = {
    ep: function (c, out, f, at, dur, a) {
      var end = at + dur + 0.6, g = c.createGain();
      var car = osc(c, 'sine', f, at, end), mod = osc(c, 'sine', f, at, end), depth = c.createGain();
      depth.gain.setValueAtTime(f * 1.4, at);
      depth.gain.setTargetAtTime(f * 0.08, at, 0.25);
      mod.connect(depth); depth.connect(car.frequency);
      car.connect(g); g.connect(out);
      env(g.gain, at, a * 0.32, 0.006, 0.35, 0.6, dur, 0.5);
    },
    bass: function (c, out, f, at, dur, a) {
      var end = at + dur + 0.4, g = c.createGain(), lp = filter(c, 'lowpass', 520);
      osc(c, 'triangle', f, at, end).connect(lp);
      osc(c, 'sine', f, at, end).connect(lp);
      lp.connect(g); g.connect(out);
      env(g.gain, at, a * 0.45, 0.012, 0.6, 0.4, dur, 0.25);
    },
    marimba: function (c, out, f, at, dur, a) {
      var g = c.createGain(), g2 = c.createGain();
      osc(c, 'sine', f, at, at + 1.2).connect(g);
      osc(c, 'sine', f * 4, at, at + 0.3).connect(g2);
      g.connect(out); g2.connect(out);
      env(g.gain, at, a * 0.6, 0.002, 0, 0.22, 0, 0.1);
      env(g2.gain, at, a * 0.12, 0.001, 0, 0.03, 0, 0.05);
    },
    pad: function (c, out, f, at, dur, a) {
      var end = at + dur + 1.5, g = c.createGain(), lp = filter(c, 'lowpass', 1300, 0.4);
      [-7, 7].forEach(function (cents) { var o = osc(c, 'sawtooth', f, at, end); o.detune.value = cents; o.connect(lp); });
      lp.connect(g); g.connect(out);
      env(g.gain, at, a * 0.16, 0.8, 1, 1, dur, 1.2);
    },
  };

  function noise(p, at, stop) {
    var s = p.ctx.createBufferSource();
    s.buffer = p.noise; s.loop = true;
    s.start(at, Math.random()); s.stop(stop);
    return s;
  }

  var DRUM = {
    kick: function (p, out, at, a) {
      var c = p.ctx, o = osc(c, 'sine', 140, at, at + 0.6), g = c.createGain();
      o.frequency.exponentialRampToValueAtTime(42, at + 0.14);
      o.connect(g); g.connect(out);
      g.gain.setValueAtTime(a * 1.1, at);
      g.gain.setTargetAtTime(0, at + 0.02, 0.12);
    },
    clap: function (p, out, at, a) {
      var c = p.ctx, g = c.createGain(), bp = filter(c, 'bandpass', 1300, 0.9);
      noise(p, at, at + 0.4).connect(bp); bp.connect(g); g.connect(out);
      g.gain.setValueAtTime(0, at);
      [0, 0.011, 0.022].forEach(function (d) { g.gain.setValueAtTime(a * 0.7, at + d); g.gain.setTargetAtTime(0, at + d + 0.001, 0.004); });
      g.gain.setValueAtTime(a * 0.6, at + 0.033);
      g.gain.setTargetAtTime(0, at + 0.034, 0.05);
    },
    hat: function (p, out, at, a) {
      var c = p.ctx, g = c.createGain(), hp = filter(c, 'highpass', 7500);
      noise(p, at, at + 0.15).connect(hp); hp.connect(g); g.connect(out);
      g.gain.setValueAtTime(a * 0.22, at);
      g.gain.setTargetAtTime(0, at, 0.02);
    },
    crash: function (p, out, at, a) {
      var c = p.ctx, g = c.createGain(), hp = filter(c, 'highpass', 4500);
      noise(p, at, at + 2.5).connect(hp); hp.connect(g); g.connect(out);
      g.gain.setValueAtTime(a * 0.3, at);
      g.gain.setTargetAtTime(0, at, 0.45);
    },
  };

  var FX = {
    whoosh: function (p, out, at, a, dur) {
      var c = p.ctx, g = c.createGain(), bp = filter(c, 'bandpass', 350, 1.1);
      noise(p, at, at + dur + 0.1).connect(bp); bp.connect(g); g.connect(out);
      bp.frequency.setValueAtTime(350, at);
      bp.frequency.exponentialRampToValueAtTime(2800, at + dur);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(a * 0.7, at + dur * 0.65);
      g.gain.linearRampToValueAtTime(0, at + dur);
    },
    boing: function (p, out, at, a) {
      var c = p.ctx, o = osc(c, 'sine', 160, at, at + 0.6), lfo = osc(c, 'sine', 16, at, at + 0.6);
      var depth = c.createGain(), g = c.createGain();
      o.frequency.exponentialRampToValueAtTime(330, at + 0.12);
      depth.gain.setValueAtTime(40, at);
      depth.gain.setTargetAtTime(0, at, 0.15);
      lfo.connect(depth); depth.connect(o.frequency);
      o.connect(g); g.connect(out);
      g.gain.setValueAtTime(a * 0.35, at);
      g.gain.setTargetAtTime(0, at + 0.05, 0.12);
    },
    revswell: function (p, out, at, a, dur) {
      // rises into the hit that lands at `at`
      var c = p.ctx, s = at - dur, g = c.createGain(), lp = filter(c, 'lowpass', 300, 0.7);
      if (s < c.currentTime) return;
      noise(p, s, at + 0.05).connect(lp); lp.connect(g); g.connect(out);
      lp.frequency.setValueAtTime(300, s);
      lp.frequency.exponentialRampToValueAtTime(7000, at);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.25 + a * 0.2, at - 0.01);
      g.gain.linearRampToValueAtTime(0, at + 0.03);
    },
    chime: function (p, out, at, a) {
      var c = p.ctx;
      [[1, 1, 1.4], [2.76, 0.45, 0.8], [5.4, 0.22, 0.4], [8.93, 0.1, 0.25]].forEach(function (k) {
        var g = c.createGain();
        osc(c, 'sine', 1568 * k[0], at, at + k[2] * 3).connect(g);
        g.connect(out);
        g.gain.setValueAtTime(a * 0.12 * k[1], at);
        g.gain.setTargetAtTime(0, at, k[2] / 2.5);
      });
    },
  };

  /* ---------- the score API the film's kit.score function is written against ---------- */
  function readScore(fn, T) {
    var ev = [], programs = {}, bpm = 120, t0 = 0, master = { gain: 0, fadeOut: 0 };
    function beat() { return 60 / bpm; }
    function note(prog, name, o) { ev.push({ t: o.t, kind: 'note', prog: prog, f: freq(name), dur: o.dur || 0.5, a: amp(o.vel) }); }
    var S = {
      tempo: function (b, o) { bpm = b; t0 = (o && o.t0) || 0; },
      toBeat: function (sec) { return (sec - t0) / beat(); },
      program: function (name, instr, o) { programs[name] = { instr: instr, rev: (o && o.rev) || 0 }; },
      note: note,
      chord: function (prog, names, o) {
        var share = 1 / Math.sqrt(names.length);
        names.forEach(function (n) { ev.push({ t: o.t, kind: 'note', prog: prog, f: freq(n), dur: o.dur || 1, a: amp(o.vel) * share }); });
      },
      run: function (prog, names, o) {
        names.forEach(function (n, i) { note(prog, n, { t: o.t + i * o.step, dur: o.step * 2, vel: o.vel + (o.cresc || 0) * i }); });
      },
      pattern: function (prog, steps, o) {
        var k = 0;
        for (var r = 0; r < (o.repeat || 1); r++) for (var i = 0; i < steps.length; i++) {
          if (steps[i] === '.') continue;
          var t = t0 + (o.from + (r * steps.length + i) * o.step) * beat();
          note(prog, o.pitch[k++ % o.pitch.length], { t: t, dur: o.step * beat() * 2, vel: o.vel });
        }
      },
      drum: function (name, o) { ev.push({ t: o.t, kind: 'drum', name: name, a: amp(o.vel) }); },
      drums: function (lanes, o) {
        var step = o.step || 0.25;
        Object.keys(lanes).forEach(function (name) {
          var steps = lanes[name];
          for (var r = 0; r < (o.repeat || 1); r++) for (var i = 0; i < steps.length; i++) {
            if (steps[i] === '.') continue;
            var t = t0 + ((o.from || 0) + (r * steps.length + i) * step) * beat();
            ev.push({ t: t, kind: 'drum', name: name, a: amp(o.vel) * (steps[i] === 'o' ? 0.6 : 1) });
          }
        });
      },
      fx: function (name, t, o) { ev.push({ t: t, kind: 'fx', name: name, a: amp(o && o.vel), dur: (o && o.dur) || 0.5 }); },
      master: function (o) { master = o; },
    };
    fn(S, T);
    return { events: ev, programs: programs, master: master };
  }

  function Player() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.allowed = this.ctx.state === 'running';
    this.out = this.ctx.createGain();
    this.out.gain.value = VOLUME;
    this.out.connect(this.ctx.destination);
    this.noise = noiseBuffer(this.ctx);
    this.ir = impulse(this.ctx, 2.4);
    this.bus = null;
  }

  // Play the score from `from` seconds in; the film has `total` seconds in all.
  Player.prototype.play = function (fn, T, total, from) {
    var c = this.ctx, p = this, score = readScore(fn, T);
    this.stop();
    var bus = this.bus = c.createGain(), comp = c.createDynamicsCompressor(), verb = c.createConvolver(), drySends = {};
    verb.buffer = this.ir;
    bus.connect(comp); comp.connect(this.out); verb.connect(bus);
    var now = c.currentTime + 0.05, start = now - from;
    var level = db(score.master.gain || 0);
    bus.gain.setValueAtTime(level, now);
    if (score.master.fadeOut) {
      var fadeAt = Math.max(now, start + total - score.master.fadeOut);
      bus.gain.setValueAtTime(level, fadeAt);
      bus.gain.linearRampToValueAtTime(0.0001, start + total);
    }
    function dest(rev) {
      var key = String(rev);
      if (!drySends[key]) {
        var g = c.createGain(), send = c.createGain();
        send.gain.value = rev;
        g.connect(bus); g.connect(send); send.connect(verb);
        drySends[key] = g;
      }
      return drySends[key];
    }
    score.events.forEach(function (e) {
      if (e.t < from) return;
      var at = start + e.t;
      if (e.kind === 'note') {
        var prog = score.programs[e.prog] || { instr: 'ep', rev: 0 };
        (INSTR[prog.instr] || INSTR.ep)(c, dest(prog.rev), e.f, at, e.dur, e.a);
      } else if (e.kind === 'drum') {
        if (DRUM[e.name]) DRUM[e.name](p, dest(0.15), at, e.a);
      } else if (FX[e.name]) {
        FX[e.name](p, dest(0.3), at, e.a, e.dur);
      }
    });
  };

  Player.prototype.stop = function () {
    if (!this.bus) return;
    var g = this.bus.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + 0.15);
    this.bus = null;
  };

  Player.prototype.setMuted = function (m) {
    this.out.gain.setTargetAtTime(m ? 0 : VOLUME, this.ctx.currentTime, 0.03);
  };

  // close the audio device once the last note has rung out
  Player.prototype.closeAfter = function (secs) {
    var c = this.ctx;
    setTimeout(function () { try { c.close(); } catch (e) {} }, secs * 1000);
  };

  return { Player: Player };
})();
