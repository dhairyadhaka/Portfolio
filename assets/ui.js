/* Shared interactions for the homepage and case studies:
   - rolling numbers: key results count up digit by digit when they scroll into view
   - screenshot accordion: [data-ui-gal] groups open the hovered or tapped screenshot
   - bar chart: .ui-chart bars grow in when they scroll into view
   - Toolkit magnify: logos near the pointer grow, like a dock */
(function () {
  // A number worth rolling: ₹10,469 · 2.1M+ · 140,000 · 61. Small numbers and years stay as text.
  var NUM = /(₹)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(M|K)?(\+)?/g;
  function worthRolling(m, all) {
    var plain = m[2].replace(/,/g, '');
    if (!m[3] && !m[1] && /^(19|20)\d\d$/.test(plain)) return false;
    return !!(all || m[1] || m[3] || m[2].indexOf(',') >= 0 || parseFloat(plain) >= 10);
  }
  // all: roll every number (big stat figures), not just the large ones inside sentences
  function parts(text, all) {
    var out = [], last = 0, m;
    NUM.lastIndex = 0;
    while ((m = NUM.exec(text))) {
      if (!worthRolling(m, all)) continue;
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      out.push({ num: m[0] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  }

  // Build one rolling number with a DOM-like factory: el(tag, props, children)
  function rollNode(el, str, key) {
    var k = 0, kids = [];
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch >= '0' && ch <= '9') {
        var stack = [];
        for (var n = 0; n <= 9; n++) stack.push(el('span', { key: n }, String(n)));
        kids.push(el('span', { key: i, className: 'ui-d', style: { '--d': ch, '--k': k++ } },
          [el('b', { key: 'b' }, ch), el('i', { key: 'i' }, stack)]));
      } else {
        kids.push(ch);
      }
    }
    return el('span', { key: key, className: 'ui-roll' }, [
      el('span', { key: 'sr', className: 'ui-sr' }, str),
      el('span', { key: 'v', 'aria-hidden': 'true' }, kids)
    ]);
  }

  function domEl(tag, props, children) {
    var e = document.createElement(tag);
    for (var p in props) {
      if (p === 'key') continue;
      if (p === 'className') e.className = props[p];
      else if (p === 'style') for (var s in props[p]) e.style.setProperty(s, props[p][s]);
      else e.setAttribute(p, props[p]);
    }
    [].concat(children == null ? [] : children).forEach(function (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  // Homepage (React): turn a text into text and rolling-number nodes
  function rollReact(h, text) {
    var el = function (tag, props, children) {
      var p = {};
      for (var k in props) p[k] = props[k];
      return h.apply(null, [tag, p].concat(children == null ? [] : children));
    };
    return parts(String(text == null ? '' : text)).map(function (x, i) {
      // built in place (not as a component) so page updates keep the same element and its "played" state
      return x.text != null ? x.text : rollNode(el, x.num, i);
    });
  }

  // Case studies (plain HTML): every [data-ui-roll] element gets its numbers rolled
  function rollStatic(root) {
    [].slice.call(root.querySelectorAll('[data-ui-roll]')).forEach(function (box) {
      var all = box.getAttribute('data-ui-roll') === 'all';
      var walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), nodes = [], n;
      while ((n = walker.nextNode())) if (!n.parentNode.closest('.ui-roll')) nodes.push(n);
      nodes.forEach(function (tn) {
        var ps = parts(tn.nodeValue, all);
        if (!ps.some(function (x) { return x.num; })) return;
        var frag = document.createDocumentFragment();
        ps.forEach(function (x) { frag.appendChild(x.text != null ? document.createTextNode(x.text) : rollNode(domEl, x.num)); });
        tn.parentNode.replaceChild(frag, tn);
      });
      box.removeAttribute('data-ui-roll');
    });
  }

  /* ---------- play things when they come into view ---------- */
  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.6 }) : null;
  function watch(root) {
    [].slice.call(root.querySelectorAll('.ui-roll:not(.is-in), .ui-chart:not(.is-in)')).forEach(function (e) {
      if (seen) { if (seen.has(e)) return; seen.add(e); }
      if (io) io.observe(e); else e.classList.add('is-in');
    });
  }

  /* ---------- screenshot accordion ---------- */
  function gallery(root) {
    [].slice.call(root.querySelectorAll('[data-ui-gal]')).forEach(function (g) {
      var items = [].slice.call(g.children);
      g.classList.add('ui-gal');
      function open(it) { items.forEach(function (x) { x.classList.toggle('is-open', x === it); x.setAttribute('aria-expanded', String(x === it)); }); }
      items.forEach(function (it, i) {
        it.setAttribute('tabindex', '0');
        it.setAttribute('role', 'button');
        it.addEventListener('mouseenter', function () { open(it); });
        it.addEventListener('focus', function () { open(it); });
        it.addEventListener('click', function () { open(it); });
        if (i === 0) open(it);
      });
      g.removeAttribute('data-ui-gal');
    });
  }

  /* ---------- Toolkit magnify ---------- */
  function magnify() {
    var reach = 150;
    document.addEventListener('mousemove', function (e) {
      var list = document.querySelector('#tools ul');
      if (!list) return;
      var r = list.getBoundingClientRect();
      var inside = e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
      if (!inside && !list._mag) return;
      list._mag = inside;
      [].slice.call(list.querySelectorAll('.m-logo, .m-logo-img')).forEach(function (logo) {
        var b = logo.getBoundingClientRect();
        var d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
        logo.style.setProperty('--mag', inside ? Math.max(0, 1 - d / reach).toFixed(3) : 0);
      });
    }, { passive: true });
  }

  /* ---------- hero dot field: a faint grid of dots that leans away from the pointer ---------- */
  function dotFields(root) {
    [].slice.call(root.querySelectorAll('canvas.m-field:not([data-field])')).forEach(function (cv) {
      cv.setAttribute('data-field', '');
      dotField(cv);
    });
  }

  function dotField(cv) {
    var GAP = 24, DOT = 1.1, BASE = 0.16, REACH = 150, PUSH = 9;
    var host = cv.parentNode, g = cv.getContext('2d');
    var dots = [], W = 0, H = 0, dpr = 1, ink = '#18181B';
    var mx = -1e4, my = -1e4, waves = [], running = false, visible = true, still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function build() {
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      ink = getComputedStyle(cv).color || ink;
      dots = [];
      var ox = (W % GAP) / 2 + GAP / 2, oy = (H % GAP) / 2 + GAP / 2;
      for (var y = oy; y < H; y += GAP) for (var x = ox; x < W; x += GAP) dots.push({ hx: x, hy: y, x: x, y: y, a: BASE, r: DOT });
      draw();
    }

    function draw() {
      g.clearRect(0, 0, W, H);
      g.fillStyle = ink;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        g.globalAlpha = d.a;
        g.beginPath(); g.arc(d.x, d.y, d.r, 0, 6.2832); g.fill();
      }
      g.globalAlpha = 1;
    }

    function step(now) {
      waves = waves.filter(function (w) { return now - w.t < 1100; });
      var moving = false;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i], dx = d.hx - mx, dy = d.hy - my, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var k = Math.max(0, 1 - dist / REACH); k = k * k * (3 - 2 * k);
        var tx = d.hx + dx / dist * PUSH * k, ty = d.hy + dy / dist * PUSH * k, ta = BASE + 0.34 * k;
        // ripple: a ring that travels outward from a click or tap
        for (var j = 0; j < waves.length; j++) {
          var w = waves[j], wx = d.hx - w.x, wy = d.hy - w.y, wd = Math.sqrt(wx * wx + wy * wy) || 1;
          var age = (now - w.t) / 1100, ring = age * 520, band = Math.max(0, 1 - Math.abs(wd - ring) / 34) * (1 - age);
          tx += wx / wd * 7 * band; ty += wy / wd * 7 * band; ta += 0.3 * band;
        }
        d.x += (tx - d.x) * 0.16; d.y += (ty - d.y) * 0.16; d.a += (ta - d.a) * 0.16;
        d.r = DOT * (1 + 0.9 * (d.a - BASE) / 0.34);
        if (Math.abs(tx - d.x) + Math.abs(ty - d.y) + Math.abs(ta - d.a) * 20 > 0.02) moving = true;
      }
      draw();
      if (visible && (moving || waves.length || mx > -1e3)) requestAnimationFrame(step);
      else running = false;
    }
    function wake() { if (!still && !running && visible) { running = true; requestAnimationFrame(step); } }
    function local(e) { var b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }

    build();
    if ('ResizeObserver' in window) new ResizeObserver(function () { build(); }).observe(cv);
    else window.addEventListener('resize', build);
    if (still) return;
    host.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var p = local(e); mx = p[0]; my = p[1]; wake(); });
    host.addEventListener('pointerleave', function () { mx = my = -1e4; wake(); });
    host.addEventListener('pointerdown', function (e) { var p = local(e); waves.push({ x: p[0], y: p[1], t: performance.now() }); wake(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }).observe(cv);
  }

  function init() {
    rollStatic(document);
    gallery(document);
    watch(document);
    dotFields(document);
    // the homepage draws its content after load, so pick up rolling numbers and the hero dot field as they appear
    if ('MutationObserver' in window) new MutationObserver(function () { watch(document); dotFields(document); }).observe(document.body, { childList: true, subtree: true });
    magnify();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.DDUI = { roll: rollReact };
})();
