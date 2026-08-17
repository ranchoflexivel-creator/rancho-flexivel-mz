// Public-page synchronization layer. The admin panel remains untouched.
import "./public-performance-fix.js?v=20260817";
import "./public-cart-ui-fix.js";
import "./public-checkout-fix.js";
import { supabase } from "./data.js";

(() => {
  const text = v => typeof v === "string" ? v : (v?.pt || Object.values(v || {})[0] || "");
  const imageUrl = p => String(p?.image_url || p?.image || "").trim();

  function hydrateProductImages() {
    const products = window.__RF_PUBLIC_DATA__?.products || [];
    if (!products.length) return;
    const byId = new Map(products.map(p => [String(p.id), p]));
    document.querySelectorAll("#productGrid [data-add]").forEach(button => {
      const product = byId.get(String(button.dataset.add));
      const card = button.closest("article");
      if (!product || !card) return;
      const src = imageUrl(product);
      if (!src) return;
      let media = card.querySelector(".rf-product-media");
      if (!media) { media = card.firstElementChild; if (!media) return; media.classList.add("rf-product-media"); }
      if (media.tagName === "IMG") return;
      media.className = "rf-product-media h-44 rounded-xl overflow-hidden bg-surface-container-low flex items-center justify-center";
      const img = document.createElement("img");
      img.src = src; img.alt = text(product.name); img.className = "w-full h-full object-cover"; img.loading = "lazy"; img.decoding = "async";
      media.replaceChildren(img);
    });
  }

  function hydrateComboNames() {
    const kits = window.__RF_PUBLIC_DATA__?.kits || [];
    if (!kits.length) return;
    const byId = new Map(kits.map(k => [String(k.id), k]));
    document.querySelectorAll("#kitsGrid [data-kit]").forEach(button => {
      const kit = byId.get(String(button.dataset.kit));
      const card = button.closest("article");
      if (!kit || !card) return;
      const title = card.querySelector("h3");
      if (!title) return;
      title.textContent = text(kit.name);
      title.classList.remove("truncate");
      title.classList.add("whitespace-normal", "break-words");
      title.style.cssText += ";overflow:visible;text-overflow:clip;white-space:normal";
      title.title = text(kit.name);
    });
  }

  function hydrate() {
    hydrateProductImages();
    hydrateComboNames();
  }

  let reloadTimer = null;
  function reloadPublicData() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      // Settings are deliberately invalidated before reload so an admin edit is
      // reflected immediately instead of being hidden by the 10-minute cache.
      try { localStorage.removeItem("rf_public_settings_v2"); } catch {}
      window.location.reload();
    }, 250);
  }

  function subscribeToAdminChanges() {
    if (!supabase?.channel) return;
    supabase
      .channel("rf-public-live-sync-v6")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, reloadPublicData)
      .on("postgres_changes", { event: "*", schema: "public", table: "bundles" }, reloadPublicData)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, reloadPublicData)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, reloadPublicData)
      .subscribe();
  }

  const boot = () => {
    hydrate();
    subscribeToAdminChanges();
    const observer = new MutationObserver(() => requestAnimationFrame(hydrate));
    ["#productGrid", "#kitsGrid"].forEach(selector => { const node = document.querySelector(selector); if (node) observer.observe(node, { childList: true, subtree: true }); });
    setTimeout(hydrate, 300);
    setTimeout(hydrate, 1200);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();
