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
  section.className="bg-white rounded-2xl p-6 mt-6 max-w-4xl";
  section.innerHTML=`
    <h2 class="font-[Montserrat] text-xl font-bold">Configurações adicionais do site</h2>
    <p class="text-sm text-[#717971] mt-1">Estas opções ficam sempre disponíveis para edição e são usadas no site público.</p>
    <div class="mt-6"><h3 class="font-bold">Formas de pagamento</h3><div class="grid md:grid-cols-2 gap-4 mt-4">${input("Número M-Pesa","rf_mpesa",valueOf(settings,"mpesa_number",valueOf(settings,"mpesa")))}${input("Número E-Mola","rf_emola",valueOf(settings,"emola_number",valueOf(settings,"emola")))}${textarea("Dados da Transferência Bancária","rf_bank",valueOf(settings,"bank_details",valueOf(settings,"bank")))}</div></div>
    <div class="mt-8 pt-6 border-t"><h3 class="font-bold">Taxas de entrega</h3><div class="grid md:grid-cols-2 gap-4 mt-4">${input("Maputo Cidade (MZN)","rf_delivery_maputo",valueOf(settings,"delivery_maputo","400"),"number")}${input("Zonas Circunvizinhas (MZN)","rf_delivery_zonas",valueOf(settings,"delivery_zonas","700"),"number")}${input("Matola (MZN)","rf_delivery_matola",valueOf(settings,"delivery_matola","1000"),"number")}${input("Levantamento (MZN)","rf_delivery_pickup",valueOf(settings,"delivery_pickup","0"),"number")}</div></div>
    <div class="mt-8 pt-6 border-t"><h3 class="font-bold">Dúvidas frequentes</h3><div class="space-y-4 mt-4">${input("Etiqueta","rf_faq_label",valueOf(settings,"faq_label","Dúvidas frequentes"))}${input("Título","rf_faq_title",valueOf(settings,"faq_title","Perguntas frequentes"))}${[1,2,3,4].map(i=>`<div class="rounded-xl border p-4 space-y-3"><div class="font-semibold">Pergunta ${i}</div>${input("Pergunta",`rf_faq_q${i}`,valueOf(settings,`faq_q${i}`))}${textarea("Resposta",`rf_faq_a${i}`,valueOf(settings,`faq_a${i}`))}</div>`).join("")}</div></div>
    <div class="mt-8 pt-6 border-t"><h3 class="font-bold">Texto criativo do site público</h3>${textarea("Texto apresentado no rodapé", "rf_footer_text", valueOf(settings,"footer_text","Do seu lar para a sua mesa: qualidade, conveniência e carinho em cada compra. Faça o seu rancho com confiança — nós cuidamos do resto."))}</div>
    <button id="rfSaveExtraSettings" type="button" class="mt-6 px-5 py-3 bg-[#00361a] text-white rounded-xl font-bold">Guardar configurações</button>`;
  form.closest(".bg-white")?.insertAdjacentElement("afterend",section);
  document.querySelector("#rfSaveExtraSettings").onclick=async()=>{
    const get=id=>document.querySelector(`#${id}`)?.value?.trim()||""; const num=id=>Number(document.querySelector(`#${id}`)?.value||0);
    const values={mpesa_number:get("rf_mpesa"),emola_number:get("rf_emola"),bank_details:get("rf_bank"),delivery_maputo:num("rf_delivery_maputo"),delivery_zonas:num("rf_delivery_zonas"),delivery_matola:num("rf_delivery_matola"),delivery_pickup:num("rf_delivery_pickup"),faq_label:get("rf_faq_label"),faq_title:get("rf_faq_title"),footer_text:get("rf_footer_text")};
    for(let i=1;i<=4;i++){values[`faq_q${i}`]=get(`rf_faq_q${i}`);values[`faq_a${i}`]=get(`rf_faq_a${i}`);}
    try{await saveSettings(values);showToast("Configurações guardadas com sucesso.");}catch(error){console.error(error);showToast(`Erro: ${error.message}`);}
  };
}
const observer=new MutationObserver(()=>mount()); observer.observe(document.body,{childList:true,subtree:true}); mount();
