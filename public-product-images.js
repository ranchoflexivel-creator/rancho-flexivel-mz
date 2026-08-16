// Public-page lightweight enhancement layer.
// IMPORTANT: product data and images are already loaded by app.js from data.js.
// Do not query Supabase a second time here: duplicate media queries were making
// the public page slow and could race with the main product renderer.
import "./public-performance-fix.js";
import "./public-cart-ui-fix.js";
import "./public-checkout-fix.js";

(() => {
  const markImagesLazy = () => {
    document.querySelectorAll("#productGrid img, #kitsGrid img").forEach(img => {
      if (!img.loading) img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.dataset.rfImageError = "1";
      }, { once: true });
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
