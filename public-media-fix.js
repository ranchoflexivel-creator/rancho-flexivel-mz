import { supabase } from "./data.js";

const text = value => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.pt || value.en || value.fr || value.zh || value.chg || Object.values(value)[0] || "";
};

const normalize = value => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const imageValue = product => product?.image_url || product?.image || product?.photo_url || product?.imageUrl || "";

let products = [];
let lastSignature = "";

async function loadProducts() {
  const { data, error } = await supabase.from("products").select("id,name,image_url,image,photo_url,imageUrl");
  if (error) {
    console.warn("Falha ao carregar imagens dos produtos:", error);
    return;
  }
  products = data || [];
  renderImages();
}

function findProduct(card) {
  const id = card.dataset.productId || card.querySelector("[data-product-id]")?.dataset.productId;
  if (id) {
    const byId = products.find(p => String(p.id) === String(id));
    if (byId) return byId;
  }
  const title = card.querySelector("h3, [data-product-name]");
  const name = normalize(card.dataset.productName || title?.textContent || "");
  if (!name) return null;
  return products.find(p => normalize(text(p.name)) === name) || null;
}

function renderImages() {
  const grid = document.querySelector("#productGrid");
  if (!grid || !products.length) return;

  const cards = [...grid.querySelectorAll(":scope > article")];
  const signature = cards.map(card => `${normalize(card.querySelector("h3")?.textContent)}:${card.querySelector("img")?.src || ""}`).join("|");
  if (signature === lastSignature) return;
  lastSignature = signature;

  cards.forEach(card => {
    const product = findProduct(card);
    const url = imageValue(product);
    if (!product || !url) return;

    let host = card.querySelector("[data-product-image], .product-image");
    if (!host) host = card.firstElementChild;
    if (!host) return;

    host.classList.add("relative", "overflow-hidden");
    host.classList.remove("text-xl");
    host.style.height = "180px";
    host.style.minHeight = "180px";

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
    img.className = "absolute inset-0 w-full h-full object-cover";
    img.style.display = "block";
  });
}

function watchGrid() {
  const grid = document.querySelector("#productGrid");
  if (!grid) {
    requestAnimationFrame(watchGrid);
    return;
  }

  const observer = new MutationObserver(() => requestAnimationFrame(renderImages));
  observer.observe(grid, { childList: true });
  renderImages();
}

loadProducts().catch(error => console.warn("Erro nas imagens públicas:", error));
watchGrid();
