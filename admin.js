import { supabase } from "./data.js";

const $ = (s) => document.querySelector(s);

const toast = (message) => {
  const t = $("#toast");

  if (!t) {
    alert(message);
    return;
  }

  t.textContent = message;
  t.classList.remove("hidden");

  setTimeout(() => {
    t.classList.add("hidden");
  }, 2500);
};

let session = null;
let products = [];
let categories = [];


/* =========================================================
   SEGURANÇA / ESCAPE HTML
========================================================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[m]
  );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function boot() {
  try {
    if (!supabase) {
      login(
        "Configure o Supabase para ativar a administração real."
      );
      return;
    }

    const {
      data,
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao obter sessão:", error);
      login("Erro ao verificar a sessão.");
      return;
    }

    session = data.session;

    if (!session) {
      login();
      return;
    }

    /*
      Verifica se o utilizador autenticado é administrador.
    */

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error(
        "Erro ao verificar conta de administrador:",
        profileError
      );

      login(
        "Erro ao verificar a conta de administrador: " +
        profileError.message
      );

      return;
    }

    if (!profile || String(profile.role).toLowerCase() !== "admin") {
      await supabase.auth.signOut();

      login(
        "Esta conta não tem permissão de administrador."
      );

      return;
    }

    /*
      Utilizador autorizado.
      Carrega produtos e categorias.
    */

    await load();

    render();

  } catch (error) {
    console.error("Erro no boot:", error);

    login(
      "Ocorreu um erro ao iniciar a área administrativa."
    );
  }
}


/* =========================================================
   LOGIN
========================================================= */

