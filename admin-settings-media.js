import { supabase } from "./data.js";

const ROOT_ID = "rf-admin-media-settings";
const esc = value => String(value ?? "").replace(/[&<>\"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

async function getSettings(){
  const {data,error}=await supabase.from("site_settings").select("key,value");
  if(error) throw error;
  return Object.fromEntries((data||[]).map(r=>[r.key,r.value]));
}

async function upload(file, folder){
  if(!file) return "";
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Use JPG, PNG ou WEBP.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=`${folder}/${crypto.randomUUID()}.${ext}`;
  const {error}=await supabase.storage.from("site-images").upload(path,file,{upsert:false,contentType:file.type,cacheControl:"31536000"});
  if(error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

async function save(values){
  const rows=Object.entries(values).map(([key,value])=>({key,value:JSON.stringify(value),updated_at:new Date().toISOString()}));
  const {error}=await supabase.from("site_settings").upsert(rows,{onConflict:"key"});
  if(error) throw error;
}

function mount(){
  const form=document.querySelector("#settingsForm");
  if(!form || document.querySelector(`#${ROOT_ID}`)) return;
  getSettings().then(settings=>{
    const section=document.createElement("section");
    section.id=ROOT_ID;
    section.className="bg-transparent mt-6 max-w-4xl space-y-6";
    const hero=settings.site_top_image||settings.hero_image||"";
    const footer=settings.site_footer_image||settings.footer_image||"";
    section.innerHTML=`
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-[Montserrat] text-xl font-bold">Imagens do site</h2>
        <p class="text-sm text-[#717971] mt-1">Gerencie separadamente as imagens usadas na página pública.</p>
        <div class="grid md:grid-cols-2 gap-6 mt-5">
          <div class="space-y-3">
            <label class="block text-sm font-semibold">Imagem do topo<input id="rfTopImage" type="file" accept="image/jpeg,image/png,image/webp" class="mt-2 w-full border rounded-xl p-3 font-normal"></label>
            <input id="rfTopImageUrl" value="${esc(hero)}" placeholder="URL da imagem (opcional)" class="w-full border rounded-xl p-3">
            <img id="rfTopPreview" src="${esc(hero)}" class="${hero?"":"hidden"} w-full h-40 object-cover rounded-xl border" alt="Pré-visualização do topo">
          </div>
          <div class="space-y-3">
            <label class="block text-sm font-semibold">Imagem do rodapé<input id="rfFooterImage" type="file" accept="image/jpeg,image/png,image/webp" class="mt-2 w-full border rounded-xl p-3 font-normal"></label>
            <input id="rfFooterImageUrl" value="${esc(footer)}" placeholder="URL da imagem (opcional)" class="w-full border rounded-xl p-3">
            <img id="rfFooterPreview" src="${esc(footer)}" class="${footer?"":"hidden"} w-full h-40 object-cover rounded-xl border" alt="Pré-visualização do rodapé">
          </div>
        </div>
        <div class="flex justify-end mt-5"><button id="rfSaveMedia" type="button" class="px-6 py-3 bg-[#00361a] text-white rounded-xl font-bold">Guardar imagens</button></div>
      </div>`;
    form.closest(".bg-white")?.insertAdjacentElement("afterend",section);

    const bindPreview=(fileId,urlId,previewId)=>{
      document.querySelector(`#${fileId}`).onchange=e=>{
        const f=e.target.files?.[0]; if(!f)return;
        document.querySelector(`#${urlId}`).value="";
        const preview=document.querySelector(`#${previewId}`);
        preview.src=URL.createObjectURL(f); preview.classList.remove("hidden");
      };
      document.querySelector(`#${urlId}`).oninput=e=>{
        const preview=document.querySelector(`#${previewId}`); const v=e.target.value.trim();
        preview.src=v; preview.classList.toggle("hidden",!v);
      };
    };
    bindPreview("rfTopImage","rfTopImageUrl","rfTopPreview");
    bindPreview("rfFooterImage","rfFooterImageUrl","rfFooterPreview");

    document.querySelector("#rfSaveMedia").onclick=async()=>{
      const button=document.querySelector("#rfSaveMedia");
      button.disabled=true; button.textContent="A guardar...";
      try{
        let top=document.querySelector("#rfTopImageUrl").value.trim();
        let footer=document.querySelector("#rfFooterImageUrl").value.trim();
        const topFile=document.querySelector("#rfTopImage").files?.[0];
        const footerFile=document.querySelector("#rfFooterImage").files?.[0];
        if(topFile) top=await upload(topFile,"site/top");
        if(footerFile) footer=await upload(footerFile,"site/footer");
        await save({site_top_image:top,site_footer_image:footer});
        const toast=document.querySelector("#toast");
        if(toast){toast.textContent="Imagens do site guardadas com sucesso.";toast.classList.remove("hidden");setTimeout(()=>toast.classList.add("hidden"),3000);}
      }catch(error){alert("Não foi possível guardar as imagens: "+error.message)}
      finally{button.disabled=false;button.textContent="Guardar imagens";}
    };
  }).catch(error=>console.error("Configuração de imagens:",error));
}

const observer=new MutationObserver(mount);
observer.observe(document.body,{childList:true,subtree:true});
mount();
