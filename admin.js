import { supabase, demoProducts, demoCategories } from "./data.js";

const $ = s => document.querySelector(s);

let session = null;
let products = [];
let categories = [];

const toast = message => {
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

function esc(value) {
  return String(value ?? "").replace(
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
   AUTENTICAÇÃO E VERIFICAÇÃO DO ADMIN
========================================================= */

async function boot() {

  console.log("========== ADMIN BOOT ==========");

  if (!supabase) {
    console.error("Supabase não está configurado.");

    login(
      "Configure o Supabase para ativar a administração real. " +
      "O modo demo não permite alterações."
    );

    return;
  }


  /* -------------------------------------------------------
     1. VERIFICAR SESSÃO
  ------------------------------------------------------- */

  const {
    data: sessionData,
    error: sessionError
  } = await supabase.auth.getSession();

  console.log("Session:", sessionData);
  console.log("Session error:", sessionError);

  if (sessionError) {
    console.error("Erro ao obter sessão:", sessionError);

    login(
      "Erro ao verificar a sessão: " +
      sessionError.message
    );

    return;
  }

  session = sessionData?.session;


  if (!session) {

    console.log("Nenhuma sessão encontrada.");

    login();

    return;
  }


  /* -------------------------------------------------------
     2. OBTER UTILIZADOR AUTENTICADO
  ------------------------------------------------------- */

  const {
    data: userData,
    error: userError
  } = await supabase.auth.getUser();

  console.log("User data:", userData);
  console.log("User error:", userError);

  if (userError || !userData?.user) {

    console.error(
      "Não foi possível obter o utilizador autenticado.",
      userError
    );

    login(
      "Não foi possível identificar a conta autenticada."
    );

    return;
  }

  const user = userData.user;

  console.log("================================");
  console.log("UTILIZADOR AUTENTICADO");
  console.log("UUID:", user.id);
  console.log("EMAIL:", user.email);
  console.log("================================");


  /* -------------------------------------------------------
     3. PROCURAR PERFIL PELO UUID
  ------------------------------------------------------- */

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();


  console.log("========== PROFILE ==========");
  console.log("Profile:", profile);
  console.log("Profile error:", profileError);
  console.log("=============================");


  /* -------------------------------------------------------
     4. TRATAR ERRO DA QUERY
  ------------------------------------------------------- */

  if (profileError) {

    console.error(
      "Erro ao consultar profiles:",
      profileError
    );

    login(
      "Erro ao consultar o perfil de administrador: " +
      profileError.message
    );

    return;
  }


  /* -------------------------------------------------------
     5. VERIFICAR SE EXISTE PERFIL
  ------------------------------------------------------- */

  if (!profile) {

    console.error(
      "Nenhum perfil encontrado para o UUID:",
      user.id
    );

    login(
      "O utilizador está autenticado, mas não existe um registo " +
      "correspondente na tabela profiles para este UUID."
    );

    return;
  }


  /* -------------------------------------------------------
     6. NORMALIZAR ROLE
  ------------------------------------------------------- */

  const role = String(profile.role ?? "")
    .trim()
    .toLowerCase();


  console.log("========== ROLE ==========");
  console.log("Role original:", profile.role);
  console.log("Role normalizado:", role);
  console.log("==========================");


  /* -------------------------------------------------------
     7. VERIFICAR ADMIN
  ------------------------------------------------------- */

  if (role !== "admin") {

    console.error(
      "Utilizador encontrado, mas não é admin.",
      {
        uuid: user.id,
        email: user.email,
        roleOriginal: profile.role,
        roleNormalizado: role
      }
    );

    login(
      "Esta conta não tem permissão de administrador. " +
      "Role encontrado: " +
      (profile.role || "vazio")
    );

    return;
  }


  /* -------------------------------------------------------
     8. ADMIN CONFIRMADO
  ------------------------------------------------------- */

  console.log("================================");
  console.log("ADMINISTRADOR CONFIRMADO");
  console.log("UUID:", user.id);
  console.log("EMAIL:", user.email);
  console.log("ROLE:", profile.role);
  console.log("================================");


  await load();

  render();
}


/* =========================================================
   LOGIN
========================================================= */

function login(message = "") {

  document.body.innerHTML = `
    <main class="min-h-screen flex items-center justify-center p-4">

      <section class="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        <div
          class="w-14 h-14 bg-[#00361a] text-white rounded-2xl
          flex items-center justify-center mx-auto"
        >
          <span class="material-symbols-outlined">
            admin_panel_settings
          </span>
        </div>

        <h1
          class="font-[Montserrat] text-2xl font-bold
          text-center mt-5"
        >
          Rancho Flexível
        </h1>

        <p
          class="text-center text-sm text-[#414942] mt-2"
        >
          Área administrativa
        </p>

        ${
          message
            ? `
              <div
                class="mt-4 bg-[#fff4e5] text-[#673b00]
                p-3 rounded-xl text-sm"
              >
                ${esc(message)}
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
            type="submit"
            class="w-full py-3 bg-[#00361a]
            text-white rounded-xl font-bold"
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


  formLogin.onsubmit = async e => {

    e.preventDefault();


    const email = $("#email").value.trim();
    const password = $("#password").value;


    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });


    console.log("Login:", data);
    console.log("Login error:", error);


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

  let result = await supabase
    .from("products")
    .select("*")
    .order("sort_order");

  if (result.error) {
    console.error(
      "Erro ao carregar produtos:",
      result.error
    );
  }

  products = result.data || [];


  result = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (result.error) {
    console.error(
      "Erro ao carregar categorias:",
      result.error
    );
  }

  categories = result.data || [];
}


/* =========================================================
   SHELL
========================================================= */

function shell(content) {

  document.body.innerHTML = `

    <div class="min-h-screen flex">

      <aside
        class="hidden md:flex w-64 bg-[#00361a]
        text-white p-5 flex-col"
      >

        <a
          href="index.html"
          class="font-[Montserrat] text-xl
          font-bold mb-8"
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


  const logout = $("#logout");

  if (logout) {

    logout.onclick = async () => {

      await supabase.auth.signOut();

      location.reload();

    };

  }


  document
    .querySelectorAll("[data-tab]")
    .forEach(button => {

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

    <div
      class="flex flex-col md:flex-row
      md:items-center justify-between gap-4"
    >

      <div>

        <p class="text-sm text-[#717971]">
          Painel administrativo
        </p>

        <h1
          class="font-[Montserrat] text-3xl font-bold"
        >
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

      ${[
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

            <div
              class="bg-white rounded-2xl
              p-5 shadow-sm"
            >

              <span
                class="material-symbols-outlined
                text-[#00361a]"
              >
                ${x[2]}
              </span>

              <p
                class="text-sm text-[#717971]
                mt-4"
              >
                ${x[0]}
              </p>

              <b class="text-2xl">
                ${x[1]}
              </b>

            </div>

          `
        )
        .join("")}

    </div>


    <div
      class="mt-8 bg-white rounded-2xl p-5"
    >

      <h2
        class="font-[Montserrat] text-xl font-bold"
      >
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


/* =========================================================
   PRODUTOS
========================================================= */

function renderProducts() {

  shell(`

    <div
      class="flex items-center justify-between gap-4"
    >

      <div>

        <h1
          class="font-[Montserrat] text-3xl font-bold"
        >
          Produtos
        </h1>

        <p
          class="text-sm text-[#717971]"
        >
          Adicione, edite preços,
          nomes, stock e imagens.
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

          ${products
            .map(
              p => `

                <tr class="border-t">

                  <td
                    class="p-4 flex items-center gap-3"
                  >

                    <img
                      src="${esc(
                        p.image_url || ""
                      )}"
                      class="w-12 h-12
                      object-cover rounded-lg"
                    >

                    <div>

                      <b>
                        ${esc(
                          p.name?.pt || p.name
                        )}
                      </b>

                      <div
                        class="text-xs
                        text-[#717971]"
                      >
                        ${esc(
                          p.sku || p.id
                        )}
                      </div>

                    </div>

                  </td>


                  <td class="p-4">

                    ${esc(
                      categories.find(
                        c =>
                          String(c.id) ===
                          String(p.category_id)
                      )?.name?.pt || "—"
                    )}

                  </td>


                  <td
                    class="p-4 font-bold"
                  >

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
                      data-edit="${p.id}"
                      class="px-3 py-2
                      rounded-lg bg-[#e8eff1]"
                    >
                      Editar
                    </button>

                  </td>

                </tr>

              `
            )
            .join("")}

        </tbody>

      </table>

    </div>

  `);


  $("#new").onclick = () => form();


  document
    .querySelectorAll("[data-edit]")
    .forEach(button => {

      button.onclick = () => {

        form(
          products.find(
            p =>
              String(p.id) ===
              String(button.dataset.edit)
          )
        );

      };

    });
}


/* =========================================================
   FORM PRODUTO
========================================================= */

function form(product = null) {

  const isNew = !product;

  const p =
    product ||
    {
      id: "RF-" + Date.now(),

      name: {
        pt: "",
        en: "",
        zh: "",
        fr: "",
        chg: ""
      },

      description: {
        pt: "",
        en: "",
        zh: "",
        fr: "",
        chg: ""
      },

      price: 0,
      old_price: "",
      stock: 0,
      sku: "",
      unit: "",

      tag: {
        pt: "",
        en: "",
        zh: "",
        fr: "",
        chg: ""
      },

      active: true,
      featured: false
    };


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

        <div
          class="grid md:grid-cols-2 gap-4"
        >

          ${field(
            "Nome (Português)",
            "name_pt",
            p.name?.pt
          )}

          ${field(
            "Nome (English)",
            "name_en",
            p.name?.en
          )}

          ${field(
            "Nome (中文)",
            "name_zh",
            p.name?.zh
          )}

          ${field(
            "Nom (Français)",
            "name_fr",
            p.name?.fr
          )}

          ${field(
            "Vito (Changana)",
            "name_chg",
            p.name?.chg
          )}

          ${field(
            "Descrição (Português)",
            "desc_pt",
            p.description?.pt
          )}

          ${field(
            "Descrição (English)",
            "desc_en",
            p.description?.en
          )}

          ${field(
            "Descrição (中文)",
            "desc_zh",
            p.description?.zh
          )}

          ${field(
            "Descrição (Français)",
            "desc_fr",
            p.description?.fr
          )}

          ${field(
            "Descrição (Changana)",
            "desc_chg",
            p.description?.chg
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


        <label
          class="block text-sm font-semibold"
        >

          Categoria

          <select
            id="category_id"
            class="mt-1 w-full border
            rounded-xl p-3"
          >

            ${categories
              .map(
                c => `

                  <option
                    value="${c.id}"
                    ${
                      String(c.id) ===
                      String(p.category_id)
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(
                      c.name?.pt || c.name
                    )}
                  </option>

                `
              )
              .join("")}

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
            src="${esc(
              p.image_url || ""
            )}"
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
                  class="px-5 py-3
                  bg-red-50 text-red-700
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


  $("#image").onchange = e => {

    const file = e.target.files[0];

    if (file) {

      $("#preview").src =
        URL.createObjectURL(file);

      $("#preview").classList.remove(
        "hidden"
      );

    }

  };


  $("#productForm").onsubmit = async e => {

    e.preventDefault();

    await saveProduct(p, isNew);

  };


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
        .eq("id", p.id);


      if (error) {

        toast(error.message);

      } else {

        toast("Produto excluído.");

        await load();

        renderProducts();

      }

    };

  }
}


