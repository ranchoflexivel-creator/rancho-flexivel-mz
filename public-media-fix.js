import { supabase } from "./data.js";

const CACHE_KEY = "rf_product_media_v2";
const CACHE_TTL = 10 * 60 * 1000;
const text = value => typeof value === "string" ? value : (value?.pt || value?.en || value?.fr || value?.zh || value?.chg || Object.values(value || {})[0] || "");
const imageValue = product => product?.image_url || product?.image || product?.photo_url || product?.imageUrl || "";
let products = [];
let lastSignature = "";
let observerStarted = false;

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached?.savedAt && Date.now() - cached.savedAt < CACHE_TTL && Array.isArray(cached.products)) return cached.products;
  } catch {}
  return null;
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), products: data })); } catch {}
}

async function loadProducts() {
  const cached = readCache();
  if (cached) {
    products = cached;
    renderImages();
    return;
  }
  const { data, error } = await supabase.from("products").select("id,name,image_url,image,photo_url,imageUrl").eq("active", true);
  if (error) {
    console.warn("Falha ao carregar imagens dos produtos:", error);
    return;
  }
  products = data || [];
  writeCache(products);
  renderImages();
}

function findProduct(card) {
  const id = card.dataset.productId || card.querySelector("[data-product-id]")?.dataset.productId || card.querySelector("[data-add]")?.dataset.add;
  if (id) {
    const byId = products.find(p => String(p.id) === String(id));
    if (byId) return byId;
  }
  const title = card.querySelector("h3, [data-product-name]");
  const name = String(card.dataset.productName || title?.textContent || "").trim().toLowerCase();
  return name ? products.find(p => text(p.name).trim().toLowerCase() === name) : null;
}

function renderImages() {
  const grid = document.querySelector("#productGrid");
  if (!grid || !products.length) return;
  const cards = [...grid.querySelectorAll(":scope > article")].filter(card => !card.hasAttribute("data-rf-unavailable-demo"));
  const signature = cards.map(card => `${card.querySelector("[data-add]")?.dataset.add || ""}:${card.querySelector("img")?.src || ""}`).join("|");
  if (signature === lastSignature) return;
  lastSignature = signature;

  cards.forEach(card => {
    const product = findProduct(card);
    const url = imageValue(product);
    if (!product || !url) return;
    let host = card.querySelector("[data-product-image], .product-image") || card.firstElementChild;
    if (!host) return;

    host.className = `${host.className} relative overflow-hidden rounded-xl`.replace(/text-xl/g, "");
    host.style.height = "180px";
    host.style.minHeight = "180px";
    host.style.background = "#eef5f7";

    let img = host.querySelector("img");
    if (!img) {
      host.replaceChildren();
      img = document.createElement("img");
      host.appendChild(img);
    }
    if (img.src !== url) img.src = url;
    img.alt = text(product.name);
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]";
    img.style.display = "block";
    img.onerror = () => { img.style.display = "none"; };
  });
}

function watchGrid() {
  if (observerStarted) return;
  const grid = document.querySelector("#productGrid");
  if (!grid) return;
  observerStarted = true;
  const observer = new MutationObserver(() => requestAnimationFrame(renderImages));
  observer.observe(grid, { childList: true });
  renderImages();
}

const boot = () => {
  watchGrid();
  loadProducts().catch(error => console.warn("Erro nas imagens públicas:", error));
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
