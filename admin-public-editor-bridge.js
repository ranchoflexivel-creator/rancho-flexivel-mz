import { supabase } from "./data.js";

const LANGS = [["pt", "Português"]];

const KEYS = [
  ["search", "Pesquisa"], ["cart", "Carrinho"], ["new", "Etiqueta do topo"],
  ["heroTitle", "Título principal"], ["heroDescription", "Texto principal"], ["startShopping", "Botão comprar"], ["howWorks", "Como funciona"],
  ["simpleFast", "Etiqueta como funciona"], ["findQuickly", "Título categorias"], ["categories", "Etiqueta categorias"],
  ["fullCatalog", "Etiqueta catálogo"], ["featuredProducts", "Título catálogo"], ["pricesPromotions", "Texto catálogo"],
  ["all", "Todos"], ["sort", "Ordenar"], ["low", "Preço menor"], ["high", "Preço maior"], ["name", "Nome"],
  ["highlights", "Etiqueta destaques"], ["monthlyCombo", "Título Combo do Mês"], ["monthlyComboDescription", "Texto Combo do Mês"],
  ["deliveries", "Etiqueta entregas"], ["closerToYou", "Título entregas"], ["deliveryDescription", "Texto entregas"],
  ["faq", "Etiqueta FAQ"], ["frequentlyAsked", "Título FAQ"], ["faqAccount", "FAQ conta"], ["faqAccountAnswer", "Resposta FAQ conta"],
  ["faqConfirmed", "FAQ confirmação"], ["faqConfirmedAnswer", "Resposta FAQ confirmação"], ["faqFee", "FAQ taxa"], ["faqFeeAnswer", "Resposta FAQ taxa"],
  ["faqPickup", "FAQ levantamento"], ["faqPickupAnswer", "Resposta FAQ levantamento"],
  ["order", "Título pedido"], ["products", "Produtos"], ["saving", "Poupança"], ["service", "Taxa de serviço"], ["total", "Total"],
  ["continue", "Continuar para entrega"], ["empty", "Pedido vazio"], ["add", "Adicionar"], ["unavailable", "Indisponível"], ["none", "Nenhum produto"],
  ["comboNone", "Nenhum combo"], ["addCombo", "Adicionar combo"], ["customer", "Dados do cliente"], ["fullName", "Nome completo"], ["phone", "Telefone"],
  ["deliveryMethod", "Forma de entrega"], ["address", "Endereço"], ["payment", "Pagamento"], ["select", "Seleccione"], ["substitution", "Substituições"],
  ["contact", "Contactar antes"], ["equivalent", "Produto equivalente"], ["noReplace", "Não substituir"], ["notes", "Observações"], ["finish", "Finalizar WhatsApp"],
  ["back", "Voltar"], ["cash", "Numerário"], ["mpesa", "M-Pesa"], ["emola", "E-Mola"], ["bank", "Transferência"], ["paymentInfo", "Dados pagamento"],
  ["accountPending", "Pagamento pendente"], ["saved", "Pedido preparado"], ["emptyFirst", "Carrinho vazio"], ["removed", "Produto removido"], ["added", "Produto adicionado"],
  ["comboAdded", "Combo adicionado"], ["viewOrder", "Ver pedido"], ["selected", "Produtos selecionados"], ["noAccount", "FAQ sem conta"],
  ["confirm", "FAQ confirmação"], ["fee", "FAQ taxa detalhada"], ["pickup", "FAQ levantamento detalhado"],
  ["footerDescription", "Descrição rodapé"], ["footerDelivery", "Entregas rodapé"], ["footerCreative", "Mensagem rodapé"],
  ["maputo", "Maputo Cidade"], ["surroundings", "Zonas circunvizinhas"], ["matola", "Matola"], ["pickupName", "Levantamento"],
  ["paymentChoose", "Escolha pagamento"], ["step1", "Passo 1"], ["step1Desc", "Descrição passo 1"], ["step2", "Passo 2"], ["step2Desc", "Descrição passo 2"],
  ["step3", "Passo 3"], ["step3Desc", "Descrição passo 3"], ["step4", "Passo 4"], ["step4Desc", "Descrição passo 4"],
  ["footer_title", "Título rodapé"], ["footer_whatsapp_label", "Etiqueta WhatsApp"], ["footer_delivery_label", "Etiqueta entregas rodapé"], ["footer_bottom_tagline", "Frase final rodapé"],
  ["checkout_back", "Checkout: voltar"], ["checkout_title", "Checkout: título"], ["checkout_intro", "Checkout: introdução"], ["checkout_customer", "Checkout: cliente"],
  ["checkout_full_name", "Checkout: nome"], ["checkout_phone", "Checkout: telefone"], ["checkout_delivery", "Checkout: entrega"], ["checkout_address", "Checkout: endereço"],
  ["checkout_payment", "Checkout: pagamento"], ["checkout_payment_info", "Checkout: dados pagamento"], ["checkout_substitution", "Checkout: substituições"], ["checkout_finish", "Checkout: finalizar"],
  ["checkout_name_placeholder", "Checkout: placeholder nome"], ["checkout_phone_placeholder", "Checkout: placeholder telefone"], ["checkout_address_placeholder", "Checkout: placeholder endereço"], ["checkout_notes_placeholder", "Checkout: placeholder observações"],
  ["footer_title", "Rodapé: título"], ["footer_tagline", "Rodapé: frase"], ["footer_whatsapp_label", "Rodapé: WhatsApp"], ["footer_delivery_label", "Rodapé: entregas"], ["footer_delivery", "Rodapé: zonas"], ["footer_text", "Rodapé: mensagem"], ["footer_bottom_tagline", "Rodapé: frase final"]
];

