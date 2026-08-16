import { supabase } from "./data.js";

let settings = {};

async function loadSettings() {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) {
    console.warn("Não foi possível carregar configurações públicas:", error);
    return;
  }
  settings = Object.fromEntries((data || []).map(row => [row.key, row.value]));
  applyPublicSettings();
}

const setting = (key, fallback = "") => {
  const value = settings[key];
  return value === undefined || value === null || String(value).trim() === "" ? fallback : value;
};

const money = value => `${Number(value || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MZN`;

function applyDeliveryCards() {
  const section = [...document.querySelectorAll("section")].find(s => s.querySelector('[data-i18n="deliveryText"]'));
  if (!section) return;
  const cards = section.querySelectorAll(".delivery-card");
  const values = [
    setting("delivery_maputo", 400),
    setting("delivery_zonas", 700),
    setting("delivery_matola", 1000),
    setting("delivery_pickup", 0)
  ];
  cards.forEach((card, index) => {
    const price = card.querySelector(".text-2xl");
    if (!price) return;
    price.textContent = Number(values[index]) === 0 ? "Grátis" : money(values[index]);
  });
}

function applyFaq() {
  const faq = document.querySelector("#faq");
  if (!faq) return;
  const questions = [1,2,3,4].map(i => ({
    q: setting(`faq_q${i}`, ""),
    a: setting(`faq_a${i}`, "")
  })).filter(x => x.q || x.a);
  if (!questions.length) return;

  const label = document.querySelector('[data-i18n="faqLabel"]');
  const title = document.querySelector('[data-i18n="faqTitle"]');
  if (label) label.textContent = setting("faq_label", "Dúvidas frequentes");
  if (title) title.textContent = setting("faq_title", "Perguntas frequentes");

  faq.innerHTML = questions.map(item => `<details class="bg-surface-container-low rounded-xl p-4"><summary class="font-semibold cursor-pointer">${escapeHtml(item.q)}</summary><p class="text-sm text-on-surface-variant mt-2">${escapeHtml(item.a)}</p></details>`).join("");
}

function applyCheckoutDelivery() {
  const select = document.querySelector('#rfCheckoutModal select[name="delivery"]');
  if (!select) return;
  const values = [
    ["Maputo Cidade", Number(setting("delivery_maputo", 400))],
    ["Zonas Circunvizinhas", Number(setting("delivery_zonas", 700))],
    ["Matola", Number(setting("delivery_matola", 1000))],
    ["Levantamento Gratis", Number(setting("delivery_pickup", 0))]
  ];
  const current = select.value;
  select.innerHTML = `<option value="">Seleccione Forma de entrega *</option>` + values.map(([name, fee]) => `<option value="${name}">${name} — ${fee === 0 ? "Grátis" : money(fee)}</option>`).join("");
  if (values.some(([name]) => name === current)) select.value = current;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[m]));
}

function applyPublicSettings() {
  applyDeliveryCards();
  applyFaq();
  applyCheckoutDelivery();
}

const observer = new MutationObserver(() => applyPublicSettings());
observer.observe(document.body, { childList: true, subtree: true });

loadSettings();
