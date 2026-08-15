import { supabase } from "./data.js";

const $ = (s) => document.querySelector(s);

let session = null;
let products = [];
let categories = [];
let bundles = [];
let settings = {};

/* ============================================================
   UTILITÁRIOS
============================================================ */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function toast(message) {
  let t = $("#toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className =
      "fixed bottom-5 right-5 z-[100] bg-[#00361a] text-white px-5 py-3 rounded-xl shadow-lg";
    document.body.appendChild(t);
  }

  t.textContent = message;
  t.classList.remove("hidden");

  setTimeout(() => {
    t.classList.add("hidden");
  }, 3000);
}

function current(v) {
  if (typeof v === "string") return v;

  return (
    v?.pt ||
    v?.en ||
    v?.fr ||
    v?.zh ||
    v?.chg ||
    Object.values(v || {})[0] ||
    ""
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MZN";
}

/* ============================================================
   UPLOAD DE IMAGENS
============================================================ */

async function uploadImage(file, folder = "site") {

  if (!file) return null;

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowed.includes(file.type)) {
    toast("Formato de imagem não permitido. Use JPG, PNG ou WebP.");
    return null;
  }

  if (file.size > 8 * 1024 * 1024) {
    toast("A imagem deve ter no máximo 8 MB.");
    return null;
  }

  const ext =
    file.name.split(".").pop().toLowerCase() || "jpg";

  const path =
    `${folder}/${crypto.randomUUID()}.${ext}`;

  const {
    error: uploadError
  } = await supabase
    .storage
    .from("site-images")
    .upload(path, file, {
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    toast("Erro no upload: " + uploadError.message);
    return null;
  }

  const {
    data
  } = supabase
    .storage
    .from("site-images")
    .getPublicUrl(path);

  return data?.publicUrl || null;
}

/* ============================================================
   INICIALIZAÇÃO
============================================================ */

async function boot() {

  if (!supabase) {
    login("Supabase não está configurado.");
    return;
  }

  const {
    data: sessionData,
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    login("Erro ao obter a sessão: " + sessionError.message);
    return;
  }

  session = sessionData.session;

  if (!session) {
    login();
    return;
  }

  /* VERIFICAR ADMIN */

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    login(
      "Erro ao verificar a conta de administrador: " +
      profileError.message
    );
    return;
  }

  if (!profile || profile.role !== "admin") {

    await supabase.auth.signOut();

    login(
      "Esta conta não tem permissão de administrador."
    );

    return;
  }

  const loaded = await load();

  if (!loaded) return;

  render();
}

/* ============================================================
   LOGIN
============================================================ */

function login(msg = "") {

  document.body.innerHTML = `
    <main class="min-h-screen flex items-center justify-center p-4 bg-[#f5f7f6]">

      <section class="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        <div class="w-14 h-14 bg-[#00361a] text-white rounded-2xl
                    flex items-center justify-center mx-auto">

          <span class="material-symbols-outlined">
            admin_panel_settings
          </span>

        </div>

        <h1 class="font-[Montserrat] text-2xl font-bold text-center mt-5">
          Rancho Flexível
        </h1>

        <p class="text-center text-sm text-[#414942] mt-2">
          Área administrativa
        </p>

        ${
          msg
            ? `
              <div class="mt-4 bg-[#fff4e5] text-[#673b00]
                          p-3 rounded-xl text-sm">
                ${esc(msg)}
              </div>
            `
            : ""
        }

        <form id="login" class="mt-6 space-y-4">

          <label class="block text-sm font-semibold">
            E-mail

            <input
              id="email"
              type="email"
              required
              class="mt-1 w-full border rounded-xl p-3"
            >
          </label>

          <label class="block text-sm font-semibold">
            Senha

            <input
              id="password"
              type="password"
              required
              class="mt-1 w-full border rounded-xl p-3"
            >
          </label>

          <button
            class="w-full py-3 bg-[#00361a] text-white
                   rounded-xl font-bold"
          >
            Entrar
          </button>

        </form>

        <p class="text-xs text-[#717971] mt-5">
          A autenticação é feita pelo Supabase.
        </p>

      </section>

    </main>
  `;

  $("#login").onsubmit = async (e) => {

    e.preventDefault();

    const email = $("#email").value;
    const password = $("#password").value;

    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      login(error.message);
      return;
    }

    location.reload();
  };
}

