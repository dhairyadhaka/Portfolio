/* Portfolio intro: Discover Build Ship. Scenes copied from the "3-discover-build-ship" film (dhairya-portfolio-intros.zip). */
DDIntro.design({
 "id": "build",
 "title": "Discover Build Ship",
 "background": "#0D1117",
 "scenes": [
  {
   "id": "verbs",
   "dur": 4.5
  },
  {
   "id": "stack",
   "dur": 2.5
  },
  {
   "id": "card",
   "dur": 2
  },
  {
   "id": "zoom",
   "dur": 2
  }
 ],
 "fonts": {
  "display": "'Inter', system-ui, sans-serif",
  "sans": "'Plus Jakarta Sans', system-ui, sans-serif"
 },
 "google": [
  "Inter:opsz,wght@14..32,900",
  "Plus+Jakarta+Sans:wght@400;600;700"
 ],
 "css": "#dd-intro .dd-stage{--ground:#0D1117; --main:#F5A524; --second:#F2EFE8; --accent:#3DD6C6; color:var(--second); font-family:var(--sans, system-ui, sans-serif)}\n#dd-intro .ground{position:absolute; inset:0; background:var(--ground); overflow:hidden}\n#dd-intro .words{position:absolute; margin:0; display:flex; flex-direction:column; gap:24px}\n#dd-intro .words > *{margin:0}\n#dd-intro .line{font-family:var(--display, var(--sans, system-ui, sans-serif)); font-size:150px; line-height:1; font-weight:900; white-space:nowrap; letter-spacing:-.03em}\n#dd-intro .sub{font-size:44px; font-weight:400; color:color-mix(in srgb, var(--second) 75%, var(--ground))}\n#dd-intro .verb{font-family:var(--display, var(--sans, system-ui, sans-serif)); font-size:300px; line-height:1; font-weight:900; letter-spacing:-.04em; white-space:nowrap; color:var(--second)}\n#dd-intro .verb-dot{color:var(--main)}\n#dd-intro .mini{font-family:var(--display, var(--sans, system-ui, sans-serif)); font-size:96px; line-height:1.02; font-weight:900; letter-spacing:-.03em; color:var(--main); white-space:nowrap}\n#dd-intro .bar{position:absolute; height:22px; background:var(--main); border-radius:2px; transform-origin:0 50%}\n#dd-intro .role{font-size:56px; font-weight:600; color:var(--second)}\n#dd-intro .rule{position:absolute; width:8px; border-radius:4px; background:var(--accent); transform-origin:50% 0}\n#dd-intro .count{font-size:28px; font-weight:700; letter-spacing:.24em; color:color-mix(in srgb, var(--second) 55%, var(--ground))}"
}, function (kit) {
(function () {
const { seg, eo, ei, eob, lerp } = kit;
const VERBS_W = [['Discover', -0.45, 1.35], ['Build', 1.45, 2.85], ['Ship', 2.95, 99]];
kit.scene('verbs', {
  init(kit) {
    let html = '<div class="ground">';
    VERBS_W.forEach(function (w, i) { html += '<div class="words verbs-w' + i + '" style="left:0;top:380px;width:1920px;align-items:center"><p class="verb">' + w[0] + '</p></div>'; });
    html += '<div class="bar verbs-bar" style="left:780px;top:730px;width:360px"></div></div>';
    kit.stage.append(kit.h(html));
    this.w = VERBS_W.map(function (w, i) { return kit.stage.querySelector('.verbs-w' + i).style; });
    this.bar = kit.stage.querySelector('.verbs-bar').style;
  },
  render(t) {
    let barS = 0;
    VERBS_W.forEach(function (w, i) {
      const s = this.w[i];
      const a = seg(t, w[1], w[1] + 0.45), b = ei(seg(t, w[2], w[2] + 0.25));
      const x = lerp(160, 0, eob(a, 1.6)) - 240 * b;
      const sq = 1 + 0.08 * Math.sin(Math.PI * seg(t, w[1] + 0.12, w[1] + 0.42));
      const creep = i === 2 ? 1 + 0.02 * eo(seg(t, w[1] + 0.45, 4.5)) : 1 + Math.max(0, t - w[1] - 0.45) * 0.01;
      s.opacity = Math.min(seg(t, w[1], w[1] + 0.12), 1 - b);
      s.transform = 'translateX(' + x + 'px) scale(' + (creep / sq) + ',' + (creep * sq) + ')';
      const bin = eo(seg(t, w[1] + 0.2, w[1] + 0.55)), bout = ei(seg(t, w[2] - 0.15, w[2]));
      barS = Math.max(barS, bin * (1 - bout));
    }, this);
    this.bar.transform = 'scaleX(' + barS + ')';
  },
});
})();
(function () {
const { seg, eo, ei, eio, eob, lerp, TextFx } = kit;
kit.scene('stack', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="bar stack-bar" style="left:780px;top:730px;width:360px"></div>' +
      '<div class="words" style="left:160px;top:360px;gap:0"><p class="mini stack-a">Discover</p><p class="mini stack-b">Build</p><p class="mini stack-c" style="align-self:flex-start">Ship</p></div>' +
      '<div class="words" style="left:790px;top:420px;gap:0"><h1 class="line stack-name" style="font-size:132px">Dhairya Dhaka</h1></div></div>'));
    const q = function (s) { return kit.stage.querySelector(s); };
    this.bar = q('.stack-bar').style;
    this.a = q('.stack-a').style; this.b = q('.stack-b').style;
    this.cEl = q('.stack-c'); this.c = this.cEl.style;
    this.name = q('.stack-name');
    const r = kit.srect(this.cEl);
    this.dx = 960 - (r.x + r.w / 2); this.dy = 530 - (r.y + r.h / 2);
  },
  render(t) {
    this.bar.transform = 'scaleX(' + (1 - ei(seg(t, 0, 0.3))) + ')';
    const m = eio(seg(t, 0.12, 0.85));
    const s = lerp(3.125 * 1.02, 1, m);
    const land = 1 + 0.06 * Math.sin(Math.PI * seg(t, 0.8, 1.0));
    this.c.transform = 'translate(' + lerp(this.dx, 0, m) + 'px,' + lerp(this.dy, 0, m) + 'px) scale(' + (s * land) + ',' + (s / land) + ')';
    this.c.color = 'color-mix(in srgb, var(--main) ' + Math.round(m * 100) + '%, var(--second))';
    [[this.a, 0.55], [this.b, 0.7]].forEach(function (p) {
      const k = seg(t, p[1], p[1] + 0.45);
      p[0].opacity = eo(k);
      p[0].transform = 'translateX(' + lerp(40, 0, eo(k)) + 'px)';
    });
    TextFx.fadeFromRight(this.name, t, 1.05, { stagger: 0.16, dur: 0.55, dx: 30 });
  },
});
})();
(function () {
const { seg, eo, eio, eob, lerp, TextFx } = kit;
kit.scene('card', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground">' +
      '<div class="words card-col" style="left:160px;top:360px;gap:0"><p class="mini">Discover</p><p class="mini">Build</p><p class="mini">Ship</p></div>' +
      '<div class="rule card-rule" style="left:700px;top:372px;height:280px"></div>' +
      '<div class="words card-block" style="left:790px;top:420px;gap:22px"><h1 class="line" style="font-size:132px">Dhairya Dhaka</h1><p class="role card-role">Product Manager</p></div></div>'));
    const q = function (s) { return kit.stage.querySelector(s); };
    this.col = q('.card-col').style;
    this.rule = q('.card-rule').style;
    this.block = q('.card-block').style;
    this.role = q('.card-role');
  },
  render(t) {
    const lift = eio(seg(t, 0.1, 0.8));
    const drift = Math.max(0, t - 0.8) * 2;
    this.block.transform = 'translateY(' + (lerp(0, -24, lift) - drift) + 'px)';
    this.col.transform = 'translateY(' + (-drift) + 'px)';
    const r = seg(t, 0.2, 0.7);
    this.rule.transform = 'translateY(' + (-drift) + 'px) scaleY(' + eob(r, 1.4) + ')';
    this.rule.opacity = r > 0 ? 1 : 0;
    TextFx.fadeFromRight(this.role, t, 0.45, { stagger: 0.12, dur: 0.5, dx: 26 });
  },
});
})();
(function () {
const { seg, eo, eio, lerp } = kit;
kit.scene('zoom', {
  init(kit) {
    kit.stage.append(kit.h('<div class="ground"><div class="zoom-z" style="position:absolute;inset:0">' +
      '<div class="words" style="left:160px;top:360px;gap:0;transform:translateY(-2.4px)"><p class="mini">Discover</p><p class="mini">Build</p><p class="mini">Ship</p></div>' +
      '<div class="rule" style="left:700px;top:372px;height:280px;transform:translateY(-2.4px)"></div>' +
      '<div class="words" style="left:790px;top:420px;gap:22px;transform:translateY(-26.4px)"><h1 class="line zoom-name" style="font-size:132px">Dhairya Dhaka</h1><p class="role">Product Manager</p></div>' +
      '</div></div>'));
    const q = function (s) { return kit.stage.querySelector(s); };
    this.z = q('.zoom-z').style;
    const el = q('.zoom-name'), s = kit.srect(el), er = el.getBoundingClientRect();
    const k = er.width ? s.w / er.width : 1;
    let fx = s.x + s.w / 2;
    try { const rg = document.createRange(); rg.setStart(el.firstChild, 7); rg.setEnd(el.firstChild, 8); const rr = rg.getBoundingClientRect(); if (rr.width) fx = s.x + (rr.left - er.left + rr.width / 2) * k; } catch (e) {}
    this.fx = fx; this.fy = s.y + s.h * 0.55;
  },
  render(t) {
    const p = eio(seg(t, 0.1, 1.8));
    this.z.transformOrigin = this.fx + 'px ' + this.fy + 'px';
    this.z.transform = 'scale(' + Math.pow(60, p) + ')';
    this.z.opacity = 1 - eo(seg(t, 0.6, 1.6));
  },
});
})();
// music (played only when sound is on; see sound.js)
(function () {
kit.score(function (S, T) {
  S.tempo(120, { t0: 0.2 });
  S.program('keys', 'ep', { rev: 0.3 });
  S.program('bass', 'bass');
  S.program('mallet', 'marimba', { rev: 0.25 });
  S.program('pad', 'pad', { rev: 0.6 });
  const hits = [0, 1.7, 3.2], roots = [['C2', ['C3', 'G3', 'E4']], ['F2', ['F3', 'C4', 'A4']], ['G2', ['G3', 'D4', 'B4']]];
  hits.forEach(function (h, i) {
    S.drum('kick', { t: h, vel: 96 });
    S.drum('clap', { t: h + 0.02, vel: 70 });
    S.note('bass', roots[i][0], { t: h, dur: 1.2, vel: 84 });
    S.chord('keys', roots[i][1], { t: h, dur: 1.2, vel: 58 });
    S.fx('whoosh', h - 0.22 < 0 ? 0 : h - 0.22, { dur: 0.25, vel: 30 });
  });
  S.drums({ hat: 'x.x.x.x.x.x.x.x.x.' }, { from: 0, step: 0.5, repeat: 1, vel: 40 });
  S.fx('whoosh', T.stack + 0.15, { dur: 0.6, vel: 40 });
  S.fx('boing', T.stack + 0.85, { vel: 50 });
  S.pattern('mallet', 'x.x.x.', { from: S.toBeat(T.stack + 1.05), step: 0.32, repeat: 1, pitch: ['G5', 'C6', 'E6'], vel: 50 });
  S.fx('revswell', T.card + 0.2, { dur: 0.9 });
  S.drum('kick', { t: T.card + 0.2, vel: 100 });
  S.drum('crash', { t: T.card + 0.2, vel: 50 });
  S.note('bass', 'C2', { t: T.card + 0.2, dur: 2.4, vel: 86 });
  S.chord('keys', ['C3', 'G3', 'C4', 'E4', 'G4'], { t: T.card + 0.2, dur: 3.6, vel: 66 });
  S.note('pad', 'C4', { t: T.card + 0.2, dur: 3.6, vel: 30 });
  S.fx('chime', T.card + 0.5, { vel: 44 });
  S.fx('whoosh', T.zoom + 0.2, { dur: 1.5, vel: 46 });
  S.run('mallet', ['C6', 'E6', 'G6', 'C7'], { t: T.zoom + 0.3, step: 0.16, vel: 34, cresc: -4 });
  S.master({ gain: -6, fadeOut: 1.8 });
});
})();
});
