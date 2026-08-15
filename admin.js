import { supabase, demoProducts, demoCategories } from "./data.js";

const $ = s => document.querySelector(s);

const toast = m => {
  const t = $("#toast");
  if (!t) return;

  t.textContent = m;
  t.classList.remove("hidden");

  setTimeout(() => {
    t.classList.add("hidden");
  }, 2500);
};

let session = null;
let products = [];
let categories = [];

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m])
  );
}


/* =========================================================
   AUTENTICAÇÃO E INICIALIZAÇÃO
   ========================================================= */

async function boot() {

  if (!supabase) {
    login(
      "Configure o Supabase para ativar a administração real. O modo demo não permite alterações."
    );
    return;
  }

  const { data, error } = await supabase.auth.getSession();

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
   * Verificar se o utilizador é administrador
   */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    console.error("Erro ao verificar conta de administrador:", profileError);

    login(
      "Erro ao verificar a conta de administrador: " +
      profileError.message
    );

    return;
  }

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();

    login(
      "Esta conta não tem permissão de administrador."
    );

    return;
  }

  /*
   * Utilizador autorizado
   */
  await load();

  render();
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

  $("#login").onsubmit = async e => {

    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email: $("#email").value,
      password: $("#password").value
    });

    if (error) {
      login(error.message);
    } else {
      location.reload();
    }
  };
}


/* =========================================================
   CARREGAR PRODUTOS E CATEGORIAS
   ========================================================= */

async function load() {

  /*
   * PRODUTOS
   */

  const productsResult = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (productsResult.error) {

    console.error(
      "Erro ao carregar produtos:",
      productsResult.error
    );

    toast(
      "Erro ao carregar produtos: " +
      productsResult.error.message
    );

    products = [];

  } else {

    products = productsResult.data || [];
  }


  /*
   * CATEGORIAS
   */

  const categoriesResult = await supabase
    .from("categories")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true });

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

    console.log(
      "Categorias carregadas:",
      categories
    );
  }
}


/* =========================================================
   ESTRUTURA DO PAINEL
   ========================================================= */

function shell(content) {

  document.body.innerHTML = `

    <div class="min-h-screen flex">

      <aside
        class="hidden md:flex w-64 bg-[#00361a] text-white p-5 flex-col"
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
    .forEach(b => {

      b.onclick = () => {

        const t = b.dataset.tab;

        if (t === "products") {
          renderProducts();

        } else if (t === "dashboard") {
          render();

        } else if (t === "orders") {
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
              p => p.active !== false
            ).length,
            "check_circle"
          ],
          [
            "Stock baixo",
            products.filter(
              p => (p.stock ?? 0) < 5
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
          x => `
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
            products
              .map(
                p => `

                  <tr class="border-t">

                    <td class="p-4 flex items-center gap-3">

                      <img
                        src="${esc(p.image_url || "")}"
                        class="w-12 h-12 object-cover rounded-lg"
                      >

                      <div>

                        <b>
                          ${esc(p.name?.pt || p.name)}
                        </b>

                        <div class="text-xs text-[#717971]">
                          ${esc(p.sku || p.id)}
                        </div>

                      </div>

                    </td>


                    <td class="p-4">

                      ${esc(
                        (
                          categories.find(
                            c =>
                              String(c.id) ===
                              String(p.category_id)
                          )?.name?.pt
                        ) || "—"
                      )}

                    </td>


                    <td class="p-4 font-bold">

                      ${Number(
                        p.price || 0
                      ).toLocaleString(
                        "pt-MZ",
                        {
                          minimumFractionDigits: 2
                        }
                      )} MZN

                    </td>


                    <td class="p-4">
                      ${p.stock ?? 0}
                    </td>


                    <td class="p-4 text-right">

                      <button
                        data-edit="${p.id}"
                        class="px-3 py-2 rounded-lg bg-[#e8eff1]"
                      >
                        Editar
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `);


  $("#new").onclick = () => form();


  document
    .querySelectorAll("[data-edit]")
    .forEach(b => {

      b.onclick = () => {

        form(
          products.find(
            p =>
              String(p.id) ===
              String(b.dataset.edit)
          )
        );
      };
    });
}


/* =========================================================
   FORMULÁRIO DE PRODUTO
   ========================================================= */

