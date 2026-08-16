```js
import {
  getProducts,
  getCategories,
  getKits,
  getSettings
} from "./data.js";

/* ============================================================
   TRADUÇÕES
============================================================ */

const I18N = {
  pt: {
    nav: {
      products: "Produtos",
      kits: "Rancho do mês",
      admin: "Administração"
    },
    hero: {
      badge: "Novo: Compras pelo WhatsApp",
      titleEnd: "sem sair de casa.",
      text: "Escolha os produtos, monte o carrinho e envie o pedido pelo WhatsApp. Simples, rápido e transparente.",
      cta: "Começar a comprar",
      how: "Ver como funciona",
      delivery: "Entrega Hoje",
      quality: "Qualidade"
    },
    categories: {
      subtitle: "Encontre tudo o que precisa para a sua despensa."
    },
    kits: {
      badge: "Destaques",
      text: "Kits pré-montados pensados para facilitar a sua rotina e garantir economia."
    },
    products: {
      title: "Produtos",
      text: "Escolha os produtos para o seu rancho."
    },
    how: {
      title: "Como funciona"
    },
    faq: {
      title: "Perguntas frequentes"
    },
    cart: {
      title: "Seu carrinho",
      total: "Total",
      checkout: "Finalizar pedido"
    },
    footer: {
      desc: "Qualidade do campo direto para a sua mesa, com a flexibilidade que o seu dia a dia pede.",
      links: "Links Úteis",
      contact: "Contacto",
      social: "Siga-nos",
      rights: "Todos os direitos reservados."
    }
  },

  en: {
    nav: {
      products: "Products",
      kits: "Monthly bundle",
      admin: "Administration"
    },
    hero: {
      badge: "New: Order by WhatsApp",
      titleEnd: "without leaving home.",
      text: "Choose your products, build your cart and send the order by WhatsApp. Simple, fast and transparent.",
      cta: "Start shopping",
      how: "How it works",
      delivery: "Delivery Today",
      quality: "Quality"
    },
    categories: {
      subtitle: "Find everything you need for your pantry."
    },
    kits: {
      badge: "Highlights",
      text: "Pre-built bundles designed to simplify your routine and save money."
    },
    products: {
      title: "Products",
      text: "Choose products for your household."
    },
    how: {
      title: "How it works"
    },
    faq: {
      title: "Frequently asked questions"
    },
    cart: {
      title: "Your cart",
      total: "Total",
      checkout: "Checkout"
    },
    footer: {
      desc: "Quality from the field to your table, with flexibility for your everyday life.",
      links: "Useful links",
      contact: "Contact",
      social: "Follow us",
      rights: "All rights reserved."
    }
  },

  zh: {
    nav: {
      products: "产品",
      kits: "本月套餐",
      admin: "管理"
    },
    hero: {
      badge: "新功能：WhatsApp 下单",
      titleEnd: "足不出户完成采购。",
      text: "选择商品、加入购物车并通过 WhatsApp 发送订单。简单、快捷、透明。",
      cta: "开始购物",
      how: "了解流程",
      delivery: "今日配送",
      quality: "品质保证"
    },
    categories: {
      subtitle: "找到您的家庭储藏所需的一切。"
    },
    kits: {
      badge: "精选",
      text: "预先搭配的套餐，帮助您轻松生活并节省开支。"
    },
    products: {
      title: "产品",
      text: "为您的家庭选择商品。"
    },
    how: {
      title: "购买流程"
    },
    faq: {
      title: "常见问题"
    },
    cart: {
      title: "购物车",
      total: "总计",
      checkout: "结算"
    },
    footer: {
      desc: "从农场到餐桌，为您的日常生活提供灵活选择。",
      links: "有用链接",
      contact: "联系方式",
      social: "关注我们",
      rights: "版权所有。"
    }
  },

  fr: {
    nav: {
      products: "Produits",
      kits: "Panier du mois",
      admin: "Administration"
    },
    hero: {
      badge: "Nouveau : commande WhatsApp",
      titleEnd: "sans quitter la maison.",
      text: "Choisissez vos produits, composez votre panier et envoyez la commande par WhatsApp. Simple, rapide et transparent.",
      cta: "Commencer",
      how: "Comment ça marche",
      delivery: "Livraison aujourd'hui",
      quality: "Qualité"
    },
    categories: {
      subtitle: "Trouvez tout ce dont vous avez besoin pour votre garde-manger."
    },
    kits: {
      badge: "Sélection",
      text: "Des paniers prêts à l'emploi pour simplifier votre quotidien et économiser."
    },
    products: {
      title: "Produits",
      text: "Choisissez les produits pour votre foyer."
    },
    how: {
      title: "Comment ça marche"
    },
    faq: {
      title: "Questions fréquentes"
    },
    cart: {
      title: "Votre panier",
      total: "Total",
      checkout: "Passer la commande"
    },
    footer: {
      desc: "La qualité du champ directement à votre table, avec flexibilité.",
      links: "Liens utiles",
      contact: "Contact",
      social: "Suivez-nous",
      rights: "Tous droits réservés."
    }
  },

  chg: {
    nav: {
      products: "Swilo",
      kits: "Rancho wa n'weti",
      admin: "Ulawuri"
    },
    hero: {
      badge: "Swa nyuwani: oda hi WhatsApp",
      titleEnd: "u nga humi kaya.",
      text: "Hlawula swilo, vekela eka cart kutani rhumela oda hi WhatsApp. Swa olova, swa hatlisa naswona swa vonaka.",
      cta: "Sungula ku xava",
      how: "Ndlela leyi swi tirhaka ha yona",
      delivery: "Ku yisa namuntlha",
      quality: "Nkoka"
    },
    categories: {
      subtitle: "Kuma swilo leswi u swi lavaka endlwini."
    },
    kits: {
      badge: "Swikombiso",
      text: "Tikhithi leti lunghisiweke ku olovisa siku ni siku."
    },
    products: {
      title: "Swilo",
      text: "Hlawula swilo swa ndyangu wa wena."
    },
    how: {
      title: "Ndlela leyi swi tirhaka ha yona"
    },
    faq: {
      title: "Swivutiso leswi talaka ku vutisiwa"
    },
    cart: {
      title: "Cart ya wena",
      total: "Ntsengo",
      checkout: "Hetisa oda"
    },
    footer: {
      desc: "Nkoka wa le masikwini wu fika etafuleni ra wena hi ku olova.",
      links: "Swihlanganisi",
      contact: "Ku tihlanganisa",
      social: "Hi landzele",
      rights: "Timfanelo hinkwato ti hlayisiwile."
    }
  }
};


/* ============================================================
   ESTADO
============================================================ */

const state = {
  lang: localStorage.getItem("rf_lang") || "pt",
  products: [],
  categories: [],
  kits: [],
  settings: {},
  cart: JSON.parse(localStorage.getItem("rf_cart") || "[]")
};


/* ============================================================
   HELPERS
============================================================ */

const $ = selector => document.querySelector(selector);

const money = number =>
  `${Number(number || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MZN`;


function tr(path) {
  return (
    path
      .split(".")
      .reduce((obj, key) => obj?.[key], I18N[state.lang]) || path
  );
}


function applyI18n() {

  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = tr(element.dataset.i18n);
  });

  document.documentElement.lang = state.lang;
}


function current(value) {

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.[state.lang] ||
    value?.pt ||
    Object.values(value || {})[0] ||
    ""
  );
}


function toast(message) {

  const element = $("#toast");

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  setTimeout(() => {
    element.classList.add("hidden");
  }, 2500);
}


/* ============================================================
   IMAGENS
============================================================ */

function imgForProduct(product) {

  return (
    product?.image_url ||
    product?.image ||
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80"
  );
}


function imgForKit(kit) {

  return (
    kit?.image_url ||
    kit?.image ||
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
  );
}


function imgForCategory(category, index) {

  if (category?.image_url) {
    return category.image_url;
  }

  if (category?.image) {
    return category.image;
  }

  const fallbackImages = [
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80"
  ];

  return fallbackImages[index % fallbackImages.length];
}


/* ============================================================
   CARREGAR DADOS
============================================================ */

async function load() {

  try {
    state.products = await getProducts();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    state.products = [];
  }

  try {
    state.categories = await getCategories();
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
    state.categories = [];
  }

  try {
    state.kits = await getKits();
  } catch (error) {
    console.error("Erro ao carregar Rancho do Mês:", error);
    state.kits = [];
  }

  try {
    state.settings = await getSettings();
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    state.settings = {};
  }

  renderAll();
  applyI18n();
}


/* ============================================================
   CATEGORIAS
============================================================ */

function renderCategories() {

  const element = $("#categories");

  if (!element) return;

  if (!state.categories.length) {

    element.innerHTML = `
      <div class="col-span-full text-center py-10 text-on-surface-variant">
        Nenhuma categoria encontrada.
      </div>
    `;

    return;
  }

  element.innerHTML = state.categories.map((category, index) => {

    const image = imgForCategory(category, index);

    return `
      <button
        data-cat="${category.id}"
        class="group flex flex-col items-center justify-center p-3 rounded-[2rem] bg-white hover:bg-surface-container shadow-sm hover:shadow-md transition min-h-[160px] text-center overflow-hidden"
      >

        <div class="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container-low">

          <img
            src="${image}"
            alt="${current(category.name)}"
            class="w-full h-full object-cover group-hover:scale-105 transition"
            onerror="this.style.display='none'"
          >

        </div>

        <span class="font-semibold text-sm mt-3">
          ${current(category.name)}
        </span>

      </button>
    `;

  }).join("");


  element.querySelectorAll("[data-cat]").forEach(button => {

    button.onclick = () => {

      const filter = $("#categoryFilter");

      if (filter) {
        filter.value = button.dataset.cat;
        renderProducts();
      }

      const productsSection = $("#produtos");

      if (productsSection) {
        productsSection.scrollIntoView({
          behavior: "smooth"
        });
      }

    };

  });

}


/* ============================================================
   RANCHO DO MÊS
============================================================ */

function renderKits() {

  const element = $("#kitsGrid");

  if (!element) return;

  if (!state.kits.length) {

    element.innerHTML = `
      <div class="col-span-full text-center py-10 text-on-surface-variant">
        Nenhum Rancho do Mês disponível.
      </div>
    `;

    return;
  }


  element.innerHTML = state.kits.map(kit => {

    const image = imgForKit(kit);

    const kitProducts = Array.isArray(kit.product_ids)
      ? kit.product_ids
          .map(id =>
            state.products.find(
              product => String(product.id) === String(id)
            )
          )
          .filter(Boolean)
      : [];


    const productsHtml = kitProducts.length

      ? `
        <div class="mt-5">

          <div class="flex items-center gap-2 mb-3">

            <span class="material-symbols-outlined text-primary text-[20px]">
              inventory_2
            </span>

            <h4 class="text-sm font-bold text-primary">
              Composição do Rancho
            </h4>

          </div>

          <div class="space-y-2">

            ${kitProducts.map(product => `

              <div
                class="flex items-center gap-3 bg-surface-container-low rounded-xl p-2"
              >

                <img
                  src="${imgForProduct(product)}"
                  alt="${current(product.name)}"
                  class="w-11 h-11 rounded-lg object-cover shrink-0"
                  onerror="this.style.display='none'"
                >

                <div class="min-w-0 flex-1">

                  <div class="text-sm font-semibold truncate">
                    ${current(product.name)}
                  </div>

                  ${
                    product.unit
                      ? `
                        <div class="text-xs text-on-surface-variant">
                          ${product.unit}
                        </div>
                      `
                      : ""
                  }

                </div>

              </div>

            `).join("")}

          </div>

        </div>
      `

      : `
        <div class="mt-5 p-3 rounded-xl bg-surface-container-low">

          <div class="flex items-center gap-2 text-on-surface-variant">

            <span class="material-symbols-outlined text-[20px]">
              inventory_2
            </span>

            <span class="text-sm">
              Este Rancho ainda não tem produtos associados.
            </span>

          </div>

        </div>
      `;


    return `
      <div
        class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition flex flex-col overflow-hidden"
      >

        <div class="h-48 bg-surface-container relative overflow-hidden">

          <img
            src="${image}"
            class="w-full h-full object-cover"
            alt="${current(kit.name)}"
            onerror="this.style.display='none'"
          >

          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end">

            <span
              class="bg-white text-on-surface text-xs font-bold px-2 py-1 rounded"
            >
              ${current(kit.badge) || "Destaque"}
            </span>

            <span class="text-white font-bold">
              ${money(kit.price)}
            </span>

          </div>

        </div>

        <div class="p-4 flex flex-col flex-1">

          <h3 class="text-xl font-semibold">
            ${current(kit.name)}
          </h3>

          ${
            current(kit.description)
              ? `
                <p class="text-sm text-on-surface-variant mt-2">
                  ${current(kit.description)}
                </p>
              `
              : ""
          }

          ${productsHtml}

          <button
            data-kit="${kit.id}"
            class="mt-5 w-full py-2.5 rounded-lg bg-surface-container-highest hover:bg-secondary hover:text-white font-semibold transition"
          >
            Adicionar ao carrinho
          </button>

        </div>

      </div>
    `;

  }).join("");


  element.querySelectorAll("[data-kit]").forEach(button => {

    button.onclick = () => {

      const kit = state.kits.find(
        item => String(item.id) === String(button.dataset.kit)
      );

      if (!kit) return;

      if (Array.isArray(kit.product_ids)) {

        kit.product_ids.forEach(id => {
          add(id, false);
        });

        saveCart();
        renderCart();

      }

      toast(`${current(kit.name)} adicionado`);

    };

  });

}


/* ============================================================
   FILTRO DE CATEGORIAS
============================================================ */

function renderFilters() {

  const select = $("#categoryFilter");

  if (!select) return;

  select.innerHTML =
    `<option value="">Todas as categorias</option>` +
    state.categories
      .map(category =>
        `<option value="${category.id}">
          ${current(category.name)}
        </option>`
      )
      .join("");
}


/* ============================================================
   PRODUTOS
============================================================ */

function renderProducts() {

  const element = $("#productGrid");

  if (!element) return;


  let products = [...state.products].filter(
    product => product.active !== false
  );


  const searchInput = $("#searchInput");
  const categoryFilter = $("#categoryFilter");
  const sortFilter = $("#sortFilter");


  const query =
    searchInput?.value?.trim().toLowerCase() || "";

  const category =
    categoryFilter?.value || "";

  const sort =
    sortFilter?.value || "default";


  /* ========================================================
     PESQUISA
  ======================================================== */

  if (query) {

    products = products.filter(product => {

      const name =
        current(product.name);

      const description =
        current(product.description);

      const unit =
        product.unit || "";

      const tag =
        current(product.tag);


      const productCategory =
        state.categories.find(
          cat =>
            String(cat.id) ===
            String(product.category_id)
        );


      const categoryName =
        productCategory
          ? current(productCategory.name)
          : "";


      const searchableText = [
        name,
        description,
        unit,
        tag,
        categoryName
      ]
        .join(" ")
        .toLowerCase();


      return searchableText.includes(query);

    });

  }


  /* ========================================================
     FILTRO DE CATEGORIA
  ======================================================== */

  if (category) {

    products = products.filter(
      product =>
        String(product.category_id) ===
        String(category)
    );

  }


  /* ========================================================
     ORDENAÇÃO
  ======================================================== */

  if (sort === "priceAsc") {

    products.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  }


  if (sort === "priceDesc") {

    products.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  }


  if (sort === "name") {

    products.sort((a, b) =>
      current(a.name).localeCompare(
        current(b.name),
        state.lang
      )
    );

  }


  /* ========================================================
     NENHUM RESULTADO
  ======================================================== */

  if (!products.length) {

    element.innerHTML = `
      <div class="col-span-full text-center py-12">

        <span class="material-symbols-outlined text-5xl text-outline">
          search_off
        </span>

        <p class="text-on-surface-variant mt-3">
          Nenhum produto encontrado.
        </p>

        ${
          query
            ? `
              <p class="text-sm text-outline mt-1">
                Pesquisa: "${query}"
              </p>
            `
            : ""
        }

      </div>
    `;

    return;
  }


  /* ========================================================
     MOSTRAR PRODUTOS
  ======================================================== */

  element.innerHTML = products.map(product => {

    const image = imgForProduct(product);

    return `
      <article
        class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden group"
      >

        <div class="h-44 bg-surface-container relative overflow-hidden">

          <img
            src="${image}"
            class="w-full h-full object-cover group-hover:scale-105 transition"
            alt="${current(product.name)}"
            onerror="this.style.display='none'"
          >

          <div class="absolute top-2 left-2 flex gap-1">

            ${
              product.tag
                ? `
                  <span
                    class="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded"
                  >
                    ${current(product.tag)}
                  </span>
                `
                : ""
            }

            ${
              product.featured
                ? `
                  <span
                    class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded"
                  >
                    ★
                  </span>
                `
                : ""
            }

          </div>

        </div>


        <div class="p-4">

          <h3 class="font-semibold">
            ${current(product.name)}
          </h3>


          <p class="text-xs text-on-surface-variant mt-1">
            ${current(product.description) || ""}
          </p>


          <div class="flex items-end justify-between mt-4">

            <div>

              <span class="text-xs text-on-surface-variant">
                ${product.unit || ""}
              </span>

              <div class="text-lg font-bold text-primary">
                ${money(product.price)}
              </div>

              ${
                product.old_price
                  ? `
                    <del class="text-xs text-outline">
                      ${money(product.old_price)}
                    </del>
                  `
                  : ""
              }

            </div>


            <button
              data-add="${product.id}"
              class="w-10 h-10 rounded-full bg-secondary-container text-white flex items-center justify-center hover:bg-secondary"
              aria-label="Adicionar ${current(product.name)} ao carrinho"
            >

              <span class="material-symbols-outlined">
                add_shopping_cart
              </span>

            </button>

          </div>

        </div>

      </article>
    `;

  }).join("");


  /* ========================================================
     BOTÕES ADICIONAR
  ======================================================== */

  element
    .querySelectorAll("[data-add]")
    .forEach(button => {

      button.onclick = () => {

        add(button.dataset.add);

      };

    });

}


/* ============================================================
   CARRINHO — ADICIONAR
============================================================ */

function add(id, showToast = true) {

  const product = state.products.find(
    item =>
      String(item.id) ===
      String(id)
  );

  if (!product) return;


  const row = state.cart.find(
    item =>
      String(item.id) ===
      String(id)
  );


  if (row) {

    row.qty++;

  } else {

    state.cart.push({
      id: product.id,
      qty: 1
    });

  }


  saveCart();
  renderCart();


  if (showToast) {

    toast(
      `${current(product.name)} adicionado ao carrinho`
    );

  }

}


/* ============================================================
   CARRINHO — REMOVER
============================================================ */

function remove(id) {

  state.cart =
    state.cart.filter(
      item =>
        String(item.id) !==
        String(id)
    );

  saveCart();
  renderCart();
}


/* ============================================================
   CARRINHO — ALTERAR QUANTIDADE
============================================================ */

function change(id, difference) {

  const item =
    state.cart.find(
      x =>
        String(x.id) ===
        String(id)
    );

  if (!item) return;


  item.qty += difference;


  if (item.qty <= 0) {

    remove(id);

    return;

  }


  saveCart();
  renderCart();
}


/* ============================================================
   CARRINHO — GUARDAR
============================================================ */

function saveCart() {

  localStorage.setItem(
    "rf_cart",
    JSON.stringify(state.cart)
  );


  const count =
    state.cart.reduce(
      (sum, item) =>
        sum + Number(item.qty || 0),
      0
    );


  const cartCount =
    $("#cartCount");

  if (cartCount) {

    cartCount.textContent =
      count;

  }

}


/* ============================================================
   CARRINHO — RENDERIZAR
============================================================ */

function renderCart() {

  const element =
    $("#cartItems");

  if (!element) return;


  let total = 0;


  const html =
    state.cart.map(item => {

      const product =
        state.products.find(
          p =>
            String(p.id) ===
            String(item.id)
        );


      if (!product) return "";


      total +=
        Number(product.price || 0) *
        Number(item.qty || 0);


      return `
        <div class="flex gap-3 border-b pb-3">

          <img
            src="${imgForProduct(product)}"
            class="w-16 h-16 rounded-lg object-cover"
            alt="${current(product.name)}"
          >


          <div class="flex-1">

            <div class="font-semibold text-sm">
              ${current(product.name)}
            </div>


            <div class="text-primary font-bold text-sm">
              ${money(
                Number(product.price || 0) *
                Number(item.qty || 0)
              )}
            </div>


            <div class="flex items-center gap-2 mt-2">

              <button
                data-minus="${product.id}"
                class="w-7 h-7 rounded bg-surface-container"
              >
                −
              </button>


              <span>
                ${item.qty}
              </span>


              <button
                data-plus="${product.id}"
                class="w-7 h-7 rounded bg-surface-container"
              >
                +
              </button>


              <button
                data-remove="${product.id}"
                class="ml-auto text-error text-xs"
              >
                Remover
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");


  element.innerHTML =
    html ||
    `
      <div class="text-center py-10 text-on-surface-variant">
        Carrinho vazio.
      </div>
    `;


  const cartTotal =
    $("#cartTotal");

  if (cartTotal) {

    cartTotal.textContent =
      money(total);

  }


  element
    .querySelectorAll("[data-minus]")
    .forEach(button => {

      button.onclick = () =>
        change(
          button.dataset.minus,
          -1
        );

    });


  element
    .querySelectorAll("[data-plus]")
    .forEach(button => {

      button.onclick = () =>
        change(
          button.dataset.plus,
          1
        );

    });


  element
    .querySelectorAll("[data-remove]")
    .forEach(button => {

      button.onclick = () =>
        remove(
          button.dataset.remove
        );

    });


  saveCart();

}


/* ============================================================
   COMO FUNCIONA
============================================================ */

function renderSteps() {

  const element =
    $("#steps");

  if (!element) return;


  const labels = {

    pt: [
      "Escolha",
      "Monte o carrinho",
      "Envie o pedido",
      "Acompanhe"
    ],

    en: [
      "Choose",
      "Build the cart",
      "Send the order",
      "Track it"
    ],

    zh: [
      "选择",
      "加入购物车",
      "发送订单",
      "跟踪"
    ],

    fr: [
      "Choisissez",
      "Composez le panier",
      "Envoyez",
      "Suivez"
    ],

    chg: [
      "Hlawula",
      "Lunghisa cart",
      "Yisa oda",
      "Landzelela"
    ]

  }[state.lang] || [];


  const descriptions = {

    pt: [
      "Pesquise produtos e compare preços.",
      "Ajuste quantidades e veja o total.",
      "O pedido pode ser partilhado pelo WhatsApp.",
      "A equipa confirma e actualiza o estado."
    ],

    en: [
      "Search products and compare prices.",
      "Adjust quantities and see the total.",
      "The order can be shared via WhatsApp.",
      "The team confirms and updates the status."
    ],

    zh: [
      "搜索商品并比较价格。",
      "调整数量并查看总额。",
      "订单可以通过 WhatsApp 发送。",
      "团队确认并更新订单状态。"
    ],

    fr: [
      "Recherchez les produits et comparez les prix.",
      "Ajustez les quantités et consultez le total.",
      "La commande peut être envoyée par WhatsApp.",
      "L'équipe confirme et met à jour le statut."
    ],

    chg: [
      "Lava swilo naswona ringanisa ntsengo.",
      "Lulamisa nhlayo u vona ntsengo.",
      "Oda yi nga rhumeriwa hi WhatsApp.",
      "Ntlawa wu tiyisisa naswona wu landzelela oda."
    ]

  }[state.lang] || [];


  element.innerHTML =
    labels.map(
      (label, index) => `

        <div class="text-center p-5 bg-white/10 rounded-2xl">

          <div
            class="w-12 h-12 mx-auto rounded-full bg-secondary-container flex items-center justify-center text-white font-bold"
          >
            ${index + 1}
          </div>


          <h3 class="font-semibold mt-3">
            ${label}
          </h3>


          <p class="text-sm opacity-80 mt-1">
            ${descriptions[index] || ""}
          </p>

        </div>

      `
    ).join("");

}


/* ============================================================
   FAQ
============================================================ */

function renderFaq() {

  const element =
    $("#faq");

  if (!element) return;


  const faq = [

    [
      "Preciso criar uma conta?",
      "Não para fazer o pedido. O cliente pode comprar sem registo."
    ],

    [
      "Quando o pedido fica confirmado?",
      "Depois de a equipa verificar stock, zona de entrega e forma de pagamento."
    ],

    [
      "Posso alterar um pedido?",
      "Sim, contacte o Rancho Flexível pelo WhatsApp o mais cedo possível."
    ],

    [
      "Como acompanho o pedido?",
      "O administrador pode actualizar o estado do pedido."
    ]

  ];


  element.innerHTML =
    faq.map(
      item => `

        <details class="bg-surface-container-low rounded-xl p-4">

          <summary class="font-semibold cursor-pointer">
            ${item[0]}
          </summary>


          <p class="text-sm text-on-surface-variant mt-2">
            ${item[1]}
          </p>

        </details>

      `
    ).join("");

}


/* ============================================================
   RENDERIZAR TUDO
============================================================ */

function renderAll() {

  renderCategories();

  renderFilters();

  renderKits();

  renderProducts();

  renderCart();

  renderSteps();

  renderFaq();


  const year =
    $("#year");

  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  /* ========================================================
     IMAGEM DO TOPO
  ======================================================== */

  if (state.settings?.hero_image) {

    const heroImage =
      $("#heroImage");

    if (heroImage) {

      heroImage.src =
        state.settings.hero_image;

    }

  }


  /* ========================================================
     CONTACTO
  ======================================================== */

  if (
    state.settings?.contact_email ||
    state.settings?.whatsapp
  ) {

    const footerContact =
      $("#footerContact");

    if (footerContact) {

      footerContact.innerHTML = `
        ${state.settings.contact_email || ""}
        <br>
        ${state.settings.whatsapp || ""}
      `;

    }

  }

}


/* ============================================================
   PESQUISA
============================================================ */

function setupSearch() {

  const searchInput =
    $("#searchInput");


  if (!searchInput) {

    console.warn(
      "Campo de pesquisa #searchInput não encontrado."
    );

    return;

  }


  /* Pesquisa enquanto escreve */

  searchInput.addEventListener(
    "input",
    () => {

      renderProducts();

    }
  );


  /* Enter */

  searchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        renderProducts();


        const productsSection =
          $("#produtos");

        if (productsSection) {

          productsSection.scrollIntoView({
            behavior: "smooth"
          });

        }

      }

    }
  );

}