/* ============================================================
   CARREGAR DADOS
============================================================ */

async function load() {

  /* PRODUTOS */

  const productsResult = await supabase
    .from("products")
    .select("*")
    .order("sort_order", {
      ascending: true
    });

  if (productsResult.error) {

    showError(
      "Erro ao carregar produtos",
      productsResult.error.message
    );

    return false;
  }

  products = productsResult.data || [];


  /* CATEGORIAS */

  const categoriesResult = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", {
      ascending: true
    });

  if (categoriesResult.error) {

    showError(
      "Erro ao carregar categorias",
      categoriesResult.error.message
    );

    return false;
  }

  categories = categoriesResult.data || [];


  /* RANCHO DO MÊS / BUNDLES */

  const bundlesResult = await supabase
    .from("bundles")
    .select("*")
    .order("sort_order", {
      ascending: true
    });

  if (bundlesResult.error) {

    console.error(
      "Erro ao carregar bundles:",
      bundlesResult.error
    );

    bundles = [];

  } else {

    bundles = bundlesResult.data || [];

  }


  /* CONFIGURAÇÕES */

  const settingsResult = await supabase
    .from("site_settings")
    .select("*");

  if (settingsResult.error) {

    console.error(
      "Erro ao carregar configurações:",
      settingsResult.error
    );

    settings = {};

  } else {

    settings = Object.fromEntries(
      (settingsResult.data || []).map(row => [
        row.key,
        row.value
      ])
    );

  }


  console.log("Produtos:", products);
  console.log("Categorias:", categories);
  console.log("Rancho do Mês:", bundles);
  console.log("Configurações:", settings);

  return true;
}

/* ============================================================
   ERRO
============================================================ */

function showError(title, message) {

  document.body.innerHTML = `
    <main class="min-h-screen flex items-center justify-center p-6 bg-[#f5f7f6]">

      <div class="max-w-xl bg-white rounded-2xl shadow p-6">

        <h1 class="text-2xl font-bold text-red-700">
          ${esc(title)}
        </h1>

        <p class="mt-4">
          ${esc(message)}
        </p>

      </div>

    </main>
  `;
}

/* ============================================================
   ESTRUTURA DO PAINEL
============================================================ */

function shell(content) {

  document.body.innerHTML = `

    <div class="min-h-screen flex bg-[#f5f7f6]">

      <aside
        class="hidden md:flex w-64 bg-[#00361a]
        text-white p-5 flex-col"
      >

        <a
          href="index.html"
          class="font-[Montserrat] text-xl font-bold mb-8"
        >
          Rancho Flexível
        </a>

        <nav class="space-y-1 text-sm">

          <button
            data-tab="dashboard"
            class="w-full text-left px-3 py-3 rounded-lg hover:bg-white/10"
          >
            Dashboard
          </button>

          <button
            data-tab="products"
            class="w-full text-left px-3 py-3 rounded-lg hover:bg-white/10"
          >
            Produtos
          </button>

          <button
            data-tab="orders"
            class="w-full text-left px-3 py-3 rounded-lg hover:bg-white/10"
          >
            Pedidos
          </button>

          <button
            data-tab="settings"
            class="w-full text-left px-3 py-3 rounded-lg hover:bg-white/10"
          >
            Configurações
          </button>

        </nav>

        <button
          id="logout"
          class="mt-auto text-left px-3 py-3 rounded-lg hover:bg-white/10"
        >
          Terminar sessão
        </button>

      </aside>

      <main class="flex-1 p-4 lg:p-8">
        ${content}
      </main>

    </div>
  `;

  $("#logout").onclick = async () => {

    await supabase.auth.signOut();

    location.reload();
  };

  document
    .querySelectorAll("[data-tab]")
    .forEach(button => {

      button.onclick = () => {

        const tab = button.dataset.tab;

        if (tab === "products") {
          renderProducts();
        }

        else if (tab === "dashboard") {
          render();
        }

        else if (tab === "orders") {
          renderOrders();
        }

        else {
          renderSettings();
        }

      };

    });
}

/* ============================================================
   DASHBOARD
============================================================ */

