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

  // Attach submit immediately. Do not wait for Supabase, otherwise a slow/blocked
  // products query could leave the checkout button completely inactive.
  form.onsubmit = async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.dataset.rfOldText = submit.textContent; submit.textContent = "A preparar pedido…"; }
    const data = new FormData(form);
    let products = [];
    try {
      const ids = cart.map(row => String(row.id));
      const result = await Promise.race([
        supabase.from("products").select("id,name,price,old_price").in("id", ids),
        new Promise(resolve => setTimeout(() => resolve({ data: [] }), 2500))
      ]);
      products = result?.data || [];
    } catch (_) {}

    const byId = new Map(products.map(p => [String(p.id), p]));
    let subtotal = 0, saving = 0;
    cart.forEach(row => {
      const p = byId.get(String(row.id)) || row;
      const qty = Number(row.qty || 0);
      const price = Number(p?.price ?? row.price ?? 0);
      const oldPrice = Number(p?.old_price ?? row.old_price ?? 0);
      subtotal += price * qty;
      if (oldPrice > price) saving += (oldPrice - price) * qty;
    });
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
      if (order?.id) {
        await supabase.from("order_items").insert(cart.map(row => {
          const p = byId.get(String(row.id)) || row;
          return { order_id: order.id, product_id: p?.id || row.id || null, product_name: p?.name?.pt || p?.name || row?.name?.pt || row?.name || "Produto", quantity: Number(row.qty || 0), unit_price: Number(p?.price ?? row.price ?? 0) };
        }));
      }
    } catch (error) { console.warn("Não foi possível guardar o pedido no painel:", error); }

    const whatsapp = String(setting("whatsapp", "+258840000000")).replace(/\D/g, "") || "258840000000";
    const lines = ["*O seu pedido — Rancho Flexível*", "", "*Produtos*", ...cart.map(row => {
      const p = byId.get(String(row.id)) || row;
      const price = Number(p?.price ?? row.price ?? 0);
      const pname = p?.name?.pt || p?.name || row?.name?.pt || row?.name || "Produto";
      return `• ${pname} — ${row.qty} x ${money(price)} = ${money(price * Number(row.qty || 0))}`;
    }), "", `Poupança: ${money(saving)}`, `Entrega: ${deliveryFee === 0 ? "Grátis" : money(deliveryFee)}`, `*Total: ${money(total)}*`, "", "*Dados do cliente*", `Nome: ${name}`, `Telefone: ${phone}`, `Forma de entrega: ${delivery}`, `Endereço: ${address || "—"}`, `Método de pagamento: ${method}`, `Dados de pagamento: ${payment || "—"}`, `Aceita substituições: ${data.get("substitutions") || "—"}`, `Observações: ${data.get("notes") || "—"}`];

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
