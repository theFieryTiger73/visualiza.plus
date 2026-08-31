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

  /* ---------- mobile menu ---------- */
  (function mobileMenu() {
    var burger = document.getElementById("navBurger");
    if (!burger) return;

    var overlay = document.getElementById("mnav");
    if (!overlay) {
      var div = document.createElement("div");
      div.className = "mnav";
      div.id = "mnav";
      div.setAttribute("aria-hidden", "true");
      div.setAttribute("aria-label", "Menu");
      div.innerHTML =
        '<div class="mnav-inner">' +
          '<div class="mnav-head"></div>' +
          '<div class="mnav-label" data-i18n="MENU">MENU</div>' +
          '<nav class="mnav-links" aria-label="Mobile"></nav>' +
          '<div class="mnav-foot">' +
            '<button type="button" class="btn btn-primary mnav-cta" data-open-modal><span data-i18n="START A PROJECT">START A PROJECT</span> <span class="arr">→</span></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(div);
      overlay = div;
      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "mnav-close";
      closeBtn.setAttribute("aria-label", "Close menu");
      closeBtn.textContent = "✕";
      overlay.querySelector(".mnav-head").appendChild(closeBtn);
    }

    var brandSrc = document.querySelector(".nav .nav-brand");
    var head = overlay.querySelector(".mnav-head");
    if (brandSrc) head.insertBefore(brandSrc.cloneNode(true), head.firstChild);

    var target = overlay.querySelector(".mnav-links");
    var source = document.querySelector(".nav .nav-links");
    if (source && target) {
      source.querySelectorAll("a").forEach(function (a) {
        var c = a.cloneNode(true);
        c.addEventListener("click", close);
        target.appendChild(c);
      });
    }

    var cta = overlay.querySelector(".mnav-cta");
    if (cta) cta.addEventListener("click", close);
    var closeBtn = overlay.querySelector(".mnav-close");
    if (closeBtn) closeBtn.addEventListener("click", close);

    function open() {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("mnav-open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Close menu");
    }
    function close() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mnav-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Menu");
    }

    burger.addEventListener("click", function () {
      if (overlay.classList.contains("open")) close(); else open();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
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

      var hero = document.querySelector(".hero, .sv-hero");
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
    if (window.innerWidth < 901) return;

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
    if (window.innerWidth < 901) return;

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
    if (window.innerWidth < 901) return;
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
    if (window.innerWidth < 901) { line.style.width = "100%"; return; }
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

  /* ---------- i18n dictionary ---------- */
  var VZ_I18N = {
    en: {
      "( 01 )": "( 01 )",
      "( 06 )": "( 06 )",
      "( 06 SYSTEMS )": "( 06 SYSTEMS )",
      "( ALL PIECES, ONE SYSTEM )": "( ALL PIECES, ONE SYSTEM )",
      "( ALL SYSTEMS GO )": "( ALL SYSTEMS GO )",
      "( BUILD FOR ATTENTION )": "( BUILD FOR ATTENTION )",
      "( BUILD → LAUNCH → GROW )": "( BUILD → LAUNCH → GROW )",
      "( DOMAIN → INBOX )": "( DOMAIN → INBOX )",
      "( ENQUIRY → INSIGHTS )": "( ENQUIRY → INSIGHTS )",
      "( EVERY REPLY ON BRAND )": "( EVERY REPLY ON BRAND )",
      "( NO MORE CHAOS )": "( NO MORE CHAOS )",
      "( NO SILOS )": "( NO SILOS )",
      "( ONE ACTION )": "( ONE ACTION )",
      "( PLUG IN )": "( PLUG IN )",
      "( QUESTIONS )": "( QUESTIONS )",
      "( THE REPETITION ENGINE )": "( THE REPETITION ENGINE )",
      "( VISITOR → CUSTOMER )": "( VISITOR → CUSTOMER )",
      "( VISITOR → LEAD )": "( VISITOR → LEAD )",
      "( WHO IT'S FOR )": "( WHO IT'S FOR )",
      "A WhatsApp or email reply is sent automatically the moment a form is submitted.": "A WhatsApp or email reply is sent automatically the moment a form is submitted.",
      "A booking website with room pages and enquiry forms that land in your inbox.": "A booking website with room pages and enquiry forms that land in your inbox.",
      "A dedicated page for Facebook or Instagram ads, so traffic has a clear next step.": "A dedicated page for Facebook or Instagram ads, so traffic has a clear next step.",
      "A firm website with enquiry forms and scheduling built in.": "A firm website with enquiry forms and scheduling built in.",
      "A focused page for a discount or package that turns ads into enquiries.": "A focused page for a discount or package that turns ads into enquiries.",
      "A focused page for campaigns and offers.": "A focused page for campaigns and offers.",
      "A full professional home for your business.": "A full professional home for your business.",
      "A landing page is a single, focused page built for one offer and one action — like 'request a quote' or 'book now'. It has no menu or distractions.": "A landing page is a single, focused page built for one offer and one action — like 'request a quote' or 'book now'. It has no menu or distractions.",
      "A lead that was never forgotten becomes a customer.": "A lead that was never forgotten becomes a customer.",
      "A listing website with WhatsApp enquiry buttons on every property.": "A listing website with WhatsApp enquiry buttons on every property.",
      "A message, form or call arrives from anywhere.": "A message, form or call arrives from anywhere.",
      "A private system built around how you work.": "A private system built around how you work.",
      "A professional home for your business online.": "A professional home for your business online.",
      "A services website with appointment requests routed to your team.": "A services website with appointment requests routed to your team.",
      "A short form captures the right information.": "A short form captures the right information.",
      "A short form that captures the right information.": "A short form that captures the right information.",
      "A single page that introduces the offer and captures interest.": "A single page that introduces the offer and captures interest.",
      "A single, focused page that turns campaign traffic into leads and enquiries.": "A single, focused page that turns campaign traffic into leads and enquiries.",
      "A website presents your whole business. A landing page drives one decision. They work together: campaigns send traffic to the landing page.": "A website presents your whole business. A landing page drives one decision. They work together: campaigns send traffic to the landing page.",
      "ACTION.": "ACTION.",
      "AGENCIES & SERVICES": "AGENCIES & SERVICES",
      "AI-ASSISTED WORKFLOWS": "AI-ASSISTED WORKFLOWS",
      "ANALYTICS": "ANALYTICS",
      "AUTHENTICATION": "AUTHENTICATION",
      "AUTOMATE MY BUSINESS": "AUTOMATE MY BUSINESS",
      "Anything repetitive: capturing new leads, sending confirmations, following up with customers, notifying your team and moving data between tools.": "Anything repetitive: capturing new leads, sending confirmations, following up with customers, notifying your team and moving data between tools.",
      "As many addresses as your team needs, each fully configured.": "As many addresses as your team needs, each fully configured.",
      "As many as your team needs — info@, sales@, accounts@, your name, or departments. We configure every mailbox individually.": "As many as your team needs — info@, sales@, accounts@, your name, or departments. We configure every mailbox individually.",
      "Automated messages through official, approved channels.": "Automated messages through official, approved channels.",
      "Automation can continue the conversation from there.": "Automation can continue the conversation from there.",
      "BOOKING CONFIRMATION": "BOOKING CONFIRMATION",
      "BOOKINGS ONLINE": "BOOKINGS ONLINE",
      "BUILD A LANDING PAGE": "BUILD A LANDING PAGE",
      "BUILD MY DIGITAL INFRASTRUCTURE": "BUILD MY DIGITAL INFRASTRUCTURE",
      "BUILD MY SYSTEM": "BUILD MY SYSTEM",
      "BUILD.": "BUILD.",
      "Basic workflows can run within days. Larger systems are built in stages so you see value quickly.": "Basic workflows can run within days. Larger systems are built in stages so you see value quickly.",
      "Booking, catalogues, portals or anything your business needs.": "Booking, catalogues, portals or anything your business needs.",
      "Built and launched in days, not months.": "Built and launched in days, not months.",
      "Built light and fast so visitors stay — even on slower connections.": "Built light and fast so visitors stay — even on slower connections.",
      "Business Automation & Workflows in Mozambique | Visualiza+": "Business Automation & Workflows in Mozambique | Visualiza+",
      "Business Email Setup in Mozambique — @YourDomain | Visualiza+": "Business Email Setup in Mozambique — @YourDomain | Visualiza+",
      "Business addresses on your own domain.": "Business addresses on your own domain.",
      "Buyers, viewings and offers in a single structured record.": "Buyers, viewings and offers in a single structured record.",
      "CLIENT CONTEXT": "CLIENT CONTEXT",
      "CLIENT TRUST": "CLIENT TRUST",
      "CLINIC": "CLINIC",
      "COLD LEAD": "COLD LEAD",
      "CONVERSION-FOCUSED STRUCTURE": "CONVERSION-FOCUSED STRUCTURE",
      "CRM & Business Systems in Mozambique | Visualiza+": "CRM & Business Systems in Mozambique | Visualiza+",
      "CRM and automation added to handle more customers without more chaos.": "CRM and automation added to handle more customers without more chaos.",
      "CUSTOM BUSINESS PORTALS": "CUSTOM BUSINESS PORTALS",
      "CUSTOM FUNCTIONALITY": "CUSTOM FUNCTIONALITY",
      "CUSTOMER": "CUSTOMER",
      "CUSTOMER DATABASE": "CUSTOMER DATABASE",
      "CUSTOMER.": "CUSTOMER.",
      "CUSTOMERS.": "CUSTOMERS.",
      "Campaign traffic arrives from ads, posts or messages.": "Campaign traffic arrives from ads, posts or messages.",
      "Can I approve messages before they are sent?": "Can I approve messages before they are sent?",
      "Can I move from Gmail or another provider?": "Can I move from Gmail or another provider?",
      "Can I read my email on my phone?": "Can I read my email on my phone?",
      "Can I run ads to it?": "Can I run ads to it?",
      "Can I see reports and dashboards?": "Can I see reports and dashboards?",
      "Can I update the page later?": "Can I update the page later?",
      "Can automation be connected to my existing tools?": "Can automation be connected to my existing tools?",
      "Can it be customised to my business?": "Can it be customised to my business?",
      "Can my whole team use it?": "Can my whole team use it?",
      "Can visitors contact me on WhatsApp from the website?": "Can visitors contact me on WhatsApp from the website?",
      "Can you add custom features later?": "Can you add custom features later?",
      "Can you take over an existing setup?": "Can you take over an existing setup?",
      "Clean structure, fast loading and mobile performance built in.": "Clean structure, fast loading and mobile performance built in.",
      "Click-to-chat buttons and enquiry flows on every page.": "Click-to-chat buttons and enquiry flows on every page.",
      "Client histories and tasks in one place — no lost context.": "Client histories and tasks in one place — no lost context.",
      "Configured on Gmail, Outlook and your phone's mail app.": "Configured on Gmail, Outlook and your phone's mail app.",
      "Confirmations, follow-ups and sequences sent on their own.": "Confirmations, follow-ups and sequences sent on their own.",
      "Connected to your website, CRM, sheets and tools.": "Connected to your website, CRM, sheets and tools.",
      "Customers receive confirmations and reminders without you writing a message.": "Customers receive confirmations and reminders without you writing a message.",
      "Customers structured in one system.": "Customers structured in one system.",
      "DASHBOARDS": "DASHBOARDS",
      "DEAL TRACKING": "DEAL TRACKING",
      "DELIVERY": "DELIVERY",
      "DESERVES A": "DESERVES A",
      "DESIGN": "DESIGN",
      "DIGITAL SYSTEM.": "DIGITAL SYSTEM.",
      "DNS": "DNS",
      "DNS & AUTHENTICATION": "DNS & AUTHENTICATION",
      "DOMAIN": "DOMAIN",
      "DOMAIN-BASED ADDRESSES": "DOMAIN-BASED ADDRESSES",
      "Dashboards show you what is moving and what needs attention.": "Dashboards show you what is moving and what needs attention.",
      "Deals move through clear stages — nothing gets stuck.": "Deals move through clear stages — nothing gets stuck.",
      "Designed mobile-first, where campaign traffic lives.": "Designed mobile-first, where campaign traffic lives.",
      "Digital Infrastructure for Business in Mozambique | Visualiza+": "Digital Infrastructure for Business in Mozambique | Visualiza+",
      "Do I need a domain name?": "Do I need a domain name?",
      "Do I need a domain to have business email?": "Do I need a domain to have business email?",
      "Do I own my domain and data?": "Do I own my domain and data?",
      "Do you provide support and maintenance?": "Do you provide support and maintenance?",
      "Does automation replace my team?": "Does automation replace my team?",
      "Does it work with WhatsApp?": "Does it work with WhatsApp?",
      "Does this need the WhatsApp Business API?": "Does this need the WhatsApp Business API?",
      "Domain, hosting and everything connected.": "Domain, hosting and everything connected.",
      "Domain, site, email, WhatsApp and analytics unified in one system.": "Domain, site, email, WhatsApp and analytics unified in one system.",
      "Domain, website and email connected from day one.": "Domain, website and email connected from day one.",
      "Domain, website, email, leads, CRM, automation and analytics — one connected digital system for your business. Built by Visualiza+.": "Domain, website, email, leads, CRM, automation and analytics — one connected digital system for your business. Built by Visualiza+.",
      "Domain, website, email, leads, CRM, automation and analytics — one connected system.": "Domain, website, email, leads, CRM, automation and analytics — one connected system.",
      "Domain-based email for your business. Professional addresses, proper authentication and reliable delivery — on every device.": "Domain-based email for your business. Professional addresses, proper authentication and reliable delivery — on every device.",
      "EMAIL WORKFLOWS": "EMAIL WORKFLOWS",
      "EMAIL.": "EMAIL.",
      "ENQUIRY": "ENQUIRY",
      "ENQUIRY + SCHEDULING": "ENQUIRY + SCHEDULING",
      "EVENT / REGISTRATION": "EVENT / REGISTRATION",
      "Each service works alone. Together, they become one digital system — a website that feeds leads, email that handles replies, workflows that follow up and a CRM that remembers everything.": "Each service works alone. Together, they become one digital system — a website that feeds leads, email that handles replies, workflows that follow up and a CRM that remembers everything.",
      "Email workflows that follow up by themselves.": "Email workflows that follow up by themselves.",
      "Every build includes SEO foundations: clean structure, fast loading, meta descriptions and mobile performance. We build the base, then you can grow it with content.": "Every build includes SEO foundations: clean structure, fast loading, meta descriptions and mobile performance. We build the base, then you can grow it with content.",
      "Every call, quote and deal tracked in one pipeline.": "Every call, quote and deal tracked in one pipeline.",
      "Every customer and conversation in one structured system — not in a WhatsApp thread.": "Every customer and conversation in one structured system — not in a WhatsApp thread.",
      "Every enquiry captured and routed to you.": "Every enquiry captured and routed to you.",
      "Every form and WhatsApp enquiry captured automatically.": "Every form and WhatsApp enquiry captured automatically.",
      "Every form submission can go straight to your WhatsApp, email or CRM. You choose where you want to receive them.": "Every form submission can go straight to your WhatsApp, email or CRM. You choose where you want to receive them.",
      "Every lead captured, organised and never forgotten.": "Every lead captured, organised and never forgotten.",
      "Every lead lives in a WhatsApp thread. Staff change and the contacts leave with them. Nobody remembers who was asked for a price, who never replied, or which deal is stuck. You are losing business in a chat app.": "Every lead lives in a WhatsApp thread. Staff change and the contacts leave with them. Nobody remembers who was asked for a price, who never replied, or which deal is stuck. You are losing business in a chat app.",
      "Every new lead captured in one system.": "Every new lead captured in one system.",
      "Every page adapts to phones, tablets and computers.": "Every page adapts to phones, tablets and computers.",
      "Every system connected under one roof.": "Every system connected under one roof.",
      "Every website we build is responsive. It adapts automatically to phones, tablets and computers — where most of your customers are.": "Every website we build is responsive. It adapts automatically to phones, tablets and computers — where most of your customers are.",
      "Existing messages and contacts moved without loss.": "Existing messages and contacts moved without loss.",
      "FAQ": "FAQ",
      "FAST LAUNCH": "FAST LAUNCH",
      "FORM": "FORM",
      "Fast, precise, on-brand. Every page is engineered, not templated.": "Fast, precise, on-brand. Every page is engineered, not templated.",
      "Fast, reliable hosting that stays online.": "Fast, reliable hosting that stays online.",
      "Fast, responsive, easy to find on Google and wired to your WhatsApp and email. Your website becomes a tool that brings in enquiries — not a decoration that sits online.": "Fast, responsive, easy to find on Google and wired to your WhatsApp and email. Your website becomes a tool that brings in enquiries — not a decoration that sits online.",
      "Follow-ups and reminders that run themselves.": "Follow-ups and reminders that run themselves.",
      "Follow-ups and responsibilities are assigned and tracked.": "Follow-ups and responsibilities are assigned and tracked.",
      "Follow-ups and workflows that run themselves.": "Follow-ups and workflows that run themselves.",
      "Follow-ups that run the moment a lead arrives.": "Follow-ups that run the moment a lead arrives.",
      "For WhatsApp workflows we use official, approved channels. We handle the setup and requirements for you.": "For WhatsApp workflows we use official, approved channels. We handle the setup and requirements for you.",
      "Forms and pages that feed the automation.": "Forms and pages that feed the automation.",
      "Forms that route enquiries straight to WhatsApp and email.": "Forms that route enquiries straight to WhatsApp and email.",
      "Forms, WhatsApp, email and analytics wired together. No lead leaks.": "Forms, WhatsApp, email and analytics wired together. No lead leaks.",
      "GENTLE NUDGE": "GENTLE NUDGE",
      "GET BUSINESS EMAIL": "GET BUSINESS EMAIL",
      "GET STARTED.": "GET STARTED.",
      "GOOD BUSINESSES, FREE ADDRESSES.": "GOOD BUSINESSES, FREE ADDRESSES.",
      "GROWING BUSINESS": "GROWING BUSINESS",
      "GUEST COMMUNICATION": "GUEST COMMUNICATION",
      "HOME": "HOME",
      "HOSTING": "HOSTING",
      "HOTEL / LODGE": "HOTEL / LODGE",
      "High-Converting Landing Pages in Mozambique | Visualiza+": "High-Converting Landing Pages in Mozambique | Visualiza+",
      "How fast can it be set up?": "How fast can it be set up?",
      "How is it different from a full website?": "How is it different from a full website?",
      "How long does it take to build a website?": "How long does it take to build a website?",
      "How long does it take to connect everything?": "How long does it take to connect everything?",
      "How many mailboxes can I have?": "How many mailboxes can I have?",
      "INBOX": "INBOX",
      "INSIGHTS": "INSIGHTS",
      "INSTANT REPLY": "INSTANT REPLY",
      "INTEGRATIONS": "INTEGRATIONS",
      "INTERNAL WORKFLOWS": "INTERNAL WORKFLOWS",
      "Is the website optimised for Google?": "Is the website optimised for Google?",
      "LAUNCH": "LAUNCH",
      "LEAD": "LEAD",
      "LEAD CAMPAIGNS": "LEAD CAMPAIGNS",
      "LEAD FORM": "LEAD FORM",
      "LEAD GENERATION": "LEAD GENERATION",
      "LEAD MANAGEMENT": "LEAD MANAGEMENT",
      "LEADS": "LEADS",
      "LEADS IN": "LEADS IN",
      "LET'S MAP IT.": "LET'S MAP IT.",
      "LISTINGS + LEADS": "LISTINGS + LEADS",
      "Leads and follow-ups in one structured system.": "Leads and follow-ups in one structured system.",
      "Leads are forgotten. Follow-ups don't happen. Confirmations are typed by hand. The same messages are copied and pasted every day — and customers who never get a reply simply buy elsewhere.": "Leads are forgotten. Follow-ups don't happen. Confirmations are typed by hand. The same messages are copied and pasted every day — and customers who never get a reply simply buy elsewhere.",
      "Leads delivered to your phone the moment they arrive.": "Leads delivered to your phone the moment they arrive.",
      "Leads that went quiet receive a friendly follow-up after a few days.": "Leads that went quiet receive a friendly follow-up after a few days.",
      "MAIL THAT LOOKS LIKE YOU.": "MAIL THAT LOOKS LIKE YOU.",
      "MAILBOXES": "MAILBOXES",
      "MANUALLY WHAT": "MANUALLY WHAT",
      "MOBILE OPTIMISATION": "MOBILE OPTIMISATION",
      "MULTIPLE MAILBOXES": "MULTIPLE MAILBOXES",
      "Mailboxes configured and ready — names, departments, forwarders.": "Mailboxes configured and ready — names, departments, forwarders.",
      "Messages and leads flow in automatically.": "Messages and leads flow in automatically.",
      "Messages reach the inbox, not the spam folder.": "Messages reach the inbox, not the spam folder.",
      "Most businesses are fully connected within 2 to 4 weeks. We build in stages so nothing blocks your operations.": "Most businesses are fully connected within 2 to 4 weeks. We build in stages so nothing blocks your operations.",
      "Most businesses in Mozambique have a Facebook page and a WhatsApp number — but no real website. When a customer searches, the business either doesn't exist online, or shows a slow site that doesn't work on a phone and never brings a single lead.": "Most businesses in Mozambique have a Facebook page and a WhatsApp number — but no real website. When a customer searches, the business either doesn't exist online, or shows a slow site that doesn't work on a phone and never brings a single lead.",
      "Most professional websites are designed, built and launched within 1 to 3 weeks, depending on content and functionality. You receive a clear timeline before we start.": "Most professional websites are designed, built and launched within 1 to 3 weeks, depending on content and functionality. You receive a clear timeline before we start.",
      "NEW BUSINESS": "NEW BUSINESS",
      "NEW ENQUIRY": "NEW ENQUIRY",
      "NO TYPING": "NO TYPING",
      "NOTIFICATIONS": "NOTIFICATIONS",
      "No. Automation removes the repetitive work so your team can focus on customers. Software sends the reminders; your people close the deals.": "No. Automation removes the repetitive work so your team can focus on customers. Software sends the reminders; your people close the deals.",
      "ONE ACTION.": "ONE ACTION.",
      "ONE CONNECTED": "ONE CONNECTED",
      "ONE ENGINE, EVERY PIECE.": "ONE ENGINE, EVERY PIECE.",
      "ONE OFFER.": "ONE OFFER.",
      "ONE PAGE.": "ONE PAGE.",
      "ONE PAGE. ONE DECISION.": "ONE PAGE. ONE DECISION.",
      "ONE PIPELINE": "ONE PIPELINE",
      "ONE PLATFORM": "ONE PLATFORM",
      "ONE SYSTEM": "ONE SYSTEM",
      "ONE SYSTEM. NO LOST LEADS.": "ONE SYSTEM. NO LOST LEADS.",
      "ONLINE, BUT INVISIBLE.": "ONLINE, BUT INVISIBLE.",
      "ONLINE, BUT NOT CONNECTED.": "ONLINE, BUT NOT CONNECTED.",
      "One clear promise and one clear reason to act.": "One clear promise and one clear reason to act.",
      "One message, one offer, one clear action.": "One message, one offer, one clear action.",
      "One page, one form — registrations land directly in your inbox or CRM.": "One page, one form — registrations land directly in your inbox or CRM.",
      "One page. One offer. One action. Campaign and launch pages engineered for conversion, mobile-optimised and tracked with analytics — built by Visualiza+.": "One page. One offer. One action. Campaign and launch pages engineered for conversion, mobile-optimised and tracked with analytics — built by Visualiza+.",
      "One structured record for every client and contact.": "One structured record for every client and contact.",
      "Overdue customers are reminded automatically, in a professional tone.": "Overdue customers are reminded automatically, in a professional tone.",
      "PATIENT RECORDS": "PATIENT RECORDS",
      "PAYMENT REMINDER": "PAYMENT REMINDER",
      "PERFORMANCE": "PERFORMANCE",
      "PHONE & CLIENT SETUP": "PHONE & CLIENT SETUP",
      "PIPELINE": "PIPELINE",
      "PRODUCT LAUNCH": "PRODUCT LAUNCH",
      "PROFESSIONAL": "PROFESSIONAL",
      "PROFESSIONAL FIRM": "PROFESSIONAL FIRM",
      "PROFESSIONAL SETUP": "PROFESSIONAL SETUP",
      "PROMOTION / OFFER": "PROMOTION / OFFER",
      "PROPERTY": "PROPERTY",
      "PROPERTY AGENCY": "PROPERTY AGENCY",
      "Patients, appointments and follow-ups managed in one system.": "Patients, appointments and follow-ups managed in one system.",
      "Pipeline, open deals and activity at a glance.": "Pipeline, open deals and activity at a glance.",
      "Professional Website Design & Development in Mozambique | Visualiza+": "Professional Website Design & Development in Mozambique | Visualiza+",
      "Professional email on your own domain.": "Professional email on your own domain.",
      "Professional email on your own domain: setup, DNS and email authentication, multiple mailboxes and reliable delivery. hello@yourcompany.com — built by Visualiza+.": "Professional email on your own domain: setup, DNS and email authentication, multiple mailboxes and reliable delivery. hello@yourcompany.com — built by Visualiza+.",
      "Professional mail on your own domain.": "Professional mail on your own domain.",
      "Professional websites built for Mozambique: responsive, fast, easy to find on Google and wired to your WhatsApp and email.": "Professional websites built for Mozambique: responsive, fast, easy to find on Google and wired to your WhatsApp and email.",
      "REAL ESTATE AGENCY": "REAL ESTATE AGENCY",
      "RECORD": "RECORD",
      "RELATED SERVICES": "RELATED SERVICES",
      "RESPONSIVE DESIGN": "RESPONSIVE DESIGN",
      "Registered in your name, with DNS managed properly.": "Registered in your name, with DNS managed properly.",
      "Repetitive work handled automatically.": "Repetitive work handled automatically.",
      "Replies, reminders and follow-ups are sent automatically.": "Replies, reminders and follow-ups are sent automatically.",
      "SAFE MIGRATION": "SAFE MIGRATION",
      "SALES INBOX": "SALES INBOX",
      "SALES TEAMS": "SALES TEAMS",
      "SCALE READY": "SCALE READY",
      "SCATTERED TOOLS": "SCATTERED TOOLS",
      "SECOND CHANCE": "SECOND CHANCE",
      "SEO FOUNDATIONS": "SEO FOUNDATIONS",
      "SERVICE 01 / WEBSITES": "SERVICE 01 / WEBSITES",
      "SERVICE 02 / BUSINESS EMAIL": "SERVICE 02 / BUSINESS EMAIL",
      "SERVICE 03 / LANDING PAGES": "SERVICE 03 / LANDING PAGES",
      "SERVICE 04 / AUTOMATION": "SERVICE 04 / AUTOMATION",
      "SERVICE 05 / CRM & SYSTEMS": "SERVICE 05 / CRM & SYSTEMS",
      "SERVICE 06 / DIGITAL INFRASTRUCTURE": "SERVICE 06 / DIGITAL INFRASTRUCTURE",
      "SERVICE DIRECTORY / 06": "SERVICE DIRECTORY / 06",
      "SOFTWARE CAN DO.": "SOFTWARE CAN DO.",
      "SOFTWARE DOES THE REPEATING.": "SOFTWARE DOES THE REPEATING.",
      "SPF, DKIM and DMARC configured so mail is trusted.": "SPF, DKIM and DMARC configured so mail is trusted.",
      "SPF, DKIM and DMARC configured so your domain is verified.": "SPF, DKIM and DMARC configured so your domain is verified.",
      "START CONNECTED": "START CONNECTED",
      "START HERE.": "START HERE.",
      "STOP DOING": "STOP DOING",
      "STOP LOSING": "STOP LOSING",
      "See visits and conversions so you know what works.": "See visits and conversions so you know what works.",
      "Services | Websites, Email, Automation & Systems — Visualiza+": "Services | Websites, Email, Automation & Systems — Visualiza+",
      "Six services that plug into one digital system: websites, business email, landing pages, automation, CRM & systems and digital infrastructure. Built for businesses in Mozambique by Visualiza+.": "Six services that plug into one digital system: websites, business email, landing pages, automation, CRM & systems and digital infrastructure. Built for businesses in Mozambique by Visualiza+.",
      "Smart drafting, summaries and routing powered by AI.": "Smart drafting, summaries and routing powered by AI.",
      "Someone visits your site, page or ad — and takes an action.": "Someone visits your site, page or ad — and takes an action.",
      "Start with one piece — a website, business email or a landing page — and add the rest when your business is ready. Every service is built to connect later.": "Start with one piece — a website, business email or a landing page — and add the rest when your business is ready. Every service is built to connect later.",
      "Stop doing manually what software can do. Lead capture, email and WhatsApp workflows, notifications and AI-assisted follow-up — built by Visualiza+.": "Stop doing manually what software can do. Lead capture, email and WhatsApp workflows, notifications and AI-assisted follow-up — built by Visualiza+.",
      "Stop losing leads in WhatsApp. CRM, lead management, customer databases, dashboards and custom business portals — built by Visualiza+.": "Stop losing leads in WhatsApp. CRM, lead management, customer databases, dashboards and custom business portals — built by Visualiza+.",
      "Structure, identity and layout — designed to make your business look the part.": "Structure, identity and layout — designed to make your business look the part.",
      "TASKS": "TASKS",
      "THAT WORK.": "THAT WORK.",
      "THAT WORKS?": "THAT WORKS?",
      "THE CHAT APP BLACK HOLE.": "THE CHAT APP BLACK HOLE.",
      "THE CONNECTION": "THE CONNECTION",
      "THE DESTINATION": "THE DESTINATION",
      "THE IDEA": "THE IDEA",
      "THE INDEX": "THE INDEX",
      "THE OFFER": "THE OFFER",
      "THE PROBLEM / SOLUTION": "THE PROBLEM / SOLUTION",
      "THE REPETITION TRAP.": "THE REPETITION TRAP.",
      "THE REVEAL": "THE REVEAL",
      "THE SIGN-UP": "THE SIGN-UP",
      "THE SOLUTION": "THE SOLUTION",
      "THE WAY IN": "THE WAY IN",
      "TRAFFIC WITHOUT A DESTINATION.": "TRAFFIC WITHOUT A DESTINATION.",
      "Tasks, approvals and team processes inside the system.": "Tasks, approvals and team processes inside the system.",
      "That's fine. Every service works alone and connects later. You can start with a website or email and add the rest when you're ready.": "That's fine. Every service works alone and connects later. You can start with a website or email and add the rest when you're ready.",
      "The capture point that starts the workflow.": "The capture point that starts the workflow.",
      "The contact and conversation are saved as one record.": "The contact and conversation are saved as one record.",
      "The domain is with one provider, the website with another, email is a free address, leads sit in WhatsApp, and nobody can see what is working. The pieces exist — but they don't connect. Your business is online, but not built for digital.": "The domain is with one provider, the website with another, email is a free address, leads sit in WhatsApp, and nobody can see what is working. The pieces exist — but they don't connect. Your business is online, but not built for digital.",
      "The enquiry becomes a captured lead in your system.": "The enquiry becomes a captured lead in your system.",
      "The enquiry lands in your WhatsApp or inbox.": "The enquiry lands in your WhatsApp or inbox.",
      "The front door that feeds leads into your CRM.": "The front door that feeds leads into your CRM.",
      "They fill in a form, send a message or start a chat.": "They fill in a form, send a message or start a chat.",
      "USE CASES": "USE CASES",
      "VISITOR": "VISITOR",
      "WE BUILD SITES THAT WORK.": "WE BUILD SITES THAT WORK.",
      "WHAT'S INCLUDED": "WHAT'S INCLUDED",
      "WHATSAPP & EMAIL ROUTING": "WHATSAPP & EMAIL ROUTING",
      "WHATSAPP CONNECTION": "WHATSAPP CONNECTION",
      "WHATSAPP INTEGRATION": "WHATSAPP INTEGRATION",
      "WHATSAPP WORKFLOWS": "WHATSAPP WORKFLOWS",
      "WHATSAPP.": "WHATSAPP.",
      "We build a single, focused page with one offer and one action. Campaign traffic lands on a page built to convert, and every enquiry arrives in your WhatsApp or inbox.": "We build a single, focused page with one offer and one action. Campaign traffic lands on a page built to convert, and every enquiry arrives in your WhatsApp or inbox.",
      "We build a system that records every customer and every conversation. Leads, deals and follow-ups live in one structured place — accessible to you, not trapped in someone's phone.": "We build a system that records every customer and every conversation. Leads, deals and follow-ups live in one structured place — accessible to you, not trapped in someone's phone.",
      "We build workflows that capture leads, send follow-ups and notify your team automatically — so nothing falls through the cracks.": "We build workflows that capture leads, send follow-ups and notify your team automatically — so nothing falls through the cracks.",
      "We clean and import your existing contacts, so you start with a structured database, not a blank page.": "We clean and import your existing contacts, so you start with a structured database, not a blank page.",
      "We configure email authentication (SPF, DKIM and DMARC) so your domain is verified. That protects your reputation and improves delivery.": "We configure email authentication (SPF, DKIM and DMARC) so your domain is verified. That protects your reputation and improves delivery.",
      "We connect the components of your business into one digital system: domain, website, email, leads, CRM, automation and analytics — engineered to work together.": "We connect the components of your business into one digital system: domain, website, email, leads, CRM, automation and analytics — engineered to work together.",
      "We map your business, your customers and your offer before a single pixel is placed.": "We map your business, your customers and your offer before a single pixel is placed.",
      "We measure, maintain and evolve the site as your business compounds.": "We measure, maintain and evolve the site as your business compounds.",
      "We start with an audit of what you already have — domain, website, email, social pages — and map the gaps. Then we build the missing pieces.": "We start with an audit of what you already have — domain, website, email, social pages — and map the gaps. Then we build the missing pieces.",
      "Websites that work: responsive design, SEO foundations, fast performance, lead generation, WhatsApp integration and custom functionality — built for businesses in Mozambique by Visualiza+.": "Websites that work: responsive design, SEO foundations, fast performance, lead generation, WhatsApp integration and custom functionality — built for businesses in Mozambique by Visualiza+.",
      "What can be automated?": "What can be automated?",
      "What if I already have a messy list of contacts?": "What if I already have a messy list of contacts?",
      "What if I only need one piece right now?": "What if I only need one piece right now?",
      "What is a landing page?": "What is a landing page?",
      "When a customer sees 'company@gmail.com', the message is clear — this is not an established business. Free addresses get lost in spam, mix with personal mail, and die with the employee who created them.": "When a customer sees 'company@gmail.com', the message is clear — this is not an established business. Free addresses get lost in spam, mix with personal mail, and die with the employee who created them.",
      "Where do I start?": "Where do I start?",
      "Where do leads go?": "Where do leads go?",
      "Why do I need a CRM?": "Why do I need a CRM?",
      "Will it work on mobile?": "Will it work on mobile?",
      "Will my emails land in the inbox or spam?": "Will my emails land in the inbox or spam?",
      "Will my website work on mobile phones?": "Will my website work on mobile phones?",
      "Without a CRM, leads live in WhatsApp threads and memories. A CRM records every customer, conversation and follow-up in one structured system.": "Without a CRM, leads live in WhatsApp threads and memories. A CRM records every customer, conversation and follow-up in one structured system.",
      "Workflows decide what happens next — instantly, every time.": "Workflows decide what happens next — instantly, every time.",
      "Workflows that capture leads, send follow-ups and notify your team — automatically.": "Workflows that capture leads, send follow-ups and notify your team — automatically.",
      "YOUR BUSINESS.": "YOUR BUSINESS.",
      "Yes. Business email runs on your own domain, like hello@yourcompany.com. If you do not have a domain yet, we can register one for you.": "Yes. Business email runs on your own domain, like hello@yourcompany.com. If you do not have a domain yet, we can register one for you.",
      "Yes. Dashboards show your pipeline, open deals, follow-ups due and customer activity at a glance.": "Yes. Dashboards show your pipeline, open deals, follow-ups due and customer activity at a glance.",
      "Yes. Everything is registered in your name and belongs to your business. We manage it, but you own it.": "Yes. Everything is registered in your name and belongs to your business. We manage it, but you own it.",
      "Yes. Landing pages are built to be fast-loading and focused, which makes them an effective destination for Facebook, Instagram and Google ads.": "Yes. Landing pages are built to be fast-loading and focused, which makes them an effective destination for Facebook, Instagram and Google ads.",
      "Yes. Landing pages are designed mobile-first, because most campaign traffic in Mozambique comes from phones.": "Yes. Landing pages are designed mobile-first, because most campaign traffic in Mozambique comes from phones.",
      "Yes. We build custom business portals and workflows around how your business actually works.": "Yes. We build custom business portals and workflows around how your business actually works.",
      "Yes. We can build workflows that pause for your approval, so important messages always pass through you.": "Yes. We can build workflows that pause for your approval, so important messages always pass through you.",
      "Yes. We can migrate your domain, website and email with minimal disruption and connect the pieces properly.": "Yes. We can migrate your domain, website and email with minimal disruption and connect the pieces properly.",
      "Yes. We can update text, offers and images for you, or connect the page to a system you manage.": "Yes. We can update text, offers and images for you, or connect the page to a system you manage.",
      "Yes. We configure your email on Gmail, Outlook or your phone's mail app, so your team can reply from anywhere.": "Yes. We configure your email on Gmail, Outlook or your phone's mail app, so your team can reply from anywhere.",
      "Yes. We connect WhatsApp so messages and leads can flow into your CRM automatically, instead of living only in your phone.": "Yes. We connect WhatsApp so messages and leads can flow into your CRM automatically, instead of living only in your phone.",
      "Yes. We connect workflows to your website, forms, CRM, spreadsheets and communication tools.": "Yes. We connect workflows to your website, forms, CRM, spreadsheets and communication tools.",
      "Yes. We integrate WhatsApp buttons and forms so enquiries go straight to your WhatsApp or email. No lead gets lost.": "Yes. We integrate WhatsApp buttons and forms so enquiries go straight to your WhatsApp or email. No lead gets lost.",
      "Yes. We migrate your existing messages and contacts so nothing is lost, and your team keeps using the same familiar tools.": "Yes. We migrate your existing messages and contacts so nothing is lost, and your team keeps using the same familiar tools.",
      "Yes. We monitor your systems, keep them secure and make sure everything stays online.": "Yes. We monitor your systems, keep them secure and make sure everything stays online.",
      "Yes. Websites are built in modules, so we can add booking forms, catalogues, portals or automation as your business grows.": "Yes. Websites are built in modules, so we can add booking forms, catalogues, portals or automation as your business grows.",
      "Yes. You control access — each team member sees the contacts and pipelines relevant to them.": "Yes. You control access — each team member sees the contacts and pipelines relevant to them.",
      "Yes. Your website lives at your own domain, such as yourcompany.com. If you do not have one yet, we register it and set everything up for you.": "Yes. Your website lives at your own domain, such as yourcompany.com. If you do not have one yet, we register it and set everything up for you.",
      "You run an offer on Instagram or Facebook, people get excited — and then nothing happens. Traffic without a destination is just attention leaking away. Posting a link to a busy homepage rarely converts.": "You run an offer on Instagram or Facebook, people get excited — and then nothing happens. Traffic without a destination is just attention leaking away. Posting a link to a busy homepage rarely converts.",
      "You see what is working and what is not.": "You see what is working and what is not.",
      "Your business deserves a professional email on your own domain. We set up hello@yourcompany.com with proper authentication and reliable delivery — the address customers trust, on every device.": "Your business deserves a professional email on your own domain. We set up hello@yourcompany.com with proper authentication and reliable delivery — the address customers trust, on every device.",
      "Your domain is pointed at the mail system and verified.": "Your domain is pointed at the mail system and verified.",
      "Your own address — yourcompany.com, registered in your name.": "Your own address — yourcompany.com, registered in your name.",
      "Your professional presence online.": "Your professional presence online.",
      "Your professional presence, built to work.": "Your professional presence, built to work.",
      "Your site goes live on your own domain, indexed and ready to be found.": "Your site goes live on your own domain, indexed and ready to be found.",
      "Your team communicates from @yourcompany, not a free address.": "Your team communicates from @yourcompany, not a free address.",
      "Your team gets addresses — names, departments, forwarders.": "Your team gets addresses — names, departments, forwarders.",
      "Your team is alerted the moment something important happens.": "Your team is alerted the moment something important happens.",
      "Your team reads and replies from anywhere, on any device.": "Your team reads and replies from anywhere, on any device.",
      "appointments@yourclinic.com for bookings and results, separate from personal mail.": "appointments@yourclinic.com for bookings and results, separate from personal mail.",
      "hello@yourcompany.com": "hello@yourcompany.com",
      "hello@yoursuite.com for every confirmation and guest conversation.": "hello@yoursuite.com for every confirmation and guest conversation.",
      "sales@youragency.com so every offer and viewing stays in one inbox.": "sales@youragency.com so every offer and viewing stays in one inbox.",
      "yourname@yourfirm.com — clients see a professional, trusted address.": "yourname@yourfirm.com — clients see a professional, trusted address.",
      "← BACK TO SERVICES": "← BACK TO SERVICES",
      "→ DIGITAL INFRASTRUCTURE TIES THEM ALL TOGETHER.": "→ DIGITAL INFRASTRUCTURE TIES THEM ALL TOGETHER.",

      "VISUALIZA+ — Your business, built for digital.": "VISUALIZA+ — Your business, built for digital.",
      "Visualiza+ | Digital Solutions & Website Development in Mozambique": "Visualiza+ | Digital Solutions & Website Development in Mozambique",
      "Real Estate Website & CRM System in Mozambique | Visualiza+": "Real Estate Website & CRM System in Mozambique | Visualiza+",
      "Hotel & Hospitality Booking System in Mozambique | Visualiza+": "Hotel & Hospitality Booking System in Mozambique | Visualiza+",
      "Clinic Website & Appointment System in Mozambique | Visualiza+": "Clinic Website & Appointment System in Mozambique | Visualiza+",
      "Professional Services Website & Scheduling System | Visualiza+": "Professional Services Website & Scheduling System | Visualiza+",
      "Visualiza+ builds digital infrastructure for businesses — websites, domains, business email, landing pages, automation, CRM and custom digital systems.": "Visualiza+ builds digital infrastructure for businesses — websites, domains, business email, landing pages, automation, CRM and custom digital systems.",
      "Visualiza+ builds professional websites, business email, automation and digital systems for businesses in Mozambique.": "Visualiza+ builds professional websites, business email, automation and digital systems for businesses in Mozambique.",
      "INTRO": "INTRO",
      "SERVICES": "SERVICES",
      "SOLUTIONS": "SOLUTIONS",
      "PROCESS": "PROCESS",
      "START A PROJECT": "START A PROJECT",
      "VISUALIZA+ — DIGITAL SOLUTIONS": "VISUALIZA+ — DIGITAL SOLUTIONS",
      "YOUR BUSINESS,": "YOUR BUSINESS,",
      "BUILT FOR": "BUILT FOR",
      "FOR DIGITAL?": "FOR DIGITAL?",
      "Websites, business email, automation and digital systems — built around your business.": "Websites, business email, automation and digital systems — built around your business.",
      "// IDEA → SYSTEM — YOUR BUSINESS ON THE LINE": "// IDEA → SYSTEM — YOUR BUSINESS ON THE LINE",
      "IDEA": "IDEA",
      "WEBSITE": "WEBSITE",
      "CONNECTION": "CONNECTION",
      "AUTOMATION": "AUTOMATION",
      "SYSTEM": "SYSTEM",
      "concept": "concept",
      "presence": "presence",
      "leads in": "leads in",
      "follow-up": "follow-up",
      "one engine": "one engine",
      "SCROLL": "SCROLL",
      "WEBSITES": "WEBSITES",
      "BUSINESS EMAIL": "BUSINESS EMAIL",
      "CRM": "CRM",
      "LANDING PAGES": "LANDING PAGES",
      "CRM & SYSTEMS": "CRM & SYSTEMS",
      "DIGITAL INFRASTRUCTURE": "DIGITAL INFRASTRUCTURE",
      "THE PROBLEM": "THE PROBLEM",
      "YOUR BUSINESS": "YOUR BUSINESS",
      "IS ONLINE.": "IS ONLINE.",
      "BUT IS IT": "BUT IS IT",
      "BUILT FOR DIGITAL?": "BUILT FOR DIGITAL?",
      "NO.": "NO.",
      "Most businesses have Instagram, Facebook and WhatsApp. Visualiza+ connects the pieces into one professional digital system.": "Most businesses have Instagram, Facebook and WhatsApp. Visualiza+ connects the pieces into one professional digital system.",
      "WHAT WE BUILD": "WHAT WE BUILD",
      "WHAT WE": "WHAT WE",
      "BUILD": "BUILD",
      "Not templates. Not brochures. Six disciplines that plug into one system — your digital infrastructure, engineered end to end.": "Not templates. Not brochures. Six disciplines that plug into one system — your digital infrastructure, engineered end to end.",
      "HOVER THE INDEX —": "HOVER THE INDEX —",
      "Marketing sites engineered for conversion, speed and identity. Built to make your business look the part.": "Marketing sites engineered for conversion, speed and identity. Built to make your business look the part.",
      "identity · performance · conversion": "identity · performance · conversion",
      "Professional email on your own domain. @yourcompany — real infrastructure, not a Gmail address.": "Professional email on your own domain. @yourcompany — real infrastructure, not a Gmail address.",
      "domain · @brand · deliverability": "domain · @brand · deliverability",
      "High-converting pages for launches, campaigns and offers. Designed to turn attention into action.": "High-converting pages for launches, campaigns and offers. Designed to turn attention into action.",
      "launches · campaigns · offers": "launches · campaigns · offers",
      "Workflows that handle the repetitive work — leads, follow-ups, invoicing and data — automatically.": "Workflows that handle the repetitive work — leads, follow-ups, invoicing and data — automatically.",
      "workflows · follow-up · data": "workflows · follow-up · data",
      "Customer relationships structured in one system. Every contact, every deal, every message tracked.": "Customer relationships structured in one system. Every contact, every deal, every message tracked.",
      "pipeline · contacts · insights": "pipeline · contacts · insights",
      "The invisible layer: domains, hosting, DNS, security and reliability. Engineered to stay online.": "The invisible layer: domains, hosting, DNS, security and reliability. Engineered to stay online.",
      "domains · hosting · security": "domains · hosting · security",
      "WE DON'T JUST": "WE DON'T JUST",
      "BUILD WEBSITES.": "BUILD WEBSITES.",
      "We build digital systems, not just websites.": "We build digital systems, not just websites.",
      "WE BUILD": "WE BUILD",
      "DIGITAL SYSTEMS.": "DIGITAL SYSTEMS.",
      "INDUSTRIES": "INDUSTRIES",
      "YOUR INDUSTRY": "YOUR INDUSTRY",
      "REAL ESTATE": "REAL ESTATE",
      "HOSPITALITY": "HOSPITALITY",
      "CLINICS": "CLINICS",
      "PROFESSIONAL SERVICES": "PROFESSIONAL SERVICES",
      "website + listings": "website + listings",
      "leads + whatsapp": "leads + whatsapp",
      "crm": "crm",
      "website + booking": "website + booking",
      "business email": "business email",
      "whatsapp": "whatsapp",
      "website + appointments": "website + appointments",
      "automation": "automation",
      "communication": "communication",
      "website + forms": "website + forms",
      "scheduling": "scheduling",
      "VIEW SYSTEM": "VIEW SYSTEM",
      "THE SEQUENCE": "THE SEQUENCE",
      "DISCOVER": "DISCOVER",
      "CONNECT": "CONNECT",
      "GROW": "GROW",
      "We map your business, your customers and the gaps. The system is designed before it is built.": "We map your business, your customers and the gaps. The system is designed before it is built.",
      "Websites, email, pages and workflows are constructed — fast, precise, on-brand.": "Websites, email, pages and workflows are constructed — fast, precise, on-brand.",
      "Everything is wired together: forms, WhatsApp, CRM, analytics. One system, no leaks.": "Everything is wired together: forms, WhatsApp, CRM, analytics. One system, no leaks.",
      "We maintain, measure and evolve the system. Your digital business keeps compounding.": "We maintain, measure and evolve the system. Your digital business keeps compounding.",
      "LET'S GO": "LET'S GO",
      "NO TEMPLATES": "NO TEMPLATES",
      "READY TO BUILD": "READY TO BUILD",
      "WHATSAPP US": "WHATSAPP US",
      "WE REPLY WITHIN 24H — USUALLY FASTER.": "WE REPLY WITHIN 24H — USUALLY FASTER.",
      "GET IN TOUCH": "GET IN TOUCH",
      "PROJECT INTAKE": "PROJECT INTAKE",
      "Tell us what you need. We reply on WhatsApp within 24 hours.": "Tell us what you need. We reply on WhatsApp within 24 hours.",
      "PROJECT TYPE": "PROJECT TYPE",
      "YOUR NAME": "YOUR NAME",
      "EMAIL": "EMAIL",
      "WHATSAPP": "WHATSAPP",
      "PROJECT DETAILS": "PROJECT DETAILS",
      "SEND VIA WHATSAPP": "SEND VIA WHATSAPP",
      "SEND VIA EMAIL": "SEND VIA EMAIL",
      "WHATSAPP +258 87 977 1024": "WHATSAPP +258 87 977 1024",
      "LANDING PAGE": "LANDING PAGE",
      "CRM / SYSTEM": "CRM / SYSTEM",
      "FULL DIGITAL SYSTEM": "FULL DIGITAL SYSTEM",
      "SOMETHING ELSE": "SOMETHING ELSE",
      "Full name": "Full name",
      "you@company.com": "you@company.com",
      "+258 …": "+258 …",
      "A few lines about your project…": "A few lines about your project…",
      "Your business, built for digital.": "Your business, built for digital.",
      "MENU": "MENU",
      "WORK": "WORK",
      "ABOUT": "ABOUT",
      "CONTACT": "CONTACT",
      "SYSTEMS": "SYSTEMS",
      "BACK TO TOP": "BACK TO TOP",
      "← BACK TO HOME": "← BACK TO HOME",
      "SYSTEM MODULES": "SYSTEM MODULES",
      "LIVE VIEW": "LIVE VIEW",
      "BUILD THIS SYSTEM": "BUILD THIS SYSTEM",
      "STATUS — ONLINE": "STATUS — ONLINE",
      "REFRESHED 12 SEC AGO": "REFRESHED 12 SEC AGO",
      "REAL ESTATE SYSTEM": "REAL ESTATE <em>SYSTEM</em>",
      "REAL ESTATE SYSTEM — VISUALIZA+": "REAL ESTATE SYSTEM — VISUALIZA+",
      "SYSTEM 01 / REAL ESTATE": "SYSTEM 01 / REAL ESTATE",
      "A digital engine for property: listings, leads, WhatsApp and a client pipeline in one system.": "A digital engine for property: listings, leads, WhatsApp and a client pipeline in one system.",
      "PROPERTY WEBSITE": "PROPERTY WEBSITE",
      "Listings with photos, maps and WhatsApp enquiry buttons on every property.": "Listings with photos, maps and WhatsApp enquiry buttons on every property.",
      "LEAD CAPTURE": "LEAD CAPTURE",
      "Every visitor becomes a lead. Contact forms route straight to your phone.": "Every visitor becomes a lead. Contact forms route straight to your phone.",
      "WHATSAPP PIPELINE": "WHATSAPP PIPELINE",
      "Buyers and sellers tracked in one thread. No lead left behind.": "Buyers and sellers tracked in one thread. No lead left behind.",
      "CLIENT CRM": "CLIENT CRM",
      "Every contact, viewing and offer structured in one record.": "Every contact, viewing and offer structured in one record.",
      "Automatic follow-ups, reminders and updates while you work.": "Automatic follow-ups, reminders and updates while you work.",
      "ACTIVE LISTINGS": "ACTIVE LISTINGS",
      "NEW LEADS": "NEW LEADS",
      "VIEWINGS": "VIEWINGS",
      "CLOSED": "CLOSED",
      "HOSPITALITY SYSTEM": "HOSPITALITY <em>SYSTEM</em>",
      "HOSPITALITY SYSTEM — VISUALIZA+": "HOSPITALITY SYSTEM — VISUALIZA+",
      "SYSTEM 02 / HOSPITALITY": "SYSTEM 02 / HOSPITALITY",
      "Rooms, bookings, guests and business email — one system that keeps every reservation in line.": "Rooms, bookings, guests and business email — one system that keeps every reservation in line.",
      "BOOKING WEBSITE": "BOOKING WEBSITE",
      "Rooms with live availability and a booking form that lands in your inbox.": "Rooms with live availability and a booking form that lands in your inbox.",
      "@yourlodge email for every confirmation and guest conversation.": "@yourlodge email for every confirmation and guest conversation.",
      "GUEST MANAGEMENT": "GUEST MANAGEMENT",
      "Check-ins, extras and guest history in one place.": "Check-ins, extras and guest history in one place.",
      "WHATSAPP CONCIERGE": "WHATSAPP CONCIERGE",
      "Guests reach you where they already talk.": "Guests reach you where they already talk.",
      "Confirmations and reminders sent automatically.": "Confirmations and reminders sent automatically.",
      "ROOMS": "ROOMS",
      "RESERVATIONS": "RESERVATIONS",
      "GUESTS": "GUESTS",
      "OCCUPANCY": "OCCUPANCY",
      "CLINIC SYSTEM": "CLINIC <em>SYSTEM</em>",
      "CLINIC SYSTEM — VISUALIZA+": "CLINIC SYSTEM — VISUALIZA+",
      "SYSTEM 03 / CLINICS": "SYSTEM 03 / CLINICS",
      "Appointments, patients and communication — a system that runs the front desk.": "Appointments, patients and communication — a system that runs the front desk.",
      "CLINIC WEBSITE": "CLINIC WEBSITE",
      "Services, doctors and an appointment request form.": "Services, doctors and an appointment request form.",
      "APPOINTMENTS": "APPOINTMENTS",
      "Patients book; you confirm. The calendar never fights you.": "Patients book; you confirm. The calendar never fights you.",
      "PATIENT COMMUNICATION": "PATIENT COMMUNICATION",
      "Reminders, results and follow-ups over WhatsApp.": "Reminders, results and follow-ups over WhatsApp.",
      "RECORDS": "RECORDS",
      "Patient history structured and private.": "Patient history structured and private.",
      "No-shows drop; reminders go out; records stay clean.": "No-shows drop; reminders go out; records stay clean.",
      "PATIENTS": "PATIENTS",
      "REMINDERS": "REMINDERS",
      "NO-SHOWS": "NO-SHOWS",
      "PROFESSIONAL SERVICES SYSTEM": "PROFESSIONAL SERVICES <em>SYSTEM</em>",
      "PROFESSIONAL SERVICES SYSTEM — VISUALIZA+": "PROFESSIONAL SERVICES SYSTEM — VISUALIZA+",
      "SYSTEM 04 / PROFESSIONAL SERVICES": "SYSTEM 04 / PROFESSIONAL SERVICES",
      "A website, scheduling and business email that make your firm look the part.": "A website, scheduling and business email that make your firm look the part.",
      "SERVICES WEBSITE": "SERVICES WEBSITE",
      "Your offer, clearly presented. Built to convert enquiries.": "Your offer, clearly presented. Built to convert enquiries.",
      "ENQUIRY FORMS": "ENQUIRY FORMS",
      "Quotes and requests that land structured in your inbox.": "Quotes and requests that land structured in your inbox.",
      "SCHEDULING": "SCHEDULING",
      "Clients pick a time; your calendar stays controlled.": "Clients pick a time; your calendar stays controlled.",
      "Follow-ups and documents sent on time, every time.": "Follow-ups and documents sent on time, every time.",
      "ENQUIRIES": "ENQUIRIES",
      "QUOTES": "QUOTES",
      "CLIENTS": "CLIENTS",
      "NEW": "NEW",
      "VIEWING": "VIEWING",
      "OFFER": "OFFER",
      "FOLLOW-UP": "FOLLOW-UP",
      "CONFIRMED": "CONFIRMED",
      "PENDING": "PENDING",
      "BOOKED": "BOOKED",
      "CHECKED IN": "CHECKED IN",
      "APPT": "APPT",
      "REMINDED": "REMINDED",
      "SENT": "SENT",
      "YOUR LISTINGS.": "YOUR LISTINGS.",
      "ONE SYSTEM.": "ONE SYSTEM.",
      "FULL HOUSE,": "FULL HOUSE,",
      "ZERO STRESS.": "ZERO STRESS.",
      "THE FRONT DESK,": "THE FRONT DESK,",
      "AUTOMATED.": "AUTOMATED.",
      "YOUR FIRM,": "YOUR FIRM,",
      "ONE ENGINE.": "ONE ENGINE."
    },
    pt: {
      "( 01 )": "( 01 )",
      "( 06 )": "( 06 )",
      "( 06 SYSTEMS )": "( 06 SISTEMAS )",
      "( ALL PIECES, ONE SYSTEM )": "( TODAS AS PEÇAS, UM SISTEMA )",
      "( ALL SYSTEMS GO )": "( TUDO OPERACIONAL )",
      "( BUILD FOR ATTENTION )": "( CONSTRUÍDO PARA A ATENÇÃO )",
      "( BUILD → LAUNCH → GROW )": "( CONSTRUIR → LANÇAR → CRESCER )",
      "( DOMAIN → INBOX )": "( DOMÍNIO → CAIXA DE ENTRADA )",
      "( ENQUIRY → INSIGHTS )": "( PEDIDO → INFORMAÇÕES )",
      "( EVERY REPLY ON BRAND )": "( CADA RESPOSTA COM A MARCA )",
      "( NO MORE CHAOS )": "( CHEGA DE CAOS )",
      "( NO SILOS )": "( SEM ILHAS )",
      "( ONE ACTION )": "( UMA AÇÃO )",
      "( PLUG IN )": "( LIGA-SE )",
      "( QUESTIONS )": "( PERGUNTAS )",
      "( THE REPETITION ENGINE )": "( O MOTOR DA REPETIÇÃO )",
      "( VISITOR → CUSTOMER )": "( VISITANTE → CLIENTE )",
      "( VISITOR → LEAD )": "( VISITANTE → LEAD )",
      "( WHO IT'S FOR )": "( PARA QUEM É )",
      "A WhatsApp or email reply is sent automatically the moment a form is submitted.": "Uma resposta por WhatsApp ou email é enviada automaticamente no momento em que um formulário é submetido.",
      "A booking website with room pages and enquiry forms that land in your inbox.": "Um site de reservas com páginas de quartos e formulários de pedido que chegam ao seu email.",
      "A dedicated page for Facebook or Instagram ads, so traffic has a clear next step.": "Uma página dedicada para anúncios no Facebook ou Instagram, para o tráfego ter um próximo passo claro.",
      "A firm website with enquiry forms and scheduling built in.": "Um site de empresa com formulários de pedido e agendamento incluídos.",
      "A focused page for a discount or package that turns ads into enquiries.": "Uma página focada num desconto ou pacote que transforma anúncios em pedidos.",
      "A focused page for campaigns and offers.": "Uma página focada para campanhas e ofertas.",
      "A full professional home for your business.": "Uma casa profissional completa para o seu negócio.",
      "A landing page is a single, focused page built for one offer and one action — like 'request a quote' or 'book now'. It has no menu or distractions.": "Uma landing page é uma página única e focada, construída para uma oferta e uma ação — como 'pedir um orçamento' ou 'reservar agora'. Não tem menu nem distrações.",
      "A lead that was never forgotten becomes a customer.": "Um lead que nunca foi esquecido torna-se cliente.",
      "A listing website with WhatsApp enquiry buttons on every property.": "Um site de listagens com botões de WhatsApp em cada imóvel.",
      "A message, form or call arrives from anywhere.": "Uma mensagem, formulário ou chamada chega de qualquer lugar.",
      "A private system built around how you work.": "Um sistema privado construído à volta de como trabalha.",
      "A professional home for your business online.": "Uma casa profissional para o seu negócio online.",
      "A services website with appointment requests routed to your team.": "Um site de serviços com pedidos de marcação encaminhados para a sua equipa.",
      "A short form captures the right information.": "Um formulário curto capta a informação certa.",
      "A short form that captures the right information.": "Um formulário curto que capta a informação certa.",
      "A single page that introduces the offer and captures interest.": "Uma página única que apresenta a oferta e capta interesse.",
      "A single, focused page that turns campaign traffic into leads and enquiries.": "Uma página única e focada que transforma o tráfego de campanhas em leads e pedidos.",
      "A website presents your whole business. A landing page drives one decision. They work together: campaigns send traffic to the landing page.": "Um website apresenta todo o seu negócio. Uma landing page conduz a uma decisão. Funcionam juntos: as campanhas enviam tráfego para a landing page.",
      "ACTION.": "AÇÃO.",
      "AGENCIES & SERVICES": "AGÊNCIAS & SERVIÇOS",
      "AI-ASSISTED WORKFLOWS": "FLUXOS COM IA",
      "ANALYTICS": "ANÁLISES",
      "AUTHENTICATION": "AUTENTICAÇÃO",
      "AUTOMATE MY BUSINESS": "AUTOMATIZAR O MEU NEGÓCIO",
      "Anything repetitive: capturing new leads, sending confirmations, following up with customers, notifying your team and moving data between tools.": "Qualquer coisa repetitiva: captar novos leads, enviar confirmações, fazer follow-up a clientes, notificar a sua equipa e mover dados entre ferramentas.",
      "As many addresses as your team needs, each fully configured.": "Tantos endereços quanto a sua equipa precisar, cada um totalmente configurado.",
      "As many as your team needs — info@, sales@, accounts@, your name, or departments. We configure every mailbox individually.": "Tantos quantos a sua equipa precisar — info@, vendas@, contabilidade@, o seu nome, ou departamentos. Configuramos cada caixa de correio individualmente.",
      "Automated messages through official, approved channels.": "Mensagens automáticas através de canais oficiais e aprovados.",
      "Automation can continue the conversation from there.": "A automação pode continuar a conversa a partir daí.",
      "BOOKING CONFIRMATION": "CONFIRMAÇÃO DE RESERVA",
      "BOOKINGS ONLINE": "RESERVAS ONLINE",
      "BUILD A LANDING PAGE": "CRIAR UMA LANDING PAGE",
      "BUILD MY DIGITAL INFRASTRUCTURE": "CONSTRUIR A MINHA INFRAESTRUTURA DIGITAL",
      "BUILD MY SYSTEM": "CONSTRUIR O MEU SISTEMA",
      "BUILD.": "CONSTRUÍMOS.",
      "Basic workflows can run within days. Larger systems are built in stages so you see value quickly.": "Fluxos básicos podem funcionar em dias. Sistemas maiores são construídos por etapas para ver valor rapidamente.",
      "Booking, catalogues, portals or anything your business needs.": "Reservas, catálogos, portais ou o que o seu negócio precisar.",
      "Built and launched in days, not months.": "Construído e lançado em dias, não em meses.",
      "Built light and fast so visitors stay — even on slower connections.": "Construído leve e rápido para os visitantes ficarem — mesmo em ligações mais lentas.",
      "Business Automation & Workflows in Mozambique | Visualiza+": "Automação de Negócios & Fluxos de Trabalho em Moçambique | Visualiza+",
      "Business Email Setup in Mozambique — @YourDomain | Visualiza+": "Configuração de Email Profissional em Moçambique — @SeuDomínio | Visualiza+",
      "Business addresses on your own domain.": "Endereços profissionais no seu próprio domínio.",
      "Buyers, viewings and offers in a single structured record.": "Compradores, visitas e propostas num único registo estruturado.",
      "CLIENT CONTEXT": "CONTEXTO DO CLIENTE",
      "CLIENT TRUST": "CONFIANÇA DO CLIENTE",
      "CLINIC": "CLÍNICA",
      "COLD LEAD": "LEAD FRIO",
      "CONVERSION-FOCUSED STRUCTURE": "ESTRUTURA FOCADA EM CONVERSÃO",
      "CRM & Business Systems in Mozambique | Visualiza+": "CRM & Sistemas de Negócio em Moçambique | Visualiza+",
      "CRM and automation added to handle more customers without more chaos.": "CRM e automação adicionados para gerir mais clientes sem mais caos.",
      "CUSTOM BUSINESS PORTALS": "PORTAIS PERSONALIZADOS",
      "CUSTOM FUNCTIONALITY": "FUNCIONALIDADES PERSONALIZADAS",
      "CUSTOMER": "CLIENTE",
      "CUSTOMER DATABASE": "BASE DE DADOS DE CLIENTES",
      "CUSTOMER.": "CLIENTE.",
      "CUSTOMERS.": "CLIENTES.",
      "Campaign traffic arrives from ads, posts or messages.": "O tráfego da campanha chega de anúncios, publicações ou mensagens.",
      "Can I approve messages before they are sent?": "Posso aprovar as mensagens antes de serem enviadas?",
      "Can I move from Gmail or another provider?": "Posso migrar do Gmail ou de outro fornecedor?",
      "Can I read my email on my phone?": "Posso ler o meu email no telemóvel?",
      "Can I run ads to it?": "Posso fazer anúncios para essa página?",
      "Can I see reports and dashboards?": "Posso ver relatórios e painéis?",
      "Can I update the page later?": "Posso atualizar a página mais tarde?",
      "Can automation be connected to my existing tools?": "A automação pode ser ligada às minhas ferramentas atuais?",
      "Can it be customised to my business?": "Pode ser personalizado para o meu negócio?",
      "Can my whole team use it?": "Toda a minha equipa pode usar?",
      "Can visitors contact me on WhatsApp from the website?": "Os visitantes podem contactar-me no WhatsApp a partir do website?",
      "Can you add custom features later?": "Podem adicionar funcionalidades personalizadas mais tarde?",
      "Can you take over an existing setup?": "Podem assumir uma instalação existente?",
      "Clean structure, fast loading and mobile performance built in.": "Estrutura limpa, carregamento rápido e performance móvel incluídos.",
      "Click-to-chat buttons and enquiry flows on every page.": "Botões de clique para conversar e fluxos de pedido em todas as páginas.",
      "Client histories and tasks in one place — no lost context.": "Históricos e tarefas de clientes num só lugar — sem contexto perdido.",
      "Configured on Gmail, Outlook and your phone's mail app.": "Configurado no Gmail, Outlook e na app de email do telemóvel.",
      "Confirmations, follow-ups and sequences sent on their own.": "Confirmações, follow-ups e sequências enviadas automaticamente.",
      "Connected to your website, CRM, sheets and tools.": "Ligado ao seu website, CRM, folhas de cálculo e ferramentas.",
      "Customers receive confirmations and reminders without you writing a message.": "Os clientes recebem confirmações e lembretes sem você escrever uma mensagem.",
      "Customers structured in one system.": "Clientes estruturados num só sistema.",
      "DASHBOARDS": "PAINÉIS",
      "DEAL TRACKING": "ACOMPANHAMENTO DE NEGÓCIOS",
      "DELIVERY": "ENTREGA",
      "DESERVES A": "MERECE UM",
      "DESIGN": "DESIGN",
      "DIGITAL SYSTEM.": "SISTEMA DIGITAL.",
      "DNS": "DNS",
      "DNS & AUTHENTICATION": "DNS & AUTENTICAÇÃO",
      "DOMAIN": "DOMÍNIO",
      "DOMAIN-BASED ADDRESSES": "ENDEREÇOS NO SEU DOMÍNIO",
      "Dashboards show you what is moving and what needs attention.": "Os painéis mostram o que está a mover e o que precisa de atenção.",
      "Deals move through clear stages — nothing gets stuck.": "Os negócios passam por etapas claras — nada fica parado.",
      "Designed mobile-first, where campaign traffic lives.": "Desenhado mobile-first, onde vive o tráfego de campanhas.",
      "Digital Infrastructure for Business in Mozambique | Visualiza+": "Infraestrutura Digital para Negócios em Moçambique | Visualiza+",
      "Do I need a domain name?": "Preciso de um nome de domínio?",
      "Do I need a domain to have business email?": "Preciso de um domínio para ter email profissional?",
      "Do I own my domain and data?": "Sou o dono do meu domínio e dos meus dados?",
      "Do you provide support and maintenance?": "Vocês fornecem suporte e manutenção?",
      "Does automation replace my team?": "A automação substitui a minha equipa?",
      "Does it work with WhatsApp?": "Funciona com o WhatsApp?",
      "Does this need the WhatsApp Business API?": "Isto precisa da API do WhatsApp Business?",
      "Domain, hosting and everything connected.": "Domínio, alojamento e tudo ligado.",
      "Domain, site, email, WhatsApp and analytics unified in one system.": "Domínio, site, email, WhatsApp e análises unificados num só sistema.",
      "Domain, website and email connected from day one.": "Domínio, website e email ligados desde o primeiro dia.",
      "Domain, website, email, leads, CRM, automation and analytics — one connected digital system for your business. Built by Visualiza+.": "Domínio, website, email, leads, CRM, automação e análises — um sistema digital ligado para o seu negócio. Construído pela Visualiza+.",
      "Domain, website, email, leads, CRM, automation and analytics — one connected system.": "Domínio, website, email, leads, CRM, automação e análises — um sistema ligado.",
      "Domain-based email for your business. Professional addresses, proper authentication and reliable delivery — on every device.": "Email no seu domínio para o seu negócio. Endereços profissionais, autenticação correta e entrega fiável — em todos os dispositivos.",
      "EMAIL WORKFLOWS": "FLUXOS DE EMAIL",
      "EMAIL.": "EMAIL.",
      "ENQUIRY": "PEDIDO",
      "ENQUIRY + SCHEDULING": "PEDIDO + AGENDAMENTO",
      "EVENT / REGISTRATION": "EVENTO / INSCRIÇÃO",
      "Each service works alone. Together, they become one digital system — a website that feeds leads, email that handles replies, workflows that follow up and a CRM that remembers everything.": "Cada serviço funciona sozinho. Juntos, tornam-se um sistema digital — um website que alimenta leads, email que trata das respostas, fluxos que fazem follow-up e um CRM que lembra tudo.",
      "Email workflows that follow up by themselves.": "Fluxos de email que fazem follow-up sozinhos.",
      "Every build includes SEO foundations: clean structure, fast loading, meta descriptions and mobile performance. We build the base, then you can grow it with content.": "Cada construção inclui bases de SEO: estrutura limpa, carregamento rápido, meta descriptions e performance móvel. Construímos a base, depois você cresce com conteúdo.",
      "Every call, quote and deal tracked in one pipeline.": "Cada chamada, orçamento e negócio acompanhado num só pipeline.",
      "Every customer and conversation in one structured system — not in a WhatsApp thread.": "Cada cliente e conversa num sistema estruturado — não num fio do WhatsApp.",
      "Every enquiry captured and routed to you.": "Cada pedido captado e encaminhado para si.",
      "Every form and WhatsApp enquiry captured automatically.": "Cada formulário e pedido de WhatsApp captado automaticamente.",
      "Every form submission can go straight to your WhatsApp, email or CRM. You choose where you want to receive them.": "Cada envio de formulário pode ir direto para o seu WhatsApp, email ou CRM. Você escolhe onde os quer receber.",
      "Every lead captured, organised and never forgotten.": "Cada lead captado, organizado e nunca esquecido.",
      "Every lead lives in a WhatsApp thread. Staff change and the contacts leave with them. Nobody remembers who was asked for a price, who never replied, or which deal is stuck. You are losing business in a chat app.": "Cada lead vive num fio do WhatsApp. A equipa muda e os contactos vão com ela. Ninguém lembra a quem foi pedido um preço, quem nunca respondeu, ou qual negócio está parado. Está a perder negócios numa app de conversas.",
      "Every new lead captured in one system.": "Cada novo lead captado num só sistema.",
      "Every page adapts to phones, tablets and computers.": "Cada página adapta-se a telemóveis, tablets e computadores.",
      "Every system connected under one roof.": "Cada sistema ligado sob o mesmo teto.",
      "Every website we build is responsive. It adapts automatically to phones, tablets and computers — where most of your customers are.": "Todos os websites que construímos são responsivos. Adaptam-se automaticamente a telemóveis, tablets e computadores — onde está a maioria dos seus clientes.",
      "Existing messages and contacts moved without loss.": "Mensagens e contactos existentes migrados sem perdas.",
      "FAQ": "PERGUNTAS FREQUENTES",
      "FAST LAUNCH": "LANÇAMENTO RÁPIDO",
      "FORM": "FORMULÁRIO",
      "Fast, precise, on-brand. Every page is engineered, not templated.": "Rápido, preciso, fiel à marca. Cada página é engenhada, não templated.",
      "Fast, reliable hosting that stays online.": "Alojamento rápido e fiável que fica sempre online.",
      "Fast, responsive, easy to find on Google and wired to your WhatsApp and email. Your website becomes a tool that brings in enquiries — not a decoration that sits online.": "Rápido, responsivo, fácil de encontrar no Google e ligado ao seu WhatsApp e email. O seu website torna-se uma ferramenta que traz pedidos — não uma decoração que fica online.",
      "Follow-ups and reminders that run themselves.": "Follow-ups e lembretes que funcionam sozinhos.",
      "Follow-ups and responsibilities are assigned and tracked.": "Follow-ups e responsabilidades são atribuídos e acompanhados.",
      "Follow-ups and workflows that run themselves.": "Follow-ups e fluxos que funcionam sozinhos.",
      "Follow-ups that run the moment a lead arrives.": "Follow-ups que correm no momento em que um lead chega.",
      "For WhatsApp workflows we use official, approved channels. We handle the setup and requirements for you.": "Para fluxos de WhatsApp usamos canais oficiais e aprovados. Tratamos da configuração e dos requisitos por si.",
      "Forms and pages that feed the automation.": "Formulários e páginas que alimentam a automação.",
      "Forms that route enquiries straight to WhatsApp and email.": "Formulários que encaminham pedidos direto para o WhatsApp e email.",
      "Forms, WhatsApp, email and analytics wired together. No lead leaks.": "Formulários, WhatsApp, email e análises ligados. Sem leads perdidos.",
      "GENTLE NUDGE": "LEMBRETE SUAVE",
      "GET BUSINESS EMAIL": "OBTER EMAIL PROFISSIONAL",
      "GET STARTED.": "COMEÇAR.",
      "GOOD BUSINESSES, FREE ADDRESSES.": "BONS NEGÓCIOS, ENDEREÇOS GRATUITOS.",
      "GROWING BUSINESS": "NEGÓCIO EM CRESCIMENTO",
      "GUEST COMMUNICATION": "COMUNICAÇÃO COM HÓSPEDES",
      "HOME": "INÍCIO",
      "HOSTING": "ALOJAMENTO",
      "HOTEL / LODGE": "HOTEL / ESTABELECIMENTO",
      "High-Converting Landing Pages in Mozambique | Visualiza+": "Landing Pages de Alta Conversão em Moçambique | Visualiza+",
      "How fast can it be set up?": "Com que rapidez pode ser configurado?",
      "How is it different from a full website?": "Em que é diferente de um website completo?",
      "How long does it take to build a website?": "Quanto tempo demora a construir um website?",
      "How long does it take to connect everything?": "Quanto tempo demora a ligar tudo?",
      "How many mailboxes can I have?": "Quantas caixas de correio posso ter?",
      "INBOX": "CAIXA DE ENTRADA",
      "INSIGHTS": "INFORMAÇÕES",
      "INSTANT REPLY": "RESPOSTA IMEDIATA",
      "INTEGRATIONS": "INTEGRAÇÕES",
      "INTERNAL WORKFLOWS": "FLUXOS INTERNOS",
      "Is the website optimised for Google?": "O website está otimizado para o Google?",
      "LAUNCH": "LANÇAR",
      "LEAD": "LEAD",
      "LEAD CAMPAIGNS": "CAMPANHAS DE LEADS",
      "LEAD FORM": "FORMULÁRIO DE LEAD",
      "LEAD GENERATION": "GERAÇÃO DE LEADS",
      "LEAD MANAGEMENT": "GESTÃO DE LEADS",
      "LEADS": "LEADS",
      "LEADS IN": "LEADS NO",
      "LET'S MAP IT.": "VAMOS MAPEAR.",
      "LISTINGS + LEADS": "LISTAGENS + LEADS",
      "Leads and follow-ups in one structured system.": "Leads e follow-ups num só sistema estruturado.",
      "Leads are forgotten. Follow-ups don't happen. Confirmations are typed by hand. The same messages are copied and pasted every day — and customers who never get a reply simply buy elsewhere.": "Os leads são esquecidos. Os follow-ups não acontecem. As confirmações são escritas à mão. As mesmas mensagens são copiadas e coladas todos os dias — e os clientes que nunca recebem resposta simplesmente compram noutro lugar.",
      "Leads delivered to your phone the moment they arrive.": "Leads entregues no seu telemóvel no momento em que chegam.",
      "Leads that went quiet receive a friendly follow-up after a few days.": "Leads que ficaram em silêncio recebem um follow-up amigável após alguns dias.",
      "MAIL THAT LOOKS LIKE YOU.": "EMAIL QUE PARECE CONSIGO.",
      "MAILBOXES": "CAIXAS DE CORREIO",
      "MANUALLY WHAT": "MANUALMENTE O QUE",
      "MOBILE OPTIMISATION": "OTIMIZAÇÃO MÓVEL",
      "MULTIPLE MAILBOXES": "MÚLTIPLAS CAIXAS DE CORREIO",
      "Mailboxes configured and ready — names, departments, forwarders.": "Caixas de correio configuradas e prontas — nomes, departamentos, reencaminhamentos.",
      "Messages and leads flow in automatically.": "Mensagens e leads entram automaticamente.",
      "Messages reach the inbox, not the spam folder.": "As mensagens chegam à caixa de entrada, não ao spam.",
      "Most businesses are fully connected within 2 to 4 weeks. We build in stages so nothing blocks your operations.": "A maioria dos negócios fica totalmente ligada em 2 a 4 semanas. Construímos por etapas para nada bloquear as suas operações.",
      "Most businesses in Mozambique have a Facebook page and a WhatsApp number — but no real website. When a customer searches, the business either doesn't exist online, or shows a slow site that doesn't work on a phone and never brings a single lead.": "A maioria dos negócios em Moçambique tem uma página no Facebook e um número de WhatsApp — mas nenhum website a sério. Quando um cliente pesquisa, o negócio ou não existe online, ou mostra um site lento que não funciona no telemóvel e nunca traz um único lead.",
      "Most professional websites are designed, built and launched within 1 to 3 weeks, depending on content and functionality. You receive a clear timeline before we start.": "A maioria dos websites profissionais é desenhada, construída e lançada em 1 a 3 semanas, dependendo do conteúdo e das funcionalidades. Recebe um cronograma claro antes de começarmos.",
      "NEW BUSINESS": "NOVO NEGÓCIO",
      "NEW ENQUIRY": "NOVO PEDIDO",
      "NO TYPING": "SEM DIGITAR",
      "NOTIFICATIONS": "NOTIFICAÇÕES",
      "No. Automation removes the repetitive work so your team can focus on customers. Software sends the reminders; your people close the deals.": "Não. A automação remove o trabalho repetitivo para a sua equipa se focar nos clientes. O software envia os lembretes; as suas pessoas fecham os negócios.",
      "ONE ACTION.": "UMA AÇÃO.",
      "ONE CONNECTED": "UM SISTEMA DIGITAL",
      "ONE ENGINE, EVERY PIECE.": "UM MOTOR, TODAS AS PEÇAS.",
      "ONE OFFER.": "UMA OFERTA.",
      "ONE PAGE.": "UMA PÁGINA.",
      "ONE PAGE. ONE DECISION.": "UMA PÁGINA. UMA DECISÃO.",
      "ONE PIPELINE": "UM PIPELINE",
      "ONE PLATFORM": "UMA PLATAFORMA",
      "ONE SYSTEM": "UM SISTEMA",
      "ONE SYSTEM. NO LOST LEADS.": "UM SISTEMA. SEM LEADS PERDIDOS.",
      "ONLINE, BUT INVISIBLE.": "ONLINE, MAS INVISÍVEL.",
      "ONLINE, BUT NOT CONNECTED.": "ONLINE, MAS NÃO LIGADO.",
      "One clear promise and one clear reason to act.": "Uma promessa clara e uma razão clara para agir.",
      "One message, one offer, one clear action.": "Uma mensagem, uma oferta, uma ação clara.",
      "One page, one form — registrations land directly in your inbox or CRM.": "Uma página, um formulário — as inscrições chegam direto ao seu email ou CRM.",
      "One page. One offer. One action. Campaign and launch pages engineered for conversion, mobile-optimised and tracked with analytics — built by Visualiza+.": "Uma página. Uma oferta. Uma ação. Páginas de campanha e lançamento projetadas para conversão, otimizadas para mobile e monitorizadas com análises — construídas pela Visualiza+.",
      "One structured record for every client and contact.": "Um registo estruturado para cada cliente e contacto.",
      "Overdue customers are reminded automatically, in a professional tone.": "Clientes em atraso são lembrados automaticamente, num tom profissional.",
      "PATIENT RECORDS": "REGISTOS DE PACIENTES",
      "PAYMENT REMINDER": "LEMBRETE DE PAGAMENTO",
      "PERFORMANCE": "PERFORMANCE",
      "PHONE & CLIENT SETUP": "CONFIGURAÇÃO NO TELEMÓVEL & CLIENTES",
      "PIPELINE": "PIPELINE",
      "PRODUCT LAUNCH": "LANÇAMENTO DE PRODUTO",
      "PROFESSIONAL": "PROFISSIONAL",
      "PROFESSIONAL FIRM": "EMPRESA PROFISSIONAL",
      "PROFESSIONAL SETUP": "CONFIGURAÇÃO PROFISSIONAL",
      "PROMOTION / OFFER": "PROMOÇÃO / OFERTA",
      "PROPERTY": "IMOBILIÁRIO",
      "PROPERTY AGENCY": "AGÊNCIA IMOBILIÁRIA",
      "Patients, appointments and follow-ups managed in one system.": "Pacientes, marcações e follow-ups geridos num só sistema.",
      "Pipeline, open deals and activity at a glance.": "Pipeline, negócios abertos e atividade num relance.",
      "Professional Website Design & Development in Mozambique | Visualiza+": "Design & Desenvolvimento de Websites Profissionais em Moçambique | Visualiza+",
      "Professional email on your own domain.": "Email profissional no seu próprio domínio.",
      "Professional email on your own domain: setup, DNS and email authentication, multiple mailboxes and reliable delivery. hello@yourcompany.com — built by Visualiza+.": "Email profissional no seu próprio domínio: configuração, DNS e autenticação de email, múltiplas caixas de correio e entrega fiável. hello@aempresa.com — construído pela Visualiza+.",
      "Professional mail on your own domain.": "Email profissional no seu próprio domínio.",
      "Professional websites built for Mozambique: responsive, fast, easy to find on Google and wired to your WhatsApp and email.": "Websites profissionais construídos para Moçambique: responsivos, rápidos, fáceis de encontrar no Google e ligados ao seu WhatsApp e email.",
      "REAL ESTATE AGENCY": "AGÊNCIA IMOBILIÁRIA",
      "RECORD": "REGISTO",
      "RELATED SERVICES": "SERVIÇOS RELACIONADOS",
      "RESPONSIVE DESIGN": "DESIGN RESPONSIVO",
      "Registered in your name, with DNS managed properly.": "Registado no seu nome, com DNS gerido corretamente.",
      "Repetitive work handled automatically.": "Trabalho repetitivo tratado automaticamente.",
      "Replies, reminders and follow-ups are sent automatically.": "Respostas, lembretes e follow-ups são enviados automaticamente.",
      "SAFE MIGRATION": "MIGRAÇÃO SEGURA",
      "SALES INBOX": "CAIXA DE VENDAS",
      "SALES TEAMS": "EQUIPAS DE VENDAS",
      "SCALE READY": "PRONTO PARA CRESCER",
      "SCATTERED TOOLS": "FERRAMENTAS DISPERSAS",
      "SECOND CHANCE": "SEGUNDA OPORTUNIDADE",
      "SEO FOUNDATIONS": "BASES DE SEO",
      "SERVICE 01 / WEBSITES": "SERVIÇO 01 / WEBSITES",
      "SERVICE 02 / BUSINESS EMAIL": "SERVIÇO 02 / EMAIL PROFISSIONAL",
      "SERVICE 03 / LANDING PAGES": "SERVIÇO 03 / LANDING PAGES",
      "SERVICE 04 / AUTOMATION": "SERVIÇO 04 / AUTOMAÇÃO",
      "SERVICE 05 / CRM & SYSTEMS": "SERVIÇO 05 / CRM & SISTEMAS",
      "SERVICE 06 / DIGITAL INFRASTRUCTURE": "SERVIÇO 06 / INFRAESTRUTURA DIGITAL",
      "SERVICE DIRECTORY / 06": "DIRETÓRIO DE SERVIÇOS / 06",
      "SOFTWARE CAN DO.": "O SOFTWARE PODE FAZER.",
      "SOFTWARE DOES THE REPEATING.": "O SOFTWARE FAZ AS REPETIÇÕES.",
      "SPF, DKIM and DMARC configured so mail is trusted.": "SPF, DKIM e DMARC configurados para o email ser confiável.",
      "SPF, DKIM and DMARC configured so your domain is verified.": "SPF, DKIM e DMARC configurados para o seu domínio ser verificado.",
      "START CONNECTED": "COMEÇAR LIGADO",
      "START HERE.": "COMEÇAR AQUI.",
      "STOP DOING": "DEIXE DE FAZER",
      "STOP LOSING": "DEIXE DE PERDER",
      "See visits and conversions so you know what works.": "Veja visitas e conversões para saber o que funciona.",
      "Services | Websites, Email, Automation & Systems — Visualiza+": "Serviços | Websites, Email, Automação & Sistemas — Visualiza+",
      "Six services that plug into one digital system: websites, business email, landing pages, automation, CRM & systems and digital infrastructure. Built for businesses in Mozambique by Visualiza+.": "Seis serviços que se ligam num só sistema digital: websites, email profissional, landing pages, automação, CRM & sistemas e infraestrutura digital. Construídos para negócios em Moçambique pela Visualiza+.",
      "Smart drafting, summaries and routing powered by AI.": "Redação inteligente, resumos e encaminhamento com IA.",
      "Someone visits your site, page or ad — and takes an action.": "Alguém visita o seu site, página ou anúncio — e age.",
      "Start with one piece — a website, business email or a landing page — and add the rest when your business is ready. Every service is built to connect later.": "Comece com uma peça — um website, email profissional ou uma landing page — e adicione o resto quando o seu negócio estiver pronto. Cada serviço é construído para ligar depois.",
      "Stop doing manually what software can do. Lead capture, email and WhatsApp workflows, notifications and AI-assisted follow-up — built by Visualiza+.": "Deixe de fazer manualmente o que o software pode fazer. Captação de leads, fluxos de email e WhatsApp, notificações e follow-up com IA — construído pela Visualiza+.",
      "Stop losing leads in WhatsApp. CRM, lead management, customer databases, dashboards and custom business portals — built by Visualiza+.": "Deixe de perder leads no WhatsApp. CRM, gestão de leads, bases de dados de clientes, painéis e portais personalizados — construído pela Visualiza+.",
      "Structure, identity and layout — designed to make your business look the part.": "Estrutura, identidade e layout — desenhados para o seu negócio parecer o que é.",
      "TASKS": "TAREFAS",
      "THAT WORK.": "QUE FUNCIONAM.",
      "THAT WORKS?": "QUE FUNCIONE?",
      "THE CHAT APP BLACK HOLE.": "O BURACO NEGRO DAS APPS DE CONVERSA.",
      "THE CONNECTION": "A LIGAÇÃO",
      "THE DESTINATION": "O DESTINO",
      "THE IDEA": "A IDEIA",
      "THE INDEX": "O ÍNDICE",
      "THE OFFER": "A OFERTA",
      "THE PROBLEM / SOLUTION": "O PROBLEMA / A SOLUÇÃO",
      "THE REPETITION TRAP.": "A ARMADILHA DA REPETIÇÃO.",
      "THE REVEAL": "A REVELAÇÃO",
      "THE SIGN-UP": "A INSCRIÇÃO",
      "THE SOLUTION": "A SOLUÇÃO",
      "THE WAY IN": "A ENTRADA",
      "TRAFFIC WITHOUT A DESTINATION.": "TRÁFEGO SEM DESTINO.",
      "Tasks, approvals and team processes inside the system.": "Tarefas, aprovações e processos de equipa dentro do sistema.",
      "That's fine. Every service works alone and connects later. You can start with a website or email and add the rest when you're ready.": "Tudo bem. Cada serviço funciona sozinho e liga-se depois. Pode começar com um website ou email e adicionar o resto quando estiver pronto.",
      "The capture point that starts the workflow.": "O ponto de captura que inicia o fluxo.",
      "The contact and conversation are saved as one record.": "O contacto e a conversa são guardados como um registo.",
      "The domain is with one provider, the website with another, email is a free address, leads sit in WhatsApp, and nobody can see what is working. The pieces exist — but they don't connect. Your business is online, but not built for digital.": "O domínio está num fornecedor, o website noutro, o email é um endereço gratuito, os leads estão no WhatsApp, e ninguém vê o que funciona. As peças existem — mas não se ligam. O seu negócio está online, mas não está construído para o digital.",
      "The enquiry becomes a captured lead in your system.": "O pedido torna-se um lead captado no seu sistema.",
      "The enquiry lands in your WhatsApp or inbox.": "O pedido chega ao seu WhatsApp ou email.",
      "The front door that feeds leads into your CRM.": "A porta de entrada que alimenta o seu CRM com leads.",
      "They fill in a form, send a message or start a chat.": "Preenchem um formulário, enviam uma mensagem ou iniciam uma conversa.",
      "USE CASES": "CASOS DE USO",
      "VISITOR": "VISITANTE",
      "WE BUILD SITES THAT WORK.": "CONSTRUÍMOS SITES QUE FUNCIONAM.",
      "WHAT'S INCLUDED": "O QUE ESTÁ INCLUÍDO",
      "WHATSAPP & EMAIL ROUTING": "ENCAMINHAMENTO PARA WHATSAPP & EMAIL",
      "WHATSAPP CONNECTION": "LIGAÇÃO AO WHATSAPP",
      "WHATSAPP INTEGRATION": "INTEGRAÇÃO COM WHATSAPP",
      "WHATSAPP WORKFLOWS": "FLUXOS DE WHATSAPP",
      "WHATSAPP.": "WHATSAPP.",
      "We build a single, focused page with one offer and one action. Campaign traffic lands on a page built to convert, and every enquiry arrives in your WhatsApp or inbox.": "Construímos uma página única e focada com uma oferta e uma ação. O tráfego da campanha chega a uma página feita para converter, e cada pedido chega ao seu WhatsApp ou email.",
      "We build a system that records every customer and every conversation. Leads, deals and follow-ups live in one structured place — accessible to you, not trapped in someone's phone.": "Construímos um sistema que regista cada cliente e cada conversa. Leads, negócios e follow-ups vivem num lugar estruturado — acessível a si, não preso no telemóvel de alguém.",
      "We build workflows that capture leads, send follow-ups and notify your team automatically — so nothing falls through the cracks.": "Construímos fluxos que captam leads, enviam follow-ups e notificam a sua equipa automaticamente — para nada escapar pelas brechas.",
      "We clean and import your existing contacts, so you start with a structured database, not a blank page.": "Limpamos e importamos os seus contactos existentes, para começar com uma base de dados estruturada, não uma página em branco.",
      "We configure email authentication (SPF, DKIM and DMARC) so your domain is verified. That protects your reputation and improves delivery.": "Configuramos a autenticação de email (SPF, DKIM e DMARC) para o seu domínio ser verificado. Isso protege a sua reputação e melhora a entrega.",
      "We connect the components of your business into one digital system: domain, website, email, leads, CRM, automation and analytics — engineered to work together.": "Ligamos os componentes do seu negócio num sistema digital: domínio, website, email, leads, CRM, automação e análises — projetados para trabalhar juntos.",
      "We map your business, your customers and your offer before a single pixel is placed.": "Mapeamos o seu negócio, os seus clientes e a sua oferta antes de colocar um único pixel.",
      "We measure, maintain and evolve the site as your business compounds.": "Medimos, mantemos e evoluímos o site à medida que o seu negócio cresce.",
      "We start with an audit of what you already have — domain, website, email, social pages — and map the gaps. Then we build the missing pieces.": "Começamos com uma auditoria do que já tem — domínio, website, email, páginas sociais — e mapeamos as lacunas. Depois construímos as peças que faltam.",
      "Websites that work: responsive design, SEO foundations, fast performance, lead generation, WhatsApp integration and custom functionality — built for businesses in Mozambique by Visualiza+.": "Websites que funcionam: design responsivo, bases de SEO, performance rápida, geração de leads, integração com WhatsApp e funcionalidades personalizadas — construídos para negócios em Moçambique pela Visualiza+.",
      "What can be automated?": "O que pode ser automatizado?",
      "What if I already have a messy list of contacts?": "E se já tenho uma lista desorganizada de contactos?",
      "What if I only need one piece right now?": "E se precisar só de uma peça por agora?",
      "What is a landing page?": "O que é uma landing page?",
      "When a customer sees 'company@gmail.com', the message is clear — this is not an established business. Free addresses get lost in spam, mix with personal mail, and die with the employee who created them.": "Quando um cliente vê 'empresa@gmail.com', a mensagem é clara — este não é um negócio estabelecido. Os endereços gratuitos perdem-se no spam, misturam-se com o mail pessoal e morrem com o funcionário que os criou.",
      "Where do I start?": "Por onde começo?",
      "Where do leads go?": "Para onde vão os leads?",
      "Why do I need a CRM?": "Porque é que preciso de um CRM?",
      "Will it work on mobile?": "Vai funcionar no telemóvel?",
      "Will my emails land in the inbox or spam?": "Os meus emails vão para a caixa de entrada ou para o spam?",
      "Will my website work on mobile phones?": "O meu website vai funcionar em telemóveis?",
      "Without a CRM, leads live in WhatsApp threads and memories. A CRM records every customer, conversation and follow-up in one structured system.": "Sem um CRM, os leads vivem em fios do WhatsApp e em memórias. Um CRM regista cada cliente, conversa e follow-up num sistema estruturado.",
      "Workflows decide what happens next — instantly, every time.": "Os fluxos decidem o que acontece a seguir — instantaneamente, sempre.",
      "Workflows that capture leads, send follow-ups and notify your team — automatically.": "Fluxos que captam leads, enviam follow-ups e notificam a sua equipa — automaticamente.",
      "YOUR BUSINESS.": "O SEU NEGÓCIO.",
      "Yes. Business email runs on your own domain, like hello@yourcompany.com. If you do not have a domain yet, we can register one for you.": "Sim. O email profissional corre no seu próprio domínio, como ola@aempresa.com. Se ainda não tem domínio, podemos registá-lo por si.",
      "Yes. Dashboards show your pipeline, open deals, follow-ups due and customer activity at a glance.": "Sim. Os painéis mostram o seu pipeline, negócios abertos, follow-ups pendentes e atividade de clientes num relance.",
      "Yes. Everything is registered in your name and belongs to your business. We manage it, but you own it.": "Sim. Tudo é registado no seu nome e pertence ao seu negócio. Nós gerimos, mas é seu.",
      "Yes. Landing pages are built to be fast-loading and focused, which makes them an effective destination for Facebook, Instagram and Google ads.": "Sim. As landing pages são construídas para carregar rápido e ser focadas, o que as torna um destino eficaz para anúncios no Facebook, Instagram e Google.",
      "Yes. Landing pages are designed mobile-first, because most campaign traffic in Mozambique comes from phones.": "Sim. As landing pages são desenhadas mobile-first, porque a maioria do tráfego de campanhas em Moçambique vem de telemóveis.",
      "Yes. We build custom business portals and workflows around how your business actually works.": "Sim. Construímos portais e fluxos personalizados à volta de como o seu negócio realmente funciona.",
      "Yes. We can build workflows that pause for your approval, so important messages always pass through you.": "Sim. Podemos construir fluxos que param para a sua aprovação, para que mensagens importantes passem sempre por si.",
      "Yes. We can migrate your domain, website and email with minimal disruption and connect the pieces properly.": "Sim. Podemos migrar o seu domínio, website e email com interrupção mínima e ligar as peças corretamente.",
      "Yes. We can update text, offers and images for you, or connect the page to a system you manage.": "Sim. Podemos atualizar texto, ofertas e imagens por si, ou ligar a página a um sistema que você gere.",
      "Yes. We configure your email on Gmail, Outlook or your phone's mail app, so your team can reply from anywhere.": "Sim. Configuramos o seu email no Gmail, Outlook ou na app de email do telemóvel, para a sua equipa responder de qualquer lugar.",
      "Yes. We connect WhatsApp so messages and leads can flow into your CRM automatically, instead of living only in your phone.": "Sim. Ligamos o WhatsApp para que mensagens e leads entrem no seu CRM automaticamente, em vez de viverem só no telemóvel.",
      "Yes. We connect workflows to your website, forms, CRM, spreadsheets and communication tools.": "Sim. Ligamos os fluxos ao seu website, formulários, CRM, folhas de cálculo e ferramentas de comunicação.",
      "Yes. We integrate WhatsApp buttons and forms so enquiries go straight to your WhatsApp or email. No lead gets lost.": "Sim. Integramos botões e formulários de WhatsApp para os pedidos irem direto ao seu WhatsApp ou email. Nenhum lead se perde.",
      "Yes. We migrate your existing messages and contacts so nothing is lost, and your team keeps using the same familiar tools.": "Sim. Migramos as suas mensagens e contactos existentes para nada se perder, e a sua equipa continua a usar as mesmas ferramentas.",
      "Yes. We monitor your systems, keep them secure and make sure everything stays online.": "Sim. Monitorizamos os seus sistemas, mantemos-nos seguros e garantimos que tudo fica online.",
      "Yes. Websites are built in modules, so we can add booking forms, catalogues, portals or automation as your business grows.": "Sim. Os websites são construídos em módulos, por isso podemos adicionar formulários de reserva, catálogos, portais ou automação à medida que o seu negócio cresce.",
      "Yes. You control access — each team member sees the contacts and pipelines relevant to them.": "Sim. Você controla os acessos — cada membro da equipa vê os contactos e pipelines relevantes para si.",
      "Yes. Your website lives at your own domain, such as yourcompany.com. If you do not have one yet, we register it and set everything up for you.": "Sim. O seu website vive no seu próprio domínio, como aempresa.com. Se ainda não tem um, nós registamo-lo e configuramos tudo por si.",
      "You run an offer on Instagram or Facebook, people get excited — and then nothing happens. Traffic without a destination is just attention leaking away. Posting a link to a busy homepage rarely converts.": "Você faz uma oferta no Instagram ou Facebook, as pessoas ficam entusiasmadas — e depois nada acontece. Tráfego sem destino é atenção a escapar. Publicar um link para uma homepage cheia raramente converte.",
      "You see what is working and what is not.": "Vê o que está a funcionar e o que não está.",
      "Your business deserves a professional email on your own domain. We set up hello@yourcompany.com with proper authentication and reliable delivery — the address customers trust, on every device.": "O seu negócio merece um email profissional no seu próprio domínio. Configuramos ola@aempresa.com com autenticação correta e entrega fiável — o endereço que os clientes confiam, em todos os dispositivos.",
      "Your domain is pointed at the mail system and verified.": "O seu domínio é apontado para o sistema de email e verificado.",
      "Your own address — yourcompany.com, registered in your name.": "O seu próprio endereço — aempresa.com, registado no seu nome.",
      "Your professional presence online.": "A sua presença profissional online.",
      "Your professional presence, built to work.": "A sua presença profissional, construída para funcionar.",
      "Your site goes live on your own domain, indexed and ready to be found.": "O seu site fica online no seu próprio domínio, indexado e pronto para ser encontrado.",
      "Your team communicates from @yourcompany, not a free address.": "A sua equipa comunica a partir de @aempresa, não de um endereço gratuito.",
      "Your team gets addresses — names, departments, forwarders.": "A sua equipa recebe endereços — nomes, departamentos, reencaminhamentos.",
      "Your team is alerted the moment something important happens.": "A sua equipa é alertada no momento em que algo importante acontece.",
      "Your team reads and replies from anywhere, on any device.": "A sua equipa lê e responde de qualquer lugar, em qualquer dispositivo.",
      "appointments@yourclinic.com for bookings and results, separate from personal mail.": "marcacoes@asuaclinica.com para reservas e resultados, separado do mail pessoal.",
      "hello@yourcompany.com": "ola@aempresa.com",
      "hello@yoursuite.com for every confirmation and guest conversation.": "ola@oseuestabelecimento.com para cada confirmação e conversa com hóspedes.",
      "sales@youragency.com so every offer and viewing stays in one inbox.": "vendas@asuagencia.com para cada proposta e visita ficar numa caixa de entrada.",
      "yourname@yourfirm.com — clients see a professional, trusted address.": "oseunome@asuafirma.com — os clientes veem um endereço profissional e confiável.",
      "← BACK TO SERVICES": "← VOLTAR AOS SERVIÇOS",
      "→ DIGITAL INFRASTRUCTURE TIES THEM ALL TOGETHER.": "→ A INFRAESTRUTURA DIGITAL LIGA TUDO.",

      "VISUALIZA+ — Your business, built for digital.": "VISUALIZA+ — O seu negócio, construído para o digital.",
      "Visualiza+ | Digital Solutions & Website Development in Mozambique": "Visualiza+ | Soluções Digitais e Desenvolvimento de Websites em Moçambique",
      "Real Estate Website & CRM System in Mozambique | Visualiza+": "Website e CRM Imobiliário em Moçambique | Visualiza+",
      "Hotel & Hospitality Booking System in Mozambique | Visualiza+": "Sistema de Reservas Hoteleiras em Moçambique | Visualiza+",
      "Clinic Website & Appointment System in Mozambique | Visualiza+": "Website e Marcações para Clínicas em Moçambique | Visualiza+",
      "Professional Services Website & Scheduling System | Visualiza+": "Website e Agendamento para Serviços Profissionais | Visualiza+",
      "Visualiza+ builds digital infrastructure for businesses — websites, domains, business email, landing pages, automation, CRM and custom digital systems.": "A Visualiza+ constrói infraestrutura digital para negócios — websites, domínios, email profissional, landing pages, automação, CRM e sistemas digitais personalizados.",
      "Visualiza+ builds professional websites, business email, automation and digital systems for businesses in Mozambique.": "A Visualiza+ constrói websites profissionais, email empresarial, automação e sistemas digitais para empresas em Moçambique.",
      "INTRO": "INTRO",
      "SERVICES": "SERVIÇOS",
      "SOLUTIONS": "SOLUÇÕES",
      "PROCESS": "PROCESSO",
      "START A PROJECT": "COMEÇAR UM PROJETO",
      "VISUALIZA+ — DIGITAL SOLUTIONS": "VISUALIZA+ — SOLUÇÕES DIGITAIS",
      "YOUR BUSINESS,": "O SEU NEGÓCIO,",
      "BUILT FOR": "CONSTRUÍDO PARA",
      "FOR DIGITAL?": "PARA O DIGITAL?",
      "Websites, business email, automation and digital systems — built around your business.": "Websites, email profissional, automação e sistemas digitais — construídos à volta do seu negócio.",
      "// IDEA → SYSTEM — YOUR BUSINESS ON THE LINE": "// IDEIA → SISTEMA — O SEU NEGÓCIO EM LINHA",
      "IDEA": "IDEIA",
      "WEBSITE": "WEBSITE",
      "CONNECTION": "LIGAÇÃO",
      "AUTOMATION": "AUTOMAÇÃO",
      "SYSTEM": "SISTEMA",
      "concept": "conceito",
      "presence": "presença",
      "leads in": "leads a entrar",
      "follow-up": "follow-up",
      "one engine": "um motor único",
      "SCROLL": "ROLAR",
      "WEBSITES": "WEBSITES",
      "BUSINESS EMAIL": "EMAIL PROFISSIONAL",
      "CRM": "CRM",
      "LANDING PAGES": "LANDING PAGES",
      "CRM & SYSTEMS": "CRM & SISTEMAS",
      "DIGITAL INFRASTRUCTURE": "INFRAESTRUTURA DIGITAL",
      "THE PROBLEM": "O PROBLEMA",
      "YOUR BUSINESS": "O SEU NEGÓCIO",
      "IS ONLINE.": "ESTÁ ONLINE.",
      "BUT IS IT": "MAS ESTÁ",
      "BUILT FOR DIGITAL?": "CONSTRUÍDO PARA O DIGITAL?",
      "NO.": "NÃO.",
      "Most businesses have Instagram, Facebook and WhatsApp. Visualiza+ connects the pieces into one professional digital system.": "A maioria dos negócios tem Instagram, Facebook e WhatsApp. A Visualiza+ liga as peças num sistema digital profissional.",
      "WHAT WE BUILD": "O QUE CONSTRUÍMOS",
      "WHAT WE": "O QUE",
      "BUILD": "CONSTRUÍMOS",
      "Not templates. Not brochures. Six disciplines that plug into one system — your digital infrastructure, engineered end to end.": "Sem templates. Sem brochuras. Seis disciplinas que se ligam num só sistema — a sua infraestrutura digital, projetada de ponta a ponta.",
      "HOVER THE INDEX —": "PASSA O RATO PELO ÍNDICE —",
      "Marketing sites engineered for conversion, speed and identity. Built to make your business look the part.": "Sites de marketing projetados para conversão, velocidade e identidade. Construídos para o seu negócio parecer aquilo que é.",
      "identity · performance · conversion": "identidade · performance · conversão",
      "Professional email on your own domain. @yourcompany — real infrastructure, not a Gmail address.": "Email profissional no seu próprio domínio. @aempresa — infraestrutura a sério, não um endereço do Gmail.",
      "domain · @brand · deliverability": "domínio · @marca · entregabilidade",
      "High-converting pages for launches, campaigns and offers. Designed to turn attention into action.": "Páginas de alta conversão para lançamentos, campanhas e ofertas. Desenhadas para transformar atenção em ação.",
      "launches · campaigns · offers": "lançamentos · campanhas · ofertas",
      "Workflows that handle the repetitive work — leads, follow-ups, invoicing and data — automatically.": "Fluxos de trabalho que tratam do trabalho repetitivo — leads, follow-ups, faturas e dados — automaticamente.",
      "workflows · follow-up · data": "workflows · follow-up · dados",
      "Customer relationships structured in one system. Every contact, every deal, every message tracked.": "Relacionamentos com clientes estruturados num só sistema. Cada contacto, cada negócio, cada mensagem rastreada.",
      "pipeline · contacts · insights": "pipeline · contactos · insights",
      "The invisible layer: domains, hosting, DNS, security and reliability. Engineered to stay online.": "A camada invisível: domínios, alojamento, DNS, segurança e fiabilidade. Projetada para estar sempre online.",
      "domains · hosting · security": "domínios · alojamento · segurança",
      "WE DON'T JUST": "NÃO FAZEMOS APENAS",
      "BUILD WEBSITES.": "SITES.",
      "We build digital systems, not just websites.": "Construímos sistemas digitais, não apenas websites.",
      "WE BUILD": "CONSTRUÍMOS",
      "DIGITAL SYSTEMS.": "SISTEMAS DIGITAIS.",
      "INDUSTRIES": "SETORES",
      "YOUR INDUSTRY": "O SEU SETOR",
      "REAL ESTATE": "IMOBILIÁRIO",
      "HOSPITALITY": "HOTELARIA",
      "CLINICS": "CLÍNICAS",
      "PROFESSIONAL SERVICES": "SERVIÇOS PROFISSIONAIS",
      "website + listings": "site + imóveis",
      "leads + whatsapp": "leads + whatsapp",
      "crm": "crm",
      "website + booking": "site + reservas",
      "business email": "email profissional",
      "whatsapp": "whatsapp",
      "website + appointments": "site + marcações",
      "automation": "automação",
      "communication": "comunicação",
      "website + forms": "site + formulários",
      "scheduling": "agendamento",
      "VIEW SYSTEM": "VER SISTEMA",
      "THE SEQUENCE": "A SEQUÊNCIA",
      "DISCOVER": "DESCOBRIR",
      "BUILD": "CONSTRUIR",
      "CONNECT": "LIGAR",
      "GROW": "CRESCER",
      "We map your business, your customers and the gaps. The system is designed before it is built.": "Mapeamos o seu negócio, os seus clientes e as lacunas. O sistema é desenhado antes de ser construído.",
      "Websites, email, pages and workflows are constructed — fast, precise, on-brand.": "Sites, email, páginas e fluxos são construídos — rápido, preciso, fiel à marca.",
      "Everything is wired together: forms, WhatsApp, CRM, analytics. One system, no leaks.": "Tudo fica ligado: formulários, WhatsApp, CRM, análises. Um sistema, sem falhas.",
      "We maintain, measure and evolve the system. Your digital business keeps compounding.": "Mantemos, medimos e evoluímos o sistema. O seu negócio digital continua a crescer.",
      "LET'S GO": "VAMOS LÁ",
      "NO TEMPLATES": "SEM TEMPLATES",
      "READY TO BUILD": "PRONTO PARA CONSTRUIR",
      "WHATSAPP US": "FALE NO WHATSAPP",
      "WE REPLY WITHIN 24H — USUALLY FASTER.": "RESPONDEMOS EM 24H — GERALMENTE MAIS RÁPIDO.",
      "GET IN TOUCH": "FALE CONNOSCO",
      "PROJECT INTAKE": "RECOLHA DE PROJETO",
      "Tell us what you need. We reply on WhatsApp within 24 hours.": "Diga-nos o que precisa. Respondemos no WhatsApp em 24 horas.",
      "PROJECT TYPE": "TIPO DE PROJETO",
      "YOUR NAME": "O SEU NOME",
      "EMAIL": "EMAIL",
      "WHATSAPP": "WHATSAPP",
      "PROJECT DETAILS": "DETALHES DO PROJETO",
      "SEND VIA WHATSAPP": "ENVIAR VIA WHATSAPP",
      "SEND VIA EMAIL": "ENVIAR VIA EMAIL",
      "WHATSAPP +258 87 977 1024": "WHATSAPP +258 87 977 1024",
      "LANDING PAGE": "LANDING PAGE",
      "CRM / SYSTEM": "CRM / SISTEMA",
      "FULL DIGITAL SYSTEM": "SISTEMA DIGITAL COMPLETO",
      "SOMETHING ELSE": "OUTRA COISA",
      "Full name": "Nome completo",
      "you@company.com": "voce@empresa.com",
      "+258 …": "+258 …",
      "A few lines about your project…": "Algumas linhas sobre o seu projeto…",
      "Your business, built for digital.": "O seu negócio, construído para o digital.",
      "MENU": "MENU",
      "WORK": "TRABALHO",
      "ABOUT": "SOBRE",
      "CONTACT": "CONTACTO",
      "SYSTEMS": "SISTEMAS",
      "BACK TO TOP": "VOLTAR AO TOPO",
      "← BACK TO HOME": "← VOLTAR AO INÍCIO",
      "SYSTEM MODULES": "MÓDULOS DO SISTEMA",
      "LIVE VIEW": "VISTA AO VIVO",
      "BUILD THIS SYSTEM": "CONSTRUIR ESTE SISTEMA",
      "STATUS — ONLINE": "ESTADO — ONLINE",
      "REFRESHED 12 SEC AGO": "ATUALIZADO HÁ 12 SEG",
      "REAL ESTATE SYSTEM": "SISTEMA <em>IMOBILIÁRIO</em>",
      "REAL ESTATE SYSTEM — VISUALIZA+": "SISTEMA IMOBILIÁRIO — VISUALIZA+",
      "SYSTEM 01 / REAL ESTATE": "SISTEMA 01 / IMOBILIÁRIO",
      "A digital engine for property: listings, leads, WhatsApp and a client pipeline in one system.": "Um motor digital para imóveis: listagens, leads, WhatsApp e um pipeline de clientes num só sistema.",
      "PROPERTY WEBSITE": "WEBSITE DE IMÓVEIS",
      "Listings with photos, maps and WhatsApp enquiry buttons on every property.": "Imóveis com fotos, mapas e botões de WhatsApp em cada propriedade.",
      "LEAD CAPTURE": "CAPTAÇÃO DE LEADS",
      "Every visitor becomes a lead. Contact forms route straight to your phone.": "Cada visitante torna-se um lead. Formulários vão diretos para o seu telemóvel.",
      "WHATSAPP PIPELINE": "PIPELINE WHATSAPP",
      "Buyers and sellers tracked in one thread. No lead left behind.": "Compradores e vendedores acompanhados num só fio. Nenhum lead fica para trás.",
      "CLIENT CRM": "CRM DE CLIENTES",
      "Every contact, viewing and offer structured in one record.": "Cada contacto, visita e proposta estruturados num único registo.",
      "Automatic follow-ups, reminders and updates while you work.": "Follow-ups, lembretes e atualizações automáticos enquanto trabalha.",
      "ACTIVE LISTINGS": "IMÓVEIS ATIVOS",
      "NEW LEADS": "NOVOS LEADS",
      "VIEWINGS": "VISITAS",
      "CLOSED": "FECHADOS",
      "HOSPITALITY SYSTEM": "SISTEMA <em>HOTELEIRO</em>",
      "HOSPITALITY SYSTEM — VISUALIZA+": "SISTEMA HOTELEIRO — VISUALIZA+",
      "SYSTEM 02 / HOSPITALITY": "SISTEMA 02 / HOTELARIA",
      "Rooms, bookings, guests and business email — one system that keeps every reservation in line.": "Quartos, reservas, hóspedes e email profissional — um sistema que mantém cada reserva alinhada.",
      "BOOKING WEBSITE": "WEBSITE DE RESERVAS",
      "Rooms with live availability and a booking form that lands in your inbox.": "Quartos com disponibilidade em tempo real e um formulário de reserva que cai no seu email.",
      "@yourlodge email for every confirmation and guest conversation.": "Email @oseuempreendimento para cada confirmação e conversa com hóspedes.",
      "GUEST MANAGEMENT": "GESTÃO DE HÓSPEDES",
      "Check-ins, extras and guest history in one place.": "Check-ins, extras e histórico de hóspedes num só lugar.",
      "WHATSAPP CONCIERGE": "CONCIERGE WHATSAPP",
      "Guests reach you where they already talk.": "Os hóspedes encontram-no onde já falam.",
      "Confirmations and reminders sent automatically.": "Confirmações e lembretes enviados automaticamente.",
      "ROOMS": "QUARTOS",
      "RESERVATIONS": "RESERVAS",
      "GUESTS": "HÓSPEDES",
      "OCCUPANCY": "OCUPAÇÃO",
      "CLINIC SYSTEM": "SISTEMA <em>DE CLÍNICA</em>",
      "CLINIC SYSTEM — VISUALIZA+": "SISTEMA DE CLÍNICA — VISUALIZA+",
      "SYSTEM 03 / CLINICS": "SISTEMA 03 / CLÍNICAS",
      "Appointments, patients and communication — a system that runs the front desk.": "Marcações, pacientes e comunicação — um sistema que trata da receção.",
      "CLINIC WEBSITE": "WEBSITE DA CLÍNICA",
      "Services, doctors and an appointment request form.": "Serviços, médicos e um formulário de pedido de marcação.",
      "APPOINTMENTS": "MARCAÇÕES",
      "Patients book; you confirm. The calendar never fights you.": "Os pacientes marcam; você confirma. O calendário nunca luta consigo.",
      "PATIENT COMMUNICATION": "COMUNICAÇÃO COM PACIENTES",
      "Reminders, results and follow-ups over WhatsApp.": "Lembretes, resultados e follow-ups pelo WhatsApp.",
      "RECORDS": "REGISTOS",
      "Patient history structured and private.": "Histórico do paciente estruturado e privado.",
      "No-shows drop; reminders go out; records stay clean.": "Faltas diminuem; lembretes saem; registos ficam limpos.",
      "PATIENTS": "PACIENTES",
      "REMINDERS": "LEMBRETES",
      "NO-SHOWS": "FALTAS",
      "PROFESSIONAL SERVICES SYSTEM": "SISTEMA <em>DE SERVIÇOS PROFISSIONAIS</em>",
      "PROFESSIONAL SERVICES SYSTEM — VISUALIZA+": "SISTEMA DE SERVIÇOS PROFISSIONAIS — VISUALIZA+",
      "SYSTEM 04 / PROFESSIONAL SERVICES": "SISTEMA 04 / SERVIÇOS PROFISSIONAIS",
      "A website, scheduling and business email that make your firm look the part.": "Um website, agendamento e email profissional que fazem a sua empresa parecer o que é.",
      "SERVICES WEBSITE": "WEBSITE DE SERVIÇOS",
      "Your offer, clearly presented. Built to convert enquiries.": "A sua oferta, apresentada com clareza. Construído para converter pedidos de informação.",
      "ENQUIRY FORMS": "FORMULÁRIOS DE PEDIDO",
      "Quotes and requests that land structured in your inbox.": "Orçamentos e pedidos que chegam estruturados ao seu email.",
      "SCHEDULING": "AGENDAMENTO",
      "Clients pick a time; your calendar stays controlled.": "Os clientes escolhem a hora; o seu calendário mantém-se sob controlo.",
      "Follow-ups and documents sent on time, every time.": "Follow-ups e documentos enviados a tempo, sempre.",
      "ENQUIRIES": "PEDIDOS",
      "QUOTES": "ORÇAMENTOS",
      "CLIENTS": "CLIENTES",
      "NEW": "NOVO",
      "VIEWING": "VISITA",
      "OFFER": "PROPOSTA",
      "FOLLOW-UP": "FOLLOW-UP",
      "CONFIRMED": "CONFIRMADO",
      "PENDING": "PENDENTE",
      "BOOKED": "RESERVADO",
      "CHECKED IN": "CHECK-IN FEITO",
      "APPT": "MARCAÇÃO",
      "REMINDED": "LEMBRADO",
      "SENT": "ENVIADO",
      "YOUR LISTINGS.": "OS SEUS IMÓVEIS.",
      "ONE SYSTEM.": "NUM SÓ SISTEMA.",
      "FULL HOUSE,": "LOTADO,",
      "ZERO STRESS.": "ZERO STRESS.",
      "THE FRONT DESK,": "A RECEÇÃO,",
      "AUTOMATED.": "AUTOMATIZADA.",
      "YOUR FIRM,": "A SUA EMPRESA,",
      "ONE ENGINE.": "UM MOTOR ÚNICO."
    }
  };

  /* ---------- language switcher ---------- */
  (function langSwitch() {
    var STORE_KEY = "vz-lang";
    var buttons = document.querySelectorAll(".lang-btn");
    var apply = function (lang) {
      var dict = VZ_I18N[lang] || VZ_I18N.en;
      document.documentElement.lang = lang;
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        if (dict[key] !== undefined) el.textContent = dict[key];
      });
      document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
        var key = el.getAttribute("data-i18n-html");
        if (dict[key] !== undefined) el.innerHTML = dict[key];
      });
      document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
        var parts = el.getAttribute("data-i18n-attr").split("|");
        var attr = parts[0];
        var key = parts.slice(1).join("|");
        if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
      buttons.forEach(function (b) {
        var active = b.getAttribute("data-lang") === lang;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };
    var current = "en";
    try { current = localStorage.getItem(STORE_KEY) || "en"; } catch (e) {}
    var param = new URLSearchParams(window.location.search).get("lang");
    if (param === "en" || param === "pt") {
      current = param;
      try { localStorage.setItem(STORE_KEY, param); } catch (e) {}
    }
    if (current !== "en" && current !== "pt") current = "en";
    apply(current);
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var lang = b.getAttribute("data-lang");
        try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
        apply(lang);
      });
    });
  })();

  /* ---------- get in touch modal ---------- */
  (function modal() {
    var wrap = document.getElementById("modalWrap");
    var form = document.getElementById("contactForm");
    if (!wrap) return;

    var open = function () {
      wrap.classList.add("open");
      wrap.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    var close = function () {
      wrap.classList.remove("open");
      wrap.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll("[data-open-modal]").forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    });
    document.querySelectorAll("[data-close-modal]").forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        close();
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && wrap.classList.contains("open")) close();
    });
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) close();
    });

    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    }
    function compose() {
      var lines = [];
      lines.push("*" + (VZ_I18N[document.documentElement.lang] || VZ_I18N.en)["PROJECT INTAKE"] + " — VISUALIZA+*");
      lines.push("");
      lines.push("" + (VZ_I18N[document.documentElement.lang] || VZ_I18N.en)["PROJECT TYPE"] + ": " + val("fType"));
      lines.push("" + (VZ_I18N[document.documentElement.lang] || VZ_I18N.en)["YOUR NAME"] + ": " + val("fName"));
      lines.push("" + (VZ_I18N[document.documentElement.lang] || VZ_I18N.en)["EMAIL"] + ": " + val("fEmail"));
      lines.push("" + (VZ_I18N[document.documentElement.lang] || VZ_I18N.en)["WHATSAPP"] + ": " + val("fWhats"));
      lines.push("" + (VZ_I18N[document.documentElement.lang] || VZ_I18N.en)["PROJECT DETAILS"] + ": " + val("fDetails"));
      lines.push("");
      lines.push("— visualiza.plus");
      return lines.join("\n");
    }
    function validate() {
      var ok = true;
      var checks = [["fName", "required"], ["fEmail", "email"], ["fDetails", "required"]];
      checks.forEach(function (c) {
        var el = document.getElementById(c[0]);
        if (!el) return;
        var bad = false;
        if (c[1] === "required") bad = !el.value.trim();
        if (c[1] === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        el.classList.toggle("error", bad);
        if (bad) ok = false;
      });
      return ok;
    }
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate()) return;
        var msg = compose();
        var href = "https://wa.me/258879771024?text=" + encodeURIComponent(msg);
        var win = window.open(href, "_blank");
        if (!win) {
          window.location.href = "mailto:hello@visualiza.plus?subject=" + encodeURIComponent("Novo Projeto — VISUALIZA+") + "&body=" + encodeURIComponent(msg);
        }
        close();
      });
      var emailBtn = document.getElementById("sendEmailBtn");
      if (emailBtn) {
        emailBtn.addEventListener("click", function () {
          if (!validate()) return;
          var msg = compose();
          window.location.href = "mailto:hello@visualiza.plus?subject=" + encodeURIComponent("Novo Projeto — VISUALIZA+") + "&body=" + encodeURIComponent(msg);
          close();
        });
      }
      ["fName", "fEmail", "fDetails"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("input", function () { el.classList.remove("error"); });
      });
    }
  })();

})();
