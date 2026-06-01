(function () {
  "use strict";

  /* ── REVEAL ── */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ── NAV ACTIVE ── */
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === currentPage) a.classList.add("active");
  });

  /* ── SMOOTH SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); }
    });
  });

  /* ── NAV BORDER ON SCROLL ── */
  const nav = document.querySelector("nav");
  if (nav) {
    window.addEventListener("scroll", () => {
      nav.style.borderBottomColor = window.scrollY > 40
        ? "rgba(200,169,110,0.22)"
        : "rgba(200,169,110,0.1)";
    }, { passive: true });
  }

  /* ── MOBILE TOGGLE ── */
  const toggle = document.querySelector(".nav-mobile-toggle");
  const links  = document.querySelector(".nav-links");
  if (toggle && links) {
    let open = false;
    toggle.addEventListener("click", () => {
      open = !open;
      if (open) {
        links.style.cssText = "display:flex;flex-direction:column;position:fixed;top:72px;left:0;right:0;background:rgba(12,12,12,0.98);padding:28px 44px;border-bottom:1px solid #1E2330;gap:22px;z-index:199;";
      } else {
        links.style.cssText = "display:none;";
      }
    });
  }
})();