function render() {

  shell(`

    <div class="flex flex-col md:flex-row
                md:items-center justify-between gap-4">

      <div>

        <p class="text-sm text-[#717971]">
          Painel administrativo
        </p>

        <h1 class="font-[Montserrat] text-3xl font-bold">
          Dashboard
        </h1>

      </div>

      <a
        href="index.html"
        class="px-4 py-2 rounded-xl border bg-white"
      >
        Ver site
      </a>

    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">

      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <p class="text-sm text-[#717971]">Produtos</p>
        <b class="text-2xl">${products.length}</b>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <p class="text-sm text-[#717971]">Ativos</p>
        <b class="text-2xl">
          ${products.filter(p => p.active !== false).length}
        </b>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <p class="text-sm text-[#717971]">Stock baixo</p>
        <b class="text-2xl">
          ${products.filter(p => (p.stock ?? 0) < 5).length}
        </b>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm">
        <p class="text-sm text-[#717971]">Rancho do Mês</p>
        <b class="text-2xl">${bundles.length}</b>
      </div>

    </div>

    <div class="mt-8 bg-white rounded-2xl p-5">

      <h2 class="font-[Montserrat] text-xl font-bold">
        Gestão rápida
      </h2>

      <div class="flex flex-wrap gap-3 mt-4">

        <button
          id="goProducts"
          class="px-4 py-2 rounded-xl bg-[#00361a] text-white"
        >
          Gerir produtos
        </button>

        <button
          id="goOrders"
          class="px-4 py-2 rounded-xl border"
        >
          Pedidos
        </button>

        <button
          id="goSettings"
          class="px-4 py-2 rounded-xl border"
        >
          Configurações
        </button>

      </div>

    </div>
  `);

  $("#goProducts").onclick = renderProducts;
  $("#goOrders").onclick = renderOrders;
  $("#goSettings").onclick = renderSettings;
}

/* ============================================================
   PRODUTOS
============================================================ */

function renderProducts() {

  shell(`

    <div class="flex items-center justify-between gap-4">

      <div>

        <h1 class="font-[Montserrat] text-3xl font-bold">
          Produtos
        </h1>

        <p class="text-sm text-[#717971]">
          Gerir produtos, preços, stock e imagens.
        </p>

      </div>

      <button
        id="new"
        class="px-4 py-2 bg-[#fd9d27]
               text-white rounded-xl font-bold"
      >
        + Adicionar produto
      </button>

    </div>

    <div class="bg-white rounded-2xl shadow-sm overflow-x-auto mt-6">

      <table class="w-full text-sm">

        <thead class="bg-[#eef5f7]">

          <tr>

            <th class="text-left p-4">Produto</th>
            <th class="text-left p-4">Categoria</th>
            <th class="text-left p-4">Preço</th>
            <th class="text-left p-4">Stock</th>
            <th class="p-4">Ações</th>

          </tr>

        </thead>

        <tbody>

          ${
            products.map(p => {

              const category = categories.find(
                c => String(c.id) === String(p.category_id)
              );

              return `

                <tr class="border-t">

                  <td class="p-4">

                    <div class="flex items-center gap-3">

                      ${
                        p.image_url
                          ? `
                            <img
                              src="${esc(p.image_url)}"
                              class="w-12 h-12 object-cover rounded-lg"
                            >
                          `
                          : `
                            <div class="w-12 h-12 rounded-lg bg-[#eef5f7]
                                        flex items-center justify-center">
                              <span class="material-symbols-outlined">
                                image
                              </span>
                            </div>
                          `
                      }

                      <div>

                        <b>
                          ${esc(current(p.name))}
                        </b>

                        <div class="text-xs text-[#717971]">
                          ${esc(p.sku || p.id)}
                        </div>

                      </div>

                    </div>

                  </td>

                  <td class="p-4">
                    ${esc(current(category?.name) || "Sem categoria")}
                  </td>

                  <td class="p-4 font-bold">
                    ${formatMoney(p.price)}
                  </td>

                  <td class="p-4">
                    ${p.stock ?? 0}
                  </td>

                  <td class="p-4 text-right">

                    <button
                      data-edit="${esc(p.id)}"
                      class="px-3 py-2 rounded-lg bg-[#e8eff1]"
                    >
                      Editar
                    </button>

                  </td>

                </tr>
              `;

            }).join("")
          }

        </tbody>

      </table>

    </div>
  `);

  $("#new").onclick = () => form();

  document
    .querySelectorAll("[data-edit]")
    .forEach(button => {

      button.onclick = () => {

        const product = products.find(
          p => String(p.id) === String(button.dataset.edit)
        );

        form(product);
      };

    });
}

