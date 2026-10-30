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

  function init() {
    rollStatic(document);
    gallery(document);
    watch(document);
    // the homepage draws its content after load, so pick up rolling numbers as they appear
    if ('MutationObserver' in window) new MutationObserver(function () { watch(document); }).observe(document.body, { childList: true, subtree: true });
    magnify();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.DDUI = { roll: rollReact };
})();
