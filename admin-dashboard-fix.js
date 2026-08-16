import { supabase } from './data.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>Number(v||0).toLocaleString('pt-MZ',{minimumFractionDigits:2,maximumFractionDigits:2})+' MZN';
const monthLabel=k=>{const [y,m]=k.split('-').map(Number);return new Intl.DateTimeFormat('pt-MZ',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));};

async function dashboardData(){
  const {data:orders,error}=await supabase.from('orders').select('id,total,status,created_at').order('created_at',{ascending:false});
  if(error) throw error;
  const safe=orders||[];
  const valid=safe.filter(o=>o.status!=='cancelled');
  const monthly={};
  valid.forEach(o=>{const k=String(o.created_at||'').slice(0,7);if(!/^\\d{4}-\\d{2}$/.test(k))return;monthly[k] ||= {orders:0,revenue:0};monthly[k].orders++;monthly[k].revenue+=Number(o.total||0);});
  return {valid,monthly};
}

async function render(){
  const main=document.querySelector('main');
  if(!main||!document.querySelector('[data-tab="dashboard"]'))return;
  main.innerHTML=`<div class="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><p class="text-sm text-[#717971]">Controlo comercial</p><h1 class="font-[Montserrat] text-3xl font-bold">Dashboard de controlo</h1><p class="text-sm text-[#717971] mt-1">Resumo das vendas por mês.</p></div><button id="rfDashRefresh" class="px-4 py-2 rounded-xl border bg-white">Actualizar</button></div><div id="rfDashBody" class="mt-7"><div class="bg-white rounded-2xl p-6">A carregar indicadores…</div></div>`;
  document.querySelector('#rfDashRefresh').onclick=render;
  try{
    const {valid,monthly}=await dashboardData();
    const keys=Object.keys(monthly).sort().reverse();
    const current=keys[0]?monthly[keys[0]]:{orders:0,revenue:0};
    const total=valid.reduce((s,o)=>s+Number(o.total||0),0);
    document.querySelector('#rfDashBody').innerHTML=`<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Vendas totais</p><b class="text-2xl">${money(total)}</b></div><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Pedidos válidos</p><b class="text-2xl">${valid.length}</b></div><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Mês actual</p><b class="text-2xl">${keys[0]?esc(monthLabel(keys[0])):'—'}</b></div><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Vendas do mês</p><b class="text-2xl text-[#00361a]">${money(current.revenue)}</b></div></div><section class="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden"><div class="p-5 border-b"><h2 class="font-bold text-xl">Saídas mensais</h2><p class="text-sm text-[#717971]">Quando não existem vendas, os indicadores ficam em zero.</p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-[#f5f7f6]"><tr><th class="text-left p-4">Mês</th><th class="text-right p-4">Pedidos</th><th class="text-right p-4">Vendas</th></tr></thead><tbody>${keys.map(k=>`<tr class="border-t"><td class="p-4 font-semibold capitalize">${esc(monthLabel(k))}</td><td class="p-4 text-right">${monthly[k].orders}</td><td class="p-4 text-right font-bold">${money(monthly[k].revenue)}</td></tr>`).join('')||'<tr><td colspan="3" class="p-8 text-center text-[#717971]">Ainda não existem vendas. Indicadores: 0 pedidos · 0,00 MZN.</td></tr>'}</tbody></table></div></section><div class="mt-6 rounded-xl bg-[#eef7f0] p-4 text-sm text-[#245c34]">O detalhe por categoria será calculado quando existirem vendas e os itens dos pedidos estiverem disponíveis para a conta administrativa.</div>`;
  }catch(error){
    document.querySelector('#rfDashBody').innerHTML=`<div class="bg-white rounded-2xl p-6 shadow-sm"><p class="font-bold text-red-700">Não foi possível carregar os indicadores.</p><p class="text-sm mt-2 text-[#717971]">${esc(error.message)}</p><p class="text-sm mt-3">Se ainda não existem vendas, o painel deve mostrar 0; este erro indica apenas um problema de acesso aos dados.</p></div>`;
  }
}

function bind(){
  const btn=document.querySelector('[data-tab="dashboard"]');
  if(!btn||btn.dataset.rfDashFix)return;
  btn.dataset.rfDashFix='1';
  btn.addEventListener('click',()=>setTimeout(render,100));
  const h=document.querySelector('main h1');
  if(h&&/^Dashboard$/.test(h.textContent.trim()))setTimeout(render,100);
}
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
setTimeout(bind,250);
