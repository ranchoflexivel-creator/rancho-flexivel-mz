import {
  supabase,
  getProducts,
  getCategories,
  getKits,
  getSettings
} from "./data.js";

const state = {
  lang: localStorage.getItem("rf_lang") || "pt",
  products: [],
  categories: [],
  kits: [],
  settings: {},
  cart: JSON.parse(localStorage.getItem("rf_cart") || "[]"),
  deliveryFee: 0,
  deliveryZone: ""
};

const $ = (s) => document.querySelector(s);

const money = (n) =>
  `${Number(n || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MZN`;

const text = (v) =>
  typeof v === "string"
    ? v
    : v?.[state.lang] ||
      v?.pt ||
      Object.values(v || {})[0] ||
      "";

const norm = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const productById = (id) =>
  state.products.find((p) => String(p.id) === String(id));

const categoryById = (id) =>
  state.categories.find((c) => String(c.id) === String(id));

const isAvailable = (p) =>
  !!p && p.active !== false && Number(p.stock ?? 1) > 0;

/* =========================================================
   TRADUÇÕES
========================================================= */

const I18N = {
  pt: {
    search: "O que procura hoje?",
    cart: "Carrinho",
    new: "MERCEARIA ONLINE · COMPRAS PELO WHATSAPP",
    heroTitle: "Faça o seu rancho sem sair de casa.",
    heroText:
      "Escolha os produtos, monte o carrinho e envie o pedido pelo WhatsApp. Simples, rápido e transparente.",
    start: "Começar a comprar →",
    how: "Como funciona",
    simple: "Simples e rápido",
    categories: "Categorias",
    find: "Encontre rapidamente o que precisa.",
    catalog: "CATÁLOGO COMPLETO",
    featured: "Produtos em destaque",
    prices: "Preços em meticais e promoções bem visíveis.",
    sort: "Ordenar",
    low: "Preço: menor",
    high: "Preço: maior",
    name: "Nome",
    all: "Todos",
    highlights: "Destaques",
    combo: "Combo do Mês",
    comboText:
      "Kits pré-montados pensados para facilitar a sua rotina e garantir economia.",
    delivery: "ENTREGAS",
    near: "Chegamos mais perto de si.",
    deliveryText:
      "A taxa é calculada automaticamente conforme a área escolhida.",
    faqLabel: "DÚVIDAS FREQUENTES",
    faqTitle: "Perguntas frequentes",
    order: "O seu pedido",
    products: "Produtos",
    subtotal: "Produtos",
    saving: "Poupança",
    service: "Taxa de serviço",
    total: "Total",
    continue: "Continuar para entrega",
    empty: "O pedido está vazio.",
    add: "Adicionar",
    unavailable: "Indisponível",
    none: "Nenhum produto encontrado.",
    comboNone: "Nenhum combo disponível.",
    addCombo: "Adicionar combo",
    customer: "Dados do cliente",
    fullName: "Nome completo *",
    phone: "Telefone *",
    deliveryMethod: "Forma de entrega *",
    address: "Endereço / ponto de referência",
    payment: "Pagamento",
    select: "Seleccione",
    substitution: "Aceita substituições?",
    contact: "Contactar antes",
    equivalent: "Sim, por produto equivalente",
    noReplace: "Não substituir",
    notes: "Observações",
    finish: "Finalizar pelo WhatsApp",
    back: "Voltar",
    cash: "Numerário",
    mpesa: "M-Pesa",
    emola: "E-Mola",
    bank: "Transferência Bancária",
    paymentInfo: "Dados para pagamento",
    accountPending:
      "Número/dados de pagamento a configurar no painel de administrador.",
    saved: "Pedido preparado para o WhatsApp.",
    emptyFirst: "Adicione produtos primeiro.",
    removed: "Produto removido.",
    added: "adicionado ao pedido.",
    comboAdded: "Combo adicionado ao pedido.",
    viewOrder: "Ver pedido",
    selected: "produtos selecionados",
    noAccount:
      "Não. Pode montar o carrinho e enviar o pedido sem registo.",
    confirm:
      "A equipa confirma primeiro a disponibilidade, as substituições e o prazo de entrega.",
    fee:
      "O valor depende da área escolhida e aparece no total antes do envio pelo WhatsApp.",
    pickup:
      "Sim. Escolha levantamento para não pagar taxa de serviço.",
    footerDescription: "A sua mercearia simples e próxima.",
    footerDelivery: "Maputo • Arredores • Matola",
    footerCreative:
      "Do nosso mercado para a sua mesa — escolha, peça e receba com simplicidade.",
    maputo: "Maputo Cidade",
    surroundings: "Zonas circunvizinhas",
    matola: "Matola",
    pickupName: "Levantamento — grátis",
    paymentChoose: "Seleccione o método de pagamento.",
    step1: "Escolha os produtos",
    step1Desc: "Pesquise e seleccione os produtos que precisa.",
    step2: "Monte o carrinho",
    step2Desc: "Ajuste quantidades e veja o total.",
    step3: "Envie o pedido",
    step3Desc: "Preencha os seus dados e envie pelo WhatsApp.",
    step4: "Acompanhe",
    step4Desc: "A equipa confirma disponibilidade e entrega."
  },

  en: {
    search: "What are you looking for today?",
    cart: "Cart",
    new: "ONLINE GROCERY · ORDERS VIA WHATSAPP",
    heroTitle: "Do your grocery shopping without leaving home.",
    heroText:
      "Choose products, build your cart and send your order through WhatsApp. Simple, fast and transparent.",
    start: "Start shopping →",
    how: "How it works",
    simple: "Simple and fast",
    categories: "Categories",
    find: "Quickly find what you need.",
    catalog: "FULL CATALOGUE",
    featured: "Featured products",
    prices: "Prices in meticais and promotions clearly shown.",
    sort: "Sort",
    low: "Lowest price",
    high: "Highest price",
    name: "Name",
    all: "All",
    highlights: "Highlights",
    combo: "Combo of the Month",
    comboText:
      "Pre-built kits designed to simplify your routine and save money.",
    delivery: "DELIVERY",
    near: "We are closer to you.",
    deliveryText:
      "The delivery fee is calculated automatically according to the selected area.",
    faqLabel: "FREQUENTLY ASKED QUESTIONS",
    faqTitle: "Frequently asked questions",
    order: "Your order",
    products: "Products",
    subtotal: "Products",
    saving: "Savings",
    service: "Service fee",
    total: "Total",
    continue: "Continue to delivery",
    empty: "Your order is empty.",
    add: "Add",
    unavailable: "Unavailable",
    none: "No products found.",
    comboNone: "No combos available.",
    addCombo: "Add combo",
    customer: "Customer details",
    fullName: "Full name *",
    phone: "Phone *",
    deliveryMethod: "Delivery method *",
    address: "Address / landmark",
    payment: "Payment",
    select: "Select",
    substitution: "Allow substitutions?",
    contact: "Contact me first",
    equivalent: "Yes, equivalent product",
    noReplace: "Do not substitute",
    notes: "Notes",
    finish: "Finish via WhatsApp",
    back: "Back",
    cash: "Cash",
    mpesa: "M-Pesa",
    emola: "E-Mola",
    bank: "Bank transfer",
    paymentInfo: "Payment details",
    accountPending:
      "Payment number/details must be configured in the admin panel.",
    saved: "Order prepared for WhatsApp.",
    emptyFirst: "Add products first.",
    removed: "Product removed.",
    added: "added to the order.",
    comboAdded: "Combo added to the order.",
    viewOrder: "View order",
    selected: "products selected",
    noAccount:
      "No. You can build the cart and send the order without registering.",
    confirm:
      "The team first confirms availability, substitutions and delivery time.",
    fee:
      "The amount depends on the selected area and appears in the total before sending via WhatsApp.",
    pickup:
      "Yes. Choose pickup to avoid the service fee.",
    footerDescription: "Your simple and nearby grocery store.",
    footerDelivery: "Maputo • Surroundings • Matola",
    footerCreative:
      "From our market to your table — choose, order and receive with simplicity.",
    maputo: "Maputo City",
    surroundings: "Surrounding areas",
    matola: "Matola",
    pickupName: "Pickup — free",
    paymentChoose: "Select a payment method.",
    step1: "Choose products",
    step1Desc: "Search and select the products you need.",
    step2: "Build your cart",
    step2Desc: "Adjust quantities and see the total.",
    step3: "Send your order",
    step3Desc: "Fill in your details and send via WhatsApp.",
    step4: "Follow your order",
    step4Desc: "The team confirms availability and delivery."
  },

  fr: {
    search: "Que cherchez-vous aujourd'hui ?",
    cart: "Panier",
    new: "ÉPICERIE EN LIGNE · COMMANDES VIA WHATSAPP",
    heroTitle: "Faites vos courses sans sortir de chez vous.",
    heroText:
      "Choisissez les produits, composez votre panier et envoyez la commande par WhatsApp. Simple, rapide et transparent.",
    start: "Commencer →",
    how: "Comment ça marche",
    simple: "Simple et rapide",
    categories: "Catégories",
    find: "Trouvez rapidement ce dont vous avez besoin.",
    catalog: "CATALOGUE COMPLET",
    featured: "Produits en vedette",
    prices: "Prix en meticais et promotions bien visibles.",
    sort: "Trier",
    low: "Prix croissant",
    high: "Prix décroissant",
    name: "Nom",
    all: "Tous",
    highlights: "À la une",
    combo: "Combo du mois",
    comboText:
      "Des kits préparés pour faciliter votre quotidien et économiser.",
    delivery: "LIVRAISONS",
    near: "Nous sommes plus proches de vous.",
    deliveryText:
      "Le tarif est calculé automatiquement selon la zone choisie.",
    faqLabel: "QUESTIONS FRÉQUENTES",
    faqTitle: "Questions fréquentes",
    order: "Votre commande",
    products: "Produits",
    subtotal: "Produits",
    saving: "Économie",
    service: "Frais de service",
    total: "Total",
    continue: "Continuer vers la livraison",
    empty: "Votre commande est vide.",
    add: "Ajouter",
    unavailable: "Indisponible",
    none: "Aucun produit trouvé.",
    comboNone: "Aucun combo disponible.",
    addCombo: "Ajouter le combo",
    customer: "Données du client",
    fullName: "Nom complet *",
    phone: "Téléphone *",
    deliveryMethod: "Mode de livraison *",
    address: "Adresse / point de repère",
    payment: "Paiement",
    select: "Sélectionnez",
    substitution: "Accepter les substitutions ?",
    contact: "Contacter avant",
    equivalent: "Oui, produit équivalent",
    noReplace: "Ne pas remplacer",
    notes: "Observations",
    finish: "Finaliser par WhatsApp",
    back: "Retour",
    cash: "Espèces",
    mpesa: "M-Pesa",
    emola: "E-Mola",
    bank: "Virement bancaire",
    paymentInfo: "Données de paiement",
    accountPending:
      "Numéro/données de paiement à configurer dans le panneau administrateur.",
    saved: "Commande préparée pour WhatsApp.",
    emptyFirst: "Ajoutez d'abord des produits.",
    removed: "Produit supprimé.",
    added: "ajouté à la commande.",
    comboAdded: "Combo ajouté à la commande.",
    viewOrder: "Voir la commande",
    selected: "produits sélectionnés",
    noAccount:
      "Non. Vous pouvez créer votre panier et envoyer la commande sans inscription.",
    confirm:
      "L'équipe confirme d'abord la disponibilité, les substitutions et le délai de livraison.",
    fee:
      "Le montant dépend de la zone choisie et apparaît dans le total avant l'envoi par WhatsApp.",
    pickup:
      "Oui. Choisissez le retrait pour éviter les frais de service.",
    footerDescription: "Votre épicerie simple et proche.",
    footerDelivery: "Maputo • Alentours • Matola",
    footerCreative:
      "De notre marché à votre table — choisissez, commandez et recevez en toute simplicité.",
    maputo: "Maputo Ville",
    surroundings: "Zones environnantes",
    matola: "Matola",
    pickupName: "Retrait — gratuit",
    paymentChoose: "Sélectionnez le mode de paiement.",
    step1: "Choisissez les produits",
    step1Desc: "Recherchez et sélectionnez les produits nécessaires.",
    step2: "Composez le panier",
    step2Desc: "Ajustez les quantités et consultez le total.",
    step3: "Envoyez la commande",
    step3Desc: "Remplissez vos données et envoyez via WhatsApp.",
    step4: "Suivez la commande",
    step4Desc: "L'équipe confirme la disponibilité et la livraison."
  },

  zh: {
    search: "今天想找什么？",
    cart: "购物车",
    new: "在线杂货店 · 通过 WhatsApp 下单",
    heroTitle: "足不出户完成您的日常采购。",
    heroText:
      "选择商品、建立购物车并通过 WhatsApp 发送订单。简单、快速、透明。",
    start: "开始购物 →",
    how: "使用方法",
    simple: "简单快速",
    categories: "分类",
    find: "快速找到您需要的商品。",
    catalog: "完整目录",
    featured: "精选商品",
    prices: "以梅蒂卡尔显示价格，并清晰标注促销。",
    sort: "排序",
    low: "价格最低",
    high: "价格最高",
    name: "名称",
    all: "全部",
    highlights: "精选",
    combo: "本月套餐",
    comboText: "预先搭配的套餐，让日常采购更轻松并节省开支。",
    delivery: "配送",
    near: "我们离您更近。",
    deliveryText: "配送费根据所选区域自动计算。",
    faqLabel: "常见问题",
    faqTitle: "常见问题",
    order: "您的订单",
    products: "商品",
    subtotal: "商品",
    saving: "节省",
    service: "服务费",
    total: "总计",
    continue: "继续配送",
    empty: "订单为空。",
    add: "添加",
    unavailable: "缺货",
    none: "未找到商品。",
    comboNone: "暂无套餐。",
    addCombo: "添加套餐",
    customer: "客户资料",
    fullName: "姓名 *",
    phone: "电话 *",
    deliveryMethod: "配送方式 *",
    address: "地址 / 参考点",
    payment: "付款",
    select: "请选择",
    substitution: "接受替换？",
    contact: "先联系我",
    equivalent: "是，使用同等商品",
    noReplace: "不要替换",
    notes: "备注",
    finish: "通过 WhatsApp 完成",
    back: "返回",
    cash: "现金",
    mpesa: "M-Pesa",
    emola: "E-Mola",
    bank: "银行转账",
    paymentInfo: "付款信息",
    accountPending: "付款号码/信息请在管理面板配置。",
    saved: "订单已准备发送到 WhatsApp。",
    emptyFirst: "请先添加商品。",
    removed: "商品已删除。",
    added: "已添加到订单。",
    comboAdded: "套餐已添加到订单。",
    viewOrder: "查看订单",
    selected: "件商品已选择",
    noAccount: "不需要。无需注册即可建立购物车并发送订单。",
    confirm: "团队会先确认库存、替换商品和配送时间。",
    fee: "金额取决于所选区域，并在通过 WhatsApp 发送前显示在总额中。",
    pickup: "可以。选择自取即可免服务费。",
    footerDescription: "简单、方便、离您更近的杂货店。",
    footerDelivery: "马普托 • 周边 • 马托拉",
    footerCreative: "从我们的市场到您的餐桌——选择、下单，简单送达。",
    maputo: "马普托市",
    surroundings: "周边地区",
    matola: "马托拉",
    pickupName: "自取 — 免费",
    paymentChoose: "请选择付款方式。",
    step1: "选择商品",
    step1Desc: "搜索并选择您需要的商品。",
    step2: "建立购物车",
    step2Desc: "调整数量并查看总额。",
    step3: "发送订单",
    step3Desc: "填写资料并通过 WhatsApp 发送。",
    step4: "跟踪订单",
    step4Desc: "团队确认库存和配送。"
  },

  chg: {
    search: "U lava yini namuntlha?",
    cart: "Nkarhi",
    new: "VUXAVISI BYA SWILO · TI-ODA HI WHATSAPP",
    heroTitle: "Xava swilo swa wena u nga humanga ekaya.",
    heroText:
      "Hlawula swilo, endla karhi kutani u rhumela oda hi WhatsApp. Swi olovile, swa hatlisa naswona swi le rivaleni.",
    start: "Sungula ku xava →",
    how: "Swi tirha ku yini",
    simple: "Swa olova naswona swa hatlisa",
    categories: "Swiphemu",
    find: "Kuma hi ku hatlisa leswi u swi lavaka.",
    catalog: "CATÁLOGO HINKWAWO",
    featured: "Swilo leswi hlawuriweke",
    prices: "Mintsengo hi meticais ni mapromoshini swi vonaka kahle.",
    sort: "Lulamisa",
    low: "Ntsengo wa le hansi",
    high: "Ntsengo wa le henhla",
    name: "Vito",
    all: "Hinkwawo",
    highlights: "Swihlawulekisi",
    combo: "Combo ya N'hweti",
    comboText:
      "Ti-kit leti lunghisiweke ku olovisa siku ra wena ni ku hlayisa mali.",
    delivery: "KU YISA",
    near: "Hi le kusuhi na wena.",
    deliveryText:
      "Mali ya ku yisa yi hlayiwa hi ku tiya hi ndhawu leyi hlawuriweke.",
    faqLabel: "SWIVUTISO",
    faqTitle: "Swivutiso leswi vutisiwaka ngopfu",
    order: "Oda ya wena",
    products: "Swilo",
    subtotal: "Swilo",
    saving: "Ku hlayisa",
    service: "Mali ya vutirheli",
    total: "Hinkwawo",
    continue: "Ya eka ku yisa",
    empty: "Oda yi hava swilo.",
    add: "Engetela",
    unavailable: "A swi kona",
    none: "A ku na swilo leswi kumiweke.",
    comboNone: "A ku na combo.",
    addCombo: "Engetela combo",
    customer: "Vuxokoxoko bya muxavi",
    fullName: "Vito hinkwaro *",
    phone: "Riqingho *",
    deliveryMethod: "Ndlela ya ku yisa *",
    address: "Adirese / ndhawu ya ku komba",
    payment: "Ku hakela",
    select: "Hlawula",
    substitution: "U amukela ku cinciwa?",
    contact: "Ntsundzuxa eku sunguleni",
    equivalent: "Ina, xitirhisiwa lexi ringanaka",
    noReplace: "U nga cinci",
    notes: "Switsundzuxo",
    finish: "Hetisa hi WhatsApp",
    back: "Vuyela",
    cash: "Mali",
    mpesa: "M-Pesa",
    emola: "E-Mola",
    bank: "Ku hundzisa mali",
    paymentInfo: "Vuxokoxoko bya ku hakela",
    accountPending: "Vuxokoxoko bya ku hakela byi fanele ku vekiwa eka admin.",
    saved: "Oda yi lunghisiwe ku ya WhatsApp.",
    emptyFirst: "Sungula hi ku engetela swilo.",
    removed: "Xitirhisiwa xi susiwile.",
    added: "xi engeteriwile eka oda.",
    comboAdded: "Combo yi engeteriwile eka oda.",
    viewOrder: "Vona oda",
    selected: "swilo leswi hlawuriweke",
    noAccount: "E-e. U nga endla oda u nga tsarisanga.",
    confirm:
      "Ntlawa wu sungula hi ku tiyisisa leswi nga kona, ku cinciwa ni nkarhi wa ku yisa.",
    fee:
      "Mali yi ya hi ndhawu leyi hlawuriweke naswona yi vonaka eka ntsengo loko u nga si rhumela hi WhatsApp.",
    pickup:
      "Ina. Hlawula ku teka hi wexe leswaku u nga hakeli mali ya vutirheli.",
    footerDescription: "Vuxavisi bya wena byo olova naswona byi le kusuhi.",
    footerDelivery: "Maputo • Matlhelo • Matola",
    footerCreative:
      "Ku suka emakete wa hina ku ya etafuleni ra wena — hlawula, oda u tlhela u kuma swilo hi ku olova.",
    maputo: "Maputo Cidade",
    surroundings: "Matlhelo",
    matola: "Matola",
    pickupName: "Ku teka — mahala",
    paymentChoose: "Hlawula ndlela ya ku hakela.",
    step1: "Hlawula swilo",
    step1Desc: "Lavisisa u tlhela u hlawula leswi u swi lavaka.",
    step2: "Endla karhi",
    step2Desc: "Cinca nhlayo u vona ntsengo.",
    step3: "Rhumela oda",
    step3Desc: "Nghenisa vuxokoxoko u rhumela hi WhatsApp.",
    step4: "Landzelela",
    step4Desc: "Ntlawa wu tiyisisa swilo ni ku yisa."
  }
};

