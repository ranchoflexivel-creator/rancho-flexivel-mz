import { supabase } from "./data.js";

const $ = (selector) => document.querySelector(selector);
const text = (value) => typeof value === "string" ? value : (value?.pt || value?.en || value?.fr || value?.zh || value?.chg || Object.values(value || {})[0] || "");
const imageOf = (row) => row?.image_url || row?.image || row?.photo_url || row?.imageUrl || "";
const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const money = (value) => `${Number(value || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
const categoryIcon = (name) => {
  const n = normalize(name);
  if (n.includes("arroz") || n.includes("cereal")) return "rice_bowl";
  if (n.includes("massa") || n.includes("pasta")) return "ramen_dining";
  if (n.includes("farinha") || n.includes("flour")) return "bakery_dining";
  if (n.includes("leite") || n.includes("lactic") || n.includes("dairy") || n.includes("pequeno")) return "egg_alt";
  if (n.includes("bebida") || n.includes("drink")) return "local_drink";
  if (n.includes("higiene") || n.includes("limpeza") || n.includes("clean")) return "cleaning_services";
  if (n.includes("conserv")) return "inventory_2";
  if (n.includes("molho") || n.includes("tempero") || n.includes("season")) return "soup_kitchen";
  return "shopping_basket";
};

let data = { products: [], categories: [], bundles: [] };
let timer = null;

async function loadCatalog() {
  const [products, categories, bundles] = await Promise.allSettled([
    supabase.from("products").select("id,name,category_id,price,old_price,unit,image_url,image,photo_url,imageUrl,tag,stock,active,description,sort_order").order("sort_order", { ascending: true }),
    supabase.from("categories").select("id,name,icon,image_url,image,active,sort_order").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("bundles").select("id,name,description,price,product_ids,image_url,image,active,sort_order").eq("active", true).order("sort_order", { ascending: true })
  ]);
  data.products = products.status === "fulfilled" && !products.value.error ? (products.value.data || []) : [];
  data.categories = categories.status === "fulfilled" && !categories.value.error ? (categories.value.data || []) : [];
  data.bundles = bundles.status === "fulfilled" && !bundles.value.error ? (bundles.value.data || []) : [];
  renderCategories();
  renderProducts();
  renderBundles();
}

function renderCategories() {
  const root = $("#categories");
  if (!root || !data.categories.length) return;
  const items = [{ id: "", name: "Todos" }, ...data.categories];
  root.className = "category-scroll flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory";
  root.innerHTML = items.map((category, index) => {
    const name = text(category.name);
    const image = imageOf(category);
    const media = image
      ? `<img src="${image.replace(/"/g, '&quot;')}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" class="w-12 h-12 rounded-xl object-cover shrink-0">`
      : `<span class="material-symbols-outlined text-3xl text-primary">${categoryIcon(name)}</span>`;
    return `<button type="button" data-cat="${String(category.id).replace(/"/g, '&quot;')}" class="snap-start shrink-0 min-w-[132px] bg-white border border-outline-variant hover:border-primary hover:shadow-md rounded-2xl px-4 py-3 flex flex-col items-center gap-2 font-semibold shadow-sm transition">${media}<span class="text-sm text-center leading-tight">${name}</span></button>`;
  }).join("");
  root.querySelectorAll("[data-cat]").forEach(button => button.onclick = () => {
    const filter = $("#categoryFilter");
    if (filter) filter.value = button.dataset.cat;
    renderProducts();
    $("#produtos")?.scrollIntoView({ behavior: "smooth" });
  });
}

