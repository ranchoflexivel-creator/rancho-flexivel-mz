import { supabase } from "./data.js";

let products = [];
let settings = {};

const localized = value => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.pt || value.en || value.fr || value.zh || value.chg || Object.values(value)[0] || "";
};

const imageValue = product => product?.image_url || product?.image || product?.photo_url || product?.imageUrl || "";

async function load() {
  const [{ data: productRows, error: productError }, { data: settingRows }] = await Promise.all([
    supabase.from("products").select("*").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("key,value")
  ]);
  if (productError) console.warn("Falha ao carregar imagens dos produtos:", productError);
  products = productRows || [];
  settings = Object.fromEntries((settingRows || []).map(row => [row.key, row.value]));
  applyAll();
}

function findProduct(card) {
  const id = card.dataset.productId || card.querySelector("[data-product-id]")?.dataset.productId;
  if (id) return products.find(p => String(p.id) === String(id));
  const name = localized(card.dataset.productName || card.textContent).trim().toLowerCase();
  return products.find(p => localized(p.name).trim().toLowerCase() && name.includes(localized(p.name).trim().toLowerCase()));
}

function applyProductImages() {
  const grid = document.querySelector("#productGrid");
  if (!grid || !products.length) return;
  [...grid.children].forEach(card => {
    const product = findProduct(card);
    const url = imageValue(product);
    if (!product || !url) return;
    let img = card.querySelector("img");
    if (!img) {
      const host = card.querySelector("[data-product-image], .product-image") || card.firstElementChild;
      if (!host) return;
      host.innerHTML = "";
      img = document.createElement("img");
      host.appendChild(img);
    }
    img.src = url;
    img.alt = localized(product.name);
    img.loading = "lazy";
    img.className = "w-full h-full object-cover";
    img.onerror = () => { img.style.display = "none"; };
  });
}

function applyFooterText() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  const value = settings.footer_text || settings.site_footer_text || "Do seu lar para a sua mesa: qualidade, conveniência e carinho em cada compra. Faça o seu rancho com confiança — nós cuidamos do resto.";
  let box = footer.querySelector("#rfFooterCreativeText");
  if (!box) {
    box = document.createElement("p");
    box.id = "rfFooterCreativeText";
    box.className = "max-w-3xl mx-auto mt-5 px-4 text-center text-sm leading-relaxed text-on-surface-variant";
    const border = footer.querySelector(".border-t");
    if (border?.parentElement) border.parentElement.insertBefore(box, border);
    else footer.appendChild(box);
  }
  box.textContent = String(value);
}

function applyAll() {
  applyProductImages();
  applyFooterText();
}

const observer = new MutationObserver(() => applyAll());
observer.observe(document.body, { childList: true, subtree: true });
load().catch(error => console.warn("Falha ao aplicar correções públicas:", error));