/* ============================================================
   CATEGORIA
============================================================ */

function setupCategoryFilter() {

  const categoryFilter =
    $("#categoryFilter");

  if (!categoryFilter) return;

  categoryFilter.addEventListener(
    "change",
    renderProducts
  );

}


/* ============================================================
   ORDENAÇÃO
============================================================ */

function setupSortFilter() {

  const sortFilter =
    $("#sortFilter");

  if (!sortFilter) return;

  sortFilter.addEventListener(
    "change",
    renderProducts
  );

}


/* ============================================================
   CARRINHO — ABRIR
============================================================ */

function setupCart() {

  const cartButton =
    $("#cartBtn");

  if (cartButton) {

    cartButton.onclick = () => {

      const drawer =
        $("#cartDrawer");

      if (drawer) {

        drawer.classList.remove(
          "hidden"
        );

      }

    };

  }


  /* ========================================================
     FECHAR
  ======================================================== */

  const closeCart =
    $("#closeCart");

  if (closeCart) {

    closeCart.onclick = () => {

      const drawer =
        $("#cartDrawer");

      if (drawer) {

        drawer.classList.add(
          "hidden"
        );

      }

    };

  }


  /* ========================================================
     OVERLAY
  ======================================================== */

  const cartOverlay =
    $("#cartOverlay");

  if (cartOverlay) {

    cartOverlay.onclick = () => {

      const drawer =
        $("#cartDrawer");

      if (drawer) {

        drawer.classList.add(
          "hidden"
        );

      }

    };

  }


  /* ========================================================
     CHECKOUT
  ======================================================== */

  const checkoutButton =
    $("#checkoutBtn");

  if (checkoutButton) {

    checkoutButton.onclick = () => {

      if (!state.cart.length) {

        toast(
          "Adicione produtos primeiro."
        );

        return;

      }


      location.href =
        "checkout.html";

    };

  }

}


/* ============================================================
   IDIOMA
============================================================ */

function setupLanguage() {

  const languageSelect =
    $("#languageSelect");

  if (!languageSelect) return;


  languageSelect.value =
    state.lang;


  languageSelect.onchange =
    event => {

      state.lang =
        event.target.value;


      localStorage.setItem(
        "rf_lang",
        state.lang
      );


      renderAll();

      applyI18n();

    };

}


/* ============================================================
   INICIAR
============================================================ */

function init() {

  setupSearch();

  setupCategoryFilter();

  setupSortFilter();

  setupCart();

  setupLanguage();

  load();

}


/* ============================================================
   EXECUTAR
============================================================ */

init();
```