/* ============================================================
   FORM PRODUTO
============================================================ */

function form(product = null) {

  const isNew = !product;

  const p = product || {

    id: "RF-" + Date.now(),

    name: { pt: "" },

    description: { pt: "" },

    price: 0,

    old_price: "",

    stock: 0,

    sku: "",

    unit: "",

    tag: { pt: "" },

    category_id: "",

    image_url: null,

    active: true,

    featured: false

  };

  const categoryOptions = categories
    .map(category => {

      const categoryName =
        current(category.name) || "Categoria";

      return `
        <option
          value="${esc(category.id)}"
          ${
            String(category.id) === String(p.category_id)
              ? "selected"
              : ""
          }
        >
          ${esc(categoryName)}
        </option>
      `;

    })
    .join("");

  shell(`

    <div class="max-w-4xl">

      <button id="back" class="text-sm text-[#414942]">
        ← Voltar
      </button>

      <h1 class="font-[Montserrat] text-3xl font-bold mt-3">
        ${isNew ? "Adicionar produto" : "Editar produto"}
      </h1>

      <form
        id="productForm"
        class="bg-white rounded-2xl p-6 shadow-sm mt-6 space-y-5"
      >

        <div class="grid md:grid-cols-2 gap-4">

          ${field("Nome do produto", "name_pt", p.name?.pt)}

          ${field("Descrição", "desc_pt", p.description?.pt)}

          ${field("Preço (MZN)", "price", p.price, "number")}

          ${field("Preço anterior", "old_price", p.old_price, "number")}

          ${field("Stock", "stock", p.stock, "number")}

          ${field("SKU", "sku", p.sku)}

          ${field("Unidade", "unit", p.unit)}

          ${field("Tag", "tag_pt", p.tag?.pt)}

        </div>

        <label class="block text-sm font-semibold">

          Categoria

          <select
            id="category_id"
            required
            class="mt-1 w-full border rounded-xl p-3"
          >

            <option value="">
              Selecione a categoria
            </option>

            ${categoryOptions}

          </select>

        </label>

        <div class="border-2 border-dashed rounded-2xl p-5">

          <label class="block text-sm font-semibold">

            Imagem do produto

            <input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="mt-2 block w-full"
            >

          </label>

          <img
            id="preview"
            src="${esc(p.image_url || "")}"
            class="mt-4 w-40 h-40 object-cover rounded-xl
                   ${p.image_url ? "" : "hidden"}"
          >

        </div>

        <div class="flex gap-5">

          <label>
            <input
              id="active"
              type="checkbox"
              ${p.active !== false ? "checked" : ""}
            >
            Ativo
          </label>

          <label>
            <input
              id="featured"
              type="checkbox"
              ${p.featured ? "checked" : ""}
            >
            Destaque
          </label>

        </div>

        <div class="flex gap-3">

          <button
            class="px-5 py-3 bg-[#00361a]
                   text-white rounded-xl font-bold"
          >
            Guardar
          </button>

          ${
            !isNew
              ? `
                <button
                  type="button"
                  id="delete"
                  class="px-5 py-3 bg-red-50
                         text-red-700 rounded-xl"
                >
                  Excluir
                </button>
              `
              : ""
          }

        </div>

      </form>

    </div>
  `);

  $("#back").onclick = renderProducts;

  $("#image").onchange = e => {

    const file = e.target.files[0];

    if (!file) return;

    $("#preview").src =
      URL.createObjectURL(file);

    $("#preview").classList.remove("hidden");
  };

  $("#productForm").onsubmit = async e => {

    e.preventDefault();

    await saveProduct(p, isNew);
  };

  if (!isNew) {

    $("#delete").onclick = async () => {

      if (!confirm("Tem certeza que deseja excluir este produto?")) {
        return;
      }

      const {
        error
      } = await supabase
        .from("products")
        .delete()
        .eq("id", p.id);

      if (error) {
        toast(error.message);
        return;
      }

      toast("Produto excluído.");

      await load();

      renderProducts();
    };
  }
}

