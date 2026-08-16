import { supabase } from "./data.js";

const EXT_ID = "rf-admin-settings-extension";
const esc = value => String(value ?? "").replace(/[&<>\"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]));
const valueOf = (settings, key, fallback = "") => settings?.[key] === undefined || settings?.[key] === null ? fallback : String(settings[key]);

async function readSettings() {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.key, row.value]));
}

async function saveSettings(values) {
  const rows = Object.entries(values).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

function input(label, id, value, type="text") { return `<label class="block text-sm font-semibold">${esc(label)}<input id="${id}" type="${type}" value="${esc(value)}" class="mt-1 w-full border rounded-xl p-3 font-normal"></label>`; }
function textarea(label, id, value) { return `<label class="block text-sm font-semibold">${esc(label)}<textarea id="${id}" rows="3" class="mt-1 w-full border rounded-xl p-3 font-normal">${esc(value)}</textarea></label>`; }
function showToast(message) { const toast=document.querySelector("#toast"); if(!toast)return; toast.textContent=message; toast.classList.remove("hidden"); clearTimeout(window.__rfAdminSettingsToast); window.__rfAdminSettingsToast=setTimeout(()=>toast.classList.add("hidden"),3000); }

async function mount() {
  const form = document.querySelector("#settingsForm");
  if (!form || document.querySelector(`#${EXT_ID}`)) return;
  let settings;
  try { settings=await readSettings(); } catch(error) { console.error("Não foi possível carregar configurações:",error); return; }

  const section=document.createElement("section");
  section.id=EXT_ID;
  section.className="bg-transparent mt-6 max-w-4xl space-y-6";
  section.innerHTML=`
    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Pagamentos</h2>
      <p class="text-sm text-[#717971] mt-1">Defina os números e dados que aparecem no finalizar pedido.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-5">
        ${input("Número M-Pesa","rf_mpesa",valueOf(settings,"mpesa_number",valueOf(settings,"mpesa")))}
        ${input("Número E-Mola","rf_emola",valueOf(settings,"emola_number",valueOf(settings,"emola")))}
      </div>
      <div class="mt-4">${textarea("Dados da transferência bancária","rf_bank",valueOf(settings,"bank_details",valueOf(settings,"bank")))}</div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Taxas de entrega</h2>
      <p class="text-sm text-[#717971] mt-1">Valores cobrados por zona de entrega.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-5">
        ${input("Maputo Cidade (MZN)","rf_delivery_maputo",valueOf(settings,"delivery_maputo","400"),"number")}
        ${input("Zonas Circunvizinhas (MZN)","rf_delivery_zonas",valueOf(settings,"delivery_zonas","700"),"number")}
        ${input("Matola (MZN)","rf_delivery_matola",valueOf(settings,"delivery_matola","1000"),"number")}
        ${input("Levantamento (MZN)","rf_delivery_pickup",valueOf(settings,"delivery_pickup","0"),"number")}
      </div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Textos do site público</h2>
      <p class="text-sm text-[#717971] mt-1">Edite os textos principais sem alterar o código.</p>
      <div class="space-y-4 mt-5">
        ${input("Título de destaque/promocional","rf_promo_title",valueOf(settings,"promo_title","Promoções especiais"))}
        ${textarea("Texto abaixo do catálogo","rf_catalog_footer_text",valueOf(settings,"catalog_footer_text",valueOf(settings,"footer_text","Do seu lar para a sua mesa: qualidade, conveniência e carinho em cada compra.")))}
        ${input("Título — Como funciona","rf_how_title",valueOf(settings,"how_title","Como funciona"))}
        ${textarea("Texto — Como funciona","rf_how_text",valueOf(settings,"how_text","Escolha os seus produtos, confirme o pedido e receba as suas compras com toda a comodidade."))}
        ${input("Título — Categorias","rf_categories_title",valueOf(settings,"categories_title","Categorias"))}
        ${input("Título — Catálogo completo","rf_catalog_title",valueOf(settings,"catalog_title","Catálogo completo"))}
        ${input("Título — Combo do mês","rf_bundle_title",valueOf(settings,"bundle_title","Combo do mês"))}
      </div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="font-[Montserrat] text-xl font-bold">Dúvidas frequentes</h2>
      <p class="text-sm text-[#717971] mt-1">O conteúdo desta área também é editável aqui.</p>
      <div class="space-y-4 mt-5">
        ${input("Etiqueta","rf_faq_label",valueOf(settings,"faq_label","Dúvidas frequentes"))}
        ${input("Título","rf_faq_title",valueOf(settings,"faq_title","Perguntas frequentes"))}
        ${[1,2,3,4].map(i=>`<div class="rounded-xl border p-4 space-y-3"><div class="font-semibold">Pergunta ${i}</div>${input("Pergunta",`rf_faq_q${i}`,valueOf(settings,`faq_q${i}`))}${textarea("Resposta",`rf_faq_a${i}`,valueOf(settings,`faq_a${i}`))}</div>`).join("")}
      </div>
    </div>

    <div class="flex justify-end">
      <button id="rfSaveExtraSettings" type="button" class="px-6 py-3 bg-[#00361a] text-white rounded-xl font-bold shadow-sm">Guardar estas configurações</button>
    </div>`;

  form.closest(".bg-white")?.insertAdjacentElement("afterend",section);
  document.querySelector("#rfSaveExtraSettings").onclick=async()=>{
    const get=id=>document.querySelector(`#${id}`)?.value?.trim()||"";
    const num=id=>Number(document.querySelector(`#${id}`)?.value||0);
    const values={
      mpesa_number:get("rf_mpesa"), emola_number:get("rf_emola"), bank_details:get("rf_bank"),
      delivery_maputo:num("rf_delivery_maputo"), delivery_zonas:num("rf_delivery_zonas"), delivery_matola:num("rf_delivery_matola"), delivery_pickup:num("rf_delivery_pickup"),
      promo_title:get("rf_promo_title"), catalog_footer_text:get("rf_catalog_footer_text"), how_title:get("rf_how_title"), how_text:get("rf_how_text"),
      categories_title:get("rf_categories_title"), catalog_title:get("rf_catalog_title"), bundle_title:get("rf_bundle_title"),
      faq_label:get("rf_faq_label"), faq_title:get("rf_faq_title")
    };
    for(let i=1;i<=4;i++){ values[`faq_q${i}`]=get(`rf_faq_q${i}`); values[`faq_a${i}`]=get(`rf_faq_a${i}`); }
    try{ await saveSettings(values); showToast("Configurações guardadas com sucesso."); }
    catch(error){ console.error(error); showToast(`Erro: ${error.message}`); }
  };
}

const observer=new MutationObserver(()=>mount());
observer.observe(document.body,{childList:true,subtree:true});
mount();
