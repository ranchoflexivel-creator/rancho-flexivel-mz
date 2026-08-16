import { supabase } from "./data.js";

// Lightweight public-page resilience layer.
(() => {
  const steps = document.querySelector('#steps');
  const cats = document.querySelector('#categories');
  const kits = document.querySelector('#kitsGrid');
  const faq = document.querySelector('#faq');
  const grid = document.querySelector('#productGrid');

  if (steps && !steps.children.length) steps.innerHTML = [
    ['1','Escolha','Pesquise produtos e compare preços.'],['2','Monte o carrinho','Ajuste quantidades e veja o total.'],
    ['3','Envie o pedido','Envie o pedido pelo WhatsApp.'],['4','Acompanhe','A equipa confirma e actualiza o estado.']
  ].map(x => `<div class="text-center p-4 bg-white/10 rounded-2xl"><div class="w-10 h-10 mx-auto rounded-full bg-secondary-container flex items-center justify-center text-white font-bold">${x[0]}</div><h3 class="font-semibold mt-2">${x[1]}</h3><p class="text-xs opacity-80 mt-1">${x[2]}</p></div>`).join('');

  if (cats && !cats.children.length) cats.innerHTML = ['Arroz e cereais','Massas','Farinhas','Mercearia','Óleo e temperos','Leite e pequeno-almoço','Conservas','Molhos e temperos','Bebidas','Higiene e limpeza'].map(x => `<button type="button" class="shrink-0 px-4 py-2.5 rounded-full bg-white border border-outline-variant font-semibold shadow-sm">${x}</button>`).join('');

  if (kits && !kits.children.length) kits.innerHTML = [['Rancho Essencial','O básico indispensável para a sua cozinha.'],['Rancho Económico','Foco no rendimento e economia.'],['Rancho para Casal','Na medida certa para dois.'],['Rancho Familiar','Quantidade para toda a família.']].map(x => `<article class="bg-white rounded-2xl shadow-sm p-5"><span class="text-[10px] font-bold uppercase tracking-wider text-secondary">Combo do mês</span><h3 class="text-lg font-bold mt-2">${x[0]}</h3><p class="text-sm text-on-surface-variant mt-2">${x[1]}</p></article>`).join('');

  if (faq && !faq.children.length) faq.innerHTML = [['Preciso de criar uma conta?','Não. Pode montar o carrinho e enviar o pedido sem registo.'],['O pedido fica logo confirmado?','A equipa confirma primeiro a disponibilidade, as substituições e o prazo de entrega.'],['Como é calculada a taxa?','O valor depende da área escolhida e aparece no total antes do envio.'],['Posso levantar a encomenda?','Sim. Escolha levantamento para não pagar taxa de serviço.']].map(x => `<details class="bg-surface-container-low rounded-xl p-4"><summary class="font-semibold cursor-pointer">${x[0]}</summary><p class="text-sm text-on-surface-variant mt-2">${x[1]}</p></details>`).join('');

  // Product images: one small, one-shot query only after the product cards exist.
  // No permanent MutationObserver and no full product payload is downloaded.
  let imageLoaded = false;
  async function loadImages() {
    if (imageLoaded || !grid || !grid.querySelector('[data-add]')) return false;
    imageLoaded = true;
    try {
      const { data } = await supabase.from('products').select('id,image_url,image').eq('active', true);
      const byId = new Map((data || []).map(p => [String(p.id), p.image_url || p.image || '']));
      grid.querySelectorAll('[data-add]').forEach(btn => {
        const card = btn.closest('article');
        const url = byId.get(String(btn.dataset.add));
        if (!card || !url) return;
        const host = card.firstElementChild;
        if (!host) return;
        const img = document.createElement('img');
        img.src = url; img.alt = card.querySelector('h3')?.textContent || ''; img.loading = 'lazy'; img.decoding = 'async';
        img.className = 'w-full h-full min-h-[180px] object-cover rounded-xl';
        host.replaceChildren(img);
        host.className = 'h-[180px] overflow-hidden rounded-xl bg-surface-container-low';
      });
    } catch (err) { console.warn('Imagens públicas:', err); }
    return true;
  }

  let checks = 0;
  const timer = setInterval(async () => {
    checks += 1;
    await loadImages();
    const ready = (cats?.children.length || 0) && (kits?.children.length || 0) && (faq?.children.length || 0);
    if (ready && imageLoaded || checks >= 20) clearInterval(timer);
  }, 250);
})();
