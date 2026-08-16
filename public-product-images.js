import { supabase } from './data.js';

const localText=v=>{if(!v)return '';if(typeof v==='string')return v;return v.pt||v.en||v.fr||v.zh||v.chg||Object.values(v)[0]||'';};
const imageOf=p=>p?.image_url||p?.image||p?.photo_url||p?.imageUrl||'';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let products=[];

async function loadProducts(){
  const {data,error}=await supabase.from('products').select('*').order('sort_order',{ascending:true});
  if(error){console.warn('Não foi possível carregar imagens dos produtos:',error);return;}
  products=data||[];
  apply();
}

function productForCard(card){
  const explicit=card.dataset.productId||card.querySelector('[data-product-id]')?.dataset.productId;
  if(explicit){const p=products.find(x=>String(x.id)===String(explicit));if(p)return p;}
  const hay=norm(card.textContent);
  return products.find(p=>{const n=norm(localText(p.name));return n && hay.includes(n);})||null;
}

function apply(){
  const grid=document.querySelector('#productGrid');
  if(!grid||!products.length)return;
  const cards=[...grid.children];
  cards.forEach(card=>{
    const product=productForCard(card); if(!product)return;
    const url=imageOf(product); if(!url)return;
    let img=card.querySelector('img');
    let host=card.querySelector('[data-product-image],.product-image');
    if(!host)host=card.firstElementChild;
    if(!host)return;
    if(!img){
      host.innerHTML='';
      img=document.createElement('img');
      host.appendChild(img);
    }
    img.src=url;
    img.alt=localText(product.name);
    img.loading='lazy';
    img.decoding='async';
    img.style.display='block';
    img.style.width='100%';
    img.style.height='100%';
    img.style.minHeight='180px';
    img.style.objectFit='cover';
    img.onerror=()=>{console.warn('Imagem do produto não abriu:',product.id,url);};
  });
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
loadProducts();
