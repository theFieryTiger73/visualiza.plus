/* ==========================================================================
   VISUALIZA+ — main.js
   Loader, cursor, reveals, line splits, scroll effects.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- utility ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- loader ---------- */
  (function loader() {
    var el = document.getElementById("loader");
    if (!el) return;
    if (reduced) { el.remove(); return; }
    var fill = document.getElementById("loaderFill");
    var pct = document.getElementById("loaderPct");
    var p = 0;
    var timer = setInterval(function () {
      p += Math.floor(Math.random() * 18) + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        setTimeout(function () { el.classList.add("done"); }, 250);
      }
      if (fill) fill.style.width = p + "%";
      if (pct) pct.textContent = String(p).padStart(2, "0") + "%";
    }, 90);
  })();

  /* ---------- custom cursor ---------- */
  (function cursor() {
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (!dot || !ring || reduced || !window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("has-cursor");
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });
    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();

    var hoverables = document.querySelectorAll("a, button, [data-hover], .svc-row, .sol");
    hoverables.forEach(function (t) {
      t.addEventListener("mouseenter", function () { document.body.classList.add("grow"); });
      t.addEventListener("mouseleave", function () { document.body.classList.remove("grow"); });
    });
  })();

  /* ---------- scroll progress + nav ---------- */
  (function scrollUI() {
    var bar = document.getElementById("progressBar");
    var nav = document.getElementById("nav");
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var sc = h.scrollTop || document.body.scrollTop;
      if (bar) bar.style.width = (max > 0 ? (sc / max) * 100 : 0) + "%";
      if (nav) nav.classList.toggle("scrolled", sc > 40);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ---------- reveal observer ---------- */
  (function reveals() {
    var io;

    /* line-wrappers clip their translated inner text, so we observe the
       wrapper (never clipped by itself) and reveal the js-lines inside. */
    function markIn(target) {
      if (target.classList.contains("line-wrap") || target.classList.contains("statement-line")) {
        var inner = target.querySelector(".js-lines");
        if (inner) inner.classList.add("in");
      } else {
        target.classList.add("in");
      }
    }

    function applyDelays() {
      document.querySelectorAll("[data-d]").forEach(function (el) {
        el.style.setProperty("--d", el.getAttribute("data-d") + "ms");
      });
    }

    function boot() {
      var targets = document.querySelectorAll(".reveal, .line-wrap, .statement-line");
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            markIn(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      targets.forEach(function (el) { io.observe(el); });

      var hero = document.querySelector(".hero");
      if (hero) {
        setTimeout(function () {
          hero.querySelectorAll(".reveal, .line-wrap, .statement-line").forEach(markIn);
        }, 450);
      }
    }

    var els = document.querySelectorAll(".reveal, .js-lines");
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    applyDelays();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(boot, 60); });
    } else {
      window.addEventListener("load", boot);
    }
  })();

  /* ---------- statement scroll effect ---------- */
  (function statement() {
    var pin = document.querySelector(".statement-pin");
    var stA = document.getElementById("stA");
    var stB = document.getElementById("stB");
    var stamp = document.querySelector(".stamp");
    var section = document.getElementById("statement");
    if (!pin || !stA || !stB) return;

    var stampDone = false;
    function update() {
      var r = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      var progress = Math.min(1, Math.max(0, -r.top / total));
      var eased = 1 - Math.pow(1 - progress, 3);

      stA.style.transform = "translateY(" + (-eased * 130) + "vh)";
      stB.style.transform = "translateY(" + ((1 - eased) * 130) + "vh)";
      if (stamp) {
        if (eased > 0.42 && !stampDone) {
          stamp.classList.add("in");
          stampDone = true;
        } else if (eased < 0.42 && stampDone) {
          stamp.classList.remove("in");
          stampDone = false;
        }
      }
    }
    window.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    update();
  })();

  /* ---------- services ghost follower ---------- */
  (function ghost() {
    var ghost = document.getElementById("ghost");
    var list = document.getElementById("servicesList");
    if (!ghost || !list) return;

    var ghostText = "";
    list.addEventListener("mouseover", function (e) {
      var row = e.target.closest(".svc-row");
      if (row) {
        var name = row.querySelector(".svc-name").textContent.trim();
        ghost.textContent = name;
        ghost.classList.add("on");
      }
    });
    list.addEventListener("mouseout", function (e) {
      var row = e.target.closest(".svc-row");
      if (row && !list.contains(e.relatedTarget)) {
        ghost.classList.remove("on");
      }
    });
    window.addEventListener("mousemove", function (e) {
      if (!ghost.classList.contains("on")) return;
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
    });
  })();

  /* ---------- solutions parallax ---------- */
  (function parallax() {
    if (reduced) return;
    var visuals = document.querySelectorAll(".sol-visual");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
        }
      });
    }, { threshold: 0.3 });
    visuals.forEach(function (v) { io.observe(v); });

    function move() {
      visuals.forEach(function (v) {
        var r = v.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var rel = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        var px = parseFloat(v.parentElement.dataset.px || "0.06");
        var shift = rel * -80 * px * 14;
        v.style.transform = "translateY(" + shift.toFixed(1) + "px)";
      });
    }
    window.addEventListener("scroll", function () { requestAnimationFrame(move); }, { passive: true });
    window.addEventListener("resize", function () { requestAnimationFrame(move); });
    move();
  })();

  /* ---------- process line fill ---------- */
  (function processLine() {
    var track = document.getElementById("processTrack");
    var line = document.getElementById("processLine");
    if (!track || !line) return;
    if (reduced) { line.style.width = "100%"; return; }
    if (!("IntersectionObserver" in window)) { line.style.width = "100%"; return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          line.style.width = "100%";
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    io.observe(track);
  })();

})();
