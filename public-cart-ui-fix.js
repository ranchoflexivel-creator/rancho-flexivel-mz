const style = document.createElement('style');
style.textContent = `
.rf-promo-highlight{display:inline-flex!important;align-items:center;gap:6px;background:#fff1d6!important;color:#8a5100!important;border:1px solid #fd9d27!important;border-radius:999px!important;padding:5px 10px!important;font-size:11px!important;font-weight:800!important;line-height:1!important}
.rf-add-highlight{background:#00361a!important;color:#fff!important;border-radius:12px!important;font-weight:700!important;box-shadow:0 5px 14px rgba(0,54,26,.18)!important}
.rf-add-highlight:disabled,.rf-unavailable{opacity:.62!important;cursor:not-allowed!important;background:#e5e9e6!important;color:#5d655f!important;box-shadow:none!important}
#rfStickyCart{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:45;width:min(620px,calc(100% - 24px));display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff;border:1px solid #c1c9bf;border-radius:18px;padding:10px 12px 10px 16px;box-shadow:0 12px 35px rgba(0,0,0,.18);backdrop-filter:blur(10px)}
#rfStickyCart .rf-sticky-count{font-weight:800;color:#00361a;font-size:14px}
#rfStickyCart .rf-sticky-button{border:0;background:#fd9d27;color:#fff;border-radius:12px;padding:10px 16px;font-weight:800;display:flex;align-items:center;gap:8px;cursor:pointer}
#rfStickyCart .rf-sticky-button:hover{background:#8a5100}
@media(max-width:480px){#rfStickyCart{bottom:8px}.rf-sticky-button{padding:9px 12px!important;font-size:13px}}
body{padding-bottom:82px}
`;
document.head.appendChild(style);
const $ = s => document.querySelector(s);
let lastCount = -1;
let uiFrame = 0;
function getCount(){return Number($('#cartCount')?.textContent||0)}
function updateSticky(){const count=getCount();if(count===lastCount)return;lastCount=count;const el=$('#rfStickyCartCount');if(el)el.textContent=`${count} ${count===1?'produto selecionado':'produtos selecionados'}`}
function openCart(){$('#cartBtn')?.click()}
function markUi(){const grid=$('#productGrid');if(!grid)return;grid.querySelectorAll('article').forEach(card=>{card.querySelectorAll('span,div').forEach(e=>{if(e.children.length===0&&/promoção/i.test(e.textContent||''))e.classList.add('rf-promo-highlight')});card.querySelectorAll('button').forEach(btn=>{if(/adicionar|add/i.test(btn.textContent||''))btn.classList.add('rf-add-highlight')})})}
function scheduleUi(){if(uiFrame)return;uiFrame=requestAnimationFrame(()=>{uiFrame=0;markUi();updateSticky()})}
function createSticky(){if($('#rfStickyCart'))return;const bar=document.createElement('div');bar.id='rfStickyCart';bar.setAttribute('aria-label','Resumo do pedido');bar.innerHTML='<div class="rf-sticky-count" id="rfStickyCartCount">0 produtos selecionados</div><button type="button" class="rf-sticky-button"><span class="material-symbols-outlined">shopping_cart</span><span>Ver pedido</span></button>';document.body.appendChild(bar);bar.querySelector('button').addEventListener('click',openCart);updateSticky()}
function addUnavailableDemo(){const grid=$('#productGrid');if(!grid||grid.querySelector('[data-rf-unavailable-demo]'))return;[['Produto de demonstração — Arroz','https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80','5 kg'],['Produto de demonstração — Leite','https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80','1 L'],['Produto de demonstração — Refrigerante','https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=700&q=80','2 L']].forEach(([name,image,unit])=>{const card=document.createElement('article');card.setAttribute('data-rf-unavailable-demo','true');card.className='bg-white rounded-2xl overflow-hidden border border-outline-variant shadow-sm';card.innerHTML=`<div class="relative h-[180px] overflow-hidden bg-surface-container-low"><img src="${image}" alt="${name}" class="w-full h-full object-cover opacity-70" loading="lazy" decoding="async"><span class="absolute top-3 left-3 rf-promo-highlight" style="background:#eef0ee!important;color:#5d655f!important;border-color:#c1c9bf!important">Indisponível</span></div><div class="p-4"><h3 class="font-bold text-sm">${name}</h3><div class="text-xs text-on-surface-variant mt-1">${unit}</div><button type="button" disabled class="rf-add-highlight rf-unavailable w-full mt-4 py-2.5 rounded-xl">Indisponível</button></div>`;grid.appendChild(card)})}
createSticky();
const grid=$('#productGrid');
if(grid)new MutationObserver(scheduleUi).observe(grid,{childList:true,subtree:true});
const cartCount=$('#cartCount');
if(cartCount)new MutationObserver(updateSticky).observe(cartCount,{childList:true,characterData:true,subtree:true});
scheduleUi();
setTimeout(addUnavailableDemo,2500);
