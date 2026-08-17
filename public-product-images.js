// Public-page lightweight enhancement layer.
// Keep the main app as the primary renderer; the resilience module recovers
// the catalogue when a slow network or delayed app boot leaves sections empty.
import "./public-performance-fix.js?v=20260817";
import "./public-cart-ui-fix.js";
import "./public-checkout-fix.js";

(() => {
  const markImagesLazy = () => {
    document.querySelectorAll("#productGrid img, #kitsGrid img").forEach(img => {
      img.loading = "lazy";
      img.decoding = "async";
    });
  };
  const boot = () => {
    markImagesLazy();
    const grid = document.querySelector("#productGrid");
    const kits = document.querySelector("#kitsGrid");
    if (!window.MutationObserver || (!grid && !kits)) return;
    const observer = new MutationObserver(() => requestAnimationFrame(markImagesLazy));
    if (grid) observer.observe(grid, { childList: true });
    if (kits) observer.observe(kits, { childList: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
