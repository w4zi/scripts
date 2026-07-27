/* WaziScripts — main logic (vanilla JS, no build) */
(function () {
  "use strict";

  /* ---------- Click sounds (Web Audio, no files) ---------- */
  var audioCtx = null;
  function ac() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    return audioCtx;
  }
  function blip(freq, dur, type, gain) {
    var c = ac();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain || 0.06, c.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.12));
    o.connect(g); g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + (dur || 0.12) + 0.02);
  }
  function clickSound() {
    blip(660, 0.09, "triangle", 0.05);
    blip(990, 0.06, "sine", 0.03);
  }
  function copySound() {
    blip(523, 0.08, "sine", 0.05);
    blip(784, 0.12, "sine", 0.05);
  }

  /* ---------- Welcome intro ---------- */
  var intro = document.getElementById("intro");
  var app = document.getElementById("app");
  var INTRO_MS = 3400;

  function revealApp() {
    intro.classList.add("is-hidden");
    app.setAttribute("aria-hidden", "false");
    // Allow the paint to settle, then fade the app in
    requestAnimationFrame(function () {
      app.classList.add("is-ready");
    });
  }

  window.addEventListener("load", function () {
    setTimeout(revealApp, INTRO_MS);
  });

  /* ---------- View navigation ---------- */
  var views = {};
  document.querySelectorAll(".view").forEach(function (v) {
    views[v.dataset.view] = v;
  });

  function go(name) {
    var target = views[name];
    if (!target) return;
    Object.keys(views).forEach(function (k) {
      views[k].classList.toggle("is-active", k === name);
    });
    // gentle parallax-ish scroll reset
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-go]").forEach(function (el) {
    el.addEventListener("click", function () {
      clickSound();
      go(el.dataset.go);
    });
  });

  /* ---------- Copy to clipboard ---------- */
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copySound();
      var codeEl = document.getElementById(btn.dataset.codeId);
      if (!codeEl) return;
      var text = codeEl.textContent.trim();
      var label = btn.querySelector(".copy-btn__label");

      function done(ok) {
        var old = label.innerHTML;
        if (ok) {
          btn.classList.add("is-copied");
          label.innerHTML = "✓ Copied!";
        } else {
          label.innerHTML = "Failed";
        }
        setTimeout(function () {
          btn.classList.remove("is-copied");
          label.innerHTML = "Copy";
        }, 1600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
  });

  function fallbackCopy(text, cb) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      cb(ok);
    } catch (e) {
      cb(false);
    }
  }

  /* ---------- Discord button click sound ---------- */
  document.querySelectorAll(".discord-btn").forEach(function (btn) {
    btn.addEventListener("click", clickSound);
  });

  /* ---------- Card hover spotlight ---------- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- Particle background ---------- */
  var canvas = document.getElementById("particles");
  var ctx = canvas.getContext("2d");
  var particles = [];
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var raf = null;

  function resize() {
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initParticles();
  }

  function initParticles() {
    var count = Math.min(70, Math.floor((W * H) / 22000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        a: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.tw += 0.03;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
      var twinkle = (Math.sin(p.tw) + 1) / 2;
      var alpha = p.a * (0.5 + twinkle * 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(120, 180, 255, " + alpha.toFixed(3) + ")";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(90,169,255,0.8)";
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(tick);

  // Pause animation when tab hidden to save CPU
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  });

  /* ---------- Occasional lightning streaks ---------- */
  var lightning = document.createElement("div");
  lightning.className = "lightning";
  document.body.appendChild(lightning);

  function spawnLightning() {
    lightning.classList.remove("flash");
    void lightning.offsetWidth; // reflow to restart animation
    lightning.classList.add("flash");
  }

  function scheduleLightning() {
    var delay = 7000 + Math.random() * 9000;
    setTimeout(function () {
      spawnLightning();
      scheduleLightning();
    }, delay);
  }
  setTimeout(scheduleLightning, 4000);

  /* ---------- Gentle parallax on background glows ---------- */
  var glow1 = document.querySelector(".bg-glow--1");
  var glow2 = document.querySelector(".bg-glow--2");
  var px = 0, py = 0, tx = 0, ty = 0;

  window.addEventListener("mousemove", function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function parallax() {
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;
    if (glow1) glow1.style.transform = "translate(" + (px * 18) + "px," + (py * 18) + "px)";
    if (glow2) glow2.style.transform = "translate(" + (-px * 18) + "px," + (-py * 18) + "px)";
    requestAnimationFrame(parallax);
  }
  requestAnimationFrame(parallax);
})();
