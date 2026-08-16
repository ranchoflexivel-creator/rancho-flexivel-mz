const $ = (s, root = document) => root.querySelector(s);

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}

function enhanceProducts() {
  const heading = [...document.querySelectorAll('h1')].find(h => h.textContent.trim() === 'Produtos');
  const table = document.querySelector('table');
  if (!heading || !table || document.querySelector('#productAdminTools')) return;

  const wrapper = table.closest('.overflow-x-auto')?.parentElement || table.parentElement;
  if (!wrapper) return;

  const tools = document.createElement('div');
  tools.id = 'productAdminTools';
  tools.className = 'bg-white rounded-2xl p-4 shadow-sm mt-5 flex flex-col md:flex-row gap-3';
  tools.innerHTML = `
    <input id="productAdminSearch" type="search" placeholder="Pesquisar produto, SKU ou categoria…" class="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#00361a]/20">
    <select id="productAdminStock" class="border rounded-xl px-4 py-3">
      <option value="all">Todos os stocks</option>
      <option value="available">Disponíveis</option>
      <option value="low">Stock baixo (≤ 5)</option>
      <option value="empty">Sem stock</option>
    </select>
  `;
  wrapper.parentElement.insertBefore(tools, wrapper);

  const rows = () => [...table.querySelectorAll('tbody tr')];
  const apply = () => {
    const q = ($('#productAdminSearch')?.value || '').toLowerCase().trim();
    const stock = $('#productAdminStock')?.value || 'all';
    rows().forEach(row => {
      const text = row.textContent.toLowerCase();
      const stockCell = row.cells[3]?.textContent.trim() || '0';
      const qty = Number(stockCell.replace(/[^0-9.-]/g, '')) || 0;
      const matchesText = !q || text.includes(q);
      const matchesStock = stock === 'all' || (stock === 'available' && qty > 5) || (stock === 'low' && qty > 0 && qty <= 5) || (stock === 'empty' && qty <= 0);
      row.style.display = matchesText && matchesStock ? '' : 'none';
    });
  };
  $('#productAdminSearch').addEventListener('input', apply);
  $('#productAdminStock').addEventListener('change', apply);
}

function bind() {
  const h1 = document.querySelector('h1')?.textContent.trim();
  if (h1 === 'Produtos') enhanceProducts();
}

new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
setTimeout(bind, 250);
