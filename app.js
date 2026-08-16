import { getProducts, getCategories, getKits, getSettings } from "./data.js";

const state={lang:localStorage.getItem("rf_lang")||"pt",products:[],categories:[],kits:[],settings:{},cart:JSON.parse(localStorage.getItem("rf_cart")||"[]")};
const $=s=>document.querySelector(s);
const money=n=>`${Number(n||0).toLocaleString("pt-MZ",{minimumFractionDigits:2,maximumFractionDigits:2})} MZN`;
const text=v=>typeof v==="string"?v:(v?.[state.lang]||v?.pt||Object.values(v||{})[0]||"");
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const categoryName=id=>text((state.categories.find(c=>String(c.id)===String(id))||{}).name);
const product=id=>state.products.find(p=>String(p.id)===String(id));
const available=p=>p&&p.active!==false&&Number(p.stock??1)>0;
const emoji=n=>{n=norm(n);if(n.includes("lactic")||n.includes("leite"))return"🥛";if(n.includes("fresc")||n.includes("frut"))return"🥬";if(n.includes("carn"))return"🥩";if(n.includes("bebid"))return"🧃";if(n.includes("limpez"))return"🧹";if(n.includes("higien"))return"🧼";return"🛒"};
function toast(m){const e=$("#toast");if(!e)return;e.textContent=m;e.classList.remove("hidden");clearTimeout(window.rfToast);window.rfToast=setTimeout(()=>e.classList.add("hidden"),2200)}
function saveCart(){localStorage.setItem("rf_cart",JSON.stringify(state.cart));const e=$("#cartCount");if(e)e.textContent=state.cart.reduce((s,x)=>s+Number(x.qty||0),0)}

async function load(){
 const r=await Promise.allSettled([getProducts(),getCategories(),getKits(),getSettings()]);
 state.products=r[0].status==="fulfilled"&&Array.isArray(r[0].value)?r[0].value:[];
 state.categories=r[1].status==="fulfilled"&&Array.isArray(r[1].value)?r[1].value:[];
 state.kits=r[2].status==="fulfilled"&&Array.isArray(r[2].value)?r[2].value:[];
 state.settings=r[3].status==="fulfilled"&&r[3].value?r[3].value:{};
 renderAll();
}

function renderCategories(){
 const e=$("#categories");if(!e)return;
 const cats=[{id:"",name:"Todos"},...state.categories];
 e.className="category-scroll flex gap-3 overflow-x-auto pb-2";
 e.innerHTML=cats.map((c,i)=>`<button type="button" data-cat="${c.id}" class="shrink-0 px-5 py-3 rounded-full ${i===0?"bg-primary text-white":"bg-white border border-outline-variant hover:border-primary hover:text-primary"} font-semibold shadow-sm transition">${i===0?"Todos":emoji(text(c.name))+" "+text(c.name)}</button>`).join("");
 e.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{const f=$("#categoryFilter");if(f)f.value=b.dataset.cat;renderProducts();$("#produtos")?.scrollIntoView({behavior:"smooth"})});
}
function renderFilters(){const e=$("#categoryFilter");if(!e)return;e.innerHTML=`<option value="">Todos</option>`+state.categories.map(c=>`<option value="${c.id}">${text(c.name)}</option>`).join("")}

