import { supabase } from "./data.js";

const LANGS = ["pt", "en", "zh", "fr", "chg"];
const CHECKOUT_MAP = {
  "body > header a:nth-of-type(2)": "checkout_back",
  "main h1": "checkout_title",
  "main > div.mb-6 p": "checkout_intro",
  "section h2": "checkout_customer",
  "label:nth-of-type(1)": "checkout_full_name",
  "label:nth-of-type(2)": "checkout_phone",
  "label:nth-of-type(3)": "checkout_delivery",
  "label:nth-of-type(4)": "checkout_address",
  "label:nth-of-type(5)": "checkout_payment",
  "#paymentInfo > div:first-child": "checkout_payment_info",
  "legend": "checkout_substitution",
  "button[type=submit]": "checkout_finish"
};

const STATIC_MAP = {
  ".rf-footer-brand": "footer_title",
  ".rf-footer-grid > div:nth-child(2) .rf-footer-label": "footer_whatsapp_label",
  ".rf-footer-grid > div:nth-child(3) .rf-footer-label": "footer_delivery_label",
  ".rf-footer-grid > div:nth-child(3) .rf-footer-text": "footer_delivery",
  "#footerMessage": "footer_text",
  ".rf-footer-bottom span:last-child": "footer_bottom_tagline"
};

let content = {};
let loaded = false;

function parse(value) {
  if (value == null) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getText(key, lang, fallback = "") {
  const value = content?.[lang]?.[key];
  return value == null || value === "" ? fallback : String(value);
}

function applyElement(el, key, lang) {
  if (!el) return;
  const fallback = el.dataset.rfDefaultText || el.textContent.trim();
  if (!el.dataset.rfDefaultText) el.dataset.rfDefaultText = fallback;
  const value = getText(key, lang, fallback);
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    el.placeholder = value;
  } else {
    el.textContent = value;
  }
}

function applyContent() {
  const lang = localStorage.getItem("rf_lang") || "pt";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    applyElement(el, el.dataset.i18n, lang);
  });

  Object.entries(STATIC_MAP).forEach(([selector, key]) => {
    document.querySelectorAll(selector).forEach((el) => applyElement(el, key, lang));
  });

  if (location.pathname.endsWith("/checkout.html") || location.pathname.endsWith("checkout.html")) {
    Object.entries(CHECKOUT_MAP).forEach(([selector, key]) => {
      document.querySelectorAll(selector).forEach((el) => applyElement(el, key, lang));
    });

    const placeholders = {
      "#name": "checkout_name_placeholder",
      "#phone": "checkout_phone_placeholder",
      "#address": "checkout_address_placeholder"
    };
    Object.entries(placeholders).forEach(([selector, key]) => {
      const el = document.querySelector(selector);
      if (el) el.placeholder = getText(key, lang, el.placeholder);
    });
  }

  document.documentElement.lang = lang === "chg" ? "pt" : lang;
}

async function loadContent() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .eq("key", "public_i18n")
      .maybeSingle();

    if (error) throw error;
    content = parse(data?.value);
  } catch (error) {
    console.warn("Conteúdo editável do site indisponível; mantendo traduções padrão:", error);
    content = {};
  }

  loaded = true;
  applyContent();
}

let observer;
function start() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    if (loaded) applyContent();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("storage", (event) => {
    if (event.key === "rf_lang") applyContent();
  });
}

loadContent().finally(start);

export { applyContent, loadContent };
