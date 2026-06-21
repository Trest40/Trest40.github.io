// Tasqyn site — scroll reveals, gauge count-up, importance bars.
(() => {
  'use strict';

  // Staggered scroll reveals.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Hero gauge: animate ring + count up to 78% when in view.
  const ring = document.getElementById('heroRing');
  const pct = document.getElementById('heroPct');
  const TARGET = 78;
  const CIRC = 753.98;

  function runGauge() {
    if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - TARGET / 100));
    if (pct) {
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / 1600);
        const eased = 1 - Math.pow(1 - k, 3);
        pct.textContent = Math.round(TARGET * eased) + '%';
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // Importance bars fill when scrolled into view.
  const barObs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.querySelectorAll('.fill').forEach((f) => {
          f.style.width = (f.dataset.w || 0) + '%';
        });
        barObs.unobserve(e.target);
      }
    },
    { threshold: 0.3 },
  );
  document.querySelectorAll('.bars').forEach((b) => barObs.observe(b));

  // Kick off the gauge shortly after load (it's above the fold).
  if (document.readyState !== 'loading') setTimeout(runGauge, 300);
  else window.addEventListener('load', () => setTimeout(runGauge, 300));
})();
