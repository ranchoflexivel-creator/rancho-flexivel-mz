import { supabase } from "./data.js";

// Public-only recovery layer. It does not modify the admin panel or its data.
(() => {
  const money = n => `${Number(n || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
  const text = v => typeof v === "string" ? v : (v?.pt || Object.values(v || {})[0] || "");
  const img = p => String(p?.image_url || p?.image || "").trim();
  const readCart = () => { try { return JSON.parse(localStorage.getItem("rf_cart") || "[]"); } catch { return []; } };
  const writeCart = cart => { localStorage.setItem("rf_cart", JSON.stringify(cart)); document.querySelector("#cartCount")?.replaceChildren(String(cart.reduce((s,x)=>s+Number(x.qty||0),0))); window.dispatchEvent(new StorageEvent("storage", { key:"rf_cart", newValue:JSON.stringify(cart) })); };
  const available = p => p && p.active !== false && !(Number.isFinite(Number(p.stock)) && Number(p.stock) <= 0);

  async function fetchRows(table, select) {
    try {
      const result = await Promise.race([
        supabase.from(table).select(select),
        new Promise(resolve => setTimeout(() => resolve({ data: [], error: new Error("timeout") }), 5000))
      ]);
      return result?.data || [];
    } catch { return []; }
  }

  function addProduct(p) {
    if (!available(p)) return;
    const cart = readCart();
    const key = String(p.id);
    const row = cart.find(x => String(x.id) === key);
    const item = { id:p.id, name:p.name, price:Number(p.price||0), old_price:Number(p.old_price||0), image_url:img(p), qty:Number(row?.qty||0)+1 };
    if (row) Object.assign(row, item); else cart.push(item);
    writeCart(cart);
    const toast = document.querySelector("#toast");
    if (toast) { toast.textContent = `${text(p.name)} adicionado ao pedido.`; toast.classList.remove("hidden"); setTimeout(()=>toast.classList.add("hidden"),1800); }
  }

  function bindProductButtons(products) {
    const byId = new Map(products.map(p=>[String(p.id),p]));
    document.querySelectorAll("#productGrid button[data-add]").forEach(btn => {
      const p = byId.get(String(btn.dataset.add));
      if (!p) return;
      btn.disabled = !available(p);
      btn.classList.toggle("rf-unavailable", !available(p));
      btn.onclick = e => { e.preventDefault(); e.stopImmediatePropagation(); addProduct(p); };
    });
  }

  function renderFallbackProducts(products) {
    const grid = document.querySelector("#productGrid");
    if (!grid || grid.children.length || !products.length) return;
    grid.innerHTML = products.map(p => {
      const name = text(p.name), description = text(p.description), unavailable = !available(p), source = img(p);
      return `<article class="bg-white rounded-2xl overflow-hidden border border-outline-variant shadow-sm"><div class="h-44 bg-surface-container-low overflow-hidden flex items-center justify-center">${source ? `<img src="${source.replace(/&/g,"&amp;").replace(/\"/g,"&quot;")}" alt="${name.replace(/\"/g,"&quot;")}" class="w-full h-full object-cover" loading="lazy">` : `<span class="text-5xl">🛒</span>`}</div><div class="p-4"><h3 class="font-bold text-sm leading-snug">${name}</h3><p class="text-xs text-on-surface-variant mt-1 line-clamp-2">${description}</p><div class="flex items-center justify-between gap-2 mt-3"><strong class="text-primary">${money(p.price)}</strong><button type="button" data-add="${p.id}" ${unavailable ? "disabled" : ""} class="px-3 py-2 rounded-xl bg-primary text-white font-semibold text-xs ${unavailable ? "rf-unavailable" : ""}">${unavailable ? "Indisponível" : "Adicionar"}</button></div></div></article>`;
    }).join("");
    bindProductButtons(products);
  }

  function keepButtonsAlive(products) {
    bindProductButtons(products);
    const grid = document.querySelector("#productGrid");
    if (grid && !grid.dataset.rfRepairObserver) {
      grid.dataset.rfRepairObserver = "1";
      new MutationObserver(() => bindProductButtons(products)).observe(grid,{childList:true,subtree:true});
    }
  }

  async function boot() {
    const products = await fetchRows("products", "id,name,description,category_id,price,old_price,unit,image_url,image,tag,stock,active,featured,sort_order");
    if (!products.length) return;
    window.__RF_PUBLIC_PRODUCTS_REPAIR__ = products;
    renderFallbackProducts(products);
    keepButtonsAlive(products);

    // Keep the public page synchronized with admin edits without touching admin.
    if (supabase?.channel) {
      supabase.channel("rf-public-runtime-repair-v1")
        .on("postgres_changes", { event:"*", schema:"public", table:"products" }, () => location.reload())
        .on("postgres_changes", { event:"*", schema:"public", table:"bundles" }, () => location.reload())
        .on("postgres_changes", { event:"*", schema:"public", table:"categories" }, () => location.reload())
        .on("postgres_changes", { event:"*", schema:"public", table:"site_settings" }, () => location.reload())
        .subscribe();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true }); else boot();
})();
