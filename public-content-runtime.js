import { supabase } from "./data.js";

const CHECKOUT_MAP = {
  "body > header a:nth-of-type(2)": "checkout_back",
  "main > div.mb-6 h1": "checkout_title",
  "main > div.mb-6 p": "checkout_intro",
  "main > .grid > section:nth-child(1) h2": "checkout_customer",
  "#checkoutForm label:nth-of-type(1)": "checkout_full_name",
  "#checkoutForm label:nth-of-type(2)": "checkout_phone",
  "#checkoutForm label:nth-of-type(3)": "checkout_delivery",
  "#checkoutForm label:nth-of-type(4)": "checkout_address",
  "#checkoutForm label:nth-of-type(5)": "checkout_payment",
  "#paymentInfo > div:first-child": "checkout_payment_info",
  "#checkoutForm legend": "checkout_substitution",
  "#checkoutForm fieldset label:nth-of-type(1) b": "contact",
  "#checkoutForm fieldset label:nth-of-type(1) small": "checkout_contact_help",
  "#checkoutForm fieldset label:nth-of-type(2) b": "equivalent",
  "#checkoutForm fieldset label:nth-of-type(2) small": "checkout_equivalent_help",
  "#checkoutForm fieldset label:nth-of-type(3) b": "noReplace",
  "#checkoutForm fieldset label:nth-of-type(3) small": "checkout_none_help",
  "#checkoutForm label:nth-of-type(6)": "notes",
  "#checkoutForm > div.flex a": "back",
  "#send": "finish",
  "main > .grid > section:nth-child(2) h2": "order",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(1)": "products",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(2)": "saving",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(3)": "service",
  "main > .grid > section:nth-child(2) .border-t.mt-5.pt-4 span:nth-of-type(4)": "total",
  "main > .grid > section:nth-child(2) .mt-5.rounded-xl": "checkout_delivery_note",
  "footer strong.text-white.text-lg": "footer_title",
  "footer > div > div.grid > div:nth-child(1) p": "footer_tagline",
  "footer > div > div.grid > div:nth-child(2) strong": "footer_whatsapp_label",
  "footer > div > div.grid > div:nth-child(2) p": "checkout_footer_whatsapp",
  "footer > div > div.grid > div:nth-child(3) strong": "footer_delivery_label",
  "footer > div > div.grid > div:nth-child(3) p": "footer_delivery",
  "footer > div > div.border-t": "footer_text"
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

function getText(key, lang, fallback = "") {
  const value = content?.[lang]?.[key];
  return value == null || value === "" ? fallback : String(value);
}

function applyElement(el, key, lang) {
  if (!el) return;
  const fallback = el.dataset.rfDefaultText || el.textContent.trim();
  if (!el.dataset.rfDefaultText) el.dataset.rfDefaultText = fallback;
  const value = getText(key, lang, fallback);
  el.textContent = value;
}

function applyPlaceholder(selector, key, lang) {
  const el = document.querySelector(selector);
  if (!el) return;
  const fallback = el.dataset.rfDefaultPlaceholder || el.placeholder || "";
  if (!el.dataset.rfDefaultPlaceholder) el.dataset.rfDefaultPlaceholder = fallback;
  el.placeholder = getText(key, lang, fallback);
}

function applyContent() {
  const lang = localStorage.getItem("rf_lang") || "pt";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    applyElement(el, el.dataset.i18n, lang);
  });

  Object.entries(STATIC_MAP).forEach(([selector, key]) => {
    document.querySelectorAll(selector).forEach((el) => applyElement(el, key, lang));
  });

  if (/checkout(?:\.html)?$/.test(location.pathname)) {
    Object.entries(CHECKOUT_MAP).forEach(([selector, key]) => {
      document.querySelectorAll(selector).forEach((el) => applyElement(el, key, lang));
    });
    applyPlaceholder("#name", "checkout_name_placeholder", lang);
    applyPlaceholder("#phone", "checkout_phone_placeholder", lang);
    applyPlaceholder("#address", "checkout_address_placeholder", lang);
    applyPlaceholder("#notes", "checkout_notes_placeholder", lang);
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