function renderProducts(){
 const e=$("#productGrid");if(!e)return;let list=state.products.filter(p=>p.active!==false);
 const q=norm($("#searchInput")?.value||""),cat=$("#categoryFilter")?.value||"",sort=$("#sortFilter")?.value||"default";
 if(q)list=list.filter(p=>norm(`${text(p.name)} ${text(p.description)} ${p.unit||""} ${text(p.tag)}`).includes(q));
 if(cat)list=list.filter(p=>String(p.category_id)===String(cat));
 if(sort==="priceAsc")list.sort((a,b)=>Number(a.price)-Number(b.price));
 if(sort==="priceDesc")list.sort((a,b)=>Number(b.price)-Number(a.price));
 if(sort==="name")list.sort((a,b)=>text(a.name).localeCompare(text(b.name),"pt"));
 if(!list.length){e.innerHTML=`<div class="col-span-full text-center py-12 text-on-surface-variant">Nenhum produto encontrado.</div>`;return}
 e.innerHTML=list.map(p=>{const ok=available(p),promo=Number(p.old_price)>Number(p.price);return `<article class="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden p-4 flex flex-col"><div class="h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-2xl">${emoji(categoryName(p.category_id))}</div><div class="flex-1"><div class="flex gap-2 flex-wrap mt-3">${p.tag?`<span class="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded">${text(p.tag)}</span>`:""}${promo?`<span class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">PROMOÇÃO</span>`:""}</div><h3 class="font-semibold mt-2">${text(p.name)}</h3><p class="text-xs text-on-surface-variant mt-1">${text(p.description)||""}</p></div><div class="flex items-end justify-between gap-3 mt-4"><div><span class="text-xs text-on-surface-variant">${p.unit||""}</span><div class="text-lg font-bold text-primary">${money(p.price)}</div>${promo?`<del class="text-xs text-outline">${money(p.old_price)}</del>`:""}</div><button type="button" data-add="${p.id}" ${ok?"":"disabled"} class="px-4 py-2.5 rounded-xl font-semibold ${ok?"bg-secondary-container text-white hover:bg-secondary":"bg-surface-container text-outline cursor-not-allowed"}">${ok?"Adicionar":"Indisponível"}</button></div></article>`}).join("");
 e.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(b.dataset.add));
}

const comboNames=["Combo Família","Combo Pequeno-Almoço","Combo Cozinha","Combo Económico","Combo Bebidas","Combo Higiene"];
const comboDesc=["Produtos básicos para uma família.","Pão, leite, cereais, café, açúcar, etc.","Arroz, óleo, farinha, feijão, temperos, etc.","Produtos essenciais pelo menor preço possível.","Sumos, água, refrigerantes, etc.","Detergente, sabão, papel higiénico, etc."];
function renderKits(){
 const e=$("#kitsGrid");if(!e)return;
 if(!state.kits.length){e.innerHTML=`<div class="col-span-full text-center py-10 text-on-surface-variant">Nenhum combo disponível.</div>`;return}
 e.innerHTML=state.kits.slice(0,6).map((k,i)=>{const ps=(Array.isArray(k.product_ids)?k.product_ids:[]).map(product).filter(Boolean);const name=comboNames[i]||text(k.name)||"Combo do Mês";const desc=comboDesc[i]||text(k.description)||"Kit pré-montado pensado para facilitar a sua rotina e garantir economia.";return `<article class="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"><div class="flex items-start justify-between gap-3"><div><span class="text-xs font-bold uppercase tracking-wider text-secondary">Combo do Mês</span><h3 class="text-xl font-bold mt-1">${name}</h3></div><span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">${money(k.price)}</span></div><p class="text-sm text-on-surface-variant mt-2">${desc}</p><div class="mt-4 space-y-1 flex-1">${ps.length?ps.map(p=>`<div class="flex items-center justify-between gap-3 py-2 border-b border-outline-variant last:border-0"><span class="text-sm">${text(p.name)}</span><span class="text-sm font-semibold">${money(p.price)}</span></div>`).join(""):"<div class="text-sm text-on-surface-variant">Produtos do combo a definir.</div>"}</div><button type="button" data-kit="${k.id}" class="mt-4 w-full py-2.5 rounded-xl bg-secondary-container text-white font-semibold hover:bg-secondary">Adicionar combo</button></article>`}).join("");
 e.querySelectorAll("[data-kit]").forEach(b=>b.onclick=()=>{const k=state.kits.find(x=>String(x.id)===String(b.dataset.kit));(k?.product_ids||[]).forEach(id=>{if(available(product(id)))add(id,false)});toast("Combo adicionado ao pedido")});
}

function renderSteps(){const e=$("#steps");if(!e)return;const a=["Escolha","Monte o carrinho","Envie o pedido","Acompanhe"],d=["Pesquise produtos e compare preços.","Ajuste quantidades e veja o total.","Envie o pedido pelo WhatsApp.","A equipa confirma e actualiza o estado."];e.innerHTML=a.map((x,i)=>`<div class="text-center p-5 bg-white/10 rounded-2xl"><div class="w-12 h-12 mx-auto rounded-full bg-secondary-container flex items-center justify-center text-white font-bold">${i+1}</div><h3 class="font-semibold mt-3">${x}</h3><p class="text-sm opacity-80 mt-1">${d[i]}</p></div>`).join("")}
function renderFaq(){const e=$("#faq");if(!e)return;const a=[["Preciso de criar uma conta?","Não. Pode montar o carrinho e enviar o pedido sem registo."],["O pedido fica logo confirmado?","A equipa confirma primeiro a disponibilidade, as substituições e o prazo de entrega."],["Como é calculada a taxa?","O valor depende da área escolhida e aparece no total antes do envio pelo WhatsApp."],["Posso levantar a encomenda?","Sim. Escolha levantamento para não pagar taxa de serviço."]];e.innerHTML=a.map(x=>`<details class="bg-surface-container-low rounded-xl p-4"><summary class="font-semibold cursor-pointer">${x[0]}</summary><p class="text-sm text-on-surface-variant mt-2">${x[1]}</p></details>`).join("")}

function add(id,show=true){const p=product(id);if(!available(p)){toast("Produto indisponível");return}const r=state.cart.find(x=>String(x.id)===String(id));if(r)r.qty++;else state.cart.push({id:p.id,qty:1});saveCart();renderCart();if(show)toast(`${text(p.name)} adicionado`)}
function remove(id){state.cart=state.cart.filter(x=>String(x.id)!==String(id));saveCart();renderCart()}
function change(id,d){const r=state.cart.find(x=>String(x.id)===String(id));if(!r)return;r.qty+=d;if(r.qty<=0)remove(id);else{saveCart();renderCart()}}
function totals(){let sub=0,save=0;state.cart.forEach(x=>{const p=product(x.id);if(!p)return;sub+=Number(p.price||0)*x.qty;if(Number(p.old_price)>Number(p.price))save+=(Number(p.old_price)-Number(p.price))*x.qty});return{sub,save,total:sub}}
function renderCart(){saveCart();const e=$("#cartItems");if(!e)return;const t=totals();e.innerHTML=state.cart.map(x=>{const p=product(x.id);if(!p)return"";return `<div class="border-b pb-3"><div class="flex justify-between gap-3"><div class="font-semibold text-sm">${text(p.name)}</div><div class="font-bold text-primary">${money(p.price*x.qty)}</div></div><div class="text-xs text-on-surface-variant mt-1">${p.unit||""}</div><div class="flex items-center gap-2 mt-2"><button data-minus="${p.id}" class="w-7 h-7 rounded bg-surface-container">−</button><span>${x.qty}</span><button data-plus="${p.id}" class="w-7 h-7 rounded bg-surface-container">+</button><button data-remove="${p.id}" class="ml-auto text-error text-xs">Remover</button></div></div>`}).join("")||`<div class="text-center py-10 text-on-surface-variant">O pedido está vazio.</div>`;if($("#cartSubtotal"))$("#cartSubtotal").textContent=money(t.sub);if($("#cartSaving"))$("#cartSaving").textContent=money(t.save);if($("#cartTotal"))$("#cartTotal").textContent=money(t.total);e.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>change(b.dataset.minus,-1));e.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>change(b.dataset.plus,1));e.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>remove(b.dataset.remove))}

