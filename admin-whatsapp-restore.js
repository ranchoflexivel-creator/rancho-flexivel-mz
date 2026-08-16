import { supabase } from "./data.js";

const esc = value => String(value ?? "").replace(/[&<>\"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

async function readSettings(){
  const {data,error}=await supabase.from("site_settings").select("key,value");
  if(error) throw error;
  return Object.fromEntries((data||[]).map(r=>[r.key,r.value]));
}
async function save(values){
  const rows=Object.entries(values).map(([key,value])=>({key,value:typeof value==="string"?value:JSON.stringify(value),updated_at:new Date().toISOString()}));
  const {error}=await supabase.from("site_settings").upsert(rows,{onConflict:"key"});
  if(error) throw error;
}
function text(settings,...keys){
  for(const key of keys){const v=settings?.[key];if(v!==undefined&&v!==null&&String(v)!=="")return typeof v==="object"?(v.pt??Object.values(v)[0]??""):String(v)}
  return "";
}
function toast(message){const el=document.querySelector("#toast");if(!el)return;el.textContent=message;el.classList.remove("hidden");clearTimeout(window.__rfWhatsappToast);window.__rfWhatsappToast=setTimeout(()=>el.classList.add("hidden"),3000)}

async function mount(){
  if(document.querySelector("#rf-whatsapp-delivery-settings")) return;
  const anchor=document.querySelector("#rf-admin-settings-v2");
  if(!anchor) return setTimeout(mount,500);
  let settings;try{settings=await readSettings()}catch(e){console.error(e);return}
  const box=document.createElement("div");box.id="rf-whatsapp-delivery-settings";box.className="bg-white rounded-2xl p-6 shadow-sm";
  box.innerHTML=`
    <h2 class="font-[Montserrat] text-xl font-bold">Entrega via WhatsApp</h2>
    <p class="text-sm text-[#717971] mt-1">Configure o número que recebe os pedidos enviados pelo site público.</p>
    <div class="grid md:grid-cols-2 gap-4 mt-5">
      <label class="block text-sm font-semibold">Número de WhatsApp
        <input id="rfWhatsappNumber" type="tel" value="${esc(text(settings,"whatsapp_number","whatsapp","contact_whatsapp"))}" placeholder="+258 84 000 0000" class="mt-1 w-full border rounded-xl p-3 font-normal">
      </label>
      <label class="flex items-center gap-3 border rounded-xl p-3 mt-6 md:mt-0">
        <input id="rfWhatsappEnabled" type="checkbox" class="h-5 w-5" ${text(settings,"whatsapp_delivery_enabled","delivery_whatsapp_enabled")!=="false"?"checked":""}>
        <span><span class="font-semibold block">Entrega/pedidos via WhatsApp</span><span class="text-sm text-[#717971]">Permitir que o cliente envie o pedido diretamente pelo WhatsApp.</span></span>
      </label>
    </div>
    <div class="flex justify-end mt-5"><button id="rfSaveWhatsapp" type="button" class="px-5 py-3 bg-[#00361a] text-white rounded-xl font-bold shadow-sm">Guardar configuração</button></div>`;
  anchor.appendChild(box);
  document.querySelector("#rfSaveWhatsapp").onclick=async()=>{
    const btn=document.querySelector("#rfSaveWhatsapp");btn.disabled=true;
    try{
      const number=document.querySelector("#rfWhatsappNumber").value.trim();
      const enabled=document.querySelector("#rfWhatsappEnabled").checked;
      await save({whatsapp_number:number,whatsapp:number,whatsapp_delivery_enabled:enabled,delivery_whatsapp_enabled:enabled});
      toast("WhatsApp e entrega via WhatsApp guardados com sucesso.");
    }catch(e){toast(`Erro: ${e.message}`)}finally{btn.disabled=false}
  };
}
mount();
