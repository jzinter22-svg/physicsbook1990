/* ============================================================
   الرسوم التفاعلية المتحركة — الفصل الأول: الحركة الدائرية والدورانية
   Canvas 2D + requestAnimationFrame، تدعم اللمس والفأرة.
   ============================================================ */
(function () {
  "use strict";

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) || 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The page is RTL, but canvas text direction must stay LTR — otherwise
    // textAlign values (and Arabic label text) render mirrored/truncated.
    ctx.direction = "ltr";
    return { ctx, size };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    const headLen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width || 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function runner(canvas, drawFrame) {
    let raf = null;
    let inViewport = true;
    let last = performance.now();
    function isRunning() {
      return inViewport && document.visibilityState === "visible";
    }
    function loop(t) {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      if (isRunning()) {
        const { ctx, size } = setupCanvas(canvas);
        drawFrame(ctx, size, dt);
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        inViewport = e.isIntersecting;
        if (inViewport) last = performance.now();
      });
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") last = performance.now();
    });
    return {
      stop: () => cancelAnimationFrame(raf),
    };
  }

  function fmt(n, d) {
    if (!isFinite(n)) return "0";
    return n.toFixed(d == null ? 2 : d);
  }

  /* ========================================================
     1) الحركة الدائرية: متجهات السرعة والتعجيل المركزي
     ======================================================== */
  function initCircularMotion(root) {
    const canvas = root.querySelector("[data-role=canvas]");
    if (!canvas) return;
    const rRange = root.querySelector("[data-role=r]");
    const wRange = root.querySelector("[data-role=w]");
    const vOut = root.querySelector("[data-role=v-out]");
    const acOut = root.querySelector("[data-role=ac-out]");
    const rOut = root.querySelector("[data-role=r-out]");
    const wOut = root.querySelector("[data-role=w-out]");
    let theta = 0;

    function state() {
      const rNorm = parseFloat(rRange.value); // 0.3 - 0.95 (fraction of stage)
      const w = parseFloat(wRange.value); // rad/s
      return { rNorm, w };
    }

    function update() {
      const { rNorm, w } = state();
      const rMeters = (rNorm * 4).toFixed(2);
      const v = w * rMeters;
      const ac = w * w * rMeters;
      if (rOut) rOut.textContent = rMeters + " m";
      if (wOut) wOut.textContent = fmt(w, 2) + " rad/s";
      if (vOut) vOut.textContent = fmt(v, 2) + " m/s";
      if (acOut) acOut.textContent = fmt(ac, 2) + " m/s²";
    }
    [rRange, wRange].forEach((el) => el && el.addEventListener("input", update));
    update();

    runner(canvas, (ctx, size, dt) => {
      const { rNorm, w } = state();
      const cx = size / 2,
        cy = size / 2;
      const R = rNorm * size * 0.38;
      theta += w * dt;

      ctx.clearRect(0, 0, size, size);

      // orbit path
      ctx.strokeStyle = cssVar("--border-strong");
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // center
      ctx.fillStyle = cssVar("--text-faint");
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      const px = cx + R * Math.cos(theta);
      const py = cy + R * Math.sin(theta);

      // radius line
      ctx.strokeStyle = cssVar("--text-faint");
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // centripetal acceleration vector (toward center)
      const acLen = Math.min(50, 18 + w * 6);
      const ax = px + (cx - px) / R * acLen;
      const ay = py + (cy - py) / R * acLen;
      drawArrow(ctx, px, py, ax, ay, cssVar("--brand-4"), 3.5);

      // tangential velocity vector
      const tAngle = theta + Math.PI / 2;
      const vLen = Math.min(56, 16 + w * 8);
      drawArrow(ctx, px, py, px + vLen * Math.cos(tAngle), py + vLen * Math.sin(tAngle), cssVar("--brand-1"), 3.5);

      // moving particle
      ctx.fillStyle = cssVar("--brand-2");
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cssVar("--surface-solid");
      ctx.lineWidth = 2;
      ctx.stroke();

      // legend labels
      ctx.font = "bold 13px Cairo, sans-serif";
      ctx.fillStyle = cssVar("--brand-1");
      ctx.textAlign = "start";
      ctx.fillText("v", px + vLen * Math.cos(tAngle) + 6, py + vLen * Math.sin(tAngle));
      ctx.fillStyle = cssVar("--brand-4");
      ctx.fillText("aᴄ", ax + 6, ay);
    });
  }

  /* ========================================================
     2) القوة المركزية: كرة تدور بخيط
     ======================================================== */
  function initCentripetalForce(root) {
    const canvas = root.querySelector("[data-role=canvas]");
    if (!canvas) return;
    const mRange = root.querySelector("[data-role=m]");
    const vRange = root.querySelector("[data-role=v]");
    const rRange = root.querySelector("[data-role=r]");
    const fOut = root.querySelector("[data-role=f-out]");
    const mOut = root.querySelector("[data-role=m-out]");
    const vOut = root.querySelector("[data-role=v-out]");
    const rOut = root.querySelector("[data-role=r-out]");
    let theta = 0;

    function state() {
      return {
        m: parseFloat(mRange.value),
        v: parseFloat(vRange.value),
        rNorm: parseFloat(rRange.value),
      };
    }
    function update() {
      const { m, v, rNorm } = state();
      const r = rNorm * 2; // meters
      const F = (m * v * v) / r;
      if (mOut) mOut.textContent = fmt(m, 2) + " kg";
      if (vOut) vOut.textContent = fmt(v, 2) + " m/s";
      if (rOut) rOut.textContent = fmt(r, 2) + " m";
      if (fOut) fOut.textContent = fmt(F, 2) + " N";
    }
    [mRange, vRange, rRange].forEach((el) => el && el.addEventListener("input", update));
    update();

    runner(canvas, (ctx, size, dt) => {
      const { m, v, rNorm } = state();
      const r = rNorm * 2;
      const cx = size / 2,
        cy = size / 2;
      const R = rNorm * size * 0.38;
      const w = v / Math.max(r, 0.1);
      theta += w * dt;

      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = cssVar("--border-strong");
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // pivot
      ctx.fillStyle = cssVar("--text-soft");
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      const px = cx + R * Math.cos(theta);
      const py = cy + R * Math.sin(theta);

      // string
      ctx.strokeStyle = cssVar("--text-faint");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Fc vector
      const F = (m * v * v) / Math.max(r, 0.1);
      const fLen = Math.min(60, 16 + F * 2.2);
      const fx = px + (cx - px) / R * fLen;
      const fy = py + (cy - py) / R * fLen;
      drawArrow(ctx, px, py, fx, fy, cssVar("--brand-4"), 4);

      // ball sized by mass
      const ballR = 8 + m * 2.2;
      const grad = ctx.createRadialGradient(px - ballR / 3, py - ballR / 3, 1, px, py, ballR);
      grad.addColorStop(0, cssVar("--brand-3"));
      grad.addColorStop(1, cssVar("--brand-1"));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, ballR, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 13px Cairo, sans-serif";
      ctx.fillStyle = cssVar("--brand-4");
      ctx.fillText("Fᴄ", fx + 6, fy);
    });
  }

  /* ========================================================
     3) مدارات كبلر: قانون تساوي المساحات
     ======================================================== */
  function initKepler(root) {
    const canvas = root.querySelector("[data-role=canvas]");
    if (!canvas) return;
    const eRange = root.querySelector("[data-role=e]");
    const speedRange = root.querySelector("[data-role=speed]");
    const eOut = root.querySelector("[data-role=e-out]");
    let theta = 0.001;
    let sweptAngleStart = null;

    function state() {
      return { e: parseFloat(eRange.value), speedMul: parseFloat(speedRange.value) };
    }
    function update() {
      const { e } = state();
      if (eOut) eOut.textContent = fmt(e, 2);
    }
    [eRange, speedRange].forEach((el) => el && el.addEventListener("input", update));
    update();

    runner(canvas, (ctx, size, dt) => {
      const { e, speedMul } = state();
      const cx = size / 2,
        cy = size / 2;
      const a = size * 0.36; // semi-major
      const b = a * Math.sqrt(1 - e * e); // semi-minor
      const c = Math.sqrt(Math.max(a * a - b * b, 0)); // focus offset
      const focusX = cx - c;

      // r(theta) relative to focus, standard polar ellipse eq
      const p = b * b / a;
      function radiusAt(th) {
        return p / (1 + e * Math.cos(th));
      }

      // angular speed varies (faster near perihelion) -> equal areas in equal time:
      // dtheta/dt proportional to 1 / r^2
      const r = radiusAt(theta);
      const w = (speedMul * 1.4) / (r * r) * (a * a * 0.02);
      theta += w * dt;
      if (theta > Math.PI * 2) theta -= Math.PI * 2;

      ctx.clearRect(0, 0, size, size);

      // orbit ellipse (centered at cx,cy but focus offset)
      ctx.strokeStyle = cssVar("--border-strong");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
      ctx.stroke();

      // sun at focus
      const sunGrad = ctx.createRadialGradient(focusX, cy, 1, focusX, cy, 16);
      sunGrad.addColorStop(0, cssVar("--brand-5"));
      sunGrad.addColorStop(1, cssVar("--brand-4"));
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(focusX, cy, 12, 0, Math.PI * 2);
      ctx.fill();

      const px = focusX + r * Math.cos(theta);
      const py = cy + r * Math.sin(theta);

      // swept area wedge (visual only, small arc slice)
      ctx.fillStyle = cssVar("--brand-3");
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.moveTo(focusX, cy);
      ctx.arc(focusX, cy, r, theta - 0.18, theta);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // planet
      ctx.fillStyle = cssVar("--brand-1");
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cssVar("--surface-solid");
      ctx.lineWidth = 2;
      ctx.stroke();

      // line focus->planet
      ctx.strokeStyle = cssVar("--text-faint");
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(focusX, cy);
      ctx.lineTo(px, py);
      ctx.stroke();
    });
  }

  /* ========================================================
     4) الحركة الدورانية: قرص دوّار
     ======================================================== */
  function initRotationalDisk(root) {
    const canvas = root.querySelector("[data-role=canvas]");
    if (!canvas) return;
    const wRange = root.querySelector("[data-role=w]");
    const wOut = root.querySelector("[data-role=w-out]");
    const thetaOut = root.querySelector("[data-role=theta-out]");
    const revOut = root.querySelector("[data-role=rev-out]");
    let theta = 0;

    function state() {
      return { w: parseFloat(wRange.value) };
    }
    function update() {
      const { w } = state();
      if (wOut) wOut.textContent = fmt(w, 2) + " rad/s";
    }
    wRange && wRange.addEventListener("input", update);
    update();

    runner(canvas, (ctx, size, dt) => {
      const { w } = state();
      theta += w * dt;
      const cx = size / 2,
        cy = size / 2;
      const R = size * 0.34;

      ctx.clearRect(0, 0, size, size);

      // disk
      const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      grad.addColorStop(0, cssVar("--surface-strong"));
      grad.addColorStop(1, cssVar("--border-strong"));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cssVar("--brand-1");
      ctx.lineWidth = 3;
      ctx.stroke();

      // spokes to show rotation
      ctx.strokeStyle = cssVar("--brand-2");
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const a = theta + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * 0.92 * Math.cos(a), cy + R * 0.92 * Math.sin(a));
        ctx.stroke();
      }

      // marker point on rim
      const mx = cx + R * Math.cos(theta);
      const my = cy + R * Math.sin(theta);
      ctx.fillStyle = cssVar("--brand-4");
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.fill();

      // tangential velocity vector at marker
      const tAngle = theta + Math.PI / 2;
      const vLen = 14 + Math.min(40, w * 8);
      drawArrow(ctx, mx, my, mx + vLen * Math.cos(tAngle), my + vLen * Math.sin(tAngle), cssVar("--brand-1"), 3);

      // hub
      ctx.fillStyle = cssVar("--text-soft");
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      if (thetaOut) thetaOut.textContent = fmt(((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), 2) + " rad";
      if (revOut) revOut.textContent = fmt(theta / (2 * Math.PI), 2) + " دورة";
    });
  }

  /* ========================================================
     5) عزم القصور الذاتي: سباق التدحرج
     ======================================================== */
  function initInertiaRace(root) {
    const canvas = root.querySelector("[data-role=canvas]");
    if (!canvas) return;
    const resetBtn = root.querySelector("[data-role=reset]");
    const shapes = [
      { name: "طوق", color: cssVar("--brand-4"), k: 1 }, // I = m r^2  -> k=1
      { name: "أسطوانة", color: cssVar("--brand-1"), k: 0.5 }, // I = 1/2 m r^2
      { name: "كرة مصمتة", color: cssVar("--brand-3"), k: 0.4 }, // I = 2/5 m r^2
    ];
    let progress = shapes.map(() => 0);
    let t0 = performance.now();

    function reset() {
      progress = shapes.map(() => 0);
      t0 = performance.now();
    }
    resetBtn && resetBtn.addEventListener("click", reset);

    runner(canvas, (ctx, size) => {
      const w = size,
        h = size;
      ctx.clearRect(0, 0, w, h);

      const trackTop = h * 0.12;
      const trackBottom = h * 0.82;
      const laneGap = (trackBottom - trackTop) / shapes.length;
      const rampX1 = w * 0.12,
        rampX2 = w * 0.82;

      const elapsed = (performance.now() - t0) / 1000;

      shapes.forEach((s, i) => {
        // acceleration down incline: a = g sinθ / (1 + k)
        const g = 9.8,
          sinT = 0.35;
        const a = (g * sinT) / (1 + s.k);
        const dist = 0.5 * a * elapsed * elapsed;
        const laneY = trackTop + laneGap * (i + 0.5);
        const x = Math.min(rampX1 + dist * 40, rampX2);

        // lane line
        ctx.strokeStyle = cssVar("--border");
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(rampX1, laneY);
        ctx.lineTo(rampX2, laneY);
        ctx.stroke();
        ctx.setLineDash([]);

        // lane label — fixed above the lane line, in the gap between lanes,
        // so it never collides with the moving ball on the line itself
        ctx.fillStyle = s.color;
        ctx.font = "bold 12px Cairo, sans-serif";
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(s.name, rampX1, laneY - laneGap * 0.32);

        // ball (plain — no text inside, avoids overflow in a small circle)
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x, laneY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cssVar("--surface-solid");
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // finish line
      ctx.strokeStyle = cssVar("--text-faint");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rampX2, trackTop - 8);
      ctx.lineTo(rampX2, trackBottom + 8);
      ctx.stroke();

      if (elapsed > 4.5) reset();
    });
  }

  /* ========================================================
     6) الزخم الزاوي: المتزلجة الدوّارة (حفظ الزخم الزاوي)
     ======================================================== */
  function initAngularMomentum(root) {
    const canvas = root.querySelector("[data-role=canvas]");
    if (!canvas) return;
    const armRange = root.querySelector("[data-role=arm]");
    const iOut = root.querySelector("[data-role=i-out]");
    const wOut = root.querySelector("[data-role=w-out]");
    const lOut = root.querySelector("[data-role=l-out]");
    let theta = 0;
    const L = 6; // ثابت: الزخم الزاوي المحفوظ

    function state() {
      const armNorm = parseFloat(armRange.value); // 0.3 (ذراعين للداخل) - 1 (ذراعين للخارج)
      const I = 0.6 + armNorm * armNorm * 2.2; // moment of inertia grows with arm extension
      const w = L / I;
      return { armNorm, I, w };
    }
    function update() {
      const { I, w } = state();
      if (iOut) iOut.textContent = fmt(I, 2) + " kg·m²";
      if (wOut) wOut.textContent = fmt(w, 2) + " rad/s";
      if (lOut) lOut.textContent = fmt(L, 2) + " kg·m²/s";
    }
    armRange && armRange.addEventListener("input", update);
    update();

    runner(canvas, (ctx, size, dt) => {
      const { armNorm, w } = state();
      theta += w * dt;
      const cx = size / 2,
        cy = size / 2;
      const armLen = size * (0.14 + armNorm * 0.28);

      ctx.clearRect(0, 0, size, size);

      // torso
      ctx.fillStyle = cssVar("--brand-1");
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.05, size * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();

      // rotation guide circle
      ctx.strokeStyle = cssVar("--border");
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, armLen, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // two arms (opposite directions)
      [0, Math.PI].forEach((offset) => {
        const a = theta + offset;
        const ex = cx + armLen * Math.cos(a);
        const ey = cy + armLen * Math.sin(a) * 0.55;
        ctx.strokeStyle = cssVar("--brand-4");
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.fillStyle = cssVar("--brand-2");
        ctx.beginPath();
        ctx.arc(ex, ey, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // head
      ctx.fillStyle = cssVar("--brand-3");
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.15, size * 0.045, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* ---------------- init all on DOM ready ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-diagram]").forEach((root) => {
      const kind = root.getAttribute("data-diagram");
      const initMap = {
        "circular-motion": initCircularMotion,
        "centripetal-force": initCentripetalForce,
        kepler: initKepler,
        "rotational-disk": initRotationalDisk,
        "inertia-race": initInertiaRace,
        "angular-momentum": initAngularMomentum,
      };
      if (initMap[kind]) initMap[kind](root);
    });
  });
})();
