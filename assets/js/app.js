/* ============================================================
   سلوك واجهة المستخدم المشترك بين جميع صفحات الكتاب
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Theme (light/dark) ---------------- */
  const THEME_KEY = "physicsbook-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      const isDark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      btn.setAttribute("aria-pressed", String(isDark));
    });
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  });

  /* ---------------- Mobile nav ---------------- */
  const navToggle = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("is-open");
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => navLinks.classList.remove("is-open"))
    );
  }

  /* ---------------- Reading progress bar ---------------- */
  const progressFill = document.querySelector("[data-progress-fill]");
  function updateProgress() {
    if (!progressFill) return;
    const h = document.documentElement;
    const scrollTop = h.scrollTop || document.body.scrollTop;
    const scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressFill.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll(".reveal, .reveal-scale");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------- Accordion cards (examples / questions) ----------------
     Cards must size to their own content, never a guessed fixed number, so
     the open transition animates to the body's real measured height
     (scrollHeight) instead of relying on a large fixed max-height ceiling. */
  const accordionBodies = [];

  document.querySelectorAll("[data-accordion]").forEach((card) => {
    const head = card.querySelector("[data-accordion-head]");
    const body = card.querySelector(".ex-card__body, .q-card__body");
    if (!head || !body) return;

    function setOpen(open) {
      card.classList.toggle("is-open", open);
      head.setAttribute("aria-expanded", String(open));
      body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
    }

    head.addEventListener("click", () => setOpen(!card.classList.contains("is-open")));
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setOpen(!card.classList.contains("is-open"));
      }
    });

    card._pbSetOpen = setOpen;
    accordionBodies.push({ card, body });
  });

  window.PB_expandAll = function (open) {
    document.querySelectorAll("[data-accordion]").forEach((card) => {
      if (card._pbSetOpen) card._pbSetOpen(open);
    });
  };

  // Keep open cards correctly sized if their content reflows — e.g. text
  // rewraps on resize, or the web font swaps in after first paint.
  function resyncOpenAccordions() {
    accordionBodies.forEach(({ card, body }) => {
      if (card.classList.contains("is-open")) {
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  }
  window.addEventListener("resize", resyncOpenAccordions, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resyncOpenAccordions);
  }

  /* ---------------- TOC scrollspy (desktop) + mobile select ---------------- */
  const sections = Array.from(document.querySelectorAll("[data-lesson-section]"));
  const tocLinks = Array.from(document.querySelectorAll("[data-toc-link]"));
  const mobileSelect = document.querySelector("[data-toc-select]");

  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          if (entry.isIntersecting) {
            tocLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
            if (mobileSelect && mobileSelect.value !== id) mobileSelect.value = id;
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  if (mobileSelect) {
    mobileSelect.addEventListener("change", () => {
      const target = document.getElementById(mobileSelect.value);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------------- Jump-to-top FAB ---------------- */
  const fab = document.querySelector("[data-jump-fab]");
  if (fab) {
    window.addEventListener(
      "scroll",
      () => {
        fab.classList.toggle("is-visible", window.scrollY > 700);
      },
      { passive: true }
    );
    fab.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
})();