/* =========================================================
   CAMPOS
========================================================= */

function field(
  label,
  id,
  value = "",
  type = "text"
) {

  return `

    <label
      class="block text-sm font-semibold"
    >

      ${label}

      <input
        id="${id}"
        type="${type}"
        value="${esc(value)}"
        class="mt-1 w-full border
        rounded-xl p-3"
      >

    </label>

  `;
}


/* =========================================================
   GUARDAR PRODUTO
========================================================= */

async function saveProduct(p, isNew) {

  const name = {

    pt: $("#name_pt").value,

    en:
      $("#name_en").value ||
      $("#name_pt").value,

    zh:
      $("#name_zh").value ||
      $("#name_pt").value,

    fr:
      $("#name_fr").value ||
      $("#name_pt").value,

    chg:
      $("#name_chg").value ||
      $("#name_pt").value
  };


  const description = {

    pt: $("#desc_pt").value,

    en:
      $("#desc_en").value ||
      $("#desc_pt").value,

    zh:
      $("#desc_zh").value ||
      $("#desc_pt").value,

    fr:
      $("#desc_fr").value ||
      $("#desc_pt").value,

    chg:
      $("#desc_chg").value ||
      $("#desc_pt").value
  };


  let image_url =
    p.image_url || null;


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
      error
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


  const row = {

    id: p.id,

    name,

    description,

    category_id:
      $("#category_id").value,

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

      pt: $("#tag_pt").value,

      en: $("#tag_pt").value,

      zh: $("#tag_pt").value,

      fr: $("#tag_pt").value,

      chg: $("#tag_pt").value
    },

    image_url,

    active:
      $("#active").checked,

    featured:
      $("#featured").checked,

    updated_at:
      new Date().toISOString()
  };


  const query = isNew

    ? supabase
        .from("products")
        .insert(row)

    : supabase
        .from("products")
        .update(row)
        .eq("id", p.id);


  const {
    error
  } = await query;


  if (error) {

    toast(error.message);

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
            .map(
              o => `

                <tr class="border-t">

                  <td
                    class="p-4 font-bold"
                  >
                    ${esc(
                      o.order_number
                    )}
                  </td>

                  <td class="p-4">

                    ${esc(
                      o.customer_name
                    )}

                    <br>

                    <span
                      class="text-xs"
                    >
                      ${esc(
                        o.customer_phone
                      )}
                    </span>

                  </td>

                  <td
                    class="p-4 font-bold"
                  >
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
          String(
            select.dataset.status
          )
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
            status:
              select.value,

            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            row.id
          );


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

    <h1
      class="font-[Montserrat]
      text-3xl font-bold"
    >
      Configurações
    </h1>


    <div
      class="bg-white rounded-2xl
      p-6 mt-6 max-w-3xl"
    >

      <p
        class="text-sm text-[#414942]"
      >
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


        <label
          class="block text-sm font-semibold"
        >

          Idioma padrão

          <select
            id="defaultLang"
            class="mt-1 w-full border
            rounded-xl p-3"
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
          class="px-5 py-3
          bg-[#00361a]
          text-white rounded-xl"
        >
          Guardar configurações
        </button>

      </form>

    </div>

  `);


  $("#settings").onsubmit =
    async e => {

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
        } = await supabase
          .from("site_settings")
          .upsert({
            key,
            value
          });


        if (error) {

          console.error(
            "Erro ao guardar configuração:",
            error
          );

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