const t = (key) =>
  I18N[state.lang]?.[key] ||
  I18N.pt[key] ||
  key;

/* =========================================================
   CATEGORIAS PEDIDAS
========================================================= */

const CATEGORY_ORDER = [
  "Todos",
  "Arroz e cereais",
  "Massas",
  "Farinhas",
  "Mercearia",
  "Óleo e temperos",
  "Leite e pequeno-almoço",
  "Conservas",
  "Molhos e temperos",
  "Bebidas",
  "Higiene e limpeza"
];

function categoryEmoji(name) {
  const n = norm(name);

  if (n === "todos") return "🛒";
  if (n.includes("arroz") || n.includes("cereal")) return "🍚";
  if (n.includes("massa")) return "🍝";
  if (n.includes("farinha")) return "🌾";
  if (n === "mercearia") return "🛒";
  if (n.includes("oleo") || n.includes("temper")) return "🫒";
  if (n.includes("leite") || n.includes("pequeno")) return "🥛";
  if (n.includes("conserv")) return "🥫";
  if (n.includes("molho")) return "🫙";
  if (n.includes("bebid")) return "🧃";
  if (n.includes("higiene") || n.includes("limpez")) return "🧼";

  if (n.includes("lactic")) return "🥛";
  if (n.includes("fresc")) return "🥬";
  if (n.includes("frut")) return "🍎";
  if (n.includes("veget")) return "🥬";
  if (n.includes("carn")) return "🥩";

  return "🛒";
}