/* ============================================================
   CAMPO
============================================================ */

function field(label, id, value = "", type = "text") {

  return `
    <label class="block text-sm font-semibold">

      ${esc(label)}

      <input
        id="${esc(id)}"
        type="${esc(type)}"
        value="${esc(value)}"
        class="mt-1 w-full border rounded-xl p-3"
      >

    </label>
  `;
}

/* ============================================================
   GUARDAR PRODUTO
============================================================ */

async function saveProduct(p, isNew) {

  let image_url = p.image_url || null;

  const file = $("#image")?.files?.[0];

  if (file) {

    image_url =
      await uploadImage(file, "products");

    if (!image_url) return;
  }

  const row = {

    id: p.id,

    name: {
      pt: $("#name_pt").value
    },

    description: {
      pt: $("#desc_pt").value
    },

    category_id:
      $("#category_id").value || null,

    price:
      Number($("#price").value || 0),

    old_price:
      Number($("#old_price").value || 0) || null,

    stock:
      Number($("#stock").value || 0),

    sku:
      $("#sku").value,

    unit:
      $("#unit").value,

    tag: {
      pt: $("#tag_pt").value
    },

    image_url,

    active:
      $("#active").checked,

    featured:
      $("#featured").checked,

    updated_at:
      new Date().toISOString()

  };

  let result;

  if (isNew) {

    result = await supabase
      .from("products")
      .insert(row);

  } else {

    result = await supabase
      .from("products")
      .update(row)
      .eq("id", p.id);

  }

  if (result.error) {

    toast(
      "Erro ao guardar: " +
      result.error.message
    );

    return;
  }

  toast(
    isNew
      ? "Produto adicionado com sucesso."
      : "Produto atualizado com sucesso."
  );

  await load();

  renderProducts();
}

/* ============================================================
   PEDIDOS
============================================================ */

function renderOrders() {

  shell(`

    <h1 class="font-[Montserrat] text-3xl font-bold">
      Pedidos
    </h1>

    <div id="orders" class="mt-6"></div>

  `);

  loadOrders();
}

async function loadOrders() {

  const {
    data,
    error
  } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    $("#orders").textContent =
      error.message;

    return;
  }

  $("#orders").innerHTML = `

    <div class="bg-white rounded-2xl overflow-x-auto">

      <table class="w-full text-sm">

        <thead class="bg-[#eef5f7]">

          <tr>

            <th class="p-4 text-left">Pedido</th>
            <th class="p-4 text-left">Cliente</th>
            <th class="p-4 text-left">Total</th>
            <th class="p-4 text-left">Estado</th>

          </tr>

        </thead>

        <tbody>

          ${(data || []).map(o => `

            <tr class="border-t">

              <td class="p-4 font-bold">
                ${esc(o.order_number)}
              </td>

              <td class="p-4">
                ${esc(o.customer_name)}
                <br>
                <span class="text-xs">
                  ${esc(o.customer_phone)}
                </span>
              </td>

              <td class="p-4 font-bold">
                ${formatMoney(o.total)}
              </td>

              <td class="p-4">

                <select
                  data-status="${esc(o.id)}"
                  class="border rounded-lg p-2"
                >

                  <option value="new">Novo</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">Em preparação</option>
                  <option value="ready">Pronto</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>

                </select>

              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;

  for (
    const select
    of document.querySelectorAll("[data-status]")
  ) {

    const row = data.find(
      x =>
        String(x.id) ===
        String(select.dataset.status)
    );

    if (!row) continue;

    select.value = row.status;

    select.onchange = async () => {

      const {
        error
      } = await supabase
        .from("orders")
        .update({
          status: select.value,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id);

      toast(
        error
          ? error.message
          : "Estado atualizado."
      );
    };
  }
}

/* ============================================================
   CONFIGURAÇÕES
============================================================ */

