import { supabase } from "./data.js";

let products = [];
let settings = {};
let lastSignature = "";

const esc = value => String(value ?? "").replace(/[&<>\"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]));
const localized = value => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.pt || value.en || value.fr || value.zh || value.chg || Object.values(value)[0] || "";
};
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function load() {
  const [{ data: productRows }, { data: settingRows }] = await Promise.all([
    supabase.from("products").select("id,name,image_url,image,active,featured,stock").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("key,value")
  ]);
  products = productRows || [];
  settings = Object.fromEntries((settingRows || []).map(row => [row.key, row.value]));
  apply();
}

function productImage(product) {
  return product?.image_url || product?.image || "";
}

function findProductInCard(card) {
  const text = normalize(card.textContent);
  return products.find(p => {
    const name = normalize(localized(p.name));
    return name && text.includes(name);
  });
}

function applyProductImages() {
  const grid = document.querySelector("#productGrid");
  if (!grid || !products.length) return;

  grid.querySelectorAll(":scope > *").forEach(card => {
    const product = findProductInCard(card);
    const url = productImage(product);
    if (!product || !url) return;

    let img = card.querySelector("img");
    if (!img) {
      const placeholder = card.querySelector("[data-product-image], .product-image, .material-symbols-outlined");
      const host = placeholder?.closest("div") || card.firstElementChild;
      if (host) host.innerHTML = `<img src="${esc(url)}" alt="${esc(localized(product.name))}" class="w-full h-full object-cover" loading="lazy" referrerpolicy="no-referrer">`;
    } else if (img.src !== url) {
      img.src = url;
      img.alt = localized(product.name);
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
    }
  });
}

function applyFooterText() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  const text = settings.footer_text || settings.site_footer_text || "Do seu lar para a sua mesa: qualidade, conveniência e carinho em cada compra. Faça o seu rancho com confiança — nós cuidamos do resto.";
  let box = footer.querySelector("#rfFooterCreativeText");
  if (!box) {
    box = document.createElement("p");
    box.id = "rfFooterCreativeText";
    box.className = "max-w-2xl mx-auto mt-5 text-center text-sm leading-relaxed text-on-surface-variant";
    const copyright = footer.querySelector(".border-t");
    if (copyright) copyright.parentElement.insertBefore(box, copyright);
    else footer.appendChild(box);
  }
  if (box.textContent !== String(text)) box.textContent = String(text);
}

function apply() {
  const signature = JSON.stringify({ products: products.map(p => [p.id, productImage(p)]), footer: settings.footer_text || settings.site_footer_text || "" });
  if (signature === lastSignature) return;
  lastSignature = signature;
  applyProductImages();
  applyFooterText();
}

const observer = new MutationObserver(() => apply());
observer.observe(document.body, { childList: true, subtree: true });
load().catch(error => console.warn("Falha ao aplicar imagens/texto público:", error));