function form(p = null) {

  const isNew = !p;


  p =
    p ||
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

      active: true,

      featured: false,

      category_id: ""
    };


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


        <div class="grid md:grid-cols-2 gap-4">

          ${field(
            "Nome (Português)",
            "name_pt",
            p.name?.pt
          )}

          ${field(
            "Descrição (Português)",
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
            "Tag (Português)",
            "tag_pt",
            p.tag?.pt
          )}

        </div>


        <!-- CATEGORIA -->

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

            ${
              categories.length > 0

                ? categories
                    .map(c => {

                      const categoryName =
                        typeof c.name === "object"
                          ? (
                              c.name.pt ||
                              ""
                            )
                          : c.name;

                      return `

                        <option
                          value="${esc(c.id)}"
                          ${
                            String(c.id) ===
                            String(p.category_id)
                              ? "selected"
                              : ""
                          }
                        >
                          ${esc(categoryName)}
                        </option>

                      `;
                    })
                    .join("")

                : `
                    <option value="" disabled>
                      Nenhuma categoria encontrada
                    </option>
                  `
            }

          </select>

        </label>


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
            src="${esc(p.image_url || "")}"
            class="mt-4 w-40 h-40 object-cover rounded-xl ${
              p.image_url
                ? ""
                : "hidden"
            }"
          >

        </div>


        <!-- ESTADO -->

        <div class="flex gap-5">

          <label>

            <input
              id="active"
              type="checkbox"
              ${
                p.active !== false
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
                p.featured
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


  $("#back").onclick = renderProducts;


  /*
   * Pré-visualização da imagem
   */

  $("#image").onchange = e => {

    const f = e.target.files[0];

    if (f) {

      $("#preview").src =
        URL.createObjectURL(f);

      $("#preview").classList.remove(
        "hidden"
      );
    }
  };


  /*
   * Guardar produto
   */

  $("#productForm").onsubmit = async e => {

    e.preventDefault();

    await saveProduct(p, isNew);
  };


  /*
   * Excluir produto
   */

  if (!isNew) {

    $("#delete").onclick = async () => {

      if (
        confirm(
          "Tem certeza que deseja excluir este produto?"
        )
      ) {

        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", p.id);

        if (error) {

          toast(error.message);

        } else {

          toast(
            "Produto excluído."
          );

          await load();

          renderProducts();
        }
      }
    };
  }
}


/* =========================================================
   CAMPO
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
   GUARDAR PRODUTO
   ========================================================= */

async function saveProduct(p, isNew) {

  /*
   * Apenas Português
   */

  const name = {
    pt: $("#name_pt").value
  };


  const description = {
    pt: $("#desc_pt").value
  };


  let image_url = p.image_url || null;


  /*
   * Upload da imagem
   */

  const file = $("#image").files[0];


  if (file) {

    const ext =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    const path =
      `products/${crypto.randomUUID()}.${ext}`;


    const {
      error
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


    if (error) {

      toast(
        "Erro no upload: " +
        error.message
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
   * Categoria selecionada
   */

  const category_id =
    $("#category_id").value;


  if (!category_id) {

    toast(
      "Selecione uma categoria."
    );

    return;
  }


  /*
   * Dados do produto
   */

  const row = {

    id: p.id,

    name,

    description,

    category_id,

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


  /*
   * Inserir ou atualizar
   */

  const q = isNew

    ? supabase
        .from("products")
        .insert(row)

    : supabase
        .from("products")
        .update(row)
        .eq("id", p.id);


  const { error } = await q;


  if (error) {

    console.error(
      "Erro ao guardar produto:",
      error
    );

    toast(
      error.message
    );

  } else {

    toast(
      isNew
        ? "Produto adicionado com sucesso."
        : "Produto atualizado com sucesso."
    );

    await load();

    renderProducts();
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
                o => `

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

                      ${Number(
                        o.total || 0
                      ).toLocaleString(
                        "pt-MZ"
                      )}

                      MZN

                    </td>

                    <td class="p-4">

                      <select
                        data-status="${o.id}"
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
    const s of document.querySelectorAll(
      "[data-status]"
    )
  ) {

    const row =
      data.find(
        x =>
          String(x.id) ===
          String(s.dataset.status)
      );


    if (!row) continue;


    s.value = row.status;


    s.onchange = async () => {

      const {
        error
      } =
        await supabase
          .from("orders")
          .update({
            status: s.value,
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


    <div
      class="bg-white rounded-2xl p-6 mt-6 max-w-3xl"
    >

      <p class="text-sm text-[#414942]">

        As configurações gerais são armazenadas
        no Supabase. Pode editar contactos,
        WhatsApp, entrega, idioma padrão e
        conteúdo através desta área.

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


  $("#settings").onsubmit = async e => {

    e.preventDefault();


    for (
      const [
        key,
        value
      ] of [
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
      ]
    ) {

      const {
        error
      } =
        await supabase
          .from("site_settings")
          .upsert({
            key,
            value
          });


      if (error) {

        toast(
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
