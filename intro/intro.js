/* Portfolio intro player.
   Plays the intro film named by data-design on this script tag (build.js) over the homepage.
   In the last scene the letters of the name turn into windows onto the site and zoom in
   until the site fills the screen.
   - index.html?intro replays it, even if it was already seen this visit.
   - Plays once per visit, never for visitors who ask for reduced motion, and can be skipped. */
(function () {
  var me = document.currentScript;
  var BASE = me.src.replace(/[^\/]*$/, '');
  var GROUND = '#0D1117';
  // widest part of the film that must stay on screen when a phone crops the sides
  var SAFE_W = 1600;

  function store(k, v) {
    try {
      if (v === undefined) return window.sessionStorage.getItem(k);
      if (v === null) window.sessionStorage.removeItem(k); else window.sessionStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }

  var design = me.getAttribute('data-design');
  if (!design) return;
  if (/[?&]intro\b/.test(location.search)) store('dd-intro-play', '1');
  var forced = store('dd-intro-play');
  if (!forced && store('dd-intro-seen')) return;
  try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { store('dd-intro-play', null); return; } } catch (e) {}
  // The homepage jumps to its other theme on load (dark 7 pm to 7 am). Play on the page it lands on.
  var choice = store('dd-theme-choice'), hr = new Date().getHours();
  var want = choice || ((hr >= 19 || hr < 7) ? 'dark' : 'light');
  var page = /dark\.html$/.test(location.pathname) ? 'dark' : 'light';
  if (want !== page) return;

  /* ---------- cover the page straight away ---------- */
  var html = document.documentElement;
  html.classList.add('dd-intro-on', 'dd-intro-hold');
  var style = document.createElement('style');
  style.textContent =
    'html.dd-intro-hold #root *{animation-play-state:paused!important}' +
    '#dd-intro{position:fixed;inset:0;z-index:2147483000;background:' + GROUND + ';overflow:hidden;contain:strict}' +
    '#dd-intro .dd-stage{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0}' +
    '#dd-intro .dd-scene{position:absolute;inset:0;visibility:hidden}' +
    '#dd-intro .dd-scene.on{visibility:visible}' +
    '#dd-intro .dd-stage .ground{overflow:visible}' +
    '#dd-intro canvas,#dd-intro svg.dd-cut{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}' +
    '#dd-intro .dd-ctrl{position:absolute;right:20px;bottom:20px;display:flex;gap:8px}' +
    '#dd-intro .dd-skip{padding:9px 16px;border:1px solid rgba(242,239,232,.28);border-radius:99px;' +
      'background:rgba(13,17,23,.6);color:#F2EFE8;font:500 13px/1 system-ui,sans-serif;letter-spacing:.02em;cursor:pointer;transition:opacity .3s ease,border-color .2s ease}' +
    '#dd-intro .dd-skip:hover{border-color:rgba(242,239,232,.7)}';
  document.head.appendChild(style);
  var root = document.createElement('div');
  root.id = 'dd-intro';
  html.appendChild(root);

  // Stop scrolling while the intro plays. Hiding the page's overflow would remove the
  // scrollbar and make the whole site jump sideways when it comes back.
  var SCROLL_KEYS = [' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
  function noScroll(e) {
    if (e.type !== 'keydown' || SCROLL_KEYS.indexOf(e.key) >= 0) e.preventDefault();
  }
  ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.addEventListener(ev, noScroll, { passive: false }); });

  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, noScroll, { passive: false }); });
    store('dd-intro-seen', '1');
    store('dd-intro-play', null);
    // the music's last notes ring out over the site, then the audio device is released
    if (audio) audio.closeAfter(3);
    html.classList.remove('dd-intro-on', 'dd-intro-hold');
    if (root.parentNode) root.parentNode.removeChild(root);
    if (style.parentNode) style.parentNode.removeChild(style);
  }
  // never leave a visitor stuck behind the cover
  var failsafe = setTimeout(finish, 20000);

  /* ---------- the toolkit the film scenes are written against ---------- */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function eo(k) { return 1 - Math.pow(1 - k, 3); }
  function ei(k) { return k * k * k; }
  function eio(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eob(k, s) { if (s == null) s = 1.70158; var x = k - 1; return k <= 0 ? 0 : 1 + (s + 1) * x * x * x + s * x * x; }

  var kit = {
    seg: seg, lerp: lerp, clamp01: clamp01, eo: eo, ei: ei, eio: eio, eob: eob,
    defs: {},
    scene: function (id, def) { kit.defs[id] = def; },
    score: function (fn) { kit.scoreFn = fn; },
    h: function (markup) { var t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstElementChild; },
    rng: function (seed) {
      var a = seed >>> 0;
      return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    },
    srect: function (el) {
      var r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      return { x: (r.left - sr.left) / view.s, y: (r.top - sr.top) / view.s, w: r.width / view.s, h: r.height / view.s };
    },
    TextFx: {
      // words slide in from the right, one after another
      fadeFromRight: function (el, t, start, o) {
        var words = el._ddWords;
        if (!words) {
          var text = el.textContent;
          el.textContent = '';
          words = [];
          text.split(' ').forEach(function (w, i) {
            if (i) el.appendChild(document.createTextNode(' '));
            var s = document.createElement('span');
            s.style.display = 'inline-block';
            s.textContent = w;
            el.appendChild(s);
            words.push(s);
          });
          el._ddWords = words;
        }
        words.forEach(function (s, i) {
          var a = start + i * (o.stagger || 0), k = eo(seg(t, a, a + (o.dur || 0.5)));
          s.style.opacity = k;
          s.style.transform = 'translateX(' + (o.dx || 0) * (1 - k) + 'px)';
        });
      },
    },
  };

  var stage, fx, view = { s: 1, ox: 0, oy: 0, w: 1, h: 1 };
  var D, scenes = [], total = 0, starts = {}, audio = null, begun = false;

  window.DDIntro = {
    design: function (cfg, code) {
      D = cfg;
      try { code(kit); start(); } catch (e) { finish(); }
    },
  };

  function layout() {
    var w = window.innerWidth, h = window.innerHeight;
    // landscape screens show the whole film; tall phone screens crop its sides so the name stays big
    var s = Math.min(h / 1080, w / (w < h ? SAFE_W : 1920));
    view = { s: s, ox: (w - 1920 * s) / 2, oy: (h - 1080 * s) / 2, w: w, h: h };
    stage.style.transform = 'translate(' + view.ox + 'px,' + view.oy + 'px) scale(' + s + ')';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = Math.round(w * dpr); fx.height = Math.round(h * dpr);
    view.dpr = dpr;
  }

  function fontsReady() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + D.google.map(function (f) { return 'family=' + f; }).join('&') + '&display=block';
    document.head.appendChild(link);
    var families = [];
    ['display', 'sans', 'mono'].forEach(function (k) {
      var f = D.fonts[k] && D.fonts[k].split(',')[0];
      if (f && families.indexOf(f) < 0) families.push(f);
    });
    var loaded = new Promise(function (ok) { link.onload = ok; link.onerror = ok; }).then(function () {
      var jobs = [];
      families.forEach(function (f) { [400, 500, 600, 700, 800, 900].forEach(function (w) { jobs.push(document.fonts.load(w + ' 100px ' + f).catch(function () {})); }); });
      return Promise.all(jobs);
    });
    return Promise.race([loaded, new Promise(function (ok) { setTimeout(ok, 2500); })]);
  }

  function start() {
    var css = document.createElement('style');
    css.textContent = D.css;
    document.head.appendChild(css);

    stage = document.createElement('div');
    stage.className = 'dd-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.style.setProperty('--display', D.fonts.display);
    stage.style.setProperty('--sans', D.fonts.sans);
    if (D.fonts.mono) stage.style.setProperty('--mono', D.fonts.mono);
    fx = document.createElement('canvas');
    root.appendChild(stage);
    root.appendChild(fx);
    kit.fx = fx;
    kit.fonts = D.fonts;
    layout();

    fontsReady().then(function () {
      if (finished) return;
      D.scenes.forEach(function (sc) {
        var layer = document.createElement('div');
        layer.className = 'dd-scene';
        stage.appendChild(layer);
        var def = kit.defs[sc.id];
        def.init.call(def, Object.create(kit, { stage: { value: layer } }));
        scenes.push({ id: sc.id, dur: sc.dur, at: total, def: def, layer: layer });
        starts[sc.id] = total;
        total += sc.dur;
      });
      addControls();
      window.addEventListener('resize', layout);
      if (kit.scoreFn && window.DDSound) {
        try { audio = new window.DDSound.Player(); } catch (e) { audio = null; }
      }
      begin();
    });
  }

  var t0 = 0, current = null, cut = null, ctrl = null, audioOn = false;

  function begin() {
    begun = true;
    clearTimeout(failsafe);
    failsafe = setTimeout(finish, (total + 5) * 1000);
    t0 = performance.now();
    // Browsers block sound until the visitor clicks, so most visitors get a silent intro
    // and a "Sound on" button; music plays straight away only where the browser allows it.
    if (audio) {
      if (audio.allowed) { audio.play(kit.scoreFn, starts, total, 0); audioOn = true; }
      addSoundButton();
    }
    requestAnimationFrame(frame);
  }

  function addControls() {
    ctrl = document.createElement('div');
    ctrl.className = 'dd-ctrl';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dd-skip';
    b.textContent = 'Skip intro';
    b.onclick = skip;
    ctrl.appendChild(b);
    root.appendChild(ctrl);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') skip(); });
  }

  function addSoundButton() {
    var b = document.createElement('button'), muted = !audioOn;
    b.type = 'button';
    b.className = 'dd-skip';
    function label() {
      b.textContent = muted ? 'Sound on' : 'Sound off';
      b.setAttribute('aria-pressed', String(!muted));
    }
    b.onclick = function () {
      if (!audioOn) {
        // first click: the browser now allows sound, so bring the music in from this moment
        audio.ctx.resume();
        audio.play(kit.scoreFn, starts, total, (performance.now() - t0) / 1000);
        audioOn = true;
        muted = false;
      } else {
        muted = !muted;
        audio.setMuted(muted);
      }
      label();
    };
    label();
    ctrl.insertBefore(b, ctrl.firstChild);
  }

  // skipping jumps to the zoom, so the hand-off into the site still plays
  function skip() {
    if (!begun) { finish(); return; }
    var last = scenes[scenes.length - 1];
    if (!last || current === last) return;
    t0 = performance.now() - last.at * 1000;
    if (audioOn) audio.play(kit.scoreFn, starts, total, last.at);
    // no time left for the homepage's entrance animation, so jump it to its end
    html.classList.remove('dd-intro-hold');
    var site = document.getElementById('root');
    try {
      document.getAnimations().forEach(function (a) {
        var el = a.effect && a.effect.target;
        if (a.timeline === document.timeline && el && site && site.contains(el) && isFinite(a.effect.getComputedTiming().endTime)) a.finish();
      });
    } catch (e) {}
  }

  function frame(now) {
    if (finished) return;
    var t = (now - t0) / 1000;
    if (t >= total) { finish(); return; }
    var sc = scenes[0];
    for (var i = 0; i < scenes.length; i++) if (t >= scenes[i].at) sc = scenes[i];
    // run the homepage's own entrance animation (about 2 s) while it is still covered,
    // so the letters open onto a settled page
    if (t >= scenes[scenes.length - 1].at - 2.2) html.classList.remove('dd-intro-hold');
    if (sc !== current) {
      if (current) current.layer.classList.remove('on');
      sc.layer.classList.add('on');
      current = sc;
      if (sc === scenes[scenes.length - 1]) beginCut(sc);
    }
    var g = fx.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, fx.width, fx.height);
    g.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, view.dpr * view.ox, view.dpr * view.oy);
    var lt = t - sc.at;
    sc.def.render.call(sc.def, lt);
    if (cut && renderCut(lt)) { finish(); return; }
    requestAnimationFrame(frame);
  }

  /* ---------- the hand-off: the name becomes a window onto the site ---------- */
  var SVG = 'http://www.w3.org/2000/svg';
  var CUT_END = 1.65; // seconds into the last scene when the site fills the screen
  var MAX_LETTER_PX = 5000;
  function svgEl(tag, attrs) { var e = document.createElementNS(SVG, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function beginCut(sc) {
    var nameEl = sc.layer.querySelector('.zoom-name');
    var zoomEl = sc.layer.querySelector('.zoom-z');
    if (!nameEl || !zoomEl) return;
    var cs = getComputedStyle(nameEl);
    var size = parseFloat(cs.fontSize);
    var ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
    var font = cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
    var text = nameEl.textContent;
    var range = document.createRange();
    range.selectNodeContents(nameEl);
    var tr = range.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    var box = kit.srect(nameEl);
    var x = (tr.left - sr.left) / view.s;
    var m = document.createElement('canvas').getContext('2d');
    m.font = font;
    var tm = m.measureText(text);
    var lh = parseFloat(cs.lineHeight) || size;
    var baseline = box.y + (lh - (tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent)) / 2 + tm.fontBoundingBoxAscent;
    var focus = thickestPoint(text, font, ls, x, baseline, box);

    // the site shows through from here on
    root.style.background = 'transparent';
    sc.layer.querySelector('.ground').style.background = 'transparent';
    nameEl.style.visibility = 'hidden';

    var svg = svgEl('svg', { 'class': 'dd-cut', 'aria-hidden': 'true' });
    var defs = svgEl('defs', {});
    var mask = svgEl('mask', { id: 'dd-cut-mask', maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: '100%', height: '100%' });
    mask.appendChild(svgEl('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: '#fff' }));
    var textAttrs = { x: x, y: baseline, 'font-family': cs.fontFamily, 'font-weight': cs.fontWeight, 'font-size': size, 'letter-spacing': ls, style: 'font-kerning:normal;font-optical-sizing:auto' };
    var holeG = svgEl('g', {});
    var hole = svgEl('text', textAttrs); hole.setAttribute('fill', '#000'); hole.textContent = text;
    holeG.appendChild(hole);
    mask.appendChild(holeG);
    var circG = svgEl('g', {});
    var circ = svgEl('circle', { cx: focus.x, cy: focus.y, r: '0', fill: '#000' });
    circG.appendChild(circ);
    mask.appendChild(circG);
    defs.appendChild(mask);
    svg.appendChild(defs);
    var cover = svgEl('g', { mask: 'url(#dd-cut-mask)' });
    cover.appendChild(svgEl('rect', { x: '0', y: '0', width: '100%', height: '100%', fill: GROUND }));
    svg.appendChild(cover);
    var inkG = svgEl('g', {});
    var ink = svgEl('text', textAttrs); ink.setAttribute('fill', cs.color); ink.textContent = text;
    // a thin outline keeps the letters readable as windows, whatever colour the site is behind them
    ink.setAttribute('stroke', getComputedStyle(stage).getPropertyValue('--main').trim() || '#F5A524');
    ink.setAttribute('stroke-width', '2');
    ink.setAttribute('vector-effect', 'non-scaling-stroke');
    ink.setAttribute('stroke-opacity', '0');
    inkG.appendChild(ink);
    svg.appendChild(inkG);
    root.insertBefore(svg, stage);

    cut = { svg: svg, groups: [holeG, inkG], ink: ink, circ: circ, circG: circG, size: size, layer: sc.layer, zoomEl: zoomEl, fx: focus.x, fy: focus.y, r: focus.r };
  }

  function renderCut(t) {
    var c = cut, v = view;
    // zoom far enough that the hole around the focus point covers every corner of the screen
    var far = 0;
    [[0, 0], [v.w, 0], [0, v.h], [v.w, v.h]].forEach(function (p) {
      var dx = (p[0] - v.ox) / v.s - c.fx, dy = (p[1] - v.oy) / v.s - c.fy;
      far = Math.max(far, Math.sqrt(dx * dx + dy * dy));
    });
    // Browsers draw text unreliably once it is ~10,000px tall, so the letters stop growing
    // at about 5,000px. A circle that starts hidden inside the letter then opens out to clear
    // the last corners; at that size the letter's edges are already big sweeping curves.
    var zEnd = Math.min(far / (c.r * 0.85), MAX_LETTER_PX / (c.size * v.s));
    var z = Math.pow(zEnd, eio(seg(t, 0.1, CUT_END)));
    var zoom = 'translate(' + c.fx + ' ' + c.fy + ') scale(' + z + ') translate(' + (-c.fx) + ' ' + (-c.fy) + ')';
    var stageT = 'translate(' + v.ox + ' ' + v.oy + ') scale(' + v.s + ')';
    c.groups.forEach(function (g) { g.setAttribute('transform', stageT + ' ' + zoom); });
    c.circG.setAttribute('transform', stageT);
    c.circ.setAttribute('r', Math.max(c.r * z * 0.9, far * 1.05 * ei(seg(t, 0.9, CUT_END))));
    c.ink.setAttribute('fill-opacity', 1 - eo(seg(t, 0.05, 0.75)));
    c.ink.setAttribute('stroke-opacity', eo(seg(t, 0.05, 0.4)) * (1 - seg(t, 1.0, 1.4)));
    // everything but the name (role line, grid, dots, guides) fades away before the zoom
    // gets going, so nothing from the film is left floating over the site
    var rest = 1 - eo(seg(t, 0, 0.35));
    c.layer.style.opacity = rest;
    fx.style.opacity = rest;
    c.zoomEl.style.transformOrigin = c.fx + 'px ' + c.fy + 'px';
    c.zoomEl.style.transform = 'scale(' + z + ')';
    return t >= CUT_END;
  }

  // The point inside the letters farthest from any edge: zooming into it opens the widest window.
  function thickestPoint(text, font, ls, x, baseline, box) {
    var pad = 20, W = Math.ceil(box.w + pad * 2), H = Math.ceil(box.h + pad * 2);
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.font = font;
    g.fillStyle = '#000';
    var ox = x - box.x + pad, oy = baseline - box.y + pad;
    if ('letterSpacing' in g) { g.letterSpacing = ls + 'px'; g.fillText(text, ox, oy); }
    else { for (var i = 0, cx = ox; i < text.length; i++) { g.fillText(text[i], cx, oy); cx += g.measureText(text[i]).width + ls; } }
    var a = g.getImageData(0, 0, W, H).data, d = new Float32Array(W * H), INF = 1e9, i2, xx, yy;
    for (i2 = 0; i2 < W * H; i2++) d[i2] = a[i2 * 4 + 3] > 127 ? INF : 0;
    // two-pass chamfer distance (3-4), good enough to find the fattest stroke
    for (yy = 1; yy < H; yy++) for (xx = 1; xx < W - 1; xx++) {
      var p = yy * W + xx; if (!d[p]) continue;
      d[p] = Math.min(d[p], d[p - 1] + 3, d[p - W] + 3, d[p - W - 1] + 4, d[p - W + 1] + 4);
    }
    var best = 0, bx = box.w / 2 + pad, by = box.h / 2 + pad, mid = W / 2;
    for (yy = H - 2; yy >= 0; yy--) for (xx = W - 2; xx >= 1; xx--) {
      var q = yy * W + xx; if (!d[q]) continue;
      d[q] = Math.min(d[q], d[q + 1] + 3, d[q + W] + 3, d[q + W + 1] + 4, d[q + W - 1] + 4);
      // lean slightly toward the middle of the name
      var score = d[q] - Math.abs(xx - mid) * 0.01;
      if (score > best) { best = score; bx = xx; by = yy; }
    }
    return { x: box.x - pad + bx, y: box.y - pad + by, r: Math.max(4, d[Math.round(by) * W + Math.round(bx)] / 3) };
  }

  // the music synth first, then the film (which starts the intro); in that order
  var snd = document.createElement('script');
  snd.src = BASE + 'sound.js';
  snd.async = false;
  document.head.appendChild(snd);
  var s = document.createElement('script');
  s.src = BASE + design + '.js';
  s.async = false;
  s.onerror = finish;
  document.head.appendChild(s);
})();
