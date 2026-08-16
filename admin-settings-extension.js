import { supabase } from "./data.js";

const ROOT_ID = "rf-admin-settings-v2";
const esc = value => String(value ?? "").replace(/[&<>\"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[m]));
const textValue = (settings, key, fallback = "") => {
  const value = settings?.[key];
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "object" ? String(value.pt ?? Object.values(value)[0] ?? fallback) : String(value);
};
const numValue = (settings, key, fallback = 0) => {
  const n = Number(settings?.[key]);
  return Number.isFinite(n) ? n : fallback;
};

async function readSettings() {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.key, row.value]));
}

async function saveSettings(values) {
  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
    updated_at: new Date().toISOString()
  }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

async function upload(file, folder) {
  if (!file) return "";
  if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Use JPG, PNG ou WEBP.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, { upsert:false, contentType:file.type, cacheControl:"31536000" });
  if (error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

function input(label, id, value = "", type = "text") {
  return `<label class="block text-sm font-semibold">${esc(label)}<input id="${id}" type="${type}" value="${esc(value)}" class="mt-1 w-full border rounded-xl p-3 font-normal"></label>`;
}
function textarea(label, id, value = "") {
  return `<label class="block text-sm font-semibold">${esc(label)}<textarea id="${id}" rows="3" class="mt-1 w-full border rounded-xl p-3 font-normal">${esc(value)}</textarea></label>`;
}
function button(id, label) {
  return `<button id="${id}" type="button" class="px-5 py-3 bg-[#00361a] text-white rounded-xl font-bold shadow-sm">${esc(label)}</button>`;
}
function toast(message) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(window.__rfSettingsToast);
  window.__rfSettingsToast = setTimeout(() => el.classList.add("hidden"), 3000);
}
function field(id) { return document.querySelector(`#${id}`)?.value?.trim() || ""; }
function numberField(id) { return Number(document.querySelector(`#${id}`)?.value || 0); }

function patchComboLabels() {
  const replaceText = root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(n => {
      if (!n.nodeValue || n.parentElement?.closest("script,style")) return;
      n.nodeValue = n.nodeValue.replace(/Rancho do Mês/g, "Combo do Mês").replace(/Rancho do mês/g, "Combo do mês");
    });
  };
  replaceText(document.body);
}

function faqDefaults(settings) {
  return [
    [textValue(settings,"faq_q1","Preciso criar uma conta para fazer um pedido?"), textValue(settings,"faq_a1","Não. Pode montar o seu pedido e enviá-lo pelo WhatsApp sem criar uma conta.")],
    [textValue(settings,"faq_q2","Como é confirmada a disponibilidade dos produtos?"), textValue(settings,"faq_a2","A equipa confirma a disponibilidade, as substituições e o prazo de entrega antes de finalizar o pedido.")],
    [textValue(settings,"faq_q3","Como é calculada a taxa de entrega?"), textValue(settings,"faq_a3","A taxa depende da área escolhida e é apresentada no total antes do envio do pedido pelo WhatsApp.")],
    [textValue(settings,"faq_q4","Posso escolher levantamento em vez de entrega?"), textValue(settings,"faq_a4","Sim. Escolha a opção de levantamento para não pagar a taxa de serviço de entrega.")]
  ];
}