const defaults = {
  pt: {
    heroTitle: "Faça o seu rancho sem sair de casa.", heroDescription: "Escolha os produtos, monte o carrinho e envie o pedido pelo WhatsApp. Simples, rápido e transparente.", startShopping: "Começar a comprar →", howWorks: "Como funciona", simpleFast: "Simples e rápido", categories: "Categorias", findQuickly: "Encontre rapidamente o que precisa.", fullCatalog: "CATÁLOGO COMPLETO", featuredProducts: "Produtos em destaque", pricesPromotions: "Preços em meticais e promoções bem visíveis.", highlights: "Destaques", monthlyCombo: "Combo do Mês", monthlyComboDescription: "Kits pré-montados pensados para facilitar a sua rotina e garantir economia.", deliveries: "ENTREGAS", closerToYou: "Chegamos mais perto de si.", deliveryDescription: "A taxa é calculada automaticamente conforme a área escolhida.", faq: "DÚVIDAS FREQUENTES", frequentlyAsked: "Perguntas frequentes", footerDescription: "A sua mercearia simples e próxima.", footerDelivery: "Maputo • Arredores • Matola", footerCreative: "Do nosso mercado para a sua mesa — escolha, peça e receba com simplicidade.", footer_title: "Rancho Flexível", footer_whatsapp_label: "WhatsApp", footer_delivery_label: "Entregas", footer_bottom_tagline: "Compras simples, perto de si."
  }
};

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const parse = (v) => { if (v && typeof v === "object") return v; try { return JSON.parse(v || "{}"); } catch { return {}; } };
const read = async () => { const { data, error } = await supabase.from("site_settings").select("key,value"); if (error) throw error; return Object.fromEntries((data || []).map((r) => [r.key, parse(r.value)])); };
const save = async (value) => { const { error } = await supabase.from("site_settings").upsert([{ key: "public_i18n", value: JSON.stringify(value), updated_at: new Date().toISOString() }], { onConflict: "key" }); if (error) throw error; };
const get = (content, key) => content?.pt?.[key] ?? defaults.pt?.[key] ?? "";

async function mount() {
  if (document.querySelector("#rf-public-editor")) return;
  const host = document.querySelector("#settingsForm")?.closest(".bg-white") || document.querySelector("#rf-admin-settings-v2");
  if (!host) return;

  let settings;
  try { settings = await read(); } catch { return; }
  const content = settings.public_i18n || {};

  const rows = KEYS.map(([key, label]) => `<div class="border rounded-2xl p-4 bg-[#fafcfb]"><div class="font-bold mb-3">${esc(label)} <span class="text-xs text-[#717971]">(${esc(key)})</span></div><textarea data-rf-key="${esc(key)}" rows="2" class="w-full border rounded-xl p-3 text-sm">${esc(get(content, key))}</textarea></div>`).join("");

  const root = document.createElement("section");
  root.id = "rf-public-editor";
  root.className = "bg-white rounded-2xl p-6 shadow-sm mt-6 max-w-7xl";
  root.innerHTML = `<h2 class="font-[Montserrat] text-xl font-bold">Conteúdo do site público</h2><p class="text-sm text-[#717971] mt-1">Edite aqui, uma única vez em português, todo o texto fixo do site público. A tradução das outras línguas é automática e não precisa ser repetida no painel.</p><div class="space-y-4 mt-5">${rows}</div><div class="mt-6 flex items-center justify-between gap-3"><span id="rfpe_status" class="text-sm text-[#717971]"></span><button id="rfpe_save" class="px-5 py-3 bg-[#00361a] text-white rounded-xl font-bold">Guardar conteúdo</button></div>`;
  host.insertAdjacentElement("afterend", root);

  document.querySelector("#rfpe_save").onclick = async () => {
    const out = { pt: {} };
    document.querySelectorAll("[data-rf-key]").forEach((el) => { out.pt[el.dataset.rfKey] = el.value.trim(); });
    const button = document.querySelector("#rfpe_save");
    const status = document.querySelector("#rfpe_status");
    button.disabled = true;
    status.textContent = "A guardar…";
    try {
      await save(out);
      status.textContent = "Guardado. O site público atualizará automaticamente.";
      button.textContent = "Guardado ✓";
      setTimeout(() => { button.textContent = "Guardar conteúdo"; status.textContent = ""; }, 2500);
    } catch (error) {
      console.error(error);
      status.textContent = "Não foi possível guardar as alterações.";
    } finally { button.disabled = false; }
  };
}

new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
mount();