function renderProducts() {
  const root = $("#productGrid");
  if (!root || !data.products.length) return;
  const query = normalize($("#searchInput")?.value || "");
  const category = $("#categoryFilter")?.value || "";
  const sort = $("#sortFilter")?.value || "default";
  let list = data.products.filter(product => product.active !== false);
  if (query) list = list.filter(product => normalize(`${text(product.name)} ${text(product.description)} ${product.unit || ""} ${text(product.tag)}`).includes(query));
  if (category) list = list.filter(product => String(product.category_id) === String(category));
  if (sort === "priceAsc") list.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "priceDesc") list.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name") list.sort((a, b) => text(a.name).localeCompare(text(b.name), "pt"));
  if (!list.length) return;
  const categories = new Map(data.categories.map(category => [String(category.id), category]));
  root.innerHTML = list.map(product => {
    const image = imageOf(product);
    const available = product.active !== false && Number(product.stock ?? 1) > 0;
    const promo = Number(product.old_price) > Number(product.price);
    const name = text(product.name);
    return `<article class="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"><div class="h-48 bg-surface-container-low overflow-hidden relative">${image ? `<img src="${image.replace(/"/g, '&quot;')}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-5xl text-outline">image</span></div>`}${promo ? `<span class="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">PROMOÇÃO</span>` : ""}</div><div class="p-4 flex-1 flex flex-col"><div class="flex gap-2 flex-wrap">${product.tag && text(product.tag) ? `<span class="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded">${text(product.tag)}</span>` : ""}</div><h3 class="font-semibold mt-2">${name}</h3><p class="text-xs text-on-surface-variant mt-1">${text(product.description) || ""}</p><div class="flex items-end justify-between gap-3 mt-auto pt-4"><div><span class="text-xs text-on-surface-variant">${product.unit || ""}</span><div class="text-lg font-bold text-primary">${money(product.price)}</div>${promo ? `<del class="text-xs text-outline">${money(product.old_price)}</del>` : ""}</div><button type="button" data-add="${String(product.id).replace(/"/g, '&quot;')}" ${available ? "" : "disabled"} class="px-4 py-2.5 rounded-xl font-semibold ${available ? "bg-secondary-container text-white hover:bg-secondary" : "bg-surface-container text-outline cursor-not-allowed"}">${available ? "Adicionar" : "Indisponível"}</button></div></div></article>`;
  }).join("");
  root.querySelectorAll("[data-add]").forEach(button => button.onclick = () => {
    const id = button.dataset.add;
    const event = new CustomEvent("rf:add-product", { detail: { id } });
    window.dispatchEvent(event);
  });
}

function renderBundles() {
  const root = $("#kitsGrid");
  if (!root) return;
  if (!data.bundles.length) {
    root.innerHTML = `<div class="col-span-full text-center py-10 text-on-surface-variant">Nenhum combo disponível.</div>`;
    return;
  }
  const products = new Map(data.products.map(product => [String(product.id), product]));
  root.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
  root.innerHTML = data.bundles.map(bundle => {
    const image = imageOf(bundle);
    const name = text(bundle.name) || "Combo do Mês";
    const description = text(bundle.description);
    const ids = Array.isArray(bundle.product_ids) ? bundle.product_ids : [];
    const included = ids.map(id => products.get(String(id))).filter(Boolean);
    return `<article class="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"><div class="h-44 bg-surface-container-low overflow-hidden">${image ? `<img src="${image.replace(/"/g, '&quot;')}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-5xl text-outline">shopping_basket</span></div>`}</div><div class="p-4 flex flex-col flex-1"><span class="text-[10px] font-bold uppercase tracking-wider text-secondary">Combo do Mês</span><h3 class="text-lg font-bold mt-1">${name}</h3>${description ? `<p class="text-xs text-on-surface-variant mt-2">${description}</p>` : ""}<div class="mt-3 space-y-1 flex-1">${included.length ? included.map(product => `<div class="flex items-center justify-between gap-2 py-1 border-b border-outline-variant"><span class="text-xs truncate">${text(product.name)}</span><span class="text-xs font-semibold whitespace-nowrap">${money(product.price)}</span></div>`).join("") : `<div class="text-xs text-on-surface-variant">Produtos do combo a definir.</div>`}</div><div class="flex items-center justify-between gap-3 mt-4"><span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">${money(bundle.price)}</span><button type="button" data-bundle="${String(bundle.id).replace(/"/g, '&quot;')}" class="py-2 px-3 rounded-xl bg-secondary-container text-white text-sm font-semibold hover:bg-secondary">Adicionar</button></div></div></article>`;
  }).join("");
  root.querySelectorAll("[data-bundle]").forEach(button => button.onclick = () => {
    const bundle = data.bundles.find(item => String(item.id) === String(button.dataset.bundle));
    (Array.isArray(bundle?.product_ids) ? bundle.product_ids : []).forEach(id => window.dispatchEvent(new CustomEvent("rf:add-product", { detail: { id } })));
  });
}

window.addEventListener("rf:add-product", event => {
  const id = event.detail?.id;
  if (!id) return;
  const original = document.querySelector(`[data-add="${CSS.escape(String(id))}"]`);
  if (original && original !== event.target) original.click();
});

function start() {
  if (timer) clearInterval(timer);
  loadCatalog().catch(error => console.warn("Falha ao atualizar catálogo público:", error));
  timer = setInterval(() => loadCatalog().catch(() => {}), 15000);
  $("#searchInput")?.addEventListener("input", renderProducts);
  $("#categoryFilter")?.addEventListener("change", renderProducts);
  $("#sortFilter")?.addEventListener("change", renderProducts);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
