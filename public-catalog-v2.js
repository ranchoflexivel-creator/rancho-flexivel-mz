import { supabase } from "./data.js";

const $ = (s) => document.querySelector(s);
const text = (v) => typeof v === "string" ? v : (v?.pt || v?.en || v?.fr || v?.zh || v?.chg || Object.values(v || {})[0] || "");
const imageOf = (row) => row?.image_url || row?.image || row?.photo_url || row?.imageUrl || "";
const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const iconFor = (name) => { const n = norm(name); if (/arroz|cereal/.test(n)) return "rice_bowl"; if (/massa|pasta/.test(n)) return "ramen_dining"; if (/farinha|flour/.test(n)) return "bakery_dining"; if (/oleo|azeite|tempero|season/.test(n)) return "oil_barrel"; if (/leite|latic|breakfast|cafe|cha/.test(n)) return "emoji_food_beverage"; if (/conserv/.test(n)) return "inventory_2"; if (/molho|sauce/.test(n)) return "soup_kitchen"; if (/bebida|drink|agua|sumo|refriger/.test(n)) return "local_drink"; if (/higiene|limpeza|clean/.test(n)) return "cleaning_services"; if (/carne|meat/.test(n)) return "set_meal"; if (/frut|veget/.test(n)) return "nutrition"; return "shopping_basket"; };
const money = (v) => `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
let catalog = { products: [], categories: [], bundles: [] };

async function load() {
  const [products, categories, bundles] = await Promise.all([
    supabase.from("products").select("id,name,category_id,price,old_price,unit,image_url,image,photo_url,imageUrl,tag,stock,active,description,sort_order").order("sort_order", { ascending: true }),
    supabase.from("categories").select("id,name,icon,image_url,image,active,sort_order").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("bundles").select("id,name,description,price,product_ids,image_url,image,active,sort_order").eq("active", true).order("sort_order", { ascending: true })
  ]);
  if (!products.error) catalog.products = products.data || [];
  if (!categories.error) catalog.categories = categories.data || [];
  if (!bundles.error) catalog.bundles = bundles.data || [];
  patchProductImages();
  renderCategories();
  renderBundles();
}

function patchProductImages() {
  const grid = $("#productGrid");
  if (!grid || !catalog.products.length) return;
  const byId = new Map(catalog.products.map(p => [String(p.id), p]));
  grid.querySelectorAll("article").forEach(card => {
    const id = card.querySelector("[data-add]")?.dataset.add;
    const product = byId.get(String(id));
    const url = imageOf(product);
    if (!product || !url) return;
    let host = card.querySelector(".product-image,[data-product-image]") || card.firstElementChild;
    if (!host) return;
    host.classList.add("relative", "overflow-hidden");
    host.style.height = "180px";
    let img = host.querySelector("img");
    if (!img) { host.innerHTML = ""; img = document.createElement("img"); host.appendChild(img); }
    if (img.src !== url) img.src = url;
    img.alt = text(product.name);
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "absolute inset-0 w-full h-full object-cover";
  });
}

function renderCategories() {
  const root = $("#categories");
  if (!root || !catalog.categories.length) return;
  root.className = "category-scroll flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory";
  root.innerHTML = [{ id: "", name: "Todos" }, ...catalog.categories].map(category => {
    const name = text(category.name);
    const image = imageOf(category);
    const media = image ? `<img src="${image.replace(/"/g, "&quot;")}" alt="${name.replace(/"/g, "&quot;")}" loading="lazy" decoding="async" class="w-12 h-12 rounded-xl object-cover">` : `<span class="material-symbols-outlined text-3xl text-primary">${iconFor(name)}</span>`;
    return `<button type="button" data-cat="${String(category.id).replace(/"/g, "&quot;")}" class="shrink-0 min-w-[132px] snap-start bg-white border border-outline-variant hover:border-primary hover:shadow-md rounded-2xl px-4 py-3 flex flex-col items-center gap-2 font-semibold shadow-sm transition">${media}<span class="text-sm text-center leading-tight">${name}</span></button>`;
  }).join("");
  root.querySelectorAll("[data-cat]").forEach(button => button.onclick = () => {
    const filter = $("#categoryFilter");
    if (filter) filter.value = button.dataset.cat;
    $("#categoryFilter")?.dispatchEvent(new Event("change"));
    $("#produtos")?.scrollIntoView({ behavior: "smooth" });
  });
}

function renderBundles() {
  const root = $("#kitsGrid");
  if (!root) return;
  if (!catalog.bundles.length) { root.innerHTML = `<div class="col-span-full text-center py-10 text-on-surface-variant">Nenhum combo disponível.</div>`; return; }
  const products = new Map(catalog.products.map(p => [String(p.id), p]));
  root.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
  root.innerHTML = catalog.bundles.map(bundle => {
    const name = text(bundle.name) || "Combo do Mês";
    const image = imageOf(bundle);
    const ids = Array.isArray(bundle.product_ids) ? bundle.product_ids : [];
    const included = ids.map(id => products.get(String(id))).filter(Boolean);
    return `<article class="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"><div class="h-44 bg-surface-container-low overflow-hidden">${image ? `<img src="${image.replace(/"/g, "&quot;")}" alt="${name.replace(/"/g, "&quot;")}" loading="lazy" decoding="async" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-5xl text-outline">shopping_basket</span></div>`}</div><div class="p-4 flex flex-col flex-1"><span class="text-[10px] font-bold uppercase tracking-wider text-secondary">Combo do Mês</span><h3 class="text-lg font-bold mt-1">${name}</h3>${text(bundle.description) ? `<p class="text-xs text-on-surface-variant mt-2">${text(bundle.description)}</p>` : ""}<div class="mt-3 space-y-1 flex-1">${included.length ? included.map(p => `<div class="flex items-center justify-between gap-2 py-1 border-b border-outline-variant"><span class="text-xs truncate">${text(p.name)}</span><span class="text-xs font-semibold whitespace-nowrap">${money(p.price)}</span></div>`).join("") : `<div class="text-xs text-on-surface-variant">Produtos do combo a definir.</div>`}</div><div class="flex items-center justify-between gap-3 mt-4"><span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">${money(bundle.price)}</span><button type="button" data-combo-add="${String(bundle.id).replace(/"/g, "&quot;")}" class="py-2 px-3 rounded-xl bg-secondary-container text-white text-sm font-semibold hover:bg-secondary">Adicionar</button></div></div></article>`;
  }).join("");
  root.querySelectorAll("[data-combo-add]").forEach(button => button.onclick = () => {
    const bundle = catalog.bundles.find(b => String(b.id) === String(button.dataset.comboAdd));
    (Array.isArray(bundle?.product_ids) ? bundle.product_ids : []).forEach(id => {
      const productButton = document.querySelector(`#productGrid [data-add="${CSS.escape(String(id))}"]`);
      if (productButton && !productButton.disabled) productButton.click();
    });
  });
}

function start() {
  load().catch(error => console.warn("Catálogo público:", error));
  const grid = $("#productGrid");
  if (grid) new MutationObserver(() => requestAnimationFrame(patchProductImages)).observe(grid, { childList: true, subtree: true });
  setInterval(() => load().catch(() => {}), 15000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