/* =========================================================
   COMBOS
========================================================= */

const COMBO_TYPES = [
  {
    name: "Combo Econômico",
    description:
      "Kits com produtos essenciais a preços reduzidos, focados em economia."
  },
  {
    name: "Combo Família",
    description:
      "Quantidades maiores ou embalagens múltiplas, ideais para consumo coletivo."
  },
  {
    name: "Combo Prático",
    description:
      "Itens pré-montados para facilitar a rotina, como café da manhã pronto ou kit almoço rápido."
  },
  {
    name: "Combo Saúde & Bem-estar",
    description:
      "Produtos naturais, integrais ou funcionais, voltados para quem busca qualidade de vida."
  },
  {
    name: "Combo Gourmet",
    description:
      "Seleção de itens premium ou diferenciados, para quem gosta de experimentar novidades."
  },
  {
    name: "Combo Temático",
    description:
      "Kits sazonais ou comemorativos, como Dia das Mães, Natal ou Volta às Aulas."
  },
  {
    name: "Combo Personalizado",
    description:
      "Opção de o cliente montar o seu próprio kit com base nas suas preferências."
  },
  {
    name: "Combo Fidelidade",
    description:
      "Pacotes exclusivos para clientes recorrentes, com bônus ou descontos adicionais."
  }
];

/* =========================================================
   UTILITÁRIOS
========================================================= */

function toast(message) {
  const e = $("#toast");
  if (!e) return;

  e.textContent = message;
  e.classList.remove("hidden");

  clearTimeout(window.rfToastTimer);

  window.rfToastTimer = setTimeout(() => {
    e.classList.add("hidden");
  }, 2200);
}

function saveCart() {
  localStorage.setItem("rf_cart", JSON.stringify(state.cart));

  const count = state.cart.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  const e = $("#cartCount");
  if (e) e.textContent = count;

  updateFloatingCart();
}

