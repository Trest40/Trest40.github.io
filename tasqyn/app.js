// Tasqyn portfolio site — map, station detail, hydrograph, proofs gallery,
// lightbox, animated feature bars, and RU/EN language switching.
// All content comes from real project data in window.FLOOD_DATA (data.js).
(() => {
  'use strict';
  const DATA = window.FLOOD_DATA;
  if (!DATA) return;
  const { stations, meta } = DATA;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // ---------------------------------------------------------------- i18n
  let LANG = 'ru';
  const I18N = {
    ru: {
      mean: 'средний уровень', max: 'макс. уровень', cm: 'см',
      seasonNorm: 'Сезонная норма уровня (опорный ряд)', updated: 'обновлено',
      anchor: 'ОПОРНАЯ', fullHydro: 'Полный гидрограф 1995–2022 →',
      levelWord: 'уровень', kz: 'Казахстан', rus: 'Россия',
      statusLevel: { normal: 'Норма', elevated: 'Повышенный', high: 'Высокий', low: 'Низкий' },
      chartMeta: (n, a, b, fc) => `${n} мес. · ${a}–${b} · пики выше порога в ${fc} годах`,
      months: ['', 'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    },
    en: {
      mean: 'mean level', max: 'max level', cm: 'cm',
      seasonNorm: 'Seasonal level norm (anchor record)', updated: 'updated',
      anchor: 'ANCHOR', fullHydro: 'Full hydrograph 1995–2022 →',
      levelWord: 'level', kz: 'Kazakhstan', rus: 'Russia',
      statusLevel: { normal: 'Normal', elevated: 'Elevated', high: 'High', low: 'Low' },
      chartMeta: (n, a, b, fc) => `${n} months · ${a}–${b} · peaks above threshold in ${fc} years`,
      months: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
  };
  const T = () => I18N[LANG];

  const el = (t, a = {}, p) => {
    const n = document.createElementNS(SVGNS, t);
    for (const k in a) n.setAttribute(k, a[k]);
    if (p != null) n.textContent = p;
    return n;
  };
  const STC = { normal: '#2e9e6b', elevated: '#e0a020', high: '#d2452c', low: '#7f9bab' };

  // swap all static [data-en] nodes between RU (stored) and EN
  function applyStatic() {
    document.querySelectorAll('[data-en]').forEach((n) => {
      if (n.dataset.ru === undefined) n.dataset.ru = n.innerHTML;
      n.innerHTML = LANG === 'en' ? n.dataset.en : n.dataset.ru;
    });
    document.documentElement.lang = LANG;
  }

  // ---------------------------------------------------------------- summary
  set('kStations', meta.n_stations);
  set('fYears', meta.flood_years.length);
  function set(id, v) { const n = document.getElementById(id); if (n) n.textContent = v; }

  const fy = document.getElementById('floodYears');
  if (fy) meta.flood_years.forEach((y) => {
    const c = document.createElement('span');
    c.className = 'yr-chip'; c.textContent = y; fy.appendChild(c);
  });

  // ---------------------------------------------------------------- map
  const svg = document.getElementById('mapSvg');
  const W = 800, H = 560, PAD = 64;
  const LON = [50.4, 72.4], LAT = [50.6, 56.0];
  const px = (lon) => PAD + ((lon - LON[0]) / (LON[1] - LON[0])) * (W - 2 * PAD);
  const py = (lat) => PAD + (1 - (lat - LAT[0]) / (LAT[1] - LAT[0])) * (H - 2 * PAD);

  svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent' }));
  const land = [
    [50.8, 51.0], [55, 50.9], [62, 51.1], [69, 51.0], [72, 52.2], [71.5, 55],
    [66, 55.6], [58, 55.3], [52, 55.4], [50.6, 53.5],
  ].map(([lo, la]) => `${px(lo).toFixed(0)},${py(la).toFixed(0)}`).join(' ');
  svg.appendChild(el('polygon', { points: land, class: 'region' }));

  for (let lon = 52; lon <= 72; lon += 4) {
    svg.appendChild(el('line', { x1: px(lon), y1: PAD - 16, x2: px(lon), y2: H - PAD + 16, class: 'grat' }));
    svg.appendChild(el('text', { x: px(lon), y: H - PAD + 30, class: 'axlabel', 'text-anchor': 'middle' }, `${lon}°E`));
  }
  for (let lat = 52; lat <= 55; lat += 1) {
    svg.appendChild(el('line', { x1: PAD - 16, y1: py(lat), x2: W - PAD + 16, y2: py(lat), class: 'grat' }));
    svg.appendChild(el('text', { x: PAD - 22, y: py(lat) + 3, class: 'axlabel', 'text-anchor': 'end' }, `${lat}°N`));
  }

  const ishim = stations.filter((s) => /Ishim/.test(s.river));
  const a0 = ishim.find((s) => s.id === 'astana'), p0 = ishim.find((s) => s.id === 'petropavl');
  if (a0 && p0) {
    const d = `M ${px(a0.lon)} ${py(a0.lat)} C ${px(a0.lon) - 30} ${py(a0.lat) - 60}, ${px(p0.lon) + 40} ${py(p0.lat) + 70}, ${px(p0.lon)} ${py(p0.lat)} S ${px(p0.lon) - 50} ${py(p0.lat) - 80}, ${px(p0.lon) - 70} ${py(p0.lat) - 110}`;
    svg.appendChild(el('path', { d, class: 'river' }));
  }

  let selectedId = null;
  const dotEls = {};
  stations.forEach((s) => {
    const x = px(s.lon), y = py(s.lat), col = STC[s.status];
    const g = el('g', { class: 'st-dot', tabindex: '0', role: 'button', 'aria-label': s.name });
    if (s.status === 'high' || s.status === 'elevated')
      g.appendChild(el('circle', { cx: x, cy: y, r: 7, fill: col, class: 'st-pulse', opacity: '.5' }));
    g.appendChild(el('circle', { cx: x, cy: y, r: s.anchor ? 9 : 7, fill: col, stroke: '#fff', 'stroke-width': s.anchor ? 3 : 2 }));
    if (s.anchor) g.appendChild(el('circle', { cx: x, cy: y, r: 3, fill: '#fff' }));
    const right = x < W / 2;
    const label = el('text', {
      x: right ? x + 14 : x - 14, y: y + 4, class: 'st-label',
      'text-anchor': right ? 'start' : 'end',
    }, s.name_ru);
    label.dataset.ru = s.name_ru; label.dataset.en = s.name;
    label.classList.add('st-labeltext');
    g.appendChild(label);
    g.appendChild(el('circle', { cx: x, cy: y, r: 22, class: 'st-hit' }));
    g.addEventListener('click', () => selectStation(s.id));
    g.addEventListener('keypress', (e) => { if (e.key === 'Enter') selectStation(s.id); });
    svg.appendChild(g);
    dotEls[s.id] = g;
  });

  // ---------------------------------------------------------------- detail
  const detail = document.getElementById('detail');
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

  function selectStation(id) {
    const s = stations.find((x) => x.id === id);
    if (!s) return;
    selectedId = id;
    Object.entries(dotEls).forEach(([k, g]) => g.classList.toggle('sel', k === id));
    const t = T();
    const name = LANG === 'en' ? s.name : s.name_ru;
    const river = LANG === 'en' ? s.river : s.river_ru;
    const note = LANG === 'en' ? (s.note_en || s.note) : s.note;
    const country = s.country === 'KZ' ? t.kz : t.rus;
    const hasLevel = s.level != null;
    const lvl = hasLevel
      ? (LANG === 'en'
          ? `. Mean ${Math.round(s.level)} cm, max ${Math.round(s.level_max)} cm`
          : `. Средний ${Math.round(s.level)} см, максимум ${Math.round(s.level_max)} см`)
      : '';
    detail.innerHTML = `
      <div class="d-name">${name}</div>
      <div class="d-river">${river} · ${country}</div>
      <p class="d-status"><span class="sdot s-${s.status}"></span>${t.statusLevel[s.status]} ${t.levelWord}${lvl}.</p>
      <p class="d-note">${note}</p>
      <div class="spark">
        <h4>${t.seasonNorm}</h4>
        <svg id="sparkSvg" viewBox="0 0 320 90" preserveAspectRatio="none"></svg>
      </div>
      <div class="d-meta">
        <span>${s.lat.toFixed(2)}°N, ${s.lon.toFixed(2)}°E</span>
        <span>${t.updated} ${s.updated}</span>
      </div>`;
    drawSpark();
  }

  function drawSpark() {
    const s = document.getElementById('sparkSvg');
    if (!s) return;
    const vals = []; for (let m = 1; m <= 12; m++) vals.push(meta.normals[m] ?? 0);
    const w = 320, h = 90, pl = 6, pb = 16, pt = 8;
    const mx = Math.max(...vals), mn = Math.min(...vals);
    const X = (i) => pl + (i / 11) * (w - 2 * pl);
    const Y = (v) => pt + (1 - (v - mn) / (mx - mn || 1)) * (h - pt - pb);
    let d = '', area = `M ${X(0)} ${h - pb} `;
    vals.forEach((v, i) => { d += `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(v).toFixed(1)} `; area += `L ${X(i).toFixed(1)} ${Y(v).toFixed(1)} `; });
    area += `L ${X(11)} ${h - pb} Z`;
    s.appendChild(el('path', { d: area, class: 'spark-area' }));
    s.appendChild(el('path', { d, class: 'spark-line' }));
    [1, 4, 7, 10].forEach((m) => s.appendChild(el('text', { x: X(m - 1), y: h - 4, class: 'spark-x', 'text-anchor': 'middle' }, T().months[m])));
  }

  // ---------------------------------------------------------------- hydrograph
  const anchor = stations.find((s) => s.anchor);
  const SERIES = anchor ? anchor.series : [];
  const cSvg = document.getElementById('chartSvg');
  const tip = document.getElementById('chartTip');
  const CW = 1100, CH = 420, M = { l: 56, r: 18, t: 18, b: 40 };
  const THRESH = 900;
  let metric = 'max';

  function drawChart() {
    cSvg.innerHTML = '';
    const vals = SERIES.map((d) => d[metric]);
    const maxV = Math.max(...vals, THRESH) * 1.05;
    const minV = Math.min(...vals, 0);
    const X = (i) => M.l + (i / (SERIES.length - 1)) * (CW - M.l - M.r);
    const Y = (v) => M.t + (1 - (v - minV) / (maxV - minV)) * (CH - M.t - M.b);

    const defs = el('defs');
    const lg = el('linearGradient', { id: 'hgrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    lg.appendChild(el('stop', { offset: '0%', 'stop-color': '#1f7fb0', 'stop-opacity': '.28' }));
    lg.appendChild(el('stop', { offset: '100%', 'stop-color': '#1f7fb0', 'stop-opacity': '.02' }));
    defs.appendChild(lg); cSvg.appendChild(defs);

    for (let v = 0; v <= maxV; v += 200) {
      cSvg.appendChild(el('line', { x1: M.l, y1: Y(v), x2: CW - M.r, y2: Y(v), class: 'gridln' }));
      cSvg.appendChild(el('text', { x: M.l - 10, y: Y(v) + 4, class: 'axlabel', 'text-anchor': 'end' }, v));
    }
    SERIES.forEach((d, i) => {
      if (d.m === 1 && d.y % 3 === 0)
        cSvg.appendChild(el('text', { x: X(i), y: CH - 12, class: 'axlabel', 'text-anchor': 'middle' }, d.y));
    });

    let area = `M ${X(0)} ${Y(minV)} `, line = '';
    SERIES.forEach((d, i) => { const p = `${X(i).toFixed(1)} ${Y(d[metric]).toFixed(1)}`; area += `L ${p} `; line += `${i ? 'L' : 'M'} ${p} `; });
    area += `L ${X(SERIES.length - 1)} ${Y(minV)} Z`;
    cSvg.appendChild(el('path', { d: area, class: 'hydro-area' }));
    cSvg.appendChild(el('path', { d: line, class: 'hydro-line' }));

    cSvg.appendChild(el('line', { x1: M.l, y1: Y(THRESH), x2: CW - M.r, y2: Y(THRESH), class: 'thr-line' }));
    cSvg.appendChild(el('text', { x: CW - M.r, y: Y(THRESH) - 6, class: 'thr-text', 'text-anchor': 'end' },
      LANG === 'en' ? `flood threshold ${THRESH} cm` : `порог половодья ${THRESH} см`));

    SERIES.forEach((d, i) => { if (d[metric] >= THRESH) cSvg.appendChild(el('circle', { cx: X(i), cy: Y(d[metric]), r: 3.2, class: 'peak-dot' })); });

    const cur = el('line', { class: 'cursor-x', x1: 0, y1: M.t, x2: 0, y2: CH - M.b, opacity: 0 });
    const cd = el('circle', { class: 'cursor-dot', r: 4.5, opacity: 0 });
    cSvg.appendChild(cur); cSvg.appendChild(cd);
    const hit = el('rect', { x: M.l, y: M.t, width: CW - M.l - M.r, height: CH - M.t - M.b, fill: 'transparent' });
    cSvg.appendChild(hit);
    hit.addEventListener('mousemove', (e) => {
      const r = cSvg.getBoundingClientRect();
      const sx = (e.clientX - r.left) / r.width * CW;
      let i = Math.round(((sx - M.l) / (CW - M.l - M.r)) * (SERIES.length - 1));
      i = Math.max(0, Math.min(SERIES.length - 1, i));
      const d = SERIES[i], gx = X(i), gy = Y(d[metric]);
      cur.setAttribute('x1', gx); cur.setAttribute('x2', gx); cur.setAttribute('opacity', 1);
      cd.setAttribute('cx', gx); cd.setAttribute('cy', gy); cd.setAttribute('opacity', 1);
      tip.hidden = false;
      tip.style.left = (gx / CW * r.width) + 'px';
      tip.style.top = (gy / CH * r.height) + 'px';
      tip.innerHTML = `${T().months[d.m]} ${d.y} · <b>${Math.round(d[metric])} ${T().cm}</b>`;
    });
    hit.addEventListener('mouseleave', () => { cur.setAttribute('opacity', 0); cd.setAttribute('opacity', 0); tip.hidden = true; });

    const last = SERIES[SERIES.length - 1];
    document.getElementById('chartMeta').textContent =
      T().chartMeta(SERIES.length, SERIES[0].y, last.y, meta.flood_years.length);
  }

  document.querySelectorAll('#metricSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#metricSeg button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      metric = b.dataset.metric;
      drawChart();
    });
  });

  // ---------------------------------------------------------------- proofs gallery
  const FIGS = [
    { src: 'assets/timeline_probability.png', tab: { ru: 'Таймлайн', en: 'Timeline' }, cap: { ru: 'Предсказанная вероятность паводка 1996–2024 с наложенными реальными событиями (красные точки).', en: 'Predicted flood probability 1996–2024 with real events overlaid (red dots).' } },
    { src: 'assets/feature_importance.png', tab: { ru: 'Важность признаков', en: 'Feature importance' }, cap: { ru: 'Топ-признаки XGBoost: снежный покров за 4 месяца до паводка явно главный. Модель сама вышла на механизм снеготаяния.', en: 'Top XGBoost features: snow cover 4 months before the flood clearly dominates. The model found the snowmelt mechanism on its own.' } },
    { src: 'assets/river_vs_probability.png', tab: { ru: 'Уровень vs прогноз', en: 'Level vs forecast' }, cap: { ru: 'Уровень реки против предсказанной вероятности (двойная ось): пики вероятности совпадают с половодьями.', en: 'River level versus predicted probability (dual axis): probability peaks coincide with floods.' } },
    { src: 'assets/naive_roc_curve.png', tab: { ru: 'ROC-кривая', en: 'ROC curve' }, cap: { ru: 'ROC-кривая модели на удержанных данных.', en: 'Model ROC curve on held-out data.' } },
    { src: 'assets/naive_precision_recall_curve.png', tab: { ru: 'Precision–Recall', en: 'Precision–Recall' }, cap: { ru: 'Кривая точность–полнота. Она честнее ROC, когда паводков в данных мало (около 6%).', en: 'Precision–recall curve. Fairer than ROC when floods are rare in the data (about 6%).' } },
    { src: 'assets/naive_confusion_matrix.png', tab: { ru: 'Матрица ошибок', en: 'Confusion matrix' }, cap: { ru: 'Матрица ошибок: TN 69 · FP 1 · FN 4 · TP 10.', en: 'Confusion matrix: TN 69 · FP 1 · FN 4 · TP 10.' } },
  ];
  let curFig = 0;
  const gImg = document.getElementById('gImg');
  const gCap = document.getElementById('gCap');
  const gtabs = document.getElementById('gtabs');
  function showFig(i) {
    curFig = i;
    const f = FIGS[i];
    gImg.src = f.src; gImg.alt = f.cap[LANG]; gCap.textContent = f.cap[LANG];
    [...gtabs.children].forEach((b, k) => {
      b.classList.toggle('on', k === i);
      b.textContent = FIGS[k].tab[LANG];
    });
  }
  if (gtabs) {
    FIGS.forEach((f, i) => {
      const b = document.createElement('button');
      b.className = 'gtab'; b.textContent = f.tab[LANG];
      b.addEventListener('click', () => showFig(i));
      gtabs.appendChild(b);
    });
    showFig(0);
  }

  // ---------------------------------------------------------------- lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const openLb = () => { lbImg.src = gImg.src; lbCap.textContent = gCap.textContent; lb.hidden = false; };
  const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
  document.querySelector('.gstage')?.addEventListener('click', openLb);
  document.getElementById('lbClose')?.addEventListener('click', closeLb);
  lb?.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  // ---------------------------------------------------------------- feature bars
  const barWrap = document.getElementById('featBars');
  if (barWrap) {
    const bo = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll('.fill').forEach((f) => { f.style.width = (f.dataset.w || 0) + '%'; });
        bo.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    bo.observe(barWrap);
  }

  // ---------------------------------------------------------------- language toggle
  const langBtn = document.getElementById('langToggle');
  function setLang(l) {
    LANG = l;
    try { localStorage.setItem('tasqyn-lang', l); } catch (e) { /* ignore */ }
    applyStatic();
    if (langBtn) langBtn.textContent = LANG === 'ru' ? 'EN' : 'RU';
    selectStation(selectedId || (anchor ? anchor.id : stations[0].id));
    if (SERIES.length) drawChart();
    showFig(curFig);
  }
  langBtn?.addEventListener('click', () => setLang(LANG === 'ru' ? 'en' : 'ru'));

  // ---------------------------------------------------------------- mobile menu
  const burger = document.getElementById('navBurger');
  const links = document.querySelector('.navlinks');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      links.classList.remove('open');
      burger.classList.remove('open');
    }));
  }

  // ---------------------------------------------------------------- init
  if (SERIES.length) drawChart();
  selectStation(anchor ? anchor.id : stations[0].id);
  // Default language is English; honour a stored 'ru' preference.
  let startLang = 'en';
  try { if (localStorage.getItem('tasqyn-lang') === 'ru') startLang = 'ru'; } catch (e) { /* ignore */ }
  setLang(startLang);

  document.querySelectorAll('.prose, .facts, .chart-card, .map-panel, .detail, .flood-stat, .verdict, .signal, .gallery, .phone, .unified')
    .forEach((n) => n.classList.add('reveal'));
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
})();