function renderSettings() {

  const heroImage =
    typeof settings.hero_image === "string"
      ? settings.hero_image
      : "";

  const whatsapp =
    typeof settings.whatsapp === "string"
      ? settings.whatsapp
      : "+258840000000";

  const email =
    typeof settings.contact_email === "string"
      ? settings.contact_email
      : "contato@ranchoflexivel.co.mz";

  const defaultLanguage =
    typeof settings.default_language === "string"
      ? settings.default_language
      : "pt";

  shell(`

    <div class="max-w-5xl">

      <div>

        <p class="text-sm text-[#717971]">
          Configurações do site
        </p>

        <h1 class="font-[Montserrat] text-3xl font-bold">
          Configurações
        </h1>

      </div>


      <!-- ==================================================
           IMAGEM GRANDE DO TOPO
      =================================================== -->

      <section
        class="bg-white rounded-2xl p-6 mt-6 shadow-sm"
      >

        <h2 class="font-[Montserrat] text-xl font-bold">
          Imagem grande do topo
        </h2>

        <p class="text-sm text-[#717971] mt-1">
          Imagem principal da página inicial.
        </p>

        <div
          class="mt-5 border-2 border-dashed
                 rounded-2xl p-5"
        >

          <input
            id="heroImageInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="block w-full"
          >

          <div
            class="mt-4 rounded-2xl overflow-hidden
                   bg-[#eef5f7] aspect-[16/6]"
          >

            <img
              id="heroPreview"
              src="${esc(heroImage)}"
              class="w-full h-full object-cover
                     ${heroImage ? "" : "hidden"}"
            >

            <div
              id="heroEmpty"
              class="w-full h-full flex items-center
                     justify-center text-[#717971]
                     ${heroImage ? "hidden" : ""}"
            >
              Nenhuma imagem definida
            </div>

          </div>

          <button
            id="saveHero"
            type="button"
            class="mt-4 px-5 py-3
                   bg-[#00361a] text-white
                   rounded-xl font-bold"
          >
            Guardar imagem do topo
          </button>

        </div>

      </section>


      <!-- ==================================================
           RANCHO DO MÊS
      =================================================== -->

      <section
        class="bg-white rounded-2xl p-6 mt-6 shadow-sm"
      >

        <h2 class="font-[Montserrat] text-xl font-bold">
          Rancho do Mês
        </h2>

        <p class="text-sm text-[#717971] mt-1">
          Altere a imagem de cada Rancho do Mês.
        </p>

        <div
          id="bundlesAdmin"
          class="grid md:grid-cols-2 gap-5 mt-5"
        >

          ${
            bundles.length
              ? bundles.map(bundle => bundleImageCard(bundle)).join("")
              : `
                <div
                  class="md:col-span-2
                         border rounded-2xl p-6
                         text-center text-[#717971]"
                >
                  Nenhum Rancho do Mês encontrado.
                </div>
              `
          }

        </div>

      </section>


      <!-- ==================================================
           CATEGORIAS
      =================================================== -->

      <section
        class="bg-white rounded-2xl p-6 mt-6 shadow-sm"
      >

        <h2 class="font-[Montserrat] text-xl font-bold">
          Categorias
        </h2>

        <p class="text-sm text-[#717971] mt-1">
          Altere a imagem de cada categoria.
        </p>

        <div
          id="categoriesAdmin"
          class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5"
        >

          ${
            categories.length
              ? categories.map(category =>
                  categoryImageCard(category)
                ).join("")
              : `
                <div
                  class="sm:col-span-2 lg:col-span-3
                         border rounded-2xl p-6
                         text-center text-[#717971]"
                >
                  Nenhuma categoria encontrada.
                </div>
              `
          }

        </div>

      </section>


      <!-- ==================================================
           CONTACTO
      =================================================== -->

      <section
        class="bg-white rounded-2xl p-6 mt-6 shadow-sm"
      >

        <h2 class="font-[Montserrat] text-xl font-bold">
          Contacto
        </h2>

        <form id="settingsForm" class="mt-5 space-y-4">

          ${field(
            "WhatsApp",
            "wa",
            whatsapp
          )}

          ${field(
            "E-mail",
            "email",
            email
          )}

          <label class="block text-sm font-semibold">

            Idioma padrão

            <select
              id="defaultLang"
              class="mt-1 w-full border rounded-xl p-3"
            >

              <option
                value="pt"
                ${defaultLanguage === "pt" ? "selected" : ""}
              >
                Português
              </option>

              <option
                value="en"
                ${defaultLanguage === "en" ? "selected" : ""}
              >
                English
              </option>

              <option
                value="fr"
                ${defaultLanguage === "fr" ? "selected" : ""}
              >
                Français
              </option>

              <option
                value="zh"
                ${defaultLanguage === "zh" ? "selected" : ""}
              >
                中文
              </option>

              <option
                value="chg"
                ${defaultLanguage === "chg" ? "selected" : ""}
              >
                Changana
              </option>

            </select>

          </label>

          <button
            class="px-5 py-3
                   bg-[#00361a]
                   text-white
                   rounded-xl font-bold"
          >
            Guardar configurações
          </button>

        </form>

      </section>

    </div>
  `);


  /* ==========================================================
     HERO PREVIEW
  ========================================================== */

  $("#heroImageInput").onchange = e => {

    const file = e.target.files[0];

    if (!file) return;

    $("#heroPreview").src =
      URL.createObjectURL(file);

    $("#heroPreview").classList.remove("hidden");
    $("#heroEmpty").classList.add("hidden");
  };


  $("#saveHero").onclick =
    async () => {

      const file =
        $("#heroImageInput").files[0];

      if (!file) {

        toast("Selecione uma imagem primeiro.");

        return;
      }

      toast("A enviar imagem...");

      const url =
        await uploadImage(file, "hero");

      if (!url) return;

      const saved =
        await saveSetting(
          "hero_image",
          url
        );

      if (!saved) return;

      settings.hero_image = url;

      toast("Imagem grande do topo atualizada.");

      setTimeout(() => {
        renderSettings();
      }, 500);
    };


  /* ==========================================================
     CONTACTOS
  ========================================================== */

  $("#settingsForm").onsubmit =
    async e => {

      e.preventDefault();

      const values = [
        [
          "whatsapp",
          $("#wa").value
        ],
        [
          "contact_email",
          $("#email").value
        ],
        [
          "default_language",
          $("#defaultLang").value
        ]
      ];

      for (const [key, value] of values) {

        const saved =
          await saveSetting(key, value);

        if (!saved) return;

        settings[key] = value;
      }

      toast("Configurações guardadas.");
    };


  /* ==========================================================
     BOTÕES DOS BUNDLES
  ========================================================== */

  document
    .querySelectorAll("[data-bundle-image]")
    .forEach(input => {

      input.onchange = e => {

        const file = e.target.files[0];

        if (!file) return;

        const id =
          input.dataset.bundleImage;

        const preview =
          document.querySelector(
            `[data-bundle-preview="${CSS.escape(id)}"]`
          );

        if (preview) {

          preview.src =
            URL.createObjectURL(file);

          preview.classList.remove("hidden");
        }
      };
    });


  document
    .querySelectorAll("[data-save-bundle]")
    .forEach(button => {

      button.onclick =
        async () => {

          const id =
            button.dataset.saveBundle;

          const input =
            document.querySelector(
              `[data-bundle-image="${CSS.escape(id)}"]`
            );

          const file =
            input?.files?.[0];

          if (!file) {

            toast("Selecione uma nova imagem.");

            return;
          }

          toast("A enviar imagem...");

          const url =
            await uploadImage(
              file,
              "bundles"
            );

          if (!url) return;

          const {
            error
          } = await supabase
            .from("bundles")
            .update({
              image_url: url,
              updated_at:
                new Date().toISOString()
            })
            .eq("id", id);

          if (error) {

            toast(
              "Erro ao guardar: " +
              error.message
            );

            return;
          }

          toast("Imagem do Rancho do Mês atualizada.");

          await load();

          renderSettings();
        };
    });


  /* ==========================================================
     BOTÕES DAS CATEGORIAS
  ========================================================== */

  document
    .querySelectorAll("[data-category-image]")
    .forEach(input => {

      input.onchange = e => {

        const file = e.target.files[0];

        if (!file) return;

        const id =
          input.dataset.categoryImage;

        const preview =
          document.querySelector(
            `[data-category-preview="${CSS.escape(id)}"]`
          );

        if (preview) {

          preview.src =
            URL.createObjectURL(file);

          preview.classList.remove("hidden");
        }
      };
    });


  document
    .querySelectorAll("[data-save-category]")
    .forEach(button => {

      button.onclick =
        async () => {

          const id =
            button.dataset.saveCategory;

          const input =
            document.querySelector(
              `[data-category-image="${CSS.escape(id)}"]`
            );

          const file =
            input?.files?.[0];

          if (!file) {

            toast("Selecione uma nova imagem.");

            return;
          }

          toast("A enviar imagem...");

          const url =
            await uploadImage(
              file,
              "categories"
            );

          if (!url) return;

          const {
            error
          } = await supabase
            .from("categories")
            .update({
              image_url: url,
              updated_at:
                new Date().toISOString()
            })
            .eq("id", id);

          if (error) {

            toast(
              "Erro ao guardar: " +
              error.message
            );

            return;
          }

          toast("Imagem da categoria atualizada.");

          await load();

          renderSettings();
        };
    });
}

/* ============================================================
   CARD — RANCHO DO MÊS
============================================================ */

function bundleImageCard(bundle) {

  const image =
    bundle.image_url || "";

  const name =
    current(bundle.name) ||
    bundle.id ||
    "Rancho";

  return `

    <div class="border rounded-2xl overflow-hidden">

      <div class="h-44 bg-[#eef5f7]">

        ${
          image
            ? `
              <img
                data-bundle-preview="${esc(bundle.id)}"
                src="${esc(image)}"
                class="w-full h-full object-cover"
                alt="${esc(name)}"
              >
            `
            : `
              <div
                data-bundle-preview="${esc(bundle.id)}"
                class="w-full h-full flex items-center
                       justify-center text-[#717971]"
              >
                <span class="material-symbols-outlined text-4xl">
                  image
                </span>
              </div>
            `
        }

      </div>

      <div class="p-4">

        <h3 class="font-bold text-lg">
          ${esc(name)}
        </h3>

        <p class="text-sm text-[#717971] mt-1">
          ${formatMoney(bundle.price)}
        </p>

        <input
          data-bundle-image="${esc(bundle.id)}"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="mt-4 block w-full text-sm"
        >

        <button
          data-save-bundle="${esc(bundle.id)}"
          class="mt-4 w-full px-4 py-3
                 bg-[#00361a] text-white
                 rounded-xl font-bold"
        >
          Guardar imagem
        </button>

      </div>

    </div>
  `;
}

/* ============================================================
   CARD — CATEGORIA
============================================================ */

function categoryImageCard(category) {

  const image =
    category.image_url || "";

  const name =
    current(category.name) ||
    "Categoria";

  return `

    <div class="border rounded-2xl overflow-hidden">

      <div class="h-40 bg-[#eef5f7]">

        ${
          image
            ? `
              <img
                data-category-preview="${esc(category.id)}"
                src="${esc(image)}"
                class="w-full h-full object-cover"
                alt="${esc(name)}"
              >
            `
            : `
              <div
                data-category-preview="${esc(category.id)}"
                class="w-full h-full flex items-center
                       justify-center text-[#717971]"
              >
                <span class="material-symbols-outlined text-4xl">
                  image
                </span>
              </div>
            `
        }

      </div>

      <div class="p-4">

        <h3 class="font-bold">
          ${esc(name)}
        </h3>

        <input
          data-category-image="${esc(category.id)}"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="mt-4 block w-full text-sm"
        >

        <button
          data-save-category="${esc(category.id)}"
          class="mt-4 w-full px-4 py-3
                 bg-[#00361a] text-white
                 rounded-xl font-bold"
        >
          Guardar imagem
        </button>

      </div>

    </div>
  `;
}

/* ============================================================
   GUARDAR CONFIGURAÇÃO
============================================================ */

async function saveSetting(key, value) {

  const {
    error
  } = await supabase
    .from("site_settings")
    .upsert({
      key,
      value,
      updated_at:
        new Date().toISOString()
    });

  if (error) {

    toast(
      "Erro ao guardar: " +
      error.message
    );

    return false;
  }

  return true;
}

/* ============================================================
   INICIAR
============================================================ */

boot();