async function mount() {
  const form = document.querySelector("#settingsForm");
  if (!form || document.querySelector(`#${ROOT_ID}`)) return;

  let settings;
  try { settings = await readSettings(); }
  catch (error) { console.error("Não foi possível carregar configurações:", error); return; }

  // Remove o painel antigo para evitar textos e campos duplicados.
  const oldPanel = form.closest(".bg-white");
  if (oldPanel) oldPanel.classList.add("hidden");

  const top = textValue(settings,"site_top_image",textValue(settings,"hero_image",""));
  const footer = textValue(settings,"site_footer_image",textValue(settings,"footer_image",""));
  const faqs = faqDefaults(settings);

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "mt-6 max-w-5xl space-y-6";
  root.innerHTML = `
    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div><h2 class="font-[Montserrat] text-xl font-bold">Imagens do site público</h2><p class="text-sm text-[#717971] mt-1">Estas imagens ficam ligadas diretamente à página pública.</p></div>
      <div class="grid md:grid-cols-2 gap-6 mt-5">
        <div class="space-y-3">
          ${input("Imagem do cabeçalho","rfTopImageUrl",top)}
          <input id="rfTopImage" type="file" accept="image/jpeg,image/png,image/webp" class="w-full border rounded-xl p-3">
          <img id="rfTopPreview" src="${esc(top)}" class="${top?"":"hidden"} w-full h-40 object-cover rounded-xl border" alt="Imagem do cabeçalho">
        </div>
        <div class="space-y-3">
          ${input("Imagem do rodapé","rfFooterImageUrl",footer)}
          <input id="rfFooterImage" type="file" accept="image/jpeg,image/png,image/webp" class="w-full border rounded-xl p-3">
          <img id="rfFooterPreview" src="${esc(footer)}" class="${footer?"":"hidden"} w-full h-40 object-cover rounded-xl border" alt="Imagem do rodapé">
        </div>
      </div>
      <div class="flex justify-end mt-5">${button("rfSaveMedia","Guardar imagens")}</div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Pagamentos</h2>
      <p class="text-sm text-[#717971] mt-1">Configure os dados que aparecem no finalizar pedido.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-5">
        ${input("Número M-Pesa","rf_mpesa",textValue(settings,"mpesa_number",textValue(settings,"mpesa")))}
        ${input("Número E-Mola","rf_emola",textValue(settings,"emola_number",textValue(settings,"emola")))}
      </div>
      <div class="mt-4">${textarea("Dados da transferência bancária","rf_bank",textValue(settings,"bank_details",textValue(settings,"bank")))}</div>
      <div class="flex justify-end mt-5">${button("rfSavePayments","Guardar pagamentos")}</div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Taxas de entrega</h2>
      <p class="text-sm text-[#717971] mt-1">Defina os valores por zona de entrega.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-5">
        ${input("Maputo Cidade (MZN)","rf_delivery_maputo",numValue(settings,"delivery_maputo",400),"number")}
        ${input("Zonas Circunvizinhas (MZN)","rf_delivery_zonas",numValue(settings,"delivery_zonas",700),"number")}
        ${input("Matola (MZN)","rf_delivery_matola",numValue(settings,"delivery_matola",1000),"number")}
        ${input("Levantamento (MZN)","rf_delivery_pickup",numValue(settings,"delivery_pickup",0),"number")}
      </div>
      <div class="flex justify-end mt-5">${button("rfSaveDelivery","Guardar taxas de entrega")}</div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Textos do site público</h2>
      <p class="text-sm text-[#717971] mt-1">Edite aqui os textos que aparecem na página pública. Cada informação fica guardada uma única vez.</p>
      <div class="space-y-4 mt-5">
        ${input("Título promocional","rf_promo_title",textValue(settings,"promo_title","Promoções especiais"))}
        ${textarea("Texto abaixo do catálogo","rf_catalog_footer_text",textValue(settings,"catalog_footer_text",textValue(settings,"footer_text","Do seu lar para a sua mesa: qualidade, conveniência e carinho em cada compra.")))}
        ${input("Título — Como funciona","rf_how_title",textValue(settings,"how_title","Como funciona"))}
        ${textarea("Texto — Como funciona","rf_how_text",textValue(settings,"how_text","Escolha os seus produtos, monte o pedido e envie-o pelo WhatsApp."))}
        ${input("Título — Categorias","rf_categories_title",textValue(settings,"categories_title","Categorias"))}
        ${input("Título — Catálogo completo","rf_catalog_title",textValue(settings,"catalog_title","Catálogo completo"))}
        ${input("Título — Combo do Mês","rf_bundle_title",textValue(settings,"bundle_title","Combo do Mês"))}
      </div>
      <div class="flex justify-end mt-5">${button("rfSaveTexts","Guardar textos")}</div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Dúvidas frequentes</h2>
      <p class="text-sm text-[#717971] mt-1">Os campos abaixo já vêm preenchidos com o conteúdo usado atualmente no site público e podem ser editados.</p>
      <div class="space-y-4 mt-5">
        ${input("Etiqueta","rf_faq_label",textValue(settings,"faq_label","Dúvidas frequentes"))}
        ${input("Título","rf_faq_title",textValue(settings,"faq_title","Perguntas frequentes"))}
        ${faqs.map((faq,i)=>`<div class="rounded-xl border p-4 space-y-3"><div class="font-semibold">Pergunta ${i+1}</div>${input("Pergunta",`rf_faq_q${i+1}`,faq[0])}${textarea("Resposta",`rf_faq_a${i+1}`,faq[1])}</div>`).join("")}
      </div>
      <div class="flex justify-end mt-5">${button("rfSaveFaq","Guardar dúvidas frequentes")}</div>
    </div>
  `;

  oldPanel?.insertAdjacentElement("afterend", root);

  const bindPreview = (fileId,urlId,previewId) => {
    document.querySelector(`#${fileId}`).onchange = e => {
      const file = e.target.files?.[0]; if (!file) return;
      const preview = document.querySelector(`#${previewId}`);
      preview.src = URL.createObjectURL(file); preview.classList.remove("hidden");
    };
    document.querySelector(`#${urlId}`).oninput = e => {
      const preview = document.querySelector(`#${previewId}`); const value = e.target.value.trim();
      preview.src = value; preview.classList.toggle("hidden", !value);
    };
  };
  bindPreview("rfTopImage","rfTopImageUrl","rfTopPreview");
  bindPreview("rfFooterImage","rfFooterImageUrl","rfFooterPreview");

  document.querySelector("#rfSaveMedia").onclick = async () => {
    const btn = document.querySelector("#rfSaveMedia"); btn.disabled = true;
    try {
      let topUrl = field("rfTopImageUrl"); let footerUrl = field("rfFooterImageUrl");
      const topFile = document.querySelector("#rfTopImage")?.files?.[0];
      const footerFile = document.querySelector("#rfFooterImage")?.files?.[0];
      if (topFile) topUrl = await upload(topFile,"site/top");
      if (footerFile) footerUrl = await upload(footerFile,"site/footer");
      await saveSettings({site_top_image:topUrl,site_footer_image:footerUrl});
      toast("Imagens do site guardadas com sucesso.");
    } catch (error) { toast(`Erro: ${error.message}`); }
    finally { btn.disabled = false; }
  };

  document.querySelector("#rfSavePayments").onclick = async () => {
    const btn = document.querySelector("#rfSavePayments"); btn.disabled = true;
    try {
      await saveSettings({mpesa_number:field("rf_mpesa"),emola_number:field("rf_emola"),bank_details:field("rf_bank")});
      toast("Configurações de pagamentos guardadas.");
    } catch (error) { toast(`Erro: ${error.message}`); }
    finally { btn.disabled = false; }
  };

  document.querySelector("#rfSaveDelivery").onclick = async () => {
    const btn = document.querySelector("#rfSaveDelivery"); btn.disabled = true;
    try {
      await saveSettings({delivery_maputo:numberField("rf_delivery_maputo"),delivery_zonas:numberField("rf_delivery_zonas"),delivery_matola:numberField("rf_delivery_matola"),delivery_pickup:numberField("rf_delivery_pickup")});
      toast("Taxas de entrega guardadas.");
    } catch (error) { toast(`Erro: ${error.message}`); }
    finally { btn.disabled = false; }
  };

  document.querySelector("#rfSaveTexts").onclick = async () => {
    const btn = document.querySelector("#rfSaveTexts"); btn.disabled = true;
    try {
      await saveSettings({promo_title:field("rf_promo_title"),catalog_footer_text:field("rf_catalog_footer_text"),how_title:field("rf_how_title"),how_text:field("rf_how_text"),categories_title:field("rf_categories_title"),catalog_title:field("rf_catalog_title"),bundle_title:field("rf_bundle_title")});
      toast("Textos do site público guardados.");
    } catch (error) { toast(`Erro: ${error.message}`); }
    finally { btn.disabled = false; }
  };

  document.querySelector("#rfSaveFaq").onclick = async () => {
    const btn = document.querySelector("#rfSaveFaq"); btn.disabled = true;
    try {
      const values={faq_label:field("rf_faq_label"),faq_title:field("rf_faq_title")};
      for(let i=1;i<=4;i++){ values[`faq_q${i}`]=field(`rf_faq_q${i}`); values[`faq_a${i}`]=field(`rf_faq_a${i}`); }
      await saveSettings(values);
      toast("Dúvidas frequentes guardadas.");
    } catch (error) { toast(`Erro: ${error.message}`); }
    finally { btn.disabled = false; }
  };

  patchComboLabels();
}

const observer = new MutationObserver(() => {
  patchComboLabels();
  mount();
});
observer.observe(document.body,{childList:true,subtree:true});
mount();
