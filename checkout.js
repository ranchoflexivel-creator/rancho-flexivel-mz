import { supabase, getProducts, getSettings } from "./data.js";

const cart = JSON.parse(localStorage.getItem("rf_cart") || "[]");
const $ = (s) => document.querySelector(s);

const products = await getProducts().catch(() => []);
const settings = await getSettings().catch(() => ({}));

const zones = {
  "Maputo Cidade": 400,
  "Zonas circunvizinhas": 700,
  "Matola": 1000,
  "Levantamento": 0
};

function money(n) {
  return `${Number(n || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MZN`;
}

function productName(product) {
  if (!product) return "";
  if (typeof product.name === "string") return product.name;
  return product.name?.pt ||
    product.name?.en ||
    product.name?.fr ||
    product.name?.zh ||
    product.name?.chg ||
    Object.values(product.name || {})[0] ||
    "";
}

function getPaymentDetails(method) {
  if (method === "M-Pesa") {
    return (
      settings.mpesa_number ||
      settings.mpesa ||
      settings.mpesa_phone ||
      settings.mpesaNumber ||
      ""
    );
  }

  if (method === "E-Mola") {
    return (
      settings.emola_number ||
      settings.emola ||
      settings.emola_phone ||
      settings.emolaNumber ||
      ""
    );
  }

  if (method === "Transferência" || method === "Transferência Bancária") {
    return (
      settings.bank_details ||
      settings.bank_transfer ||
      settings.bank ||
      settings.bank_account ||
      ""
    );
  }

  return "";
}

function substitutionLabel() {
  const value = $("input[name='substitution']:checked")?.value;

  if (value === "equivalent") {
    return "Sim, por produto equivalente";
  }

  if (value === "none") {
    return "Não substituir";
  }

  return "Contactar antes";
}

function getCartProducts() {
  return cart
    .map((item) => {
      const product = products.find(
        (p) => String(p.id) === String(item.id)
      );

      if (!product) return null;

      return {
        product,
        quantity: Number(item.qty || 0)
      };
    })
    .filter(Boolean);
}

function calculateTotals() {
  let subtotal = 0;
  let saving = 0;

  getCartProducts().forEach(({ product, quantity }) => {
    subtotal += Number(product.price || 0) * quantity;

    if (
      Number(product.old_price || 0) > Number(product.price || 0)
    ) {
      saving +=
        (Number(product.old_price) - Number(product.price)) *
        quantity;
    }
  });

  const zone = $("#zone")?.value || "";
  const deliveryFee = Number(zones[zone] || 0);

  return {
    subtotal,
    saving,
    deliveryFee,
    total: subtotal + deliveryFee
  };
}

function renderSummary() {
  const summary = $("#summary");

  if (!summary) return;

  const items = getCartProducts();

  if (!items.length) {
    summary.innerHTML =
      '<p class="text-sm text-gray-500">O carrinho está vazio.</p>';

    if ($("#total")) {
      $("#total").textContent = money(0);
    }

    return;
  }

  summary.innerHTML = items
    .map(({ product, quantity }) => {
      const value =
        Number(product.price || 0) * quantity;

      return `
        <div class="flex justify-between gap-3 py-2 border-b">
          <div class="min-w-0">
            <div class="font-medium text-sm">
              ${productName(product)}
            </div>
            <div class="text-xs text-gray-500">
              ${quantity} × ${money(product.price)}
            </div>
          </div>

          <strong class="text-sm whitespace-nowrap">
            ${money(value)}
          </strong>
        </div>
      `;
    })
    .join("");

  const totals = calculateTotals();

  if ($("#subtotal")) {
    $("#subtotal").textContent = money(totals.subtotal);
  }

  if ($("#saving")) {
    $("#saving").textContent = money(totals.saving);
  }

  if ($("#deliveryFee")) {
    $("#deliveryFee").textContent =
      totals.deliveryFee === 0
        ? "Grátis"
        : money(totals.deliveryFee);
  }

  if ($("#total")) {
    $("#total").textContent = money(totals.total);
  }
}

