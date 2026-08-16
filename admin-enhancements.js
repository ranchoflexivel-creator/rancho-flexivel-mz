import { supabase } from './data.js';

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money = (v) => Number(v || 0).toLocaleString('pt-MZ',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' MZN';
const monthLabel = (key) => { const [y,m]=key.split('-').map(Number); return new Intl.DateTimeFormat('pt-MZ',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)); };

function isAdminShell(){ return !!document.querySelector('[data-tab="dashboard"]') && !!document.querySelector('main'); }

async function fetchAnalytics(){
  const [{data: orders, error: oe},{data: items, error: ie},{data: cats, error: ce},{data: products, error: pe}] = await Promise.all([
    supabase.from('orders').select('id,order_number,total,status,created_at,customer_name').order('created_at',{ascending:false}),
    supabase.from('order_items').select('order_id,product_id,product_name,quantity,unit_price'),
    supabase.from('categories').select('id,name'),
    supabase.from('products').select('id,category_id,name')
  ]);
  if(oe||ie||ce||pe) throw new Error((oe||ie||ce||pe).message);
  const catMap = Object.fromEntries((cats||[]).map(c=>[String(c.id), typeof c.name==='object' ? (c.name.pt||c.name.en||'Sem categoria') : (c.name||'Sem categoria')]));
  const prodMap = Object.fromEntries((products||[]).map(p=>[String(p.id),p]));
  const orderMap = Object.fromEntries((orders||[]).map(o=>[o.id,o]));
  const completed = (orders||[]).filter(o=>o.status !== 'cancelled');
  const monthly = {};
  for(const o of completed){ const key=o.created_at.slice(0,7); monthly[key] ||= {orders:0,revenue:0,items:0,categories:{}}; monthly[key].orders++; monthly[key].revenue += Number(o.total||0); }
  for(const i of (items||[])){
    const o=orderMap[i.order_id]; if(!o || o.status==='cancelled') continue;
    const key=o.created_at.slice(0,7); const m=monthly[key] ||= {orders:0,revenue:0,items:0,categories:{}};
    const qty=Number(i.quantity||0), value=qty*Number(i.unit_price||0); m.items += qty;
    const p=prodMap[String(i.product_id)]; const cat=catMap[String(p?.category_id)] || 'Sem categoria';
    m.categories[cat] ||= {qty:0,revenue:0}; m.categories[cat].qty += qty; m.categories[cat].revenue += value;
  }
  return {orders:orders||[],monthly,completed};
}

