// Public-page resilience layer: recover the catalogue if the main renderer is delayed or fails.
(() => {
  const URL = 'https://omwxktpktugunpkcxoim.supabase.co';
  const KEY = 'sb_publishable_vNA-GPPgGCg_gCduUqPTQq_QOnpuCnd';
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const text = v => typeof v === 'string' ? v : (v?.pt || Object.values(v || {})[0] || '');
  const money = n => `${Number(n || 0).toLocaleString('pt-MZ',{minimumFractionDigits:2,maximumFractionDigits:2})} MZN`;
  const image = v => String(v || '').trim();

  async function get(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const r = await fetch(`${URL}/rest/v1/${path}`, { headers, signal: controller.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  const productCard = p => {
    const src = image(p.image_url || p.image);
    const name = text(p.name) || 'Produto';
    const desc = text(p.description);
    const available = p.active !== false && Number(p.stock ?? 1) > 0;
    return `<article class="rf-recovery-product bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/40 flex flex-col" data-product-id="${String(p.id).replace(/"/g,'&quot;')}">
      <div class="h-44 bg-surface-container-low overflow-hidden">${src ? `<img src="${src}" alt="${name.replace(/"/g,'&quot;')}" class="w-full h-full object-cover" loading="lazy" decoding="async">` : `<div class="w-full h-full flex items-center justify-center text-5xl">🛒</div>`}</div>
      <div class="p-4 flex flex-col flex-1">
        <div class="text-xs text-secondary font-semibold">${available ? 'Disponível' : 'Indisponível'}</div>
        <h3 class="font-bold mt-1">${name}</h3>
        ${desc ? `<p class="text-xs text-on-surface-variant mt-1 line-clamp-2">${desc}</p>` : ''}
        <div class="mt-auto pt-4 flex items-center justify-between gap-2"><strong class="text-primary">${money(p.price)}</strong><button type="button" data-rf-add="${String(p.id).replace(/"/g,'&quot;')}" class="px-3 py-2 rounded-xl bg-secondary-container text-white text-sm font-semibold ${available ? '' : 'opacity-50 cursor-not-allowed'}" ${available ? '' : 'disabled'}>Adicionar</button></div>
      </div>
    </article>`;
  };

  const categoryCard = c => `<button type="button" data-rf-category="${c.id}" class="shrink-0 px-4 py-3 rounded-2xl bg-white border border-outline-variant shadow-sm font-semibold flex items-center gap-2"><span class="text-2xl">${c.icon && !c.icon.includes('_') ? c.icon : '🛒'}</span><span>${text(c.name)}</span></button>`;

  const kitCard = k => {
    const src = image(k.image_url);
    return `<article class="rf-recovery-kit bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/40" data-kit-id="${k.id}">${src ? `<img src="${src}" alt="${text(k.name)}" class="w-full h-48 object-cover" loading="lazy" decoding="async">` : ''}<div class="p-5"><span class="text-[10px] font-bold uppercase tracking-wider text-secondary">Combo do Mês</span><h3 class="text-lg font-bold mt-2">${text(k.name)}</h3><p class="text-sm text-on-surface-variant mt-2">${text(k.description)}</p><div class="mt-4 flex items-center justify-between"><strong class="text-primary">${money(k.price)}</strong><button type="button" data-rf-kit="${k.id}" class="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold">Adicionar combo</button></div></div></article>`;
  };

  async function recover() {
    try {
      const [products, categories, kits] = await Promise.all([
        get('products?select=id,name,description,category_id,price,old_price,unit,image_url,image,tag,stock,active,featured,sort_order&active=eq.true&order=sort_order.asc'),
        get('categories?select=id,name,description,icon,image_url,active,sort_order&active=eq.true&order=sort_order.asc'),
        get('bundles?select=id,name,description,price,product_ids,image_url,badge,active,sort_order&active=eq.true&order=sort_order.asc')
      ]);

      window.__RF_PUBLIC_DATA__ = { products, categories, kits };
      const productGrid = document.querySelector('#productGrid');
      const categoryGrid = document.querySelector('#categories');
      const kitsGrid = document.querySelector('#kitsGrid');

      // Only take over an empty/broken section. The main app remains the owner when it renders normally.
      if (productGrid && !productGrid.querySelector('[data-product-id]') && products.length) productGrid.innerHTML = products.map(productCard).join('');
      if (categoryGrid && !categoryGrid.querySelector('[data-rf-category]') && categories.length) categoryGrid.innerHTML = categories.map(categoryCard).join('');
      if (kitsGrid && !kitsGrid.querySelector('[data-kit-id]') && kits.length) kitsGrid.innerHTML = kits.map(kitCard).join('');

      document.querySelectorAll('#productGrid img,#kitsGrid img').forEach(img => { img.loading='lazy'; img.decoding='async'; });

      document.addEventListener('click', e => {
        const btn = e.target.closest('[data-rf-add]');
        if (!btn) return;
        const id = btn.dataset.rfAdd;
        const cart = JSON.parse(localStorage.getItem('rf_cart') || '[]');
        const item = cart.find(x => String(x.id) === String(id));
        if (item) item.qty = Number(item.qty || 0) + 1; else cart.push({ id, qty: 1 });
        localStorage.setItem('rf_cart', JSON.stringify(cart));
        const count = cart.reduce((s,x) => s + Number(x.qty || 0), 0);
        const badge = document.querySelector('#cartCount'); if (badge) badge.textContent = count;
        const toast = document.querySelector('#toast'); if (toast) { toast.textContent = 'Produto adicionado ao pedido.'; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 1800); }
      }, { once: true });
    } catch (error) {
      console.warn('Recuperação pública indisponível:', error);
    }
  }

  const fillStaticSections = () => {
    const steps = document.querySelector('#steps');
    const faq = document.querySelector('#faq');
    if (steps && !steps.children.length) steps.innerHTML = [['1','Escolha','Pesquise produtos e compare preços.'],['2','Monte o carrinho','Ajuste quantidades e veja o total.'],['3','Envie o pedido','Envie o pedido pelo WhatsApp.'],['4','Acompanhe','A equipa confirma e actualiza o estado.']].map(x => `<div class="text-center p-4 bg-white/10 rounded-2xl"><div class="w-10 h-10 mx-auto rounded-full bg-secondary-container flex items-center justify-center text-white font-bold">${x[0]}</div><h3 class="font-semibold mt-2">${x[1]}</h3><p class="text-xs opacity-80 mt-1">${x[2]}</p></div>`).join('');
    if (faq && !faq.children.length) faq.innerHTML = [['Preciso de criar uma conta?','Não. Pode montar o carrinho e enviar o pedido sem registo.'],['O pedido fica logo confirmado?','A equipa confirma primeiro a disponibilidade, as substituições e o prazo de entrega.'],['Como é calculada a taxa?','O valor depende da área escolhida e aparece no total antes do envio.'],['Posso levantar a encomenda?','Sim. Escolha levantamento para não pagar taxa de serviço.']].map(x => `<details class="bg-surface-container-low rounded-xl p-4"><summary class="font-semibold cursor-pointer">${x[0]}</summary><p class="text-sm text-on-surface-variant mt-2">${x[1]}</p></details>`).join('');
  };

  recover();
  setTimeout(fillStaticSections, 1200);
})();
