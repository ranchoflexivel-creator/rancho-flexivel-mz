import { supabase } from "./data.js";

const SETTINGS_CACHE = "rf_public_settings_v2";
const SETTINGS_TTL = 10 * 60 * 1000;
let settings = {};
let lastFaqMarkup = "";
let lastDeliverySignature = "";
let footerApplied = false;
let checkoutProducts = null;

const setting = (key, fallback = "") => settings[key] === undefined || settings[key] === null || String(settings[key]).trim() === "" ? fallback : settings[key];
const money = value => `${Number(value || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`;
const escapeHtml = value => String(value ?? "").replace(/[&<>\"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[m]));

function readSettingsCache() { try { const cached = JSON.parse(localStorage.getItem(SETTINGS_CACHE) || "null"); if (cached?.savedAt && cached.settings) return cached; } catch {} return null; }
function writeSettingsCache(value) { try { localStorage.setItem(SETTINGS_CACHE, JSON.stringify({ savedAt: Date.now(), settings: value })); } catch {} }

async function refreshSettingsFromSupabase() {
  try {
    const { data, error } = await supabase.from("site_settings").select("key,value");
    if (error) throw error;
    const fresh = Object.fromEntries((data || []).map(row => [row.key, row.value]));
    const changed = JSON.stringify(fresh) !== JSON.stringify(settings);
    settings = fresh;
    writeSettingsCache(settings);
    if (changed) applyPublicSettings();
    return settings;
  } catch (error) { console.warn("Não foi possível atualizar configurações públicas:", error); return settings; }
}

async function loadSettings() {
  const cached = readSettingsCache();
  if (cached?.settings) { settings = cached.settings; applyPublicSettings(); }
  // Never let the cache be the source of truth. Fetch current admin values in
  // the background on every page load.
  await refreshSettingsFromSupabase();
}

const deliveryFee = name => ({ "Maputo Cidade":Number(setting("delivery_maputo",400)), "Zonas Circunvizinhas":Number(setting("delivery_zonas",700)), "Matola":Number(setting("delivery_matola",1000)), "Levantamento Gratis":Number(setting("delivery_pickup",0)) }[name] ?? 0);
const paymentDetails = method => method === "M-Pesa" ? setting("mpesa_number",setting("mpesa",setting("mpesa_phone",""))) : method === "E-Mola" ? setting("emola_number",setting("emola",setting("emola_phone",""))) : method === "Transferencia Bancaria" ? setting("bank_details",setting("bank_transfer",setting("bank",""))) : "";

function applyDeliveryCards() {
  const section = [...document.querySelectorAll("section")].find(s => s.querySelector('[data-i18n="deliveryText"]')); if (!section) return;
  const values=[deliveryFee("Maputo Cidade"),deliveryFee("Zonas Circunvizinhas"),deliveryFee("Matola"),deliveryFee("Levantamento Gratis")], signature=values.join("|"); if(signature===lastDeliverySignature)return; lastDeliverySignature=signature;
  section.querySelectorAll(".delivery-card").forEach((card,index)=>{const price=card.querySelector(".text-2xl");if(price)price.textContent=values[index]===0?"Grátis":money(values[index]);});
}
function applyFaq(){const faq=document.querySelector("#faq");if(!faq)return;const questions=[1,2,3,4].map(i=>({q:setting(`faq_q${i}`,""),a:setting(`faq_a${i}`,"")})).filter(x=>x.q||x.a);const label=document.querySelector('[data-i18n="faqLabel"]'),title=document.querySelector('[data-i18n="faqTitle"]');if(label)label.textContent=setting("faq_label","Dúvidas frequentes");if(title)title.textContent=setting("faq_title","Perguntas frequentes");if(!questions.length)return;const markup=questions.map(item=>`<details class="bg-surface-container-low rounded-xl p-4"><summary class="font-semibold cursor-pointer">${escapeHtml(item.q)}</summary><p class="text-sm text-on-surface-variant mt-2">${escapeHtml(item.a)}</p></details>`).join("");if(markup!==lastFaqMarkup){lastFaqMarkup=markup;faq.innerHTML=markup;}}
function applyFooter(){const footer=document.querySelector("footer");if(!footer)return;const image=setting("footer_image",""),copy=setting("footer_text","Directo para a sua mesa: qualidade, conveniência e carinho em cada compra."),existing=footer.querySelector("#rfFooterBrandStory");if(existing)existing.remove();if(!image&&!copy)return;const block=document.createElement("div");block.id="rfFooterBrandStory";block.className="max-w-[1280px] mx-auto px-4 lg:px-16 mb-6";block.innerHTML=`<div class="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low flex flex-col sm:flex-row items-stretch"><div class="w-full sm:w-40 h-28 sm:h-auto bg-white overflow-hidden">${image?`<img src="${escapeHtml(image)}" alt="Rancho Flexível" loading="lazy" decoding="async" class="w-full h-full object-cover">`:""}</div><div class="p-4 sm:p-5 flex items-center"><p class="text-sm sm:text-base font-medium text-on-surface-variant leading-relaxed">${escapeHtml(copy)}</p></div></div>`;footer.prepend(block);}
function cartRows(){try{return JSON.parse(localStorage.getItem("rf_cart")||"[]")}catch{return[]}}
async function loadCheckoutProducts(){if(checkoutProducts)return checkoutProducts;const ids=cartRows().map(row=>String(row.id));if(!ids.length)return[];try{const {data,error}=await supabase.from("products").select("id,name,price,old_price").in("id",ids);if(error)throw error;checkoutProducts=data||[];return checkoutProducts}catch(e){console.warn("Não foi possível preparar o resumo do pedido:",e);return[]}}
async function patchCheckoutForm(){const form=document.querySelector("#rfCheckoutModal #rfForm");if(!form||form.dataset.rfPatched==="1")return;const deliverySelect=form.querySelector('select[name="delivery"]'),paymentSelect=form.querySelector('select[name="payment"]');if(!deliverySelect)return;form.dataset.rfPatched="1";deliverySelect.innerHTML=`<option value="">Seleccione Forma de entrega *</option>`+[["Maputo Cidade",deliveryFee("Maputo Cidade")],["Zonas Circunvizinhas",deliveryFee("Zonas Circunvizinhas")],["Matola",deliveryFee("Matola")],["Levantamento Gratis",deliveryFee("Levantamento Gratis")]].map(([name,fee])=>`<option value="${escapeHtml(name)}">${escapeHtml(name)} — ${fee===0?"Grátis":money(fee)}</option>`).join("");const paymentInfo=form.querySelector("#rfPaymentInfo"),paymentText=form.querySelector("#rfPaymentText"),summary=document.createElement("div");summary.id="rfManagedSummary";summary.className="rounded-xl bg-surface-container-low p-4 text-sm space-y-1";const buttons=form.querySelector("button[type=submit]")?.parentElement;if(buttons)buttons.parentElement.insertBefore(summary,buttons);const updateSummary=async()=>{const rows=cartRows(),products=await loadCheckoutProducts(),byId=new Map(products.map(p=>[String(p.id),p]));let subtotal=0;rows.forEach(row=>{const p=byId.get(String(row.id));subtotal+=Number(p?.price??row.price??0)*Number(row.qty||0)});const fee=deliveryFee(deliverySelect.value);summary.innerHTML=`<div class="flex justify-between"><span>Subtotal</span><b>${money(subtotal)}</b></div><div class="flex justify-between"><span>Entrega</span><b>${fee===0?"Grátis":money(fee)}</b></div><div class="flex justify-between text-base pt-1 border-t"><span>Total</span><b>${money(subtotal+fee)}</b></div>`};deliverySelect.onchange=updateSummary;updateSummary();if(paymentSelect)paymentSelect.onchange=()=>{const method=paymentSelect.value,details=paymentDetails(method);if(!paymentInfo||!paymentText)return;if(!method||method==="Numerário"){paymentInfo.classList.add("hidden");return}paymentInfo.classList.remove("hidden");paymentText.textContent=details||"Número/dados de pagamento a configurar no painel."};}
function applyPublicSettings(){applyDeliveryCards();applyFaq();applyFooter();patchCheckoutForm();}
const boot=()=>{applyPublicSettings();loadSettings().catch(error=>console.warn("Erro nas configurações públicas:",error));const observer=new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node?.id==="rfCheckoutModal"||node?.querySelector?.("#rfCheckoutModal"))))patchCheckoutForm()});observer.observe(document.body,{childList:true})};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
