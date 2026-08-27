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

  /* ---------- i18n dictionary ---------- */
  var VZ_I18N = {
    en: {
      "VISUALIZA+ — Your business, built for digital.": "VISUALIZA+ — Your business, built for digital.",
      "Visualiza+ builds digital infrastructure for businesses — websites, domains, business email, landing pages, automation, CRM and custom digital systems.": "Visualiza+ builds digital infrastructure for businesses — websites, domains, business email, landing pages, automation, CRM and custom digital systems.",
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
      "VISUALIZA+ — Your business, built for digital.": "VISUALIZA+ — O seu negócio, construído para o digital.",
      "Visualiza+ builds digital infrastructure for businesses — websites, domains, business email, landing pages, automation, CRM and custom digital systems.": "A Visualiza+ constrói infraestrutura digital para negócios — websites, domínios, email profissional, landing pages, automação, CRM e sistemas digitais personalizados.",
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
        b.classList.toggle("active", b.getAttribute("data-lang") === lang);
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
