import { supabase } from "./data.js";

const $ = (s) => document.querySelector(s);

let session = null;
let products = [];
let categories = [];
let bundles = [];

/* =========================
   UTILITÁRIOS
========================= */

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
      "fixed bottom-5 right-5 z-50 bg-[#00361a] text-white px-5 py-3 rounded-xl shadow-lg";
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
    Object.values(v || {})[0] ||
    ""
  );
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MZN";
}

/* =========================
   INICIALIZAÇÃO
========================= */

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

  /* =========================
     VERIFICAR ADMIN
  ========================= */

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

  /* =========================
     CARREGAR DADOS
  ========================= */

  const loaded = await load();

  if (!loaded) {
    return;
  }

  render();
}

/* =========================
   LOGIN
========================= */

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

    const { error } =
      await supabase.auth.signInWithPassword({
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

/* =========================
   CARREGAR DADOS
========================= */

async function load() {

  /* =========================
     PRODUTOS
  ========================= */

  const productsResult =
    await supabase
      .from("products")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (productsResult.error) {

    showLoadError(
      "Erro ao carregar produtos",
      productsResult.error.message
    );

    return false;
  }

  products = productsResult.data || [];


  /* =========================
     CATEGORIAS
  ========================= */

  const categoriesResult =
    await supabase
      .from("categories")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (categoriesResult.error) {

    showLoadError(
      "Erro ao carregar categorias",
      categoriesResult.error.message
    );

    return false;
  }

  categories = categoriesResult.data || [];


  /* =========================
     RANCHO DO MÊS
  ========================= */

  const bundlesResult =
    await supabase
      .from("bundles")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (bundlesResult.error) {

    showLoadError(
      "Erro ao carregar Rancho do Mês",
      bundlesResult.error.message
    );

    return false;
  }

  bundles = bundlesResult.data || [];


  console.log("Categorias carregadas:", categories);
  console.log("Rancho do Mês carregado:", bundles);

  return true;
}

function showLoadError(title, message) {

  document.body.innerHTML = `
    <main class="min-h-screen flex items-center justify-center p-6">

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

/* =========================
   ESTRUTURA DO PAINEL
========================= */

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
            class="w-full text-left px-3 py-3
                   rounded-lg hover:bg-white/10"
          >
            Dashboard
          </button>

          <button
            data-tab="products"
            class="w-full text-left px-3 py-3
                   rounded-lg hover:bg-white/10"
          >
            Produtos
          </button>

          <button
            data-tab="orders"
            class="w-full text-left px-3 py-3
                   rounded-lg hover:bg-white/10"
          >
            Pedidos
          </button>

          <button
            data-tab="settings"
            class="w-full text-left px-3 py-3
                   rounded-lg hover:bg-white/10"
          >
            Configurações
          </button>

        </nav>

        <button
          id="logout"
          class="mt-auto text-left px-3 py-3
                 rounded-lg hover:bg-white/10"
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
    .forEach((button) => {

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

/* =========================
   DASHBOARD
========================= */

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

    <div
      class="grid sm:grid-cols-2 lg:grid-cols-4
             gap-4 mt-7"
    >

      <div class="bg-white rounded-2xl p-5 shadow-sm">

        <p class="text-sm text-[#717971]">
          Produtos
        </p>

        <b class="text-2xl">
          ${products.length}
        </b>

      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm">

        <p class="text-sm text-[#717971]">
          Ativos
        </p>

        <b class="text-2xl">
          ${
            products.filter(
              p => p.active !== false
            ).length
          }
        </b>

      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm">

        <p class="text-sm text-[#717971]">
          Stock baixo
        </p>

        <b class="text-2xl">
          ${
            products.filter(
              p => (p.stock ?? 0) < 5
            ).length
          }
        </b>

      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm">

        <p class="text-sm text-[#717971]">
          Conta
        </p>

        <b class="text-2xl">
          Admin
        </b>

      </div>

    </div>

    <div class="mt-8 bg-white rounded-2xl p-5">

      <h2 class="font-[Montserrat] text-xl font-bold">
        Gestão rápida
      </h2>

      <div class="flex flex-wrap gap-3 mt-4">

        <button
          id="goProducts"
          class="px-4 py-2 rounded-xl
                 bg-[#00361a] text-white"
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

/* =========================
   LISTA DE PRODUTOS
========================= */

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

    <div
      class="bg-white rounded-2xl shadow-sm
             overflow-x-auto mt-6"
    >

      <table class="w-full text-sm">

        <thead class="bg-[#eef5f7]">

          <tr>

            <th class="text-left p-4">
              Produto
            </th>

            <th class="text-left p-4">
              Categoria
            </th>

            <th class="text-left p-4">
              Preço
            </th>

            <th class="text-left p-4">
              Stock
            </th>

            <th class="p-4">
              Ações
            </th>

          </tr>

        </thead>

        <tbody>

          ${
            products.map(p => {

              const category =
                categories.find(
                  c =>
                    String(c.id) ===
                    String(p.category_id)
                );

              return `

                <tr class="border-t">

                  <td class="p-4">

                    <div class="flex items-center gap-3">

                      <img
                        src="${esc(p.image_url || "")}"
                        class="w-12 h-12
                               object-cover rounded-lg"
                      >

                      <div>

                        <b>
                          ${esc(p.name?.pt || "")}
                        </b>

                        <div
                          class="text-xs
                                 text-[#717971]"
                        >
                          ${esc(p.sku || p.id)}
                        </div>

                      </div>

                    </div>

                  </td>

                  <td class="p-4">

                    ${
                      esc(
                        category?.name?.pt ||
                        "Sem categoria"
                      )
                    }

                  </td>

                  <td class="p-4 font-bold">

                    ${
                      Number(p.price || 0)
                        .toLocaleString(
                          "pt-MZ",
                          {
                            minimumFractionDigits: 2
                          }
                        )
                    }

                    MZN

                  </td>

                  <td class="p-4">
                    ${p.stock ?? 0}
                  </td>

                  <td class="p-4 text-right">

                    <button
                      data-edit="${esc(p.id)}"
                      class="px-3 py-2 rounded-lg
                             bg-[#e8eff1]"
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

        const product =
          products.find(
            p =>
              String(p.id) ===
              String(button.dataset.edit)
          );

        form(product);
      };

    });
}

/* =========================
   FORMULÁRIO PRODUTO
========================= */

function form(product = null) {

  const isNew = !product;

  const p = product || {

    id: "RF-" + Date.now(),

    name: {
      pt: ""
    },

    description: {
      pt: ""
    },

    price: 0,

    old_price: "",

    stock: 0,

    sku: "",

    unit: "",

    tag: {
      pt: ""
    },

    category_id: "",

    image_url: null,

    active: true,

    featured: false

  };

  const categoryOptions = categories
    .map(category => {

      const categoryName =
        category?.name?.pt ||
        category?.name ||
        "Categoria";

      return `

        <option
          value="${esc(category.id)}"
          ${
            String(category.id) ===
            String(p.category_id)
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

      <button
        id="back"
        class="text-sm text-[#414942]"
      >
        ← Voltar
      </button>

      <h1
        class="font-[Montserrat]
               text-3xl font-bold mt-3"
      >
        ${isNew
          ? "Adicionar produto"
          : "Editar produto"}
      </h1>

      <form
        id="productForm"
        class="bg-white rounded-2xl
               p-6 shadow-sm mt-6 space-y-5"
      >

        <div class="grid md:grid-cols-2 gap-4">

          ${field(
            "Nome do produto",
            "name_pt",
            p.name?.pt
          )}

          ${field(
            "Descrição",
            "desc_pt",
            p.description?.pt
          )}

          ${field(
            "Preço (MZN)",
            "price",
            p.price,
            "number"
          )}

          ${field(
            "Preço anterior",
            "old_price",
            p.old_price,
            "number"
          )}

          ${field(
            "Stock",
            "stock",
            p.stock,
            "number"
          )}

          ${field(
            "SKU",
            "sku",
            p.sku
          )}

          ${field(
            "Unidade",
            "unit",
            p.unit
          )}

          ${field(
            "Tag",
            "tag_pt",
            p.tag?.pt
          )}

        </div>

        <label
          class="block text-sm font-semibold"
        >

          Categoria

          <select
            id="category_id"
            required
            class="mt-1 w-full border
                   rounded-xl p-3"
          >

            <option value="">
              Selecione a categoria
            </option>

            ${categoryOptions}

          </select>

        </label>

        <div
          class="border-2 border-dashed
                 rounded-2xl p-5"
        >

          <label
            class="block text-sm font-semibold"
          >

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
            class="mt-4 w-40 h-40
                   object-cover rounded-xl
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
            class="px-5 py-3
                   bg-[#00361a]
                   text-white
                   rounded-xl
                   font-bold"
          >
            Guardar
          </button>

          ${
            !isNew
              ? `
                <button
                  type="button"
                  id="delete"
                  class="px-5 py-3
                         bg-red-50
                         text-red-700
                         rounded-xl"
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

  $("#image").onchange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    $("#preview").src =
      URL.createObjectURL(file);

    $("#preview").classList.remove("hidden");
  };

  $("#productForm").onsubmit =
    async (e) => {

      e.preventDefault();

      await saveProduct(p, isNew);
    };

  if (!isNew) {

    $("#delete").onclick =
      async () => {

        if (
          !confirm(
            "Tem certeza que deseja excluir este produto?"
          )
        ) {
          return;
        }

        const { error } =
          await supabase
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

/* =========================
   CAMPO
========================= */

function field(
  label,
  id,
  value = "",
  type = "text"
) {

  return `

    <label class="block text-sm font-semibold">

      ${esc(label)}

      <input
        id="${esc(id)}"
        type="${esc(type)}"
        value="${esc(value)}"
        class="mt-1 w-full border
               rounded-xl p-3"
      >

    </label>

  `;
}

/* =========================
   UPLOAD DE IMAGEM
========================= */

async function uploadImage(file, folder = "site") {

  if (!file) {
    return null;
  }

  const ext =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const path =
    `${folder}/${crypto.randomUUID()}.${ext}`;

  const {
    error: uploadError
  } =
    await supabase
      .storage
      .from("site-images")
      .upload(
        path,
        file,
        {
          upsert: false
        }
      );

  if (uploadError) {

    throw new Error(
      "Erro no upload: " +
      uploadError.message
    );
  }

  const publicUrl =
    supabase
      .storage
      .from("site-images")
      .getPublicUrl(path)
      .data
      .publicUrl;

  return publicUrl;
}

/* =========================
   GUARDAR PRODUTO
========================= */

async function saveProduct(p, isNew) {

  let image_url = p.image_url || null;

  const file = $("#image").files[0];

  try {

    if (file) {

      image_url =
        await uploadImage(
          file,
          "products"
        );
    }

  } catch (error) {

    toast(error.message);

    return;
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
      Number(
        $("#price").value || 0
      ),

    old_price:
      Number(
        $("#old_price").value || 0
      ) || null,

    stock:
      Number(
        $("#stock").value || 0
      ),

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

    result =
      await supabase
        .from("products")
        .insert(row);

  } else {

    result =
      await supabase
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

/* =========================
   PEDIDOS
========================= */

function renderOrders() {

  shell(`

    <h1
      class="font-[Montserrat]
             text-3xl font-bold"
    >
      Pedidos
    </h1>

    <div
      id="orders"
      class="mt-6"
    ></div>

  `);

  loadOrders();
}

async function loadOrders() {

  const {
    data,
    error
  } =
    await supabase
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    $("#orders").textContent =
      error.message;

    return;
  }

  $("#orders").innerHTML = `

    <div
      class="bg-white rounded-2xl
             overflow-x-auto"
    >

      <table class="w-full text-sm">

        <thead class="bg-[#eef5f7]">

          <tr>

            <th class="p-4 text-left">
              Pedido
            </th>

            <th class="p-4 text-left">
              Cliente
            </th>

            <th class="p-4 text-left">
              Total
            </th>

            <th class="p-4 text-left">
              Estado
            </th>

          </tr>

        </thead>

        <tbody>

          ${(data || [])
            .map(o => `

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
                  ${money(o.total)}
                </td>

                <td class="p-4">

                  <select
                    data-status="${esc(o.id)}"
                    class="border rounded-lg p-2"
                  >

                    <option value="new">
                      Novo
                    </option>

                    <option value="confirmed">
                      Confirmado
                    </option>

                    <option value="preparing">
                      Em preparação
                    </option>

                    <option value="ready">
                      Pronto
                    </option>

                    <option value="delivered">
                      Entregue
                    </option>

                    <option value="cancelled">
                      Cancelado
                    </option>

                  </select>

                </td>

              </tr>

            `)
            .join("")}

        </tbody>

      </table>

    </div>

  `;

  for (
    const select
    of document.querySelectorAll(
      "[data-status]"
    )
  ) {

    const row =
      data.find(
        x =>
          String(x.id) ===
          String(select.dataset.status)
      );

    if (!row) continue;

    select.value = row.status;

    select.onchange =
      async () => {

        const {
          error
        } =
          await supabase
            .from("orders")
            .update({
              status: select.value,
              updated_at:
                new Date().toISOString()
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

/* =========================
   CONFIGURAÇÕES
========================= */

async function getSiteSettings() {

  const {
    data,
    error
  } =
    await supabase
      .from("site_settings")
      .select("*");

  if (error) {

    console.error(
      "Erro ao carregar configurações:",
      error
    );

    return {};
  }

  return Object.fromEntries(
    (data || []).map(
      item => [
        item.key,
        item.value
      ]
    )
  );
}

function renderSettings() {

  const essential =
    bundles.find(
      b => b.id === "essential"
    );

  const economy =
    bundles.find(
      b => b.id === "economy"
    );

  const couple =
    bundles.find(
      b => b.id === "couple"
    );

  const family =
    bundles.find(
      b => b.id === "family"
    );

  shell(`

    <div class="max-w-5xl">

      <h1
        class="font-[Montserrat]
               text-3xl font-bold"
      >
        Configurações
      </h1>

      <p class="text-sm text-[#717971] mt-1">
        Gerir informações gerais e imagens do site.
      </p>


      <!-- =========================
           CONFIGURAÇÕES GERAIS
      ========================== -->

      <div
        class="bg-white rounded-2xl
               p-6 mt-6"
      >

        <h2
          class="font-[Montserrat]
                 text-xl font-bold"
        >
          Informações gerais
        </h2>

        <form
          id="settings"
          class="mt-5 space-y-4"
        >

          ${field(
            "WhatsApp",
            "wa",
            ""
          )}

          ${field(
            "E-mail",
            "email",
            ""
          )}

          <label
            class="block text-sm font-semibold"
          >

            Idioma padrão

            <select
              id="defaultLang"
              class="mt-1 w-full
                     border rounded-xl p-3"
            >

              <option value="pt">
                Português
              </option>

              <option value="en">
                English
              </option>

              <option value="fr">
                Français
              </option>

              <option value="zh">
                中文
              </option>

              <option value="chg">
                Changana
              </option>

            </select>

          </label>

          <button
            class="px-5 py-3
                   bg-[#00361a]
                   text-white
                   rounded-xl
                   font-bold"
          >
            Guardar configurações
          </button>

        </form>

      </div>


      <!-- =========================
           IMAGEM GRANDE DO TOPO
      ========================== -->

      <div
        class="bg-white rounded-2xl
               p-6 mt-6"
      >

        <h2
          class="font-[Montserrat]
                 text-xl font-bold"
        >
          Imagem grande do topo
        </h2>

        <p class="text-sm text-[#717971] mt-1">
          Esta é a imagem principal apresentada no topo do site.
        </p>

        <form
          id="heroForm"
          class="mt-5 space-y-4"
        >

          <input
            id="heroImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="block w-full border
                   rounded-xl p-3"
          >

          <img
            id="heroPreview"
            class="w-full max-w-2xl
                   h-56 object-cover
                   rounded-2xl mt-3"
            alt="Imagem grande do topo"
          >

          <button
            class="px-5 py-3
                   bg-[#00361a]
                   text-white
                   rounded-xl
                   font-bold"
          >
            Guardar imagem do topo
          </button>

        </form>

      </div>


      <!-- =========================
           RANCHO DO MÊS
      ========================== -->

      <div
        class="bg-white rounded-2xl
               p-6 mt-6"
      >

        <div>

          <h2
            class="font-[Montserrat]
                   text-xl font-bold"
          >
            Imagens do Rancho do Mês
          </h2>

          <p class="text-sm text-[#717971] mt-1">
            Altere as imagens dos quatro kits apresentados no site.
          </p>

        </div>


        <div
          class="grid md:grid-cols-2
                 gap-6 mt-6"
        >

          ${bundleImageCard(
            essential,
            "essential",
            "Rancho Essencial"
          )}

          ${bundleImageCard(
            economy,
            "economy",
            "Rancho Económico"
          )}

          ${bundleImageCard(
            couple,
            "couple",
            "Rancho para Casal"
          )}

          ${bundleImageCard(
            family,
            "family",
            "Rancho Familiar"
          )}

        </div>

      </div>

    </div>

  `);


  /* =========================
     CARREGAR CONFIGURAÇÕES
  ========================== */

  loadSettingsIntoForm();


  /* =========================
     IMAGEM TOPO
  ========================== */

  loadHeroPreview();


  $("#heroImage").onchange =
    (e) => {

      const file =
        e.target.files[0];

      if (!file) return;

      $("#heroPreview").src =
        URL.createObjectURL(file);

    };


  $("#heroForm").onsubmit =
    async (e) => {

      e.preventDefault();

      await saveHeroImage();

    };


  /* =========================
     CONFIGURAÇÕES
  ========================== */

  $("#settings").onsubmit =
    async (e) => {

      e.preventDefault();

      await saveGeneralSettings();

    };


  /* =========================
     IMAGENS DOS KITS
  ========================== */

  document
    .querySelectorAll("[data-bundle-file]")
    .forEach(input => {

      input.onchange =
        (e) => {

          const file =
            e.target.files[0];

          if (!file) return;

          const id =
            input.dataset.bundleFile;

          const preview =
            document.querySelector(
              `[data-bundle-preview="${id}"]`
            );

          if (preview) {

            preview.src =
              URL.createObjectURL(file);

          }

        };

    });


  document
    .querySelectorAll("[data-save-bundle]")
    .forEach(button => {

      button.onclick =
        async () => {

          await saveBundleImage(
            button.dataset.saveBundle
          );

        };

    });

}

/* =========================
   CARD DO RANCHO DO MÊS
========================= */

function bundleImageCard(
  bundle,
  id,
  title
) {

  const image =
    bundle?.image_url || "";

  return `

    <div
      class="border rounded-2xl
             p-4"
    >

      <h3 class="font-bold text-lg">
        ${esc(title)}
      </h3>

      <p
        class="text-xs text-[#717971]
               mt-1"
      >
        ${esc(
          bundle
            ? current(bundle.name)
            : "Kit não encontrado"
        )}
      </p>

      <img
        data-bundle-preview="${esc(id)}"
        src="${esc(image)}"
        class="w-full h-48
               object-cover rounded-xl
               mt-4
               ${image ? "" : "hidden"}"
        alt="${esc(title)}"
      >

      ${
        !image
          ? `
            <div
              data-bundle-preview-placeholder="${esc(id)}"
              class="w-full h-48
                     bg-[#eef5f7]
                     rounded-xl mt-4
                     flex items-center
                     justify-center
                     text-[#717971]"
            >
              Sem imagem
            </div>
          `
          : ""
      }

      <input
        data-bundle-file="${esc(id)}"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="mt-4 block w-full
               border rounded-xl p-3"
      >

      <button
        type="button"
        data-save-bundle="${esc(id)}"
        class="mt-4 w-full
               px-4 py-3
               bg-[#00361a]
               text-white
               rounded-xl
               font-bold"
      >
        Guardar imagem
      </button>

    </div>

  `;
}

/* =========================
   CARREGAR SETTINGS
========================= */

async function loadSettingsIntoForm() {

  const settings =
    await getSiteSettings();

  const wa =
    settings.whatsapp;

  const email =
    settings.contact_email;

  const language =
    settings.default_language ||
    settings["default language"] ||
    "pt";

  if ($("#wa")) {

    $("#wa").value =
      typeof wa === "string"
        ? wa
        : "";

  }

  if ($("#email")) {

    $("#email").value =
      typeof email === "string"
        ? email
        : "";

  }

  if ($("#defaultLang")) {

    $("#defaultLang").value =
      typeof language === "string"
        ? language
        : "pt";

  }

}

/* =========================
   IMAGEM HERO
========================= */

async function loadHeroPreview() {

  const settings =
    await getSiteSettings();

  const hero =
    settings.hero_image;

  if (!$("#heroPreview")) {
    return;
  }

  if (
    typeof hero === "string" &&
    hero
  ) {

    $("#heroPreview").src =
      hero;

  } else {

    $("#heroPreview").classList.add(
      "hidden"
    );

  }

}

/* =========================
   GUARDAR HERO
========================= */

async function saveHeroImage() {

  const file =
    $("#heroImage").files[0];

  if (!file) {

    toast(
      "Selecione uma imagem primeiro."
    );

    return;
  }

  try {

    const imageUrl =
      await uploadImage(
        file,
        "hero"
      );

    const {
      error
    } =
      await supabase
        .from("site_settings")
        .upsert({
          key: "hero_image",
          value: imageUrl,
          updated_at:
            new Date().toISOString()
        });

    if (error) {

      toast(
        "Erro ao guardar imagem: " +
        error.message
      );

      return;
    }

    toast(
      "Imagem grande do topo atualizada."
    );

    $("#heroPreview").src =
      imageUrl;

    $("#heroImage").value = "";

  } catch (error) {

    toast(error.message);

  }

}

/* =========================
   GUARDAR CONFIGURAÇÕES
========================= */

async function saveGeneralSettings() {

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

  for (
    const [key, value]
    of values
  ) {

    const {
      error
    } =
      await supabase
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

      return;
    }

  }

  toast(
    "Configurações guardadas."
  );

}

/* =========================
   GUARDAR IMAGEM DO BUNDLE
========================= */

async function saveBundleImage(
  bundleId
) {

  const bundle =
    bundles.find(
      b => String(b.id) === String(bundleId)
    );

  if (!bundle) {

    toast(
      "Rancho do Mês não encontrado."
    );

    return;
  }

  const input =
    document.querySelector(
      `[data-bundle-file="${bundleId}"]`
    );

  const file =
    input?.files?.[0];

  if (!file) {

    toast(
      "Selecione uma imagem primeiro."
    );

    return;
  }

  const button =
    document.querySelector(
      `[data-save-bundle="${bundleId}"]`
    );

  if (button) {

    button.disabled = true;

    button.textContent =
      "A guardar...";

  }

  try {

    /* =========================
       UPLOAD
    ========================== */

    const imageUrl =
      await uploadImage(
        file,
        "bundles"
      );


    /* =========================
       ATUALIZAR BUNDLE
    ========================== */

    const {
      data,
      error
    } =
      await supabase
        .from("bundles")
        .update({
          image_url: imageUrl,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", bundle.id)
        .select()
        .single();

    if (error) {

      toast(
        "Erro ao guardar imagem: " +
        error.message
      );

      return;
    }


    /* =========================
       ATUALIZAR MEMÓRIA LOCAL
    ========================== */

    const index =
      bundles.findIndex(
        b =>
          String(b.id) ===
          String(bundle.id)
      );

    if (index !== -1) {

      bundles[index] =
        data || {
          ...bundle,
          image_url: imageUrl
        };

    }


    const preview =
      document.querySelector(
        `[data-bundle-preview="${bundleId}"]`
      );

    if (preview) {

      preview.src =
        imageUrl;

      preview.classList.remove(
        "hidden"
      );

    }

    const placeholder =
      document.querySelector(
        `[data-bundle-preview-placeholder="${bundleId}"]`
      );

    if (placeholder) {

      placeholder.remove();

    }

    input.value = "";

    toast(
      "Imagem do Rancho do Mês atualizada."
    );

  } catch (error) {

    toast(
      error.message
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Guardar imagem";

    }

  }

}

/* =========================
   INICIAR
========================= */

boot();
