// Conteúdo mínimo de segurança: mantém as secções principais visíveis mesmo
// quando a ligação ao Supabase está lenta ou temporariamente indisponível.
(() => {
  const steps = document.querySelector('#steps');
  const categories = document.querySelector('#categories');
  const kits = document.querySelector('#kitsGrid');
  const faq = document.querySelector('#faq');

  const cards = [
    ['shopping_cart','1. Escolha os produtos','Navegue pelas categorias e adicione o que precisa ao pedido.'],
    ['edit_note','2. Monte o pedido','Confira quantidades, substituições e observações.'],
    ['local_shipping','3. Escolha a entrega','Indique a zona ou seleccione levantamento.'],
    ['whatsapp','4. Envie pelo WhatsApp','A equipa confirma disponibilidade, total e prazo.']
  ];
  const cats = ['Arroz e cereais','Massas','Farinhas','Mercearia','Óleo e temperos','Leite e pequeno-almoço','Conservas','Molhos e temperos','Bebidas','Higiene e limpeza'];
  const kitData = [
    ['Rancho Essencial','O básico indispensável para a sua cozinha.'],
    ['Rancho Económico','Uma seleção pensada para render mais e poupar.'],
    ['Rancho Família','Produtos essenciais para o dia a dia da família.']
  ];
  const faqs = [
    ['Como faço um pedido?','Escolha os produtos, adicione ao carrinho e envie o pedido pelo WhatsApp.'],
    ['Preciso criar uma conta?','Não. Pode montar o pedido e enviá-lo sem registo.'],
    ['Como funciona a entrega?','Escolha a zona de entrega. A taxa correspondente será considerada no total do pedido.'],
    ['Posso pedir substituições?','Sim. Pode indicar se aceita produtos equivalentes ou se prefere não substituir.']
  ];

  function render() {
    if (steps && !steps.children.length) steps.innerHTML = cards.map(([icon,title,desc]) => `<div class="bg-white/10 rounded-2xl p-5"><span class="material-symbols-outlined text-3xl">${icon}</span><h3 class="font-bold mt-3">${title}</h3><p class="text-sm text-white/75 mt-2 leading-relaxed">${desc}</p></div>`).join('');
    if (categories && !categories.children.length) categories.innerHTML = cats.map(name => `<button type="button" class="shrink-0 bg-white border border-outline-variant rounded-full px-4 py-3 text-sm font-semibold hover:border-primary">${name}</button>`).join('');
    if (kits && !kits.children.length) kits.innerHTML = kitData.map(([name,desc]) => `<article class="bg-white rounded-2xl p-5 shadow-sm"><div class="w-11 h-11 rounded-xl bg-secondary-container/20 text-primary flex items-center justify-center"><span class="material-symbols-outlined">inventory_2</span></div><h3 class="font-bold text-lg mt-4">${name}</h3><p class="text-sm text-on-surface-variant mt-2">${desc}</p></article>`).join('');
    if (faq && !faq.children.length) faq.innerHTML = faqs.map(([q,a]) => `<details class="border border-outline-variant rounded-xl p-4 bg-surface"><summary class="font-semibold cursor-pointer">${q}</summary><p class="text-sm text-on-surface-variant mt-3 leading-relaxed">${a}</p></details>`).join('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once:true}); else render();
})();