function renderDashboard(){
  const main=document.querySelector('main'); if(!main)return;
  main.innerHTML=`<div class="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><p class="text-sm text-[#717971]">Controlo comercial</p><h1 class="font-[Montserrat] text-3xl font-bold">Dashboard de saídas mensais</h1><p class="text-sm text-[#717971] mt-1">Vendas organizadas por mês e por categoria.</p></div><button id="refreshAnalytics" class="px-4 py-2 rounded-xl border bg-white">Actualizar</button></div><div id="analytics" class="mt-7"><div class="bg-white rounded-2xl p-6 shadow-sm">A carregar indicadores…</div></div>`;
  $('#refreshAnalytics').onclick=renderDashboard;
  fetchAnalytics().then(({monthly,completed})=>{
    const keys=Object.keys(monthly).sort().reverse();
    const current=keys[0] ? monthly[keys[0]] : {orders:0,revenue:0,items:0,categories:{}};
    const total=completed.reduce((s,o)=>s+Number(o.total||0),0);
    const html=`<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Vendas totais</p><b class="text-2xl">${money(total)}</b></div><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Pedidos válidos</p><b class="text-2xl">${completed.length}</b></div><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Mês em destaque</p><b class="text-2xl">${keys[0]?monthLabel(keys[0]):'—'}</b></div><div class="bg-white rounded-2xl p-5 shadow-sm"><p class="text-sm text-[#717971]">Vendas do mês</p><b class="text-2xl text-[#00361a]">${money(current.revenue)}</b></div></div><div class="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden"><div class="p-5 border-b"><h2 class="font-bold text-xl">Resumo por mês</h2><p class="text-sm text-[#717971]">Cada mês mostra pedidos, unidades e valor vendido.</p></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-[#f5f7f6]"><tr><th class="text-left p-4">Mês</th><th class="text-right p-4">Pedidos</th><th class="text-right p-4">Unidades</th><th class="text-right p-4">Vendas</th><th class="text-right p-4">Categorias</th></tr></thead><tbody>${keys.map(k=>{const m=monthly[k];return `<tr class="border-t"><td class="p-4 font-semibold capitalize">${esc(monthLabel(k))}</td><td class="p-4 text-right">${m.orders}</td><td class="p-4 text-right">${m.items}</td><td class="p-4 text-right font-bold">${money(m.revenue)}</td><td class="p-4 text-right">${Object.keys(m.categories).length}</td></tr>`}).join('') || '<tr><td colspan="5" class="p-8 text-center text-[#717971]">Ainda não existem vendas.</td></tr>'}</tbody></table></div></div>${keys.map(k=>{const m=monthly[k];const rows=Object.entries(m.categories).sort((a,b)=>b[1].revenue-a[1].revenue);return `<section class="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden"><div class="p-5 border-b flex items-center justify-between gap-3"><div><h2 class="font-bold text-xl capitalize">${esc(monthLabel(k))}</h2><p class="text-sm text-[#717971]">Vendas por categoria</p></div><strong>${money(m.revenue)}</strong></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-[#f5f7f6]"><tr><th class="text-left p-4">Categoria</th><th class="text-right p-4">Unidades</th><th class="text-right p-4">Valor vendido</th><th class="text-right p-4">Peso no mês</th></tr></thead><tbody>${rows.map(([cat,v])=>`<tr class="border-t"><td class="p-4 font-semibold">${esc(cat)}</td><td class="p-4 text-right">${v.qty}</td><td class="p-4 text-right font-bold">${money(v.revenue)}</td><td class="p-4 text-right">${m.revenue?((v.revenue/m.revenue)*100).toFixed(1):'0.0'}%</td></tr>`).join('') || '<tr><td colspan="4" class="p-8 text-center text-[#717971]">Sem itens neste mês.</td></tr>'}</tbody></table></div></section>`}).join('')}`;
    $('#analytics').innerHTML=html;
  }).catch(err=>{$('#analytics').innerHTML=`<div class="bg-white rounded-2xl p-6 shadow-sm text-red-700">Não foi possível carregar os indicadores: ${esc(err.message)}</div>`;});
}

async function renderOrdersByMonth(){
  const main=document.querySelector('main'); if(!main)return;
  main.innerHTML=`<div class="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><p class="text-sm text-[#717971]">Gestão de vendas</p><h1 class="font-[Montserrat] text-3xl font-bold">Pedidos por mês</h1><p class="text-sm text-[#717971] mt-1">Pedidos agrupados cronologicamente para controlo operacional.</p></div><button id="refreshOrders" class="px-4 py-2 rounded-xl border bg-white">Actualizar</button></div><div id="ordersByMonth" class="mt-7">A carregar pedidos…</div>`;
  $('#refreshOrders').onclick=renderOrdersByMonth;
  const {data,error}=await supabase.from('orders').select('*').order('created_at',{ascending:false});
  if(error){$('#ordersByMonth').innerHTML=`<div class="bg-white rounded-2xl p-6 text-red-700">${esc(error.message)}</div>`;return;}
  const groups={}; (data||[]).forEach(o=>{const k=o.created_at.slice(0,7);(groups[k] ||= []).push(o);});
  const keys=Object.keys(groups).sort().reverse();
  $('#ordersByMonth').innerHTML=keys.map(k=>{const list=groups[k], valid=list.filter(o=>o.status!=='cancelled'), revenue=valid.reduce((s,o)=>s+Number(o.total||0),0); return `<section class="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden"><div class="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><h2 class="font-bold text-xl capitalize">${esc(monthLabel(k))}</h2><p class="text-sm text-[#717971]">${list.length} pedido(s) · ${valid.length} válidos</p></div><strong class="text-[#00361a]">${money(revenue)}</strong></div><div class="divide-y">${list.map(o=>`<article class="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="font-bold">${esc(o.order_number || o.id)}</div><div class="text-sm text-[#717971]">${esc(o.customer_name)} · ${new Date(o.created_at).toLocaleString('pt-MZ')}</div><div class="text-xs mt-1">${esc(o.delivery_zone||'')} ${o.address?'· '+esc(o.address):''}</div></div><div class="flex items-center gap-4"><span class="px-3 py-1 rounded-full text-xs font-semibold bg-[#f1f5f2]">${esc(o.status)}</span><strong>${money(o.total)}</strong></div></article>`).join('')}</div></section>`}).join('') || `<div class="bg-white rounded-2xl p-8 text-center text-[#717971]">Ainda não existem pedidos.</div>`;
}

function bind(){
  if(!isAdminShell()) return;
  document.querySelectorAll('[data-tab="dashboard"]').forEach(btn=>{ if(btn.dataset.analyticsBound) return; btn.dataset.analyticsBound='1'; btn.addEventListener('click',()=>setTimeout(renderDashboard,50)); });
  document.querySelectorAll('[data-tab="orders"]').forEach(btn=>{ if(btn.dataset.ordersBound) return; btn.dataset.ordersBound='1'; btn.addEventListener('click',()=>setTimeout(renderOrdersByMonth,70)); });
  if(document.querySelector('h1')?.textContent?.trim()==='Dashboard' && !document.querySelector('#analytics')) renderDashboard();
}

new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
setTimeout(bind,200);