function renderPaymentInfo() {
  const method = $("#payment")?.value;
  const box = $("#paymentInfo");
  const value = $("#paymentNumber");

  if (!box || !value) return;

  if (!method || method === "Numerário") {
    box.classList.add("hidden");
    value.textContent = "";
    return;
  }

  const details = getPaymentDetails(method);

  box.classList.remove("hidden");

  value.textContent =
    details ||
    "Número/dados de pagamento ainda não configurados no painel de administrador.";
}

function render() {
  renderSummary();
  renderPaymentInfo();
}

$("#zone")?.addEventListener("change", render);
$("#payment")?.addEventListener("change", renderPaymentInfo);

document
  .querySelectorAll("input[name='substitution']")
  .forEach((input) => {
    input.addEventListener("change", render);
  });

render();

$("#send")?.addEventListener("click", async () => {
  const name = $("#name")?.value.trim() || "";
  const phone = $("#phone")?.value.trim() || "";
  const address = $("#address")?.value.trim() || "";
  const zone = $("#zone")?.value || "";
  const payment = $("#payment")?.value || "";
  const notes = $("#notes")?.value.trim() || "";
  const substitution = substitutionLabel();

  if (!cart.length) {
    if ($("#msg")) {
      $("#msg").textContent =
        "O carrinho está vazio. Adicione produtos antes de finalizar.";
    }
    return;
  }

  if (!name || !phone || !zone || !payment) {
    if ($("#msg")) {
      $("#msg").textContent =
        "Preencha todos os campos obrigatórios antes de continuar.";
    }
    return;
  }

  const totals = calculateTotals();
  const paymentDetails = getPaymentDetails(payment);

  const orderNo =
    "RF-" + Date.now().toString().slice(-8);

  const items = getCartProducts();

  let inserted = null;

  try {
    const orderPayload = {
      order_number: orderNo,
      customer_name: name,
      customer_phone: phone,
      address: address || null,
      delivery_zone: zone,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      status: "new"
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (error) {
      console.warn(
        "Não foi possível guardar o pedido:",
        error
      );
    } else {
      inserted = data;
    }

    if (inserted?.id) {
      const orderItems = items.map(
        ({ product, quantity }) => ({
          order_id: inserted.id,
          product_id: product.id,
          product_name: productName(product),
          quantity,
          unit_price: Number(product.price || 0)
        })
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.warn(
          "Não foi possível guardar os produtos do pedido:",
          itemsError
        );
      }
    }
  } catch (error) {
    console.warn(
      "Erro ao guardar pedido no painel:",
      error
    );
  }

  const productLines = items.map(
    ({ product, quantity }) =>
      `• ${productName(product)} — ${quantity} x ${money(
        product.price
      )} = ${money(
        Number(product.price || 0) * quantity
      )}`
  );

  const paymentLine =
    payment === "Numerário"
      ? "Pagamento: Numerário"
      : [
          `Pagamento: ${payment}`,
          `Dados de pagamento: ${
            paymentDetails || "A configurar"
          }`
        ].join("\n");

  const lines = [
    "*RANCHO FLEXÍVEL — NOVO PEDIDO*",
    "",
    `*Pedido:* ${orderNo}`,
    "",
    "*Produtos*",
    ...productLines,
    "",
    `Poupança: ${money(totals.saving)}`,
    `Taxa de serviço: ${
      totals.deliveryFee === 0
        ? "Grátis"
        : money(totals.deliveryFee)
    }`,
    `*Total: ${money(totals.total)}*`,
    "",
    "*Dados do cliente*",
    `Nome: ${name}`,
    `Telefone: ${phone}`,
    `Forma de entrega: ${zone}`,
    `Endereço / ponto de referência: ${
      address || "—"
    }`,
    "",
    paymentLine,
    "",
    `Aceita substituições: ${substitution}`,
    `Observações: ${notes || "—"}`
  ];

  const whatsapp =
    settings.whatsapp ||
    settings.whatsapp_number ||
    settings.whatsapp_phone ||
    "258840000000";

  const whatsappNumber = String(whatsapp)
    .replace(/\D/g, "");

  const whatsappUrl =
    `https://wa.me/${whatsappNumber}?text=` +
    encodeURIComponent(lines.join("\n"));

  localStorage.removeItem("rf_cart");

  window.location.href = whatsappUrl;
});
