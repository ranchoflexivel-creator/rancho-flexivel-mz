import { supabase } from "./data.js";

const localText = value => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.pt || value.en || value.fr || value.zh || value.chg || Object.values(value)[0] || "";
};
const imageOf = product => product?.image_url || product?.image || product?.photo_url || product?.imageUrl || "";
const norm = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const CACHE_KEY = "rf_public_product_images_v1";
let products = [];
let scheduled = false;

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
}
function writeCache(value) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch {}
}

async function loadProducts() {
  const cached = readCache();
  if (cached.length) {
    products = cached;
    apply();
    return;
  }
  const { data, error } = await supabase
    .from("products")
    .select("id,name,image_url,image,photo_url,imageUrl,active,stock,price,old_price")
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("Não foi possível carregar imagens dos produtos:", error);
    return;
  }
  products = data || [];
  if (products.length) writeCache(products);
  apply();
}

function productForCard(card) {
  const explicit = card.dataset.productId || card.querySelector("[data-product-id]")?.dataset.productId;
  if (explicit) {
    const product = products.find(item => String(item.id) === String(explicit));
    if (product) return product;
  }
  const title = card.querySelector("h3, [data-product-name]");
  const name = norm(card.dataset.productName || title?.textContent || "");
  if (!name) return null;
  return products.find(product => norm(localText(product.name)) === name) || null;
}

function apply() {
  const grid = document.querySelector("#productGrid");
  if (!grid || !products.length) return;
  [...grid.children].forEach(card => {
    const product = productForCard(card);
    const url = imageOf(product);
    if (!product || !url) return;
    let host = card.querySelector("[data-product-image], .product-image") || card.firstElementChild;
    if (!host) return;
    host.classList.add("relative", "overflow-hidden");
    host.style.height = "180px";
    host.style.minHeight = "180px";
    let img = host.querySelector("img");
    if (!img) {
      host.replaceChildren();
      img = document.createElement("img");
      host.appendChild(img);
    }
    if (img.src !== url) img.src = url;
    img.alt = localText(product.name);
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "absolute inset-0 w-full h-full object-cover";
  });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    apply();
  });
}

function watchGrid() {
  const grid = document.querySelector("#productGrid");
  if (!grid) return;
  const observer = new MutationObserver(schedule);
  observer.observe(grid, { childList: true });
  apply();
}

loadProducts().catch(error => console.warn("Erro nas imagens públicas:", error));
watchGrid();
import "./public-cart-ui-fix.js";