function setting(...keys) {
  for (const key of keys) {
    const value = state.settings?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

/* =========================================================
   CARREGAMENTO
========================================================= */

async function loadData() {
  const results = await Promise.allSettled([
    getProducts(),
    getCategories(),
    getKits(),
    getSettings()
  ]);

  state.products =
    results[0].status === "fulfilled" &&
    Array.isArray(results[0].value)
      ? results[0].value
      : [];

  state.categories =
    results[1].status === "fulfilled" &&
    Array.isArray(results[1].value)
      ? results[1].value
      : [];

  state.kits =
    results[2].status === "fulfilled" &&
    Array.isArray(results[2].value)
      ? results[2].value
      : [];

  state.settings =
    results[3].status === "fulfilled" &&
    results[3].value
      ? results[3].value
      : {};

  renderAll();
}

/* =========================================================
   CATEGORIAS
========================================================= */

function findCategoryByName(name) {
  const target = norm(name);

  return state.categories.find(
    (category) => norm(text(category.name)) === target
  );
}

function renderCategories() {
  const e = $("#categories");
  if (!e) return;

  const ordered = [];

  for (const wanted of CATEGORY_ORDER) {
    if (wanted === "Todos") {
      ordered.push({
        id: "",
        name: "Todos"
      });
      continue;
    }

    const found = findCategoryByName(wanted);

    if (found) {
      ordered.push(found);
    } else {
      ordered.push({
        id: `virtual-${norm(wanted).replace(/\s+/g, "-")}`,
        name: wanted,
        virtual: true
      });
    }
  }

  e.innerHTML = ordered
    .map(
      (category, index) => `
        <button
          type="button"
          data-cat="${category.id}"
          data-cat-name="${category.virtual ? category.name : ""}"
          class="
            rf-cat shrink-0
            px-4 py-2.5
            rounded-full
            ${
              index === 0
                ? "bg-primary text-white"
                : "bg-white border border-outline-variant hover:border-primary hover:text-primary"
            }
            font-semibold shadow-sm transition
          "
        >
          ${categoryEmoji(category.name)}
          ${category.virtual ? category.name : text(category.name)}
        </button>
      `
    )
    .join("");

  e.querySelectorAll("[data-cat]").forEach((button) => {
    button.addEventListener("click", () => {
      const categoryId = button.dataset.cat;
      const categoryName = button.dataset.catName;

      const filter = $("#categoryFilter");

      if (filter) {
        if (!categoryId.startsWith("virtual-")) {
          filter.value = categoryId;
        } else {
          filter.value = "";
        }
      }

      if (categoryName) {
        renderProducts(categoryName);
      } else {
        renderProducts();
      }
    });
  });
}

/* =========================================================
   FILTROS
========================================================= */

function renderFilters() {
  const e = $("#categoryFilter");
  if (!e) return;

  e.innerHTML =
    `<option value="">${t("all")}</option>` +
    state.categories
      .map(
        (category) =>
          `<option value="${category.id}">${text(category.name)}</option>`
      )
      .join("");
}

/* =========================================================
   PRODUTOS
========================================================= */

function productImage(product) {
  return (
    product.image_url ||
    product.image ||
    product.photo ||
    product.imageUrl ||
    ""
  );
}

function renderProducts(forcedCategoryName = "") {
  const e = $("#productGrid");
  if (!e) return;

  let list = state.products.filter(
    (product) => product.active !== false
  );

  const q = norm($("#searchInput")?.value || "");
  const cat = $("#categoryFilter")?.value || "";
  const sort = $("#sortFilter")?.value || "default";

  if (q) {
    list = list.filter((product) =>
      norm(
        `${text(product.name)}
         ${text(product.description)}
         ${product.unit || ""}
         ${text(product.tag)}`
      ).includes(q)
    );
  }

  if (forcedCategoryName) {
    list = list.filter((product) => {
      const category = categoryById(product.category_id);
      return (
        norm(text(category?.name)) ===
        norm(forcedCategoryName)
      );
    });
  } else if (cat) {
    list = list.filter(
      (product) =>
        String(product.category_id) === String(cat)
    );
  }

  if (sort === "priceAsc") {
    list.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  }

  if (sort === "priceDesc") {
    list.sort(
      (a, b) => Number(b.price) - Number(a.price)
    );
  }

  if (sort === "name") {
    list.sort((a, b) =>
      text(a.name).localeCompare(
        text(b.name),
        state.lang
      )
    );
  }

  if (!list.length) {
    e.innerHTML = `
      <div class="col-span-full text-center py-12 text-on-surface-variant">
        ${t("none")}
      </div>
    `;
    return;
  }

  e.innerHTML = list
    .map((product) => {
      const available = isAvailable(product);
      const promo =
        Number(product.old_price) >
        Number(product.price);

      const categoryName = text(
        categoryById(product.category_id)?.name
      );

      const image = productImage(product);

      return `
        <article
          class="
            bg-white rounded-2xl shadow-sm
            hover:shadow-md transition overflow-hidden
            flex flex-col
          "
        >
          ${
            image
              ? `
                <div class="h-40 overflow-hidden bg-surface-container-low">
                  <img
                    src="${image}"
                    alt="${text(product.name)}"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    onerror="this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-4xl&quot;>${categoryEmoji(
                      categoryName
                    )}</div>'"
                  >
                </div>
              `
              : `
                <div class="h-40 bg-surface-container-low flex items-center justify-center text-4xl">
                  ${categoryEmoji(categoryName)}
                </div>
              `
          }

          <div class="p-4 flex flex-col flex-1">
            <div class="flex gap-2 flex-wrap">
              ${
                product.tag && text(product.tag)
                  ? `
                    <span class="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded">
                      ${text(product.tag)}
                    </span>
                  `
                  : ""
              }

              ${
                promo
                  ? `
                    <span class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">
                      PROMOÇÃO
                    </span>
                  `
                  : ""
              }
            </div>

            <h3 class="font-semibold mt-2">
              ${text(product.name)}
            </h3>

            <p class="text-xs text-on-surface-variant mt-1">
              ${text(product.description) || ""}
            </p>

            <div class="flex items-end justify-between gap-3 mt-4">
              <div>
                <span class="text-xs text-on-surface-variant">
                  ${product.unit || ""}
                </span>

                <div class="text-lg font-bold text-primary">
                  ${money(product.price)}
                </div>

                ${
                  promo
                    ? `
                      <del class="text-xs text-outline">
                        ${money(product.old_price)}
                      </del>
                    `
                    : ""
                }
              </div>

              <button
                type="button"
                data-add="${product.id}"
                ${available ? "" : "disabled"}
                class="
                  px-4 py-2.5 rounded-xl font-semibold
                  ${
                    available
                      ? "bg-secondary-container text-white hover:bg-secondary"
                      : "bg-surface-container text-outline cursor-not-allowed"
                  }
                "
              >
                ${available ? t("add") : t("unavailable")}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  e.querySelectorAll("[data-add]").forEach(
    (button) => {
      button.addEventListener("click", () =>
        addToCart(button.dataset.add)
      );
    }
  );
}

/* =========================================================
   COMBOS
========================================================= */

function renderKits() {
  const e = $("#kitsGrid");
  if (!e) return;

  if (!state.kits.length) {
    e.innerHTML = `
      <div class="col-span-full text-center py-10 text-on-surface-variant">
        ${t("comboNone")}
      </div>
    `;
    return;
  }

  e.innerHTML = state.kits
    .slice(0, 8)
    .map((kit, index) => {
      const type =
        COMBO_TYPES[index] || {
          name: text(kit.name),
          description: text(kit.description)
        };

      const products = (
        Array.isArray(kit.product_ids)
          ? kit.product_ids
          : []
      )
        .map(productById)
        .filter(Boolean);

      return `
        <article
          class="
            bg-white rounded-2xl shadow-sm
            hover:shadow-md transition p-4
            flex flex-col min-w-0
          "
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <span
                class="
                  text-[10px] font-bold uppercase
                  tracking-wider text-secondary
                "
              >
                ${t("combo")}
              </span>

              <h3
                class="
                  text-base sm:text-lg font-bold mt-1
                  break-words leading-tight
                "
              >
                ${type.name}
              </h3>
            </div>

            <span
              class="
                bg-primary text-white px-2 py-1
                rounded-full text-xs font-bold
                whitespace-nowrap
              "
            >
              ${money(kit.price)}
            </span>
          </div>

          <p
            class="
              text-xs text-on-surface-variant
              mt-2 leading-relaxed
            "
          >
            ${type.description}
          </p>

          <div class="mt-3 space-y-1 flex-1">
            ${
              products.length
                ? products
                    .map(
                      (product) => `
                        <div
                          class="
                            flex items-center
                            justify-between gap-2
                            py-1.5 border-b
                            border-outline-variant
                          "
                        >
                          <span class="text-xs break-words">
                            ${text(product.name)}
                          </span>

                          <span
                            class="
                              text-xs font-semibold
                              whitespace-nowrap
                            "
                          >
                            ${money(product.price)}
                          </span>
                        </div>
                      `
                    )
                    .join("")
                : `
                  <div class="text-xs text-on-surface-variant">
                    Produtos do combo a definir.
                  </div>
                `
            }
          </div>

          <button
            type="button"
            data-kit="${kit.id}"
            class="
              mt-3 w-full py-2 rounded-xl
              bg-secondary-container text-white
              text-sm font-semibold
              hover:bg-secondary
            "
          >
            ${t("addCombo")}
          </button>
        </article>
      `;
    })
    .join("");

  e.querySelectorAll("[data-kit]").forEach(
    (button) => {
      button.addEventListener("click", () => {
        const kit = state.kits.find(
          (item) =>
            String(item.id) ===
            String(button.dataset.kit)
        );

        if (!kit) return;

        (
          Array.isArray(kit.product_ids)
            ? kit.product_ids
            : []
        ).forEach((id) => {
          if (isAvailable(productById(id))) {
            addToCart(id, false);
          }
        });

        toast(t("comboAdded"));
      });
    }
  );
}

/* =========================================================
   COMO FUNCIONA
========================================================= */

function renderSteps() {
  const e = $("#steps");
  if (!e) return;

  const steps = [
    [t("step1"), t("step1Desc")],
    [t("step2"), t("step2Desc")],
    [t("step3"), t("step3Desc")],
    [t("step4"), t("step4Desc")]
  ];

  e.innerHTML = steps
    .map(
      ([title, description], index) => `
        <div
          class="
            text-center p-4 bg-white/10
            rounded-2xl
          "
        >
          <div
            class="
              w-10 h-10 mx-auto rounded-full
              bg-secondary-container
              flex items-center justify-center
              text-white font-bold
            "
          >
            ${index + 1}
          </div>

          <h3 class="font-semibold mt-2">
            ${title}
          </h3>

          <p class="text-xs opacity-80 mt-1">
            ${description}
          </p>
        </div>
      `
    )
    .join("");
}

/* =========================================================
   FAQ
========================================================= */

function renderFaq() {
  const e = $("#faq");
  if (!e) return;

  const questions = {
    pt: [
      "Preciso de criar uma conta?",
      "O pedido fica logo confirmado?",
      "Como é calculada a taxa?",
      "Posso levantar a encomenda?"
    ],
    en: [
      "Do I need an account?",
      "Is the order confirmed immediately?",
      "How is the fee calculated?",
      "Can I pick up the order?"
    ],
    fr: [
      "Dois-je créer un compte ?",
      "La commande est-elle confirmée immédiatement ?",
      "Comment le tarif est-il calculé ?",
      "Puis-je retirer la commande ?"
    ],
    zh: [
      "需要创建账户吗？",
      "订单会立即确认吗？",
      "配送费如何计算？",
      "可以自取订单吗？"
    ],
    chg: [
      "Xana ndzi fanele ku endla account?",
      "Xana oda yi tiyisisiwa hi ku hatlisa?",
      "Mali ya ku yisa yi hlayiwa ku yini?",
      "Xana ndzi nga teka oda hi ndzexe?"
    ]
  };

  const answers = [
    t("noAccount"),
    t("confirm"),
    t("fee"),
    t("pickup")
  ];

  const qs =
    questions[state.lang] ||
    questions.pt;

  e.innerHTML = qs
    .map(
      (question, index) => `
        <details
          class="
            bg-surface-container-low
            rounded-xl p-4
          "
        >
          <summary
            class="font-semibold cursor-pointer"
          >
            ${question}
          </summary>

          <p
            class="
              text-sm text-on-surface-variant
              mt-2
            "
          >
            ${answers[index]}
          </p>
        </details>
      `
    )
    .join("");
}

/* =========================================================
   TOTAIS
========================================================= */

function totals() {
  let subtotal = 0;
  let saving = 0;

  state.cart.forEach((item) => {
    const product = productById(item.id);
    if (!product) return;

    const qty = Number(item.qty || 0);

    subtotal +=
      Number(product.price || 0) * qty;

    if (
      Number(product.old_price) >
      Number(product.price)
    ) {
      saving +=
        (Number(product.old_price) -
          Number(product.price)) *
        qty;
    }
  });

  return {
    subtotal,
    saving,
    deliveryFee: Number(state.deliveryFee || 0),
    total:
      subtotal +
      Number(state.deliveryFee || 0)
  };
}

/* =========================================================
   CARRINHO
========================================================= */

function renderCart() {
  saveCart();

  const e = $("#cartItems");
  if (!e) return;

  const values = totals();

  e.innerHTML =
    state.cart
      .map((item) => {
        const product = productById(item.id);
        if (!product) return "";

        return `
          <div class="border-b pb-3">
            <div
              class="
                flex justify-between gap-3
              "
            >
              <div class="font-semibold text-sm">
                ${text(product.name)}
              </div>

              <div
                class="
                  font-bold text-primary
                  whitespace-nowrap
                "
              >
                ${money(
                  Number(product.price) *
                    Number(item.qty)
                )}
              </div>
            </div>

            <div
              class="
                text-xs text-on-surface-variant
                mt-1
              "
            >
              ${product.unit || ""} ·
              ${item.qty} un.
            </div>

            <div
              class="
                flex items-center gap-2 mt-2
              "
            >
              <button
                data-minus="${product.id}"
                class="w-7 h-7 rounded bg-surface-container"
              >
                −
              </button>

              <span>${item.qty}</span>

              <button
                data-plus="${product.id}"
                class="w-7 h-7 rounded bg-surface-container"
              >
                +
              </button>

              <button
                data-remove="${product.id}"
                class="ml-auto text-red-600 text-xs"
              >
                Remover
              </button>
            </div>
          </div>
        `;
      })
      .join("") ||
    `
      <div
        class="
          text-center py-10
          text-on-surface-variant
        "
      >
        ${t("empty")}
      </div>
    `;

  if ($("#cartSubtotal"))
    $("#cartSubtotal").textContent =
      money(values.subtotal);

  if ($("#cartSaving"))
    $("#cartSaving").textContent =
      money(values.saving);

  if ($("#cartServiceFee"))
    $("#cartServiceFee").textContent =
      state.deliveryZone
        ? money(state.deliveryFee)
        : "A definir";

  if ($("#cartTotal"))
    $("#cartTotal").textContent =
      money(values.total);

  e.querySelectorAll("[data-minus]").forEach(
    (button) =>
      (button.onclick = () =>
        changeQty(button.dataset.minus, -1))
  );

  e.querySelectorAll("[data-plus]").forEach(
    (button) =>
      (button.onclick = () =>
        changeQty(button.dataset.plus, 1))
  );

  e.querySelectorAll("[data-remove]").forEach(
    (button) =>
      (button.onclick = () =>
        removeFromCart(button.dataset.remove))
  );
}

function addToCart(id, showToast = true) {
  const product = productById(id);

  if (!isAvailable(product)) {
    toast(t("unavailable"));
    return;
  }

  const row = state.cart.find(
    (item) =>
      String(item.id) === String(id)
  );

  if (row) {
    row.qty = Number(row.qty || 0) + 1;
  } else {
    state.cart.push({
      id: product.id,
      qty: 1
    });
  }

  renderCart();

  if (showToast) {
    toast(
      `${text(product.name)} ${t("added")}`
    );
  }
}

function removeFromCart(id) {
  state.cart = state.cart.filter(
    (item) =>
      String(item.id) !== String(id)
  );

  renderCart();
  toast(t("removed"));
}

function changeQty(id, difference) {
  const row = state.cart.find(
    (item) =>
      String(item.id) === String(id)
  );

  if (!row) return;

  row.qty =
    Number(row.qty) + Number(difference);

  if (row.qty <= 0) {
    removeFromCart(id);
  } else {
    renderCart();
  }
}

/* =========================================================
   BARRA MÓVEL DO CARRINHO
========================================================= */

function createFloatingCart() {
  if ($("#rfFloatingCart")) return;

  const bar = document.createElement("div");

  bar.id = "rfFloatingCart";

  bar.innerHTML = `
    <div
      id="rfFloatingInner"
      style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        max-width:420px;
        margin:auto;
      "
    >
      <span id="rfFloatingText"></span>

      <button
        id="rfFloatingView"
        type="button"
      >
        🛒 ${t("viewOrder")}
      </button>
    </div>
  `;

  Object.assign(bar.style, {
    position: "fixed",
    bottom: "14px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "45",
    width: "calc(100% - 28px)",
    maxWidth: "420px",
    background: "#00361a",
    color: "#fff",
    borderRadius: "14px",
    padding: "9px 12px",
    boxShadow: "0 8px 30px rgba(0,0,0,.22)",
    fontSize: "12px",
    fontWeight: "700"
  });

  const button =
    bar.querySelector("#rfFloatingView");

  Object.assign(button.style, {
    border: "0",
    background: "#fd9d27",
    color: "#fff",
    borderRadius: "10px",
    padding: "7px 10px",
    fontWeight: "800",
    fontSize: "11px",
    cursor: "pointer",
    whiteSpace: "nowrap"
  });

  button.onclick = () =>
    $("#cartDrawer")?.classList.remove(
      "hidden"
    );

  document.body.appendChild(bar);

  updateFloatingCart();
}

function updateFloatingCart() {
  const bar = $("#rfFloatingCart");
  const textElement =
    $("#rfFloatingText");

  if (!bar || !textElement) return;

  const count = state.cart.reduce(
    (sum, item) =>
      sum + Number(item.qty || 0),
    0
  );

  textElement.textContent =
    `${count} ${t("selected")}`;

  bar.style.display =
    count > 0 ? "block" : "none";
}

/* =========================================================
   PAGAMENTO
========================================================= */

function paymentDetails(method) {
  if (method === "M-Pesa") {
    return setting(
      "mpesa_number",
      "mpesa",
      "mpesa_phone",
      "mpesaNumber"
    );
  }

  if (method === "E-Mola") {
    return setting(
      "emola_number",
      "emola",
      "emola_phone",
      "emolaNumber"
    );
  }

  if (
    method ===
    "Transferencia Bancaria"
  ) {
    return setting(
      "bank_details",
      "bank_transfer",
      "bank",
      "bank_account"
    );
  }

  return "";
}

/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout() {
  if (!state.cart.length) {
    toast(t("emptyFirst"));
    return;
  }

  $("#cartDrawer")?.classList.add("hidden");

  const old = $("#rfCheckoutModal");
  if (old) old.remove();

  const modal =
    document.createElement("div");

  modal.id = "rfCheckoutModal";

  modal.className =
    "fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4";

  const values = totals();

  modal.innerHTML = `
    <div
      class="
        bg-white rounded-3xl w-full
        max-w-xl max-h-[94vh]
        overflow-y-auto shadow-2xl
      "
    >
      <div
        class="
          p-5 border-b flex
          justify-between items-center
          sticky top-0 bg-white z-10
        "
      >
        <h2 class="hero-title text-2xl font-bold">
          ${t("order")}
        </h2>

        <button
          id="rfClose"
          class="p-2 rounded-full hover:bg-surface-container"
        >
          ✕
        </button>
      </div>

      <div
        class="
          mx-5 mt-5 p-4
          bg-surface-container-low
          rounded-2xl
        "
      >
        <h3 class="font-bold mb-3">
          ${t("products")}
        </h3>

        <div class="space-y-2">
          ${state.cart
            .map((item) => {
              const product =
                productById(item.id);

              if (!product) return "";

              return `
                <div
                  class="
                    flex justify-between
                    gap-3 text-sm
                  "
                >
                  <span>
                    ${text(product.name)}
                    × ${item.qty}
                  </span>

                  <strong>
                    ${money(
                      Number(product.price) *
                        Number(item.qty)
                    )}
                  </strong>
                </div>
              `;
            })
            .join("")}
        </div>

        <div class="border-t mt-3 pt-3 space-y-1 text-sm">
          <div class="flex justify-between">
            <span>${t("subtotal")}</span>
            <strong>${money(values.subtotal)}</strong>
          </div>

          <div class="flex justify-between">
            <span>${t("saving")}</span>
            <strong>${money(values.saving)}</strong>
          </div>

          <div class="flex justify-between">
            <span>${t("service")}</span>
            <strong id="rfCheckoutFee">
              A definir
            </strong>
          </div>

          <div
            class="
              flex justify-between
              text-lg font-bold pt-1
            "
          >
            <span>${t("total")}</span>
            <strong id="rfCheckoutTotal">
              ${money(values.subtotal)}
            </strong>
          </div>
        </div>
      </div>

      <form
        id="rfForm"
        class="p-5 space-y-4"
      >
        <h3 class="font-bold text-lg">
          ${t("customer")}
        </h3>

        <div class="grid sm:grid-cols-2 gap-3">
          <input
            required
            name="name"
            placeholder="${t("fullName")}"
            class="
              w-full border
              border-outline-variant
              rounded-xl px-4 py-3
            "
          >

          <input
            required
            name="phone"
            placeholder="${t("phone")}"
            class="
              w-full border
              border-outline-variant
              rounded-xl px-4 py-3
            "
          >
        </div>

        <select
          required
          name="delivery"
          id="rfDelivery"
          class="
            w-full border
            border-outline-variant
            rounded-xl px-4 py-3
          "
        >
          <option value="">
            ${t("select")}
            ${t("deliveryMethod")}
          </option>

          <option value="Maputo Cidade">
            ${t("maputo")} — 400 MT
          </option>

          <option value="Zonas Circunvizinhas">
            ${t("surroundings")} — 700 MT
          </option>

          <option value="Matola">
            ${t("matola")} — 1.000 MT
          </option>

          <option value="Levantamento Gratis">
            ${t("pickupName")}
          </option>
        </select>

        <input
          name="address"
          placeholder="${t("address")}"
          class="
            w-full border
            border-outline-variant
            rounded-xl px-4 py-3
          "
        >

        <select
          required
          name="payment"
          id="rfPayment"
          class="
            w-full border
            border-outline-variant
            rounded-xl px-4 py-3
          "
        >
          <option value="">
            ${t("select")} ${t("payment")}
          </option>

          <option value="Numerário">
            ${t("cash")}
          </option>

          <option value="M-Pesa">
            ${t("mpesa")}
          </option>

          <option value="E-Mola">
            ${t("emola")}
          </option>

          <option value="Transferencia Bancaria">
            ${t("bank")}
          </option>
        </select>

        <div
          id="rfPaymentInfo"
          class="
            hidden rounded-xl
            bg-surface-container-low p-4
          "
        >
          <div
            class="
              text-xs font-bold uppercase
              tracking-wider text-secondary
            "
          >
            ${t("paymentInfo")}
          </div>

          <div
            id="rfPaymentText"
            class="
              text-sm font-semibold
              text-primary mt-1
            "
          ></div>
        </div>

        <div>
          <h3 class="font-bold mb-2">
            ${t("substitution")}
          </h3>

          <div class="space-y-2">
            <label
              class="
                flex gap-2 items-center
                border rounded-xl p-3
              "
            >
              <input
                type="radio"
                name="substitutions"
                value="${t("contact")}"
                checked
              >
              ${t("contact")}
            </label>

            <label
              class="
                flex gap-2 items-center
                border rounded-xl p-3
              "
            >
              <input
                type="radio"
                name="substitutions"
                value="${t("equivalent")}"
              >
              ${t("equivalent")}
            </label>

            <label
              class="
                flex gap-2 items-center
                border rounded-xl p-3
              "
            >
              <input
                type="radio"
                name="substitutions"
                value="${t("noReplace")}"
              >
              ${t("noReplace")}
            </label>
          </div>
        </div>

        <textarea
          name="notes"
          rows="3"
          placeholder="${t("notes")}"
          class="
            w-full border
            border-outline-variant
            rounded-xl px-4 py-3
          "
        ></textarea>

        <div class="flex gap-3">
          <button
            type="button"
            id="rfBack"
            class="
              flex-1 py-3 rounded-xl
              border border-outline-variant
              font-semibold
            "
          >
            ${t("back")}
          </button>

          <button
            type="submit"
            class="
              flex-1 py-3 rounded-xl
              bg-primary text-white
              font-semibold
            "
          >
            ${t("finish")}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  $("#rfClose").onclick = () =>
    modal.remove();

  $("#rfBack").onclick = () =>
    modal.remove();

  /* TAXA DE ENTREGA */
  $("#rfDelivery").onchange = (event) => {
    const value = event.target.value;

    state.deliveryZone = value;

    if (value === "Maputo Cidade") {
      state.deliveryFee = 400;
    } else if (
      value === "Zonas Circunvizinhas"
    ) {
      state.deliveryFee = 700;
    } else if (value === "Matola") {
      state.deliveryFee = 1000;
    } else {
      state.deliveryFee = 0;
    }

    const currentTotals = totals();

    const feeElement =
      $("#rfCheckoutFee");

    const totalElement =
      $("#rfCheckoutTotal");

    if (feeElement) {
      feeElement.textContent =
        value
          ? money(state.deliveryFee)
          : "A definir";
    }

    if (totalElement) {
      totalElement.textContent =
        money(currentTotals.total);
    }

    renderCart();
  };

  /* PAGAMENTO */
  $("#rfPayment").onchange = (event) => {
    const method = event.target.value;
    const info =
      paymentDetails(method);

    const box = $("#rfPaymentInfo");
    const textElement =
      $("#rfPaymentText");

    if (
      !method ||
      method === "Numerário"
    ) {
      box.classList.add("hidden");
      return;
    }

    box.classList.remove("hidden");

    textElement.textContent =
      info || t("accountPending");
  };

  /* ENVIO */
  $("#rfForm").onsubmit = async (event) => {
    event.preventDefault();

    const form =
      new FormData(event.target);

    const currentTotals = totals();

    const method =
      form.get("payment");

    const pay =
      paymentDetails(method);

    const orderNumber =
      `RF-${Date.now()
        .toString()
        .slice(-8)}`;

    const lines = [
      "*O seu pedido — Rancho Flexível*",
      "",
      "*Produtos*",
      ...state.cart.map((item) => {
        const product =
          productById(item.id);

        return `• ${text(product.name)} — ${
          item.qty
        } x ${money(product.price)} = ${money(
          Number(product.price) *
            Number(item.qty)
        )}`;
      }),
      "",
      `Poupança: ${money(
        currentTotals.saving
      )}`,
      `Taxa de serviço: ${
        state.deliveryFee
          ? money(state.deliveryFee)
          : "A definir"
      }`,
      `*Total: ${money(
        currentTotals.total
      )}*`,
      "",
      "*Dados do cliente*",
      `Nome: ${form.get("name")}`,
      `Telefone: ${form.get("phone")}`,
      `Forma de entrega: ${form.get("delivery")}`,
      `Endereço: ${
        form.get("address") || "—"
      }`,
      `Método de pagamento: ${method}`,
      `Dados de pagamento: ${
        pay || "—"
      }`,
      `Aceita substituições: ${
        form.get("substitutions")
      }`,
      `Observações: ${
        form.get("notes") || "—"
      }`
    ];

    /* Guardar no Supabase */
    try {
      const {
        data: customer
      } = await supabase
        .from("customers")
        .insert({
          name: form.get("name"),
          phone: form.get("phone"),
          address:
            form.get("address") || null
        })
        .select("id")
        .single();

      const {
        data: order
      } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id:
            customer?.id || null,
          customer_name:
            form.get("name"),
          customer_phone:
            form.get("phone"),
          address:
            form.get("address") || null,
          delivery_zone:
            form.get("delivery"),
          delivery_fee:
            Number(state.deliveryFee || 0),
          total:
            Number(currentTotals.total)
        })
        .select("id")
        .single();

      if (order?.id) {
        await supabase
          .from("order_items")
          .insert(
            state.cart.map((item) => {
              const product =
                productById(item.id);

              return {
                order_id: order.id,
                product_id: product.id,
                product_name:
                  text(product.name),
                quantity: item.qty,
                unit_price:
                  product.price
              };
            })
          );
      }
    } catch (error) {
      console.warn(
        "Não foi possível guardar o pedido no painel:",
        error
      );
    }

    const phone = String(
      setting(
        "whatsapp",
        "whatsapp_number",
        "whatsapp_phone"
      ) || "258840000000"
    ).replace(/\D/g, "");

    const whatsapp =
      phone || "258840000000";

    window.open(
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        lines.join("\n")
      )}`,
      "_blank"
    );

    toast(t("saved"));

    state.cart = [];
    state.deliveryFee = 0;
    state.deliveryZone = "";

    saveCart();

    modal.remove();
  };
}

/* =========================================================
   TEXTO ESTÁTICO DA PÁGINA
========================================================= */

function applyStaticText() {
  document.documentElement.lang =
    state.lang === "zh"
      ? "zh"
      : state.lang === "chg"
      ? "pt"
      : state.lang;

  const search =
    $("#searchInput");

  if (search) {
    search.placeholder =
      t("search");
  }

  const heroTitle =
    document.querySelector(
      ".hero-title"
    );

  /* HERO */
  const heroSection =
    document.querySelector(".hero");

  if (heroSection) {
    const title =
      heroSection.querySelector("h1");

    const paragraph =
      heroSection.querySelector("p");

    const buttons =
      heroSection.querySelectorAll("a");

    if (title)
      title.textContent =
        t("heroTitle");

    if (paragraph)
      paragraph.textContent =
        t("heroText");

    if (buttons[0])
      buttons[0].textContent =
        t("start");

    if (buttons[1])
      buttons[1].textContent =
        t("how");

    const badge =
      heroSection.querySelector(
        ".inline-flex"
      );

    if (badge) {
      badge.innerHTML = `
        <span class="text-secondary-container">●</span>
        ${t("new")}
      `;
    }
  }

  /* COMO FUNCIONA */
  const how =
    $("#como-funciona");

  if (how) {
    const label =
      how.querySelector(
        ".text-xs"
      );

    const title =
      how.querySelector("h2");

    if (label)
      label.textContent =
        t("simple");

    if (title)
      title.textContent =
        t("how");
  }

  /* CATEGORIAS */
  const categoriesSection =
    $("#categories")?.parentElement;

  if (categoriesSection) {
    const label =
      categoriesSection.querySelector(
        ".text-xs"
      );

    const title =
      categoriesSection.querySelector(
        "h2"
      );

    if (label)
      label.textContent =
        t("categories");

    if (title)
      title.textContent =
        t("find");
  }

  /* CATÁLOGO */
  const products =
    $("#produtos");

  if (products) {
    const labels =
      products.querySelectorAll(
        ".text-xs"
      );

    if (labels[0])
      labels[0].textContent =
        t("catalog");

    const title =
      products.querySelector("h2");

    if (title)
      title.textContent =
        t("featured");

    const paragraph =
      products.querySelector(
        "h2 + p"
      );

    if (paragraph)
      paragraph.textContent =
        t("prices");

    const sort =
      $("#sortFilter");

    if (sort) {
      const options =
        sort.querySelectorAll(
          "option"
        );

      if (options[0])
        options[0].textContent =
          t("sort");

      if (options[1])
        options[1].textContent =
          t("low");

      if (options[2])
        options[2].textContent =
          t("high");

      if (options[3])
        options[3].textContent =
          t("name");
    }
  }

  /* COMBOS */
  const kits =
    $("#kits");

  if (kits) {
    const label =
      kits.querySelector(
        ".text-xs"
      );

    const title =
      kits.querySelector("h2");

    const paragraph =
      kits.querySelector("h2 + p");

    if (label)
      label.textContent =
        t("highlights");

    if (title)
      title.textContent =
        t("combo");

    if (paragraph)
      paragraph.textContent =
        t("comboText");
  }

  /* ENTREGAS */
  const delivery =
    $("#entregas");

  if (delivery) {
    const labels =
      delivery.querySelectorAll(
        ".text-xs"
      );

    const title =
      delivery.querySelector("h2");

    const paragraph =
      delivery.querySelector(
        "h2 + p"
      );

    if (labels[0])
      labels[0].textContent =
        t("delivery");

    if (title)
      title.textContent =
        t("near");

    if (paragraph)
      paragraph.textContent =
        t("deliveryText");

    const cards =
      delivery.querySelectorAll(
        ".delivery-card"
      );

    if (cards[0])
      cards[0].querySelector(
        "div"
      ).textContent =
        t("maputo");

    if (cards[1])
      cards[1].querySelector(
        "div"
      ).textContent =
        t("surroundings");

    if (cards[2])
      cards[2].querySelector(
        "div"
      ).textContent =
        t("matola");

    if (cards[3])
      cards[3].querySelector(
        "div"
      ).textContent =
        t("pickupName");
  }

  /* FAQ */
  const faq =
    $("#faqSection");

  if (faq) {
    const labels =
      faq.querySelectorAll(
        ".text-xs"
      );

    const title =
      faq.querySelector("h2");

    if (labels[0])
      labels[0].textContent =
        t("faqLabel");

    if (title)
      title.textContent =
        t("faqTitle");
  }

  /* FOOTER */
  renderFooter();

  /* BOTÃO CARRINHO */
  const cartButton =
    $("#cartBtn");

  if (cartButton) {
    cartButton.setAttribute(
      "aria-label",
      t("cart")
    );
  }

  const cartTitle =
    document.querySelector(
      "#cartDrawer h2"
    );

  if (cartTitle)
    cartTitle.textContent =
      t("order");

  const checkoutButton =
    $("#checkoutBtn");

  if (checkoutButton)
    checkoutButton.textContent =
      t("continue");
}

/* =========================================================
   RODAPÉ
========================================================= */

function renderFooter() {
  const footer =
    document.querySelector("footer");

  if (!footer) return;

  footer.innerHTML = `
    <div
      class="
        max-w-[1280px] mx-auto
        px-4 lg:px-16
        py-8
      "
    >
      <div
        class="
          grid grid-cols-1
          md:grid-cols-3
          gap-6 items-center
        "
      >
        <div>
          <div
            class="
              font-headline font-bold
              text-primary text-xl
            "
          >
            Rancho Flexível
          </div>

          <div
            class="
              text-sm text-on-surface-variant
              mt-1
            "
          >
            ${t("footerDescription")}
          </div>
        </div>

        <div>
          <div
            class="
              font-bold text-primary
              text-sm
            "
          >
            WhatsApp
          </div>

          <div
            class="
              text-sm text-on-surface-variant
              mt-1
            "
          >
            ${setting(
              "whatsapp",
              "whatsapp_number",
              "whatsapp_phone"
            ) || "Número do WhatsApp"}
          </div>
        </div>

        <div>
          <div
            class="
              font-bold text-primary
              text-sm
            "
          >
            ${t("delivery")}
          </div>

          <div
            class="
              text-sm text-on-surface-variant
              mt-1
            "
          >
            ${t("footerDelivery")}
          </div>
        </div>
      </div>

      <div
        class="
          mt-7 pt-5
          border-t border-outline-variant
          text-center
          text-sm text-on-surface-variant
        "
      >
        ${t("footerCreative")}
      </div>

      <div
        class="
          mt-4 text-center
          text-xs text-outline
        "
      >
        © ${new Date().getFullYear()}
        Rancho Flexível.
        Todos os direitos reservados.
      </div>
    </div>
  `;
}

/* =========================================================
   CONFIGURAÇÕES DO PAINEL
========================================================= */

function renderSettings() {
  const heroImage =
    $("#heroImage");

  const configuredHero =
    setting(
      "hero_image",
      "heroImage",
      "hero_image_url"
    );

  if (
    heroImage &&
    configuredHero
  ) {
    heroImage.src =
      configuredHero;
  }

  renderFooter();

  const year =
    $("#year");

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
}

/* =========================================================
   IDIOMA
========================================================= */

function createLanguageSelector() {
  if ($("#languageSelect")) return;

  const header =
    document.querySelector(
      "header .flex.items-center.gap-2"
    );

  if (!header) return;

  const select =
    document.createElement("select");

  select.id =
    "languageSelect";

  select.className =
    "border border-outline-variant rounded-full px-3 py-2 text-xs bg-white font-semibold";

  select.innerHTML = `
    <option value="pt">Português</option>
    <option value="en">English</option>
    <option value="zh">中文</option>
    <option value="fr">Français</option>
    <option value="chg">Changana</option>
  `;

  select.value =
    state.lang;

  select.addEventListener(
    "change",
    (event) => {
      state.lang =
        event.target.value;

      localStorage.setItem(
        "rf_lang",
        state.lang
      );

      renderAll();
    }
  );

  header.prepend(select);
}

/* =========================================================
   ATUALIZAÇÃO AUTOMÁTICA DO PAINEL
========================================================= */

let refreshTimer = null;

function startAdminSync() {
  clearInterval(
    refreshTimer
  );

  refreshTimer =
    setInterval(async () => {
      try {
        const [
          products,
          categories,
          kits,
          settings
        ] = await Promise.all([
          getProducts(),
          getCategories(),
          getKits(),
          getSettings()
        ]);

        const changed =
          JSON.stringify(products) !==
            JSON.stringify(state.products) ||
          JSON.stringify(categories) !==
            JSON.stringify(state.categories) ||
          JSON.stringify(kits) !==
            JSON.stringify(state.kits) ||
          JSON.stringify(settings) !==
            JSON.stringify(state.settings);

        if (changed) {
          state.products =
            Array.isArray(products)
              ? products
              : [];

          state.categories =
            Array.isArray(categories)
              ? categories
              : [];

          state.kits =
            Array.isArray(kits)
              ? kits
              : [];

          state.settings =
            settings || {};

          renderAll();
        }
      } catch (error) {
        console.warn(
          "Sincronização com o painel:",
          error
        );
      }
    }, 10000);
}

/* =========================================================
   EVENTOS
========================================================= */

function bindEvents() {
  $("#searchInput")?.addEventListener(
    "input",
    () => renderProducts()
  );

  $("#categoryFilter")?.addEventListener(
    "change",
    () => renderProducts()
  );

  $("#sortFilter")?.addEventListener(
    "change",
    () => renderProducts()
  );

  $("#cartBtn")?.addEventListener(
    "click",
    () =>
      $("#cartDrawer")?.classList.remove(
        "hidden"
      )
  );

  $("#closeCart")?.addEventListener(
    "click",
    () =>
      $("#cartDrawer")?.classList.add(
        "hidden"
      )
  );

  $("#cartOverlay")?.addEventListener(
    "click",
    () =>
      $("#cartDrawer")?.classList.add(
        "hidden"
      )
  );

  $("#checkoutBtn")?.addEventListener(
    "click",
    openCheckout
  );
}

/* =========================================================
   RENDER GERAL
========================================================= */

function renderAll() {
  createLanguageSelector();
  renderCategories();
  renderFilters();
  renderProducts();
  renderKits();
  renderSteps();
  renderFaq();
  renderCart();
  renderSettings();
  applyStaticText();
  createFloatingCart();
  updateFloatingCart();
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function init() {
  bindEvents();

  await loadData();

  startAdminSync();

  /* Atualiza se outra aba alterar o idioma/carrinho */
  window.addEventListener(
    "storage",
    (event) => {
      if (event.key === "rf_cart") {
        try {
          state.cart =
            JSON.parse(
              event.newValue || "[]"
            );
        } catch {
          state.cart = [];
        }

        renderCart();
      }

      if (event.key === "rf_lang") {
        state.lang =
          event.newValue || "pt";

        renderAll();
      }
    }
  );
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );
} else {
  init();
}