function login(msg = "") {
  document.body.innerHTML = `
    <main class="min-h-screen flex items-center justify-center p-4">

      <section class="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        <div class="w-14 h-14 bg-[#00361a] text-white rounded-2xl flex items-center justify-center mx-auto">
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
              <div class="mt-4 bg-[#fff4e5] text-[#673b00] p-3 rounded-xl text-sm">
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
            class="w-full py-3 bg-[#00361a] text-white rounded-xl font-bold"
          >
            Entrar
          </button>

        </form>

        <p class="text-xs text-[#717971] mt-5">
          A autenticação é feita pelo Supabase.
          Nenhuma senha é guardada neste site.
        </p>

      </section>

    </main>
  `;

  const formLogin = $("#login");

  if (!formLogin) return;

  formLogin.onsubmit = async (e) => {
    e.preventDefault();

    const email = $("#email").value.trim();
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


/* =========================================================
   CARREGAR PRODUTOS E CATEGORIAS
========================================================= */

async function load() {

  /*
    PRODUTOS
  */

  const productsResult = await supabase
    .from("products")
    .select("*")
    .order("sort_order");

  if (productsResult.error) {
    console.error(
      "Erro ao carregar produtos:",
      productsResult.error
    );

    toast(
      "Erro ao carregar produtos: " +
      productsResult.error.message
    );
  }

  products = productsResult.data || [];


  /*
    CATEGORIAS
  */

  const categoriesResult = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (categoriesResult.error) {
    console.error(
      "Erro ao carregar categorias:",
      categoriesResult.error
    );

    toast(
      "Erro ao carregar categorias: " +
      categoriesResult.error.message
    );

    categories = [];
  } else {
    categories = categoriesResult.data || [];
  }

  console.log("Categorias carregadas:", categories);
}


/* =========================================================
   ESTRUTURA DO PAINEL
========================================================= */

function shell(content) {

  document.body.innerHTML = `
    <div class="min-h-screen flex">

      <aside class="hidden md:flex w-64 bg-[#00361a] text-white p-5 flex-col">

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

  const logout = $("#logout");

  if (logout) {
    logout.onclick = async () => {
      await supabase.auth.signOut();
      location.reload();
    };
  }

  document
    .querySelectorAll("[data-tab]")
    .forEach((button) => {

      button.onclick = () => {

        const tab = button.dataset.tab;

        if (tab === "products") {
          renderProducts();

        } else if (tab === "dashboard") {
          render();

        } else if (tab === "orders") {
          renderOrders();

        } else {
          renderSettings();
        }
      };
    });
}


/* =========================================================
   DASHBOARD
========================================================= */

function render() {

  shell(`
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">

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

      ${
        [
          [
            "Produtos",
            products.length,
            "inventory_2"
          ],
          [
            "Ativos",
            products.filter(
              (p) => p.active !== false
            ).length,
            "check_circle"
          ],
          [
            "Stock baixo",
            products.filter(
              (p) => (p.stock ?? 0) < 5
            ).length,
            "warning"
          ],
          [
            "Conta",
            "Admin",
            "admin_panel_settings"
          ]
        ]
          .map(
            (x) => `
              <div class="bg-white rounded-2xl p-5 shadow-sm">

                <span class="material-symbols-outlined text-[#00361a]">
                  ${x[2]}
                </span>

                <p class="text-sm text-[#717971] mt-4">
                  ${x[0]}
                </p>

                <b class="text-2xl">
                  ${x[1]}
                </b>

              </div>
            `
          )
          .join("")
      }

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


/* =========================================================
   PRODUTOS
========================================================= */

function renderProducts() {

  shell(`
    <div class="flex items-center justify-between gap-4">

      <div>
        <h1 class="font-[Montserrat] text-3xl font-bold">
          Produtos
        </h1>

        <p class="text-sm text-[#717971]">
          Adicione, edite preços, nomes, stock e imagens.
        </p>
      </div>

      <button
        id="new"
        class="px-4 py-2 bg-[#fd9d27] text-white rounded-xl font-bold"
      >
        + Adicionar produto
      </button>

    </div>


    <div class="bg-white rounded-2xl shadow-sm overflow-x-auto mt-6">

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
            products.length
              ? products
                  .map(
                    (p) => {

                      const category =
                        categories.find(
                          (c) =>
                            String(c.id) ===
                            String(p.category_id)
                        );

                      const categoryName =
                        category?.name?.pt ||
                        category?.name ||
                        "—";

                      return `
                        <tr class="border-t">

                          <td class="p-4 flex items-center gap-3">

                            ${
                              p.image_url
                                ? `
                                  <img
                                    src="${esc(p.image_url)}"
                                    class="w-12 h-12 object-cover rounded-lg"
                                  >
                                `
                                : `
                                  <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span class="material-symbols-outlined text-gray-400">
                                      image
                                    </span>
                                  </div>
                                `
                            }

                            <div>

                              <b>
                                ${esc(
                                  p.name?.pt ||
                                  p.name ||
                                  ""
                                )}
                              </b>

                              <div class="text-xs text-[#717971]">
                                ${esc(p.sku || p.id)}
                              </div>

                            </div>

                          </td>


                          <td class="p-4">
                            ${esc(categoryName)}
                          </td>


                          <td class="p-4 font-bold">
                            ${Number(
                              p.price || 0
                            ).toLocaleString(
                              "pt-MZ",
                              {
                                minimumFractionDigits: 2
                              }
                            )}
                            MZN
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
                    }
                  )
                  .join("")
              : `
                <tr>
                  <td
                    colspan="5"
                    class="p-8 text-center text-gray-500"
                  >
                    Ainda não existem produtos.
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

    </div>
  `);


  $("#new").onclick = () => form();


  document
    .querySelectorAll("[data-edit]")
    .forEach((button) => {

      button.onclick = () => {

        const product = products.find(
          (p) =>
            String(p.id) ===
            String(button.dataset.edit)
        );

        if (product) {
          form(product);
        }
      };
    });
}


/* =========================================================
   CAMPO DE TEXTO
========================================================= */

function field(
  label,
  id,
  value = "",
  type = "text"
) {

  return `
    <label class="block text-sm font-semibold">

      ${label}

      <input
        id="${id}"
        type="${type}"
        value="${esc(value)}"
        class="mt-1 w-full border rounded-xl p-3"
      >

    </label>
  `;
}


/* =========================================================
   FORMULÁRIO DE PRODUTO
   SOMENTE PORTUGUÊS
========================================================= */

function form(product = null) {

  const isNew = !product;

  product =
    product ||
    {
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


  /*
    CATEGORIAS

    Aqui usamos diretamente o array carregado
    do Supabase.

    As suas 10 categorias deverão aparecer aqui.
  */

  const categoryOptions = categories
    .map((category) => {

      const name =
        category?.name?.pt ||
        category?.name ||
        "Categoria sem nome";

      return `
        <option
          value="${esc(category.id)}"
          ${
            String(category.id) ===
            String(product.category_id)
              ? "selected"
              : ""
          }
        >
          ${esc(name)}
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


      <h1 class="font-[Montserrat] text-3xl font-bold mt-3">

        ${
          isNew
            ? "Adicionar produto"
            : "Editar produto"
        }

      </h1>


      <form
        id="productForm"
        class="bg-white rounded-2xl p-6 shadow-sm mt-6 space-y-5"
      >


        <!-- NOME SOMENTE PORTUGUÊS -->

        ${field(
          "Nome do produto",
          "name_pt",
          product.name?.pt || ""
        )}


        <!-- DESCRIÇÃO SOMENTE PORTUGUÊS -->

        <label class="block text-sm font-semibold">

          Descrição

          <textarea
            id="desc_pt"
            rows="4"
            class="mt-1 w-full border rounded-xl p-3"
          >${esc(
            product.description?.pt || ""
          )}</textarea>

        </label>


        <!-- PREÇO / STOCK -->

        <div class="grid md:grid-cols-2 gap-4">

          ${field(
            "Preço (MZN)",
            "price",
            product.price,
            "number"
          )}

          ${field(
            "Preço anterior",
            "old_price",
            product.old_price || "",
            "number"
          )}

          ${field(
            "Stock",
            "stock",
            product.stock,
            "number"
          )}

          ${field(
            "SKU",
            "sku",
            product.sku || ""
          )}

          ${field(
            "Unidade",
            "unit",
            product.unit || ""
          )}

          ${field(
            "Tag",
            "tag_pt",
            product.tag?.pt || ""
          )}

        </div>


        <!-- CATEGORIA -->

        <label class="block text-sm font-semibold">

          Categoria

          <select
            id="category_id"
            class="mt-1 w-full border rounded-xl p-3"
            required
          >

            <option value="">
              Selecione uma categoria
            </option>

            ${categoryOptions}

          </select>

        </label>


        ${
          categories.length === 0
            ? `
              <p class="text-sm text-red-600">
                Nenhuma categoria foi encontrada.
                Verifique a tabela categories no Supabase.
              </p>
            `
            : `
              <p class="text-xs text-gray-500">
                ${categories.length}
                categorias disponíveis.
              </p>
            `
        }


        <!-- IMAGEM -->

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
            src="${esc(product.image_url || "")}"
            class="mt-4 w-40 h-40 object-cover rounded-xl ${
              product.image_url
                ? ""
                : "hidden"
            }"
          >

        </div>


        <!-- ATIVO / DESTAQUE -->

        <div class="flex gap-5">

          <label>

            <input
              id="active"
              type="checkbox"
              ${
                product.active !== false
                  ? "checked"
                  : ""
              }
            >

            Ativo

          </label>


          <label>

            <input
              id="featured"
              type="checkbox"
              ${
                product.featured
                  ? "checked"
                  : ""
              }
            >

            Destaque

          </label>

        </div>


        <!-- BOTÕES -->

        <div class="flex gap-3">

          <button
            type="submit"
            class="px-5 py-3 bg-[#00361a] text-white rounded-xl font-bold"
          >
            Guardar
          </button>


          ${
            !isNew
              ? `
                <button
                  type="button"
                  id="delete"
                  class="px-5 py-3 bg-red-50 text-red-700 rounded-xl"
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


  /* VOLTAR */

  $("#back").onclick = renderProducts;


  /* PREVISUALIZAÇÃO DA IMAGEM */

  $("#image").onchange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    $("#preview").src =
      URL.createObjectURL(file);

    $("#preview").classList.remove("hidden");
  };


  /* GUARDAR */

  $("#productForm").onsubmit = async (e) => {

    e.preventDefault();

    await saveProduct(product, isNew);
  };


  /* EXCLUIR */

  if (!isNew) {

    $("#delete").onclick = async () => {

      if (
        !confirm(
          "Tem certeza que deseja excluir este produto?"
        )
      ) {
        return;
      }

      const {
        error
      } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {

        console.error(
          "Erro ao excluir produto:",
          error
        );

        toast(
          "Erro ao excluir: " +
          error.message
        );

        return;
      }

      toast("Produto excluído.");

      await load();

      renderProducts();
    };
  }
}


/* =========================================================
   GUARDAR PRODUTO
========================================================= */

async function saveProduct(
  product,
  isNew
) {

  try {

    const portugueseName =
      $("#name_pt").value.trim();

    const portugueseDescription =
      $("#desc_pt").value.trim();

    if (!portugueseName) {
      toast(
        "Digite o nome do produto."
      );
      return;
    }


    const categoryId =
      $("#category_id").value;

    if (!categoryId) {
      toast(
        "Selecione uma categoria."
      );
      return;
    }


    /*
      IMPORTANTE:

      O banco continua recebendo o formato:

      {
        pt: "...",
        en: "...",
        zh: "...",
        fr: "...",
        chg: "..."
      }

      Mas o administrador só precisa
      preencher Português.

      As outras línguas recebem automaticamente
      o português.
    */

    const name = {
      pt: portugueseName,
      en: portugueseName,
      zh: portugueseName,
      fr: portugueseName,
      chg: portugueseName
    };


    const description = {
      pt: portugueseDescription,
      en: portugueseDescription,
      zh: portugueseDescription,
      fr: portugueseDescription,
      chg: portugueseDescription
    };


    const tagValue =
      $("#tag_pt").value.trim();

    const tag = {
      pt: tagValue,
      en: tagValue,
      zh: tagValue,
      fr: tagValue,
      chg: tagValue
    };


    /*
      IMAGEM
    */

    let image_url =
      product.image_url || null;

    const file =
      $("#image").files[0];


    if (file) {

      const ext =
        file.name
          .split(".")
          .pop()
          .toLowerCase();

      const path =
        `products/${crypto.randomUUID()}.${ext}`;


      const {
        error: uploadError
      } = await supabase
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

        console.error(
          "Erro no upload:",
          uploadError
        );

        toast(
          "Erro no upload: " +
          uploadError.message
        );

        return;
      }


      image_url =
        supabase
          .storage
          .from("site-images")
          .getPublicUrl(path)
          .data
          .publicUrl;
    }


    /*
      DADOS DO PRODUTO
    */

    const row = {

      id: product.id,

      name,

      description,

      category_id: categoryId,

      price: Number(
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
        $("#sku").value.trim(),

      unit:
        $("#unit").value.trim(),

      tag,

      image_url,

      active:
        $("#active").checked,

      featured:
        $("#featured").checked,

      updated_at:
        new Date().toISOString()
    };


    /*
      INSERT OU UPDATE
    */

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
          .eq("id", product.id);
    }


    if (result.error) {

      console.error(
        "Erro ao guardar produto:",
        result.error
      );

      toast(
        "Erro ao guardar produto: " +
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


  } catch (error) {

    console.error(
      "Erro inesperado ao guardar produto:",
      error
    );

    toast(
      "Erro ao guardar produto."
    );
  }
}


/* =========================================================
   PEDIDOS
========================================================= */

function renderOrders() {

  shell(`
    <h1 class="font-[Montserrat] text-3xl font-bold">
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
  } = await supabase
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

    <div class="bg-white rounded-2xl overflow-x-auto">

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

          ${
            (data || [])
              .map(
                (order) => `
                  <tr class="border-t">

                    <td class="p-4 font-bold">
                      ${esc(order.order_number)}
                    </td>

                    <td class="p-4">

                      ${esc(order.customer_name)}

                      <br>

                      <span class="text-xs">
                        ${esc(order.customer_phone)}
                      </span>

                    </td>

                    <td class="p-4 font-bold">
                      ${Number(
                        order.total || 0
                      ).toLocaleString("pt-MZ")}
                      MZN
                    </td>

                    <td class="p-4">

                      <select
                        data-status="${esc(order.id)}"
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
                `
              )
              .join("")
          }

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
        (item) =>
          String(item.id) ===
          String(select.dataset.status)
      );


    if (!row) continue;


    select.value =
      row.status;


    select.onchange =
      async () => {

        const {
          error
        } = await supabase
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


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

function renderSettings() {

  shell(`

    <h1 class="font-[Montserrat] text-3xl font-bold">
      Configurações
    </h1>


    <div class="bg-white rounded-2xl p-6 mt-6 max-w-3xl">

      <p class="text-sm text-[#414942]">

        As configurações gerais são armazenadas
        no Supabase.

      </p>


      <form
        id="settings"
        class="mt-5 space-y-4"
      >

        ${field(
          "WhatsApp",
          "wa",
          "+258840000000"
        )}

        ${field(
          "E-mail",
          "email",
          "contato@ranchoflexivel.co.mz"
        )}


        <label class="block text-sm font-semibold">

          Idioma padrão

          <select
            id="defaultLang"
            class="mt-1 w-full border rounded-xl p-3"
          >

            <option value="pt">
              Português
            </option>

            <option value="en">
              English
            </option>

            <option value="zh">
              Mandarim (中文)
            </option>

            <option value="fr">
              Français
            </option>

            <option value="chg">
              Changana
            </option>

          </select>

        </label>


        <button
          class="px-5 py-3 bg-[#00361a] text-white rounded-xl"
        >
          Guardar configurações
        </button>

      </form>

    </div>

  `);


  $("#settings").onsubmit =
    async (e) => {

      e.preventDefault();


      const settings = [
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
        of settings
      ) {

        const {
          error
        } = await supabase
          .from("site_settings")
          .upsert({
            key,
            value
          });


        if (error) {

          toast(
            "Erro: " +
            error.message
          );

          return;
        }
      }


      toast(
        "Configurações guardadas."
      );
    };
}


/* =========================================================
   INICIAR
========================================================= */

boot();
