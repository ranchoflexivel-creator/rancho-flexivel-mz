import { supabase } from "./data.js";

const CHECKOUT_MAP = {
  "body > header a:nth-of-type(2)": "checkout_back",
  "main > div.mb-6 h1": "checkout_title",
  "main > div.mb-6 p": "checkout_intro",
  "main > .grid > section:nth-child(1) h2": "checkout_customer",
  "#checkoutForm legend": "checkout_substitution",
  "#checkoutForm fieldset label:nth-of-type(1) b": "contact",
  "#checkoutForm fieldset label:nth-of-type(2) b": "equivalent",
  "#checkoutForm fieldset label:nth-of-type(3) b": "noReplace",
  "#send": "finish",
  "main > .grid > section:nth-child(2) h2": "order",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(1)": "products",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(2)": "saving",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(3)": "service",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(4)": "total"
};

const STATIC_MAP = {
  ".rf-footer-brand": "footer_title",
  ".rf-footer-grid > div:nth-child(2) .rf-footer-label": "footer_whatsapp_label",
  ".rf-footer-grid > div:nth-child(3) .rf-footer-label": "footer_delivery_label",
  ".rf-footer-grid > div:nth-child(3) .rf-footer-text": "footer_delivery",
  "#footerMessage": "footer_text",
  ".rf-footer-bottom span:last-child": "footer_bottom_tagline"
};

const LANGUAGES = [
  ["pt", "Português"],
  ["en", "English"],
  ["zh", "中文"],
  ["fr", "Français"],
  ["chg", "Changana"]
];

let content = {};
let settings = {};
let loaded = false;

function parse(value) {
  if (value == null) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function getText(key, lang, fallback = "") {
  const value = content?.[lang]?.[key];
  return value == null || value === "" ? fallback : String(value);
}

function applyElement(el, key, lang) {
  if (!el) return;
  const fallback = el.dataset.rfDefaultText || el.textContent.trim();
  if (!el.dataset.rfDefaultText) el.dataset.rfDefaultText = fallback;
  // Conteúdo editável do painel é a fonte principal em português.
  // Nos outros idiomas, o app.js mantém a tradução nativa da página.
  if (lang === "pt") el.textContent = getText(key, lang, fallback);
}

function applyPlaceholder(selector, key, lang) {
  if (lang !== "pt") return;
  const el = document.querySelector(selector);
  if (!el) return;
  const fallback = el.dataset.rfDefaultPlaceholder || el.placeholder || "";
  if (!el.dataset.rfDefaultPlaceholder) el.dataset.rfDefaultPlaceholder = fallback;
  el.placeholder = getText(key, lang, fallback);
}

function realWhatsApp() {
  const value = settings.whatsapp_number || settings.whatsapp_phone || settings.whatsapp || "";
  if (typeof value === "object") {
    return String(value.number || value.phone || value.value || "").trim();
  }
  return String(value || "").trim();
}

function applyWhatsAppNumber() {
  const number = realWhatsApp();
  if (!number) return;
  const clean = number.replace(/\D/g, "");
  const display = number;
  document.querySelectorAll("footer p, footer div").forEach((el) => {
    const text = el.textContent.trim();
    if (text === "Número do WhatsApp" || text === "Número do WhatsAppp") {
      el.textContent = display;
    }
  });
  document.querySelectorAll("[data-whatsapp-number]").forEach((el) => {
    el.textContent = display;
    if (el.tagName === "A" && clean) el.href = `https://wa.me/${clean}`;
  });
}

function ensureLanguageSelector() {
  if (document.querySelector("#rf-language-select")) return;
  const existing = document.querySelector("#languageSelect");
  if (existing) return;

  const header = document.querySelector("header");
  if (!header) return;

  const host = header.querySelector(".flex.items-center.gap-2") || header.querySelector("nav") || header;
  const select = document.createElement("select");
  select.id = "rf-language-select";
  select.setAttribute("aria-label", "Idioma");
  select.className = "border border-outline-variant rounded-full px-3 py-2 text-xs bg-white font-semibold ml-2";
  select.innerHTML = LANGUAGES.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  select.value = localStorage.getItem("rf_lang") || "pt";

  select.addEventListener("change", (event) => {
    const lang = event.target.value;
    localStorage.setItem("rf_lang", lang);
    document.documentElement.lang = lang === "chg" ? "pt" : lang;
    // O app.js já contém as traduções completas da interface pública.
    // Recarregar garante que todos os textos dinâmicos e estáticos acompanhem o idioma.
    location.reload();
  });

  host.prepend(select);
}

function applyContent() {
  const lang = localStorage.getItem("rf_lang") || "pt";

  ensureLanguageSelector();

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    applyElement(el, el.dataset.i18n, lang);
  });

  if (lang === "pt") {
    Object.entries(STATIC_MAP).forEach(([selector, key]) => {
      document.querySelectorAll(selector).forEach((el) => applyElement(el, key, lang));
    });
  }

  if (/checkout(?:\.html)?$/.test(location.pathname)) {
    Object.entries(CHECKOUT_MAP).forEach(([selector, key]) => {
      document.querySelectorAll(selector).forEach((el) => applyElement(el, key, lang));
    });
    applyPlaceholder("#name", "checkout_name_placeholder", lang);
    applyPlaceholder("#phone", "checkout_phone_placeholder", lang);
    applyPlaceholder("#address", "checkout_address_placeholder", lang);
    applyPlaceholder("#notes", "checkout_notes_placeholder", lang);
  }

  applyWhatsAppNumber();
  document.documentElement.lang = lang === "chg" ? "pt" : lang;
}

async function loadContent() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value");
    if (error) throw error;
    const rows = data || [];
    settings = Object.fromEntries(rows.map((row) => [row.key, parse(row.value)]));
    content = settings.public_i18n || {};
  } catch (error) {
    console.warn("Conteúdo editável do site indisponível; mantendo conteúdo padrão:", error);
    content = {};
    settings = {};
  }
  loaded = true;
  applyContent();
}

const observer = new MutationObserver(() => {
  if (loaded) applyContent();
});

loadContent().finally(() => {
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("storage", (event) => {
    if (event.key === "rf_lang") applyContent();
  });
});

export { applyContent, loadContent };
