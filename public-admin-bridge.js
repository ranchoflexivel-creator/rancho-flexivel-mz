(()=>{
const SUP='https://omwxktpktugunpkcxoim.supabase.co';
const KEY='sb_publishable_vNA-GPPgGCg_gCduUqPTqQ_QOnpuCnd';
let settings={};

const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const money=v=>`${Number(v||0).toLocaleString('pt-MZ',{minimumFractionDigits:2,maximumFractionDigits:2})} MZN`;
const readCart=()=>{try{return JSON.parse(localStorage.getItem('rf_cart')||'[]')}catch{return[]}};
const setting=(...keys)=>{for(const key of keys){const v=settings[key];if(v!==undefined&&v!==null&&String(v)!=='')return typeof v==='object'?(v.pt??v.en??Object.values(v)[0]??''):v}return''};
const feeFor=value=>{
  const n=norm(value);
  if(n==='maputo'||n.includes('maputo'))return Number(setting('delivery_maputo'))||400;
  if(n==='arredores'||n.includes('circun')||n.includes('arredor'))return Number(setting('delivery_zonas'))||700;
  if(n==='matola'||n.includes('matola'))return Number(setting('delivery_matola'))||1000;
  return Number(setting('delivery_pickup'))||0;
};
const subtotal=()=>readCart().reduce((sum,item)=>sum+Number(item.price||0)*Number(item.qty||0),0);
const saving=()=>readCart().reduce((sum,item)=>sum+Math.max(0,Number(item.old_price||0)-Number(item.price||0))*Number(item.qty||0),0);

function updateOrderSummary(){
  const delivery=document.querySelector('#delivery');
  const fee=feeFor(delivery?.value||'');
  const sub=subtotal();
  const total=sub+fee;
  const service=document.querySelector('#cartServiceFee');
  const cartTotal=document.querySelector('#cartTotal');
  if(service)service.textContent=fee?money(fee):'A definir';
  if(cartTotal)cartTotal.textContent=money(total);

  const box=document.querySelector('#checkoutSummary');
  if(!box)return;
  const items=readCart();
  const rows=items.map(item=>`<div class="flex justify-between text-sm"><span>${String(item.name||'').replace(/[&<>"']/g,'')}</span><b>${money(Number(item.price||0)*Number(item.qty||0))}</b></div>`).join('');
  box.innerHTML=`${rows}<hr><div class="flex justify-between"><span>Poupança</span><b>${money(saving())}</b></div><div class="flex justify-between"><span>Taxa de serviço</span><b>${fee?money(fee):'A definir'}</b></div><div class="flex justify-between font-bold"><span>Total</span><b>${money(total)}</b></div>`;
}

function bindDelivery(){
  const delivery=document.querySelector('#delivery');
  if(!delivery||delivery.dataset.rfFeeBound)return;
  delivery.dataset.rfFeeBound='1';
  delivery.addEventListener('change',updateOrderSummary);
  updateOrderSummary();
}

function interceptSubmit(){
  if(document.documentElement.dataset.rfOrderSubmitBound)return;
  document.documentElement.dataset.rfOrderSubmitBound='1';
  document.addEventListener('submit',event=>{
    if(event.target?.id!=='checkoutForm')return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const name=document.querySelector('#customerName')?.value.trim();
    const phone=document.querySelector('#customerPhone')?.value.trim();
    const delivery=document.querySelector('#delivery')?.value;
    const payment=document.querySelector('#payment')?.value;
    if(!name||!phone||!delivery||!payment)return;

    const items=readCart();
    const fee=feeFor(delivery);
    const sub=items.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.qty||0),0);
    const saved=items.reduce((sum,item)=>sum+Math.max(0,Number(item.old_price||0)-Number(item.price||0))*Number(item.qty||0),0);
    const total=sub+fee;
    const lines=items.map(item=>`• ${item.name} × ${item.qty} = ${money(Number(item.price||0)*Number(item.qty||0))}`).join('\n');
    const msg=[
      '*Novo pedido — Rancho Flexível*','',
      '*Produtos*',lines,'',
      `Poupança: ${money(saved)}`,
      `Taxa de serviço: ${fee?money(fee):'A definir'}`,
      `*Total: ${money(total)}*`,'',
      `Entrega: ${delivery}`,
      `Pagamento: ${payment}`,
      `Cliente: ${name}`,
      `Telefone: ${phone}`,
      `Endereço: ${document.querySelector('#address')?.value||'Não informado'}`,
      `Substituições: ${document.querySelector('input[name="substitution"]:checked')?.value||'contact'}`,
      `Observações: ${document.querySelector('#notes')?.value||'Nenhuma'}`
    ].join('\n');

    const wa=setting('whatsapp_number','whatsapp','phone');
    if(wa)window.open(`https://wa.me/${String(wa).replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`,'_blank');
  },true);
}

async function load(){
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const db=createClient(SUP,KEY);
    const {data}=await db.from('site_settings').select('key,value');
    settings=Object.fromEntries((data||[]).map(row=>[row.key,row.value]));
  }catch(error){console.warn('Order settings:',error)}
  bindDelivery();
  interceptSubmit();
  updateOrderSummary();
}

load();
setInterval(load,15000);
document.addEventListener('click',event=>{
  if(event.target.closest('#checkoutBtn'))setTimeout(()=>{bindDelivery();updateOrderSummary()},120);
});
})();