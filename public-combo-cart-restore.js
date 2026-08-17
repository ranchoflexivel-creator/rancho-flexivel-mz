import { supabase } from "./data.js";

const $ = (s) => document.querySelector(s);
const text = (v) => typeof v === "string" ? v : (v?.pt || v?.en || v?.fr || v?.zh || v?.chg || Object.values(v || {})[0] || "");
const money = (v) => `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
const imageOf = (row) => row?.image_url || row?.image || row?.photo_url || row?.imageUrl || "";

function openCart() {
  const drawer = $("#cartDrawer");
  if (!drawer) return;
  drawer.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}
function closeCart() {
  const drawer = $("#cartDrawer");
  if (!drawer) return;
  drawer.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}
function wireCart() {
  const btn = $("#cartBtn");
  if (btn && btn.dataset.rfCartRestore !== "1") {
    btn.dataset.rfCartRestore = "1";
    btn.addEventListener("click", () => setTimeout(() => {
      const drawer = $("#cartDrawer");
      if (drawer && drawer.classList.contains("hidden")) openCart();
    }, 0));
  }
  const close = $("#closeCart");
  if (close && close.dataset.rfCartRestore !== "1") { close.dataset.rfCartRestore = "1"; close.addEventListener("click", closeCart); }
  const overlay = $("#cartOverlay");
  if (overlay && overlay.dataset.rfCartRestore !== "1") { overlay.dataset.rfCartRestore = "1"; overlay.addEventListener("click", closeCart); }
}

function ensureStickyCart() {
  if ($("#rfStickyCart")) return;
  const style = document.createElement("style");
  style.textContent = `#rfStickyCart{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:45;width:min(620px,calc(100% - 24px));display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.98);border:1px solid #c1c9bf;border-radius:18px;padding:10px 12px 10px 16px;box-shadow:0 12px 35px rgba(0,0,0,.16)}#rfStickyCart .rf-sticky-count{font-weight:800;color:#00361a;font-size:14px}#rfStickyCart button{border:0;background:#fd9d27;color:#fff;border-radius:12px;padding:10px 16px;font-weight:800;display:flex;align-items:center;gap:8px;cursor:pointer}@media(max-width:480px){#rfStickyCart{bottom:8px}.rf-sticky-count{font-size:12px!important}#rfStickyCart button{padding:9px 12px!important;font-size:13px}}body{padding-bottom:82px}`;
  document.head.appendChild(style);
  const bar = document.createElement("div");
  bar.id = "rfStickyCart";
  bar.innerHTML = '<div class="rf-sticky-count" id="rfStickyCartCount">0 produtos selecionados</div><button type="button"><span class="material-symbols-outlined">shopping_cart</span><span>Ver pedido</span></button>';
  document.body.appendChild(bar);
  bar.querySelector("button").addEventListener("click", openCart);
}
function updateSticky() {
  const count = Number($("#cartCount")?.textContent || 0);
  const el = $("#rfStickyCartCount");
  if (el) el.textContent = `${count} ${count === 1 ? "produto selecionado" : "produtos selecionados"}`;
}

async function renderCombos() {
  const root = $("#kitsGrid");
  if (!root) return;
  const [{ data: bundles }, { data: products }] = await Promise.all([
    supabase.from("bundles").select("id,name,description,price,product_ids,image_url,image,active,sort_order").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("products").select("id,name,price,image_url,image,photo_url,imageUrl,active,stock").order("sort_order", { ascending: true })
  ]);
  const combos = bundles || [];
  const byId = new Map((products || []).map(p => [String(p.id), p]));
  if (!combos.length) { root.innerHTML = '<div class="col-span-full text-center py-10 text-on-surface-variant">Nenhum combo disponível.</div>'; return; }
  root.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
  root.innerHTML = combos.map(bundle => {
    const name = text(bundle.name) || "Combo do Mês";
    const desc = text(bundle.description);
    const ids = Array.isArray(bundle.product_ids) ? bundle.product_ids : [];
    const included = ids.map(id => byId.get(String(id))).filter(Boolean);
    const image = imageOf(bundle) || imageOf(included[0]);
    const list = included.length ? included.map(p => `<li class="flex gap-2 items-start text-xs"><span class="material-symbols-outlined text-sm text-secondary">check_circle</span><span>${text(p.name)}${p.price ? ` — ${money(p.price)}` : ""}</span></li>`).join("") : '<li class="text-xs text-on-surface-variant">Produtos do combo a definir.</li>';
    return `<article class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-outline-variant"><div class="h-44 bg-surface-container-low overflow-hidden">${image ? `<img src="${image.replace(/"/g,"&quot;")}" alt="${name.replace(/"/g,"&quot;")}" loading="lazy" decoding="async" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-5xl text-outline">shopping_basket</span></div>'}</div><div class="p-4 flex flex-col flex-1"><span class="text-[10px] font-bold uppercase tracking-wider text-secondary">Combo do Mês</span><h3 class="text-lg font-bold mt-1">${name}</h3>${desc ? `<p class="text-sm text-on-surface-variant mt-2 leading-relaxed">${desc}</p>` : ""}<div class="mt-3 flex-1"><p class="text-xs font-bold text-primary mb-2">Este combo inclui:</p><ul class="space-y-1.5">${list}</ul></div><div class="flex items-center justify-between gap-3 mt-4"><span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">${money(bundle.price)}</span><button type="button" data-combo-add-restore="${String(bundle.id).replace(/"/g,"&quot;")}" class="py-2 px-3 rounded-xl bg-secondary-container text-white text-sm font-semibold">Adicionar</button></div></div></article>`;
  }).join("");
  root.querySelectorAll("[data-combo-add-restore]").forEach(btn => btn.addEventListener("click", () => {
    const combo = combos.find(x => String(x.id) === String(btn.dataset.comboAddRestore));
    (Array.isArray(combo?.product_ids) ? combo.product_ids : []).forEach(id => {
      const add = document.querySelector(`#productGrid [data-add="${CSS.escape(String(id))}"]`);
      if (add && !add.disabled) add.click();
    });
    updateSticky();
  }));
}

function boot() {
  ensureStickyCart();
  wireCart();
  updateSticky();
  const count = $("#cartCount");
  if (count) new MutationObserver(updateSticky).observe(count, { childList: true, characterData: true, subtree: true });
  renderCombos().catch(e => console.warn("Combos públicos:", e));
  setTimeout(wireCart, 500);
  setTimeout(updateSticky, 700);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
