import { supabase } from "./data.js";

const settingsCache = (() => { try { return JSON.parse(localStorage.getItem("rf_public_settings_v2") || "null")?.settings || {}; } catch { return {}; } })();
const setting = (key, fallback = "") => settingsCache[key] === undefined || settingsCache[key] === null || String(settingsCache[key]).trim() === "" ? fallback : settingsCache[key];
const money = value => `${Number(value || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
const fee = name => ({
  "Maputo Cidade": Number(setting("delivery_maputo", 400)),
  "Zonas Circunvizinhas": Number(setting("delivery_zonas", 700)),
  "Matola": Number(setting("delivery_matola", 1000)),
  "Levantamento Gratis": Number(setting("delivery_pickup", 0))
}[name] ?? 0);
const pay = method => method === "M-Pesa" ? setting("mpesa_number", "") : method === "E-Mola" ? setting("emola_number", "") : method === "Transferencia Bancaria" ? setting("bank_details", "") : "";

async function patch() {
  const form = document.querySelector("#rfCheckoutModal #rfForm");
  if (!form || form.dataset.rfSubmitPatched === "1") return;
  form.dataset.rfSubmitPatched = "1";
  const cart = (() => { try { return JSON.parse(localStorage.getItem("rf_cart") || "[]"); } catch { return []; } })();
  if (!cart.length) return;
  const ids = cart.map(row => String(row.id));
  const { data: products } = await supabase.from("products").select("id,name,price,old_price").in("id", ids);
  const byId = new Map((products || []).map(p => [String(p.id), p]));

  form.onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(form);
    let subtotal = 0, saving = 0;
    cart.forEach(row => { const p = byId.get(String(row.id)); const qty = Number(row.qty || 0); subtotal += Number(p?.price || 0) * qty; if (Number(p?.old_price) > Number(p?.price)) saving += (Number(p.old_price) - Number(p.price)) * qty; });
    const delivery = String(data.get("delivery") || "");
    const deliveryFee = fee(delivery);
    const total = subtotal + deliveryFee;
    const method = String(data.get("payment") || "");
    const payment = pay(method);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const address = String(data.get("address") || "");
    const orderNumber = `RF-${Date.now().toString().slice(-8)}`;

    try {
      const { data: customer } = await supabase.from("customers").insert({ name, phone, address: address || null }).select("id").single();
      const { data: order } = await supabase.from("orders").insert({ order_number: orderNumber, customer_id: customer?.id || null, customer_name: name, customer_phone: phone, address: address || null, delivery_zone: delivery, delivery_fee: deliveryFee, total }).select("id").single();
      if (order?.id) await supabase.from("order_items").insert(cart.map(row => { const p = byId.get(String(row.id)); return { order_id: order.id, product_id: p?.id || null, product_name: p?.name?.pt || p?.name || "Produto", quantity: Number(row.qty || 0), unit_price: Number(p?.price || 0) }; }));
    } catch (error) { console.warn("Não foi possível guardar o pedido no painel:", error); }

    const whatsapp = String(setting("whatsapp", "+258840000000")).replace(/\D/g, "") || "258840000000";
    const lines = ["*O seu pedido — Rancho Flexível*", "", "*Produtos*", ...cart.map(row => { const p = byId.get(String(row.id)); return `• ${p?.name?.pt || p?.name || "Produto"} — ${row.qty} x ${money(p?.price)} = ${money(Number(p?.price || 0) * Number(row.qty || 0))}`; }), "", `Poupança: ${money(saving)}`, `Entrega: ${deliveryFee === 0 ? "Grátis" : money(deliveryFee)}`, `*Total: ${money(total)}*`, "", "*Dados do cliente*", `Nome: ${name}`, `Telefone: ${phone}`, `Forma de entrega: ${delivery}`, `Endereço: ${address || "—"}`, `Método de pagamento: ${method}`, `Dados de pagamento: ${payment || "—"}`, `Aceita substituições: ${data.get("substitutions") || "—"}`, `Observações: ${data.get("notes") || "—"}`];
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    localStorage.removeItem("rf_cart");
    document.querySelector("#rfCheckoutModal")?.remove();
  };
}

const boot = () => {
  const observer = new MutationObserver(records => { if (records.some(record => [...record.addedNodes].some(node => node?.id === "rfCheckoutModal" || node?.querySelector?.("#rfCheckoutModal")))) patch(); });
  observer.observe(document.body, { childList: true });
  patch();
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
