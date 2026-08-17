import { supabase } from "./data.js";

// Public-only recovery layer. The admin panel and its data are not modified.
(() => {
  const money = n => `${Number(n || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
  const text = v => typeof v === "string" ? v : (v?.pt || Object.values(v || {})[0] || "");
  const img = p => String(p?.image_url || p?.image || p?.photo_url || p?.imageUrl || "").trim();
  const readCart = () => { try { return JSON.parse(localStorage.getItem("rf_cart") || "[]"); } catch { return []; } };
  const writeCart = cart => {
    localStorage.setItem("rf_cart", JSON.stringify(cart));
    const count = cart.reduce((s, x) => s + Number(x.qty || 0), 0);
    const el = document.querySelector("#cartCount");
    if (el) el.textContent = String(count);
    const sticky = document.querySelector("#rfStickyCartCount");
    if (sticky) sticky.textContent = `${count} ${count === 1 ? "produto selecionado" : "produtos selecionados"}`;
    window.dispatchEvent(new Event("rf-cart-updated"));
  };
  const available = p => !!p && p.active !== false && !(Number.isFinite(Number(p.stock)) && Number(p.stock) <= 0);

  async function fetchRows(table, select) {
    try {
      const result = await Promise.race([
        supabase.from(table).select(select),
        new Promise(resolve => setTimeout(() => resolve({ data: [], error: new Error("timeout") }), 7000))
      ]);
      return result?.data || [];
    } catch { return []; }
  }

  function addProduct(p) {
    if (!available(p)) return false;
    const cart = readCart();
    const key = String(p.id);
    const row = cart.find(x => String(x.id) === key);
    if (row) {
      row.qty = Number(row.qty || 0) + 1;
      Object.assign(row, { name: p.name, price: Number(p.price || 0), old_price: Number(p.old_price || 0), image_url: img(p) });
    } else {
      cart.push({ id: p.id, name: p.name, price: Number(p.price || 0), old_price: Number(p.old_price || 0), image_url: img(p), qty: 1 });
    }
    writeCart(cart);
    const toast = document.querySelector("#toast");
    if (toast) { toast.textContent = `${text(p.name)} adicionado ao pedido.`; toast.classList.remove("hidden"); clearTimeout(window.rfRepairToast); window.rfRepairToast = setTimeout(() => toast.classList.add("hidden"), 1800); }
    return true;
  }

  function renderProducts(products) {
    const grid = document.querySelector("#productGrid");
    if (!grid || !products.length) return;
    const current = [...grid.querySelectorAll("button[data-add]")].length;
    if (!current) {
      grid.innerHTML = products.map(p => {
        const name = text(p.name), description = text(p.description), unavailable = !available(p), source = img(p);
        const safe = v => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
        return `<article class="bg-white rounded-2xl overflow-hidden border border-outline-variant shadow-sm flex flex-col"><div class="h-44 bg-surface-container-low overflow-hidden flex items-center justify-center">${source ? `<img src="${safe(source)}" alt="${safe(name)}" class="w-full h-full object-cover" loading="lazy" decoding="async">` : `<span class="text-5xl">🛒</span>`}</div><div class="p-4 flex-1 flex flex-col"><h3 class="font-bold text-sm leading-snug">${safe(name)}</h3><p class="text-xs text-on-surface-variant mt-1 line-clamp-2">${safe(description)}</p><div class="flex items-center justify-between gap-2 mt-auto pt-4"><div><span class="text-lg font-bold text-primary">${money(p.price)}</span>${Number(p.old_price) > Number(p.price) ? `<del class="block text-xs text-outline">${money(p.old_price)}</del>` : ""}</div><button type="button" data-add="${safe(p.id)}" ${unavailable ? "disabled" : ""} class="px-3 py-2 rounded-xl bg-primary text-white font-semibold text-xs ${unavailable ? "rf-unavailable" : ""}">${unavailable ? "Indisponível" : "Adicionar"}</button></div></div></article>`;
      }).join("");
    }
    bindProductButtons(products);
  }

  function bindProductButtons(products) {
    const byId = new Map(products.map(p => [String(p.id), p]));
    document.querySelectorAll("#productGrid button[data-add]").forEach(btn => {
      const p = byId.get(String(btn.dataset.add));
      if (!p) return;
      btn.disabled = !available(p);
      btn.classList.toggle("rf-unavailable", !available(p));
    });
  }

  function openCart() {
    const drawer = document.querySelector("#cartDrawer");
    if (drawer) drawer.classList.remove("hidden");
    // Let the existing app render the drawer from localStorage when available.
    document.dispatchEvent(new Event("rf-cart-updated"));
  }

  function globalClickGuard(products) {
    document.addEventListener("click", e => {
      const add = e.target.closest?.("#productGrid button[data-add]");
      if (add) {
        const p = products.find(x => String(x.id) === String(add.dataset.add));
        if (!p || !available(p)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        addProduct(p);
        return;
      }
      const sticky = e.target.closest?.("#rfStickyCart button");
      if (sticky) { e.preventDefault(); e.stopImmediatePropagation(); openCart(); }
    }, true);
  }

  async function boot() {
    const products = await fetchRows("products", "id,name,description,category_id,price,old_price,unit,image_url,image,photo_url,imageUrl,tag,stock,active,featured,sort_order");
    if (!products.length) return;
    window.__RF_PUBLIC_PRODUCTS_REPAIR__ = products;
    window.__RF_PUBLIC_DATA__ = window.__RF_PUBLIC_DATA__ || {};
    window.__RF_PUBLIC_DATA__.products = products;

    // If the main app rendered products, replace only the media with the admin image.
    const hydrate = () => {
      const byId = new Map(products.map(p => [String(p.id), p]));
      document.querySelectorAll("#productGrid button[data-add]").forEach(btn => {
        const p = byId.get(String(btn.dataset.add));
        const card = btn.closest("article");
        if (!p || !card) return;
        const src = img(p);
        const media = card.firstElementChild;
        if (src && media && media.tagName !== "IMG") {
          media.className = "h-44 rounded-xl overflow-hidden bg-surface-container-low";
          media.innerHTML = `<img src="${String(src).replace(/\"/g,"&quot;").replace(/</g,"&lt;")}" alt="${text(p.name).replace(/\"/g,"&quot;")}" class="w-full h-full object-cover" loading="lazy" decoding="async">`;
        }
      });
      bindProductButtons(products);
    };

    renderProducts(products);
    hydrate();
    globalClickGuard(products);
    const grid = document.querySelector("#productGrid");
    if (grid) new MutationObserver(() => requestAnimationFrame(hydrate)).observe(grid, { childList: true, subtree: true });

    if (supabase?.channel) {
      supabase.channel("rf-public-runtime-repair-v2")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => location.reload())
        .on("postgres_changes", { event: "*", schema: "public", table: "bundles" }, () => location.reload())
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => location.reload())
        .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => location.reload())
        .subscribe();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();