function openCheckout(){if(!state.cart.length){toast("Adicione produtos primeiro.");return}$("#cartDrawer")?.classList.add("hidden");if($("#rfCheckoutModal"))return;const m=document.createElement("div");m.id="rfCheckoutModal";m.className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4";m.innerHTML=`<div class="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl"><div class="p-5 border-b flex justify-between items-center"><h2 class="hero-title text-2xl font-bold">O seu pedido</h2><button id="rfClose" class="p-2 rounded-full hover:bg-surface-container"><span class="material-symbols-outlined">close</span></button></div><form id="rfForm" class="p-5 space-y-4"><h3 class="font-bold text-lg">Dados do cliente</h3><div class="grid sm:grid-cols-2 gap-3"><input required name="name" placeholder="Nome completo *" class="w-full border border-outline-variant rounded-xl px-4 py-3"><input required name="phone" placeholder="Telefone *" class="w-full border border-outline-variant rounded-xl px-4 py-3"></div><select required name="delivery" class="w-full border border-outline-variant rounded-xl px-4 py-3"><option value="">Forma de entrega *</option><option>Maputo Cidade — 400 MT</option><option>Zonas Circunvizinhas — 700 MT</option><option>Matola — 1.000 MT</option><option>Levantamento Grátis</option></select><input name="address" placeholder="Endereço / ponto de referência" class="w-full border border-outline-variant rounded-xl px-4 py-3"><select name="payment" class="w-full border border-outline-variant rounded-xl px-4 py-3"><option>Numerário</option><option>M-Pesa</option><option>E-Mola</option><option>Transferência Bancária</option></select><select name="substitutions" class="w-full border border-outline-variant rounded-xl px-4 py-3"><option>Contactar antes</option><option>Sim, por produto equivalente</option><option>Não substituir</option></select><textarea name="notes" rows="3" placeholder="Observações" class="w-full border border-outline-variant rounded-xl px-4 py-3"></textarea><div class="flex gap-3"><button type="button" id="rfBack" class="flex-1 py-3 rounded-xl border border-outline-variant font-semibold">Voltar</button><button class="flex-1 py-3 rounded-xl bg-primary text-white font-semibold">Finalizar pelo WhatsApp</button></div></form></div>`;document.body.appendChild(m);$("#rfClose").onclick=()=>m.remove();$("#rfBack").onclick=()=>m.remove();$("#rfForm").onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target),t=totals(),lines=["*O seu pedido — Rancho Flexível*","",...state.cart.map(x=>{const p=product(x.id);return `• ${text(p.name)} — ${x.qty} x ${money(p.price)} = ${money(p.price*x.qty)}`}),"",`Subtotal: ${money(t.sub)}`,`Poupança: ${money(t.save)}`,"Taxa de serviço: A definir",`Total: ${money(t.total)}`,"",`Nome completo: ${f.get("name")}`,`Telefone: ${f.get("phone")}`,`Forma de entrega: ${f.get("delivery")}`,`Endereço / ponto de referência: ${f.get("address")||"Não informado"}`,`Pagamento: ${f.get("payment")}`,`Aceita substituições: ${f.get("substitutions")}`,`Observações: ${f.get("notes")||"Nenhuma"}`];const n=String(state.settings?.whatsapp||state.settings?.whatsapp_number||"258840000000").replace(/\D/g,"");window.open(`https://wa.me/${n}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank")}}

function bind(){
 const s=$("#searchInput");if(s)s.oninput=renderProducts;
 const c=$("#categoryFilter");if(c)c.onchange=renderProducts;
 const o=$("#sortFilter");if(o)o.onchange=renderProducts;
 const cart=$("#cartBtn");if(cart)cart.onclick=()=>{$("#cartDrawer")?.classList.remove("hidden");renderCart()};
 const close=$("#closeCart");if(close)close.onclick=()=>$("#cartDrawer")?.classList.add("hidden");
 const overlay=$("#cartOverlay");if(overlay)overlay.onclick=()=>$("#cartDrawer")?.classList.add("hidden");
 const checkout=$("#checkoutBtn");if(checkout)checkout.onclick=openCheckout;
 const lang=$("#languageSelect");if(lang){lang.value=state.lang;lang.onchange=()=>{state.lang=lang.value;localStorage.setItem("rf_lang",state.lang);renderAll()}}
}
function renderAll(){renderCategories();renderFilters();renderProducts();renderKits();renderSteps();renderFaq();renderCart();const y=$("#year");if(y)y.textContent=new Date().getFullYear();const h=$("#heroImage");if(h&&state.settings?.hero_image)h.src=state.settings.hero_image;const f=$("#footerContact");if(f)f.innerHTML=`${state.settings?.contact_email||"contato@ranchoflexivel.co.mz"}<br>${state.settings?.whatsapp||""}`;bind()}
load().catch(e=>console.error("Rancho Flexível:",e));