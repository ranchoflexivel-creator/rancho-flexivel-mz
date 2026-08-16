import { supabase, getProducts } from "./data.js";

let settings = {};
let products = [];
let lastFaqMarkup = "";
let lastDeliverySignature = "";

async function loadSettings() {
  const [{ data, error }, loadedProducts] = await Promise.all([
    supabase.from("site_settings").select("key,value"),
    getProducts()
  ]);
  if (error) console.warn("Não foi possível carregar configurações públicas:", error);
  settings = Object.fromEntries((data || []).map(row => [row.key, row.value]));
  products = loadedProducts || [];
  applyPublicSettings();
}

const setting = (key, fallback = "") => {
  const value = settings[key];
  return value === undefined || value === null || String(value).trim() === "" ? fallback : value;
};
const money = value => `${Number(value || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
const escapeHtml = value => String(value ?? "").replace(/[&<>\"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]));
const deliveryFee = name => ({
  "Maputo Cidade": Number(setting("delivery_maputo", 400)),
  "Zonas Circunvizinhas": Number(setting("delivery_zonas", 700)),
  "Matola": Number(setting("delivery_matola", 1000)),
  "Levantamento Gratis": Number(setting("delivery_pickup", 0))
}[name] ?? 0);
const paymentDetails = method => {
  if (method === "M-Pesa") return setting("mpesa_number", setting("mpesa", setting("mpesa_phone", "")));
  if (method === "E-Mola") return setting("emola_number", setting("emola", setting("emola_phone", "")));
  if (method === "Transferencia Bancaria") return setting("bank_details", setting("bank_transfer", setting("bank", "")));
  return "";
};

function applyDeliveryCards() {
  const section = [...document.querySelectorAll("section")].find(s => s.querySelector('[data-i18n="deliveryText"]'));
  if (!section) return;
  const values = [deliveryFee("Maputo Cidade"), deliveryFee("Zonas Circunvizinhas"), deliveryFee("Matola"), deliveryFee("Levantamento Gratis")];
  const signature = values.join("|");
  if (signature === lastDeliverySignature) return;
  lastDeliverySignature = signature;
  section.querySelectorAll(".delivery-card").forEach((card, index) => {
    const price = card.querySelector(".text-2xl");
    if (!price) return;
    const next = values[index] === 0 ? "Grátis" : money(values[index]);
    if (price.textContent !== next) price.textContent = next;
  });
}

function applyFaq() {
  const faq = document.querySelector("#faq");
  if (!faq) return;
  const questions = [1,2,3,4].map(i => ({ q: setting(`faq_q${i}`, ""), a: setting(`faq_a${i}`, "") })).filter(x => x.q || x.a);
  if (!questions.length) return;
  const label = document.querySelector('[data-i18n="faqLabel"]');
  const title = document.querySelector('[data-i18n="faqTitle"]');
  if (label) label.textContent = setting("faq_label", "Dúvidas frequentes");
  if (title) title.textContent = setting("faq_title", "Perguntas frequentes");
  const markup = questions.map(item => `<details class="bg-surface-container-low rounded-xl p-4"><summary class="font-semibold cursor-pointer">${escapeHtml(item.q)}</summary><p class="text-sm text-on-surface-variant mt-2">${escapeHtml(item.a)}</p></details>`).join("");
  if (markup !== lastFaqMarkup) {
    lastFaqMarkup = markup;
    faq.innerHTML = markup;
  }
}

function cartTotals() {
  const cart = JSON.parse(localStorage.getItem("rf_cart") || "[]");
  let subtotal = 0, saving = 0;
  cart.forEach(row => {
    const product = products.find(p => String(p.id) === String(row.id));
    if (!product) return;
    const qty = Number(row.qty || 0);
    subtotal += Number(product.price || 0) * qty;
    if (Number(product.old_price) > Number(product.price)) saving += (Number(product.old_price) - Number(product.price)) * qty;
  });
  return { cart, subtotal, saving };
}

function patchCheckoutForm() {
  const form = document.querySelector("#rfCheckoutModal #rfForm");
  if (!form || form.dataset.rfPatched === "1") return;
  form.dataset.rfPatched = "1";

  const deliverySelect = form.querySelector('select[name="delivery"]');
  const paymentSelect = form.querySelector('select[name="payment"]');
  if (!deliverySelect) return;

  const deliveryOptions = [["Maputo Cidade", deliveryFee("Maputo Cidade")], ["Zonas Circunvizinhas", deliveryFee("Zonas Circunvizinhas")], ["Matola", deliveryFee("Matola")], ["Levantamento Gratis", deliveryFee("Levantamento Gratis")]];
  deliverySelect.innerHTML = `<option value="">Seleccione Forma de entrega *</option>` + deliveryOptions.map(([name, fee]) => `<option value="${escapeHtml(name)}">${escapeHtml(name)} — ${fee === 0 ? "Grátis" : money(fee)}</option>`).join("");

  const paymentInfo = form.querySelector("#rfPaymentInfo");
  const paymentText = form.querySelector("#rfPaymentText");
  const summary = document.createElement("div");
  summary.id = "rfManagedSummary";
  summary.className = "rounded-xl bg-surface-container-low p-4 text-sm space-y-1";
  const buttons = form.querySelector("button[type=submit]")?.parentElement;
  if (buttons) buttons.parentElement.insertBefore(summary, buttons);

  const updateSummary = () => {
    const totals = cartTotals();
    const fee = deliveryFee(deliverySelect.value);
    summary.innerHTML = `<div class="flex justify-between"><span>Subtotal</span><b>${money(totals.subtotal)}</b></div><div class="flex justify-between"><span>Entrega</span><b>${fee === 0 ? "Grátis" : money(fee)}</b></div><div class="flex justify-between text-base pt-1 border-t"><span>Total</span><b>${money(totals.subtotal + fee)}</b></div>`;
  };
  deliverySelect.onchange = updateSummary;
  updateSummary();

  if (paymentSelect) {
    paymentSelect.onchange = () => {
      const method = paymentSelect.value;
      const details = paymentDetails(method);
      if (!paymentInfo || !paymentText) return;
      if (!method || method === "Numerário") {
        paymentInfo.classList.add("hidden");
        return;
      }
      paymentInfo.classList.remove("hidden");
      paymentText.textContent = details || "Número/dados de pagamento a configurar no painel.";
    };
  }

  form.onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(form);
    const { cart, subtotal, saving } = cartTotals();
    if (!cart.length) return;
    const delivery = String(data.get("delivery") || "");
    const fee = deliveryFee(delivery);
    const total = subtotal + fee;
    const method = String(data.get("payment") || "");
    const pay = paymentDetails(method);
    const orderNumber = `RF-${Date.now().toString().slice(-8)}`;
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const address = String(data.get("address") || "");

    try {
      const { data: customer } = await supabase.from("customers").insert({ name, phone, address: address || null }).select("id").single();
      const { data: order } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_id: customer?.id || null,
        customer_name: name,
        customer_phone: phone,
        address: address || null,
        delivery_zone: delivery,
        delivery_fee: fee,
        total
      }).select("id").single();
      if (order?.id) {
        await supabase.from("order_items").insert(cart.map(row => {
          const product = products.find(p => String(p.id) === String(row.id));
          return { order_id: order.id, product_id: product?.id || null, product_name: product?.name?.pt || product?.name || "Produto", quantity: Number(row.qty || 0), unit_price: Number(product?.price || 0) };
        }));
      }
    } catch (error) {
      console.warn("Não foi possível guardar o pedido no painel:", error);
    }

    const lines = [
      "*O seu pedido — Rancho Flexível*", "", "*Produtos*",
      ...cart.map(row => {
        const product = products.find(p => String(p.id) === String(row.id));
        const productName = product?.name?.pt || product?.name || "Produto";
        return `• ${productName} — ${row.qty} x ${money(product?.price)} = ${money(Number(product?.price || 0) * Number(row.qty || 0))}`;
      }),
      "", `Poupança: ${money(saving)}`, `Entrega: ${fee === 0 ? "Grátis" : money(fee)}`, `*Total: ${money(total)}*`, "",
      "*Dados do cliente*", `Nome: ${name}`, `Telefone: ${phone}`, `Forma de entrega: ${delivery}`, `Endereço: ${address || "—"}`,
      `Método de pagamento: ${method}`, `Dados de pagamento: ${pay || "—"}`, `Aceita substituições: ${data.get("substitutions") || "—"}`, `Observações: ${data.get("notes") || "—"}`
    ];
    const whatsapp = String(setting("whatsapp", setting("whatsapp_number", "258840000000"))).replace(/\D/g, "") || "258840000000";
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    localStorage.removeItem("rf_cart");
    document.querySelector("#rfCheckoutModal")?.remove();
  };
}

function applyPublicSettings() {
  applyDeliveryCards();
  applyFaq();
  patchCheckoutForm();
}

const observer = new MutationObserver(() => applyPublicSettings());
observer.observe(document.body, { childList: true, subtree: true });
loadSettings();
