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

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function jsonValue(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function localized(value, lang = "pt") {
  const obj = jsonValue(value, {});

  if (typeof obj === "string") {
    return obj;
  }

  return (
    obj?.[lang] ||
    obj?.pt ||
    obj?.en ||
    obj?.fr ||
    obj?.zh ||
    obj?.chg ||
    ""
  );
}

function toast(message) {
  let t = $("#toast");

  if (!t) {
    t = document.createElement("div");

    t.id = "toast";

    t.className =
      "fixed bottom-5 right-5 z-[9999] bg-[#00361a] text-white px-5 py-3 rounded-xl shadow-lg";

    document.body.appendChild(t);
  }

  t.textContent = message;

  t.classList.remove("hidden");

  clearTimeout(window.__rfToast);

  window.__rfToast = setTimeout(() => {
    t.classList.add("hidden");
  }, 3000);
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MZN";
}

function imageUrl(row) {
  return row?.image_url || row?.image || "";
}

function bundleProductIds(bundle) {
  const value = jsonValue(bundle?.product_ids, []);

  if (Array.isArray(value)) {
    return value.map(String);
  }

  return [];
}

/* ============================================================
   UPLOAD DE IMAGEM
============================================================ */

async function uploadImage(file, folder = "admin") {

  if (!file) {
    return null;
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowed.includes(file.type)) {
    throw new Error(
      "Formato inválido. Use JPG, PNG ou WEBP."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const path =
    `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } =
    await supabase
      .storage
      .from("site-images")
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType: file.type
        }
      );

  if (error) {
    throw error;
  }

  const { data } =
    supabase
      .storage
      .from("site-images")
      .getPublicUrl(path);

  return data.publicUrl;
}

/* ============================================================
   BOOT
============================================================ */

async function boot() {

  if (!supabase) {
    login("Supabase não está configurado.");
    return;
  }

  const {
    data: sessionData,
    error: sessionError
  } =
    await supabase.auth.getSession();

  if (sessionError) {
    login(
      "Erro ao obter a sessão: " +
      sessionError.message
    );

    return;
  }

  session =
    sessionData?.session || null;

  if (!session) {
    login();
    return;
  }

  const {
    data: profile,
    error: profileError
  } =
    await supabase
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

  if (!loaded) {
    return;
  }

  render();
}

/* ============================================================
   LOGIN
============================================================ */

function login(message = "") {

  document.body.innerHTML = `

    <main
      class="min-h-screen flex items-center
             justify-center p-4 bg-[#f5f7f6]"
    >

      <section
        class="w-full max-w-md bg-white
               rounded-3xl shadow-xl p-8"
      >

        <div
          class="w-14 h-14 bg-[#00361a]
                 text-white rounded-2xl
                 flex items-center justify-center mx-auto"
        >
          <span class="material-symbols-outlined">
            admin_panel_settings
          </span>
        </div>

        <h1
          class="font-[Montserrat]
                 text-2xl font-bold
                 text-center mt-5"
        >
          Rancho Flexível
        </h1>

        <p
          class="text-center text-sm
                 text-[#414942] mt-2"
        >
          Área administrativa
        </p>

        ${
          message
            ? `
              <div
                class="mt-4 bg-[#fff4e5]
                       text-[#673b00]
                       p-3 rounded-xl text-sm"
              >
                ${esc(message)}
              </div>
            `
            : ""
        }

        <form
          id="login"
          class="mt-6 space-y-4"
        >

          <label
            class="block text-sm font-semibold"
          >
            E-mail

            <input
              id="email"
              type="email"
              required
              autocomplete="email"
              class="mt-1 w-full border
                     rounded-xl p-3"
            >
          </label>

          <label
            class="block text-sm font-semibold"
          >
            Senha

            <input
              id="password"
              type="password"
              required
              autocomplete="current-password"
              class="mt-1 w-full border
                     rounded-xl p-3"
            >
          </label>

          <button
            class="w-full py-3
                   bg-[#00361a]
                   text-white rounded-xl
                   font-bold"
          >
            Entrar
          </button>

        </form>

        <p
          class="text-xs text-[#717971] mt-5"
        >
          A autenticação é feita pelo Supabase.
        </p>

      </section>

    </main>
  `;

  $("#login").onsubmit = async (e) => {

    e.preventDefault();

    const email = $("#email").value.trim();
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

/* ============================================================
   CARREGAR TODOS OS DADOS
============================================================ */

async function load() {

  /* ========================================================
     PRODUTOS
  ======================================================== */

  const productsResult =
    await supabase
      .from("products")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (productsResult.error) {

    showFatalError(
      "Erro ao carregar produtos",
      productsResult.error.message
    );

    return false;
  }

  products =
    productsResult.data || [];


  /* ========================================================
     CATEGORIAS
  ======================================================== */

  const categoriesResult =
    await supabase
      .from("categories")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (categoriesResult.error) {

    showFatalError(
      "Erro ao carregar categorias",
      categoriesResult.error.message
    );

    return false;
  }

  categories =
    categoriesResult.data || [];


  /* ========================================================
     RANCHO DO MÊS
  ======================================================== */

  const bundlesResult =
    await supabase
      .from("bundles")
      .select("*")
      .order("sort_order", {
        ascending: true
      });

  if (bundlesResult.error) {

    showFatalError(
      "Erro ao carregar Rancho do Mês",
      bundlesResult.error.message
    );

    return false;
  }

  bundles =
    bundlesResult.data || [];


  /* ========================================================
     CONFIGURAÇÕES
  ======================================================== */

  const settingsResult =
    await supabase
      .from("site_settings")
      .select("*");

  if (settingsResult.error) {

    showFatalError(
      "Erro ao carregar configurações",
      settingsResult.error.message
    );

    return false;
  }

  settings = {};

  (settingsResult.data || [])
    .forEach(row => {

      settings[row.key] =
        jsonValue(row.value, row.value);

    });


  console.log("Produtos:", products);
  console.log("Categorias:", categories);
  console.log("Rancho do Mês:", bundles);
  console.log("Configurações:", settings);

  return true;
}

/* ============================================================
   ERRO FATAL
============================================================ */

function showFatalError(title, message) {

  document.body.innerHTML = `

    <main
      class="min-h-screen flex
             items-center justify-center p-6
             bg-[#f5f7f6]"
    >

      <div
        class="max-w-xl w-full
               bg-white rounded-2xl
               shadow p-6"
      >

        <h1
          class="text-2xl
                 font-bold text-red-700"
        >
          ${esc(title)}
        </h1>

        <p class="mt-4 text-[#414942]">
          ${esc(message)}
        </p>

        <button
          onclick="location.reload()"
          class="mt-6 px-5 py-3
                 rounded-xl
                 bg-[#00361a]
                 text-white font-bold"
        >
          Tentar novamente
        </button>

      </div>

    </main>
  `;
}

/* ============================================================
   SHELL
============================================================ */

function shell(content) {

  document.body.innerHTML = `

    <div
      class="min-h-screen flex
             bg-[#f5f7f6]"
    >

      <aside
        class="hidden md:flex
               w-64 bg-[#00361a]
               text-white p-5
               flex-col"
      >

        <a
          href="index.html"
          class="font-[Montserrat]
                 text-xl font-bold mb-8"
        >
          Rancho Flexível
        </a>

        <nav class="space-y-1 text-sm">

          <button
            data-tab="dashboard"
            class="w-full text-left
                   px-3 py-3 rounded-lg
                   hover:bg-white/10"
          >
            Dashboard
          </button>

          <button
            data-tab="products"
            class="w-full text-left
                   px-3 py-3 rounded-lg
                   hover:bg-white/10"
          >
            Produtos
          </button>

          <button
            data-tab="bundles"
            class="w-full text-left
                   px-3 py-3 rounded-lg
                   hover:bg-white/10"
          >
            Rancho do Mês
          </button>

          <button
            data-tab="categories"
            class="w-full text-left
                   px-3 py-3 rounded-lg
                   hover:bg-white/10"
          >
            Categorias
          </button>

          <button
            data-tab="orders"
            class="w-full text-left
                   px-3 py-3 rounded-lg
                   hover:bg-white/10"
          >
            Pedidos
          </button>

          <button
            data-tab="settings"
            class="w-full text-left
                   px-3 py-3 rounded-lg
                   hover:bg-white/10"
          >
            Configurações
          </button>

        </nav>

        <button
          id="logout"
          class="mt-auto text-left
                 px-3 py-3 rounded-lg
                 hover:bg-white/10"
        >
          Terminar sessão
        </button>

      </aside>

      <main
        class="flex-1 p-4 lg:p-8"
      >
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

        const tab =
          button.dataset.tab;

        if (tab === "products") {
          renderProducts();
        }

        else if (tab === "bundles") {
          renderBundles();
        }

        else if (tab === "categories") {
          renderCategories();
        }

        else if (tab === "orders") {
          renderOrders();
        }

        else if (tab === "settings") {
          renderSettings();
        }

        else {
          render();
        }
      };
    });
}

/* ============================================================
   DASHBOARD
============================================================ */

function render() {

  shell(`

    <div
      class="flex flex-col md:flex-row
             md:items-center
             justify-between gap-4"
    >

      <div>

        <p
          class="text-sm
                 text-[#717971]"
        >
          Painel administrativo
        </p>

        <h1
          class="font-[Montserrat]
                 text-3xl font-bold"
        >
          Dashboard
        </h1>

      </div>

      <a
        href="index.html"
        class="px-4 py-2
               rounded-xl border bg-white"
      >
        Ver site
      </a>

    </div>

    <div
      class="grid sm:grid-cols-2
             lg:grid-cols-4
             gap-4 mt-7"
    >

      <div
        class="bg-white
               rounded-2xl p-5 shadow-sm"
      >
        <p class="text-sm text-[#717971]">
          Produtos
        </p>

        <b class="text-2xl">
          ${products.length}
        </b>
      </div>

      <div
        class="bg-white
               rounded-2xl p-5 shadow-sm"
      >
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

      <div
        class="bg-white
               rounded-2xl p-5 shadow-sm"
      >
        <p class="text-sm text-[#717971]">
          Rancho do Mês
        </p>

        <b class="text-2xl">
          ${bundles.length}
        </b>
      </div>

      <div
        class="bg-white
               rounded-2xl p-5 shadow-sm"
      >
        <p class="text-sm text-[#717971]">
          Categorias
        </p>

        <b class="text-2xl">
          ${categories.length}
        </b>
      </div>

    </div>

    <div
      class="mt-8 bg-white
             rounded-2xl p-5"
    >

      <h2
        class="font-[Montserrat]
               text-xl font-bold"
      >
        Gestão rápida
      </h2>

      <div
        class="flex flex-wrap
               gap-3 mt-4"
      >

        <button
          id="goProducts"
          class="px-4 py-2
                 rounded-xl
                 bg-[#00361a]
                 text-white"
        >
          Gerir produtos
        </button>

        <button
          id="goBundles"
          class="px-4 py-2
                 rounded-xl border"
        >
          Rancho do Mês
        </button>

        <button
          id="goCategories"
          class="px-4 py-2
                 rounded-xl border"
        >
          Categorias
        </button>

        <button
          id="goSettings"
          class="px-4 py-2
                 rounded-xl border"
        >
          Configurações
        </button>

      </div>

    </div>
  `);

  $("#goProducts").onclick = renderProducts;
  $("#goBundles").onclick = renderBundles;
  $("#goCategories").onclick = renderCategories;
  $("#goSettings").onclick = renderSettings;
}

/* ============================================================
   PRODUTOS
============================================================ */

function renderProducts() {

  shell(`

    <div
      class="flex items-center
             justify-between gap-4"
    >

      <div>

        <h1
          class="font-[Montserrat]
                 text-3xl font-bold"
        >
          Produtos
        </h1>

        <p
          class="text-sm
                 text-[#717971]"
        >
          Gerir produtos, preços,
          stock e imagens.
        </p>

      </div>

      <button
        id="newProduct"
        class="px-4 py-2
               bg-[#fd9d27]
               text-white rounded-xl
               font-bold"
      >
        + Adicionar produto
      </button>

    </div>

    <div
      class="bg-white
             rounded-2xl
             shadow-sm
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
            products.map(product => {

              const category =
                categories.find(
                  c =>
                    String(c.id) ===
                    String(product.category_id)
                );

              return `

                <tr class="border-t">

                  <td class="p-4">

                    <div
                      class="flex items-center
                             gap-3"
                    >

                      ${
                        product.image_url
                          ? `
                            <img
                              src="${esc(product.image_url)}"
                              class="w-12 h-12
                                     object-cover
                                     rounded-lg"
                            >
                          `
                          : `
                            <div
                              class="w-12 h-12
                                     rounded-lg
                                     bg-[#eef5f7]
                                     flex items-center
                                     justify-center"
                            >
                              <span
                                class="material-symbols-outlined"
                              >
                                image
                              </span>
                            </div>
                          `
                      }

                      <div>

                        <b>
                          ${esc(
                            localized(product.name)
                          )}
                        </b>

                        <div
                          class="text-xs
                                 text-[#717971]"
                        >
                          ${esc(
                            product.sku ||
                            product.id
                          )}
                        </div>

                      </div>

                    </div>

                  </td>

                  <td class="p-4">
                    ${esc(
                      localized(category?.name) ||
                      "Sem categoria"
                    )}
                  </td>

                  <td class="p-4 font-bold">
                    ${money(product.price)}
                  </td>

                  <td class="p-4">
                    ${product.stock ?? 0}
                  </td>

                  <td class="p-4 text-right">

                    <button
                      data-edit-product="${esc(product.id)}"
                      class="px-3 py-2
                             rounded-lg
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

  $("#newProduct").onclick =
    () => productForm();

  document
    .querySelectorAll("[data-edit-product]")
    .forEach(button => {

      button.onclick = () => {

        const product =
          products.find(
            p =>
              String(p.id) ===
              String(button.dataset.editProduct)
          );

        if (product) {
          productForm(product);
        }
      };
    });
}

/* ============================================================
   FORM PRODUTO
============================================================ */

function productForm(product = null) {

  const isNew = !product;

  const p =
    product ||
    {
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
      image_url: "",
      active: true,
      featured: false
    };

  const categoryOptions =
    categories
      .map(category => `

        <option
          value="${esc(category.id)}"
          ${
            String(category.id) ===
            String(p.category_id)
              ? "selected"
              : ""
          }
        >
          ${esc(localized(category.name))}
        </option>

      `)
      .join("");

  shell(`

    <div class="max-w-4xl">

      <button
        id="backProducts"
        class="text-sm text-[#414942]"
      >
        ← Voltar
      </button>

      <h1
        class="font-[Montserrat]
               text-3xl font-bold mt-3"
      >
        ${
          isNew
            ? "Adicionar produto"
            : "Editar produto"
        }
      </h1>

      <form
        id="productForm"
        class="bg-white rounded-2xl
               p-6 shadow-sm mt-6
               space-y-5"
      >

        <div
          class="grid md:grid-cols-2
                 gap-4"
        >

          ${field(
            "Nome do produto",
            "name_pt",
            localized(p.name)
          )}

          ${field(
            "Descrição",
            "desc_pt",
            localized(p.description)
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
            p.old_price || "",
            "number"
          )}

          ${field(
            "Stock",
            "stock",
            p.stock || 0,
            "number"
          )}

          ${field(
            "SKU",
            "sku",
            p.sku || ""
          )}

          ${field(
            "Unidade",
            "unit",
            p.unit || ""
          )}

          ${field(
            "Tag",
            "tag_pt",
            localized(p.tag)
          )}

        </div>

        <label
          class="block text-sm
                 font-semibold"
        >
          Categoria

          <select
            id="category_id"
            required
            class="mt-1 w-full
                   border rounded-xl p-3"
          >

            <option value="">
              Selecione a categoria
            </option>

            ${categoryOptions}

          </select>

        </label>

        <div
          class="border-2
                 border-dashed
                 rounded-2xl p-5"
        >

          <label
            class="block text-sm
                   font-semibold"
          >

            Imagem do produto

            <input
              id="productImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="mt-2 block w-full"
            >

          </label>

          <img
            id="productPreview"
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
                  id="deleteProduct"
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

  $("#backProducts").onclick = renderProducts;

  $("#productImage").onchange = e => {

    const file = e.target.files[0];

    if (!file) return;

    $("#productPreview").src =
      URL.createObjectURL(file);

    $("#productPreview")
      .classList
      .remove("hidden");
  };

  $("#productForm").onsubmit = async e => {

    e.preventDefault();

    await saveProduct(p, isNew);
  };

  if (!isNew) {

    $("#deleteProduct").onclick =
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

/* ============================================================
   CAMPO
============================================================ */

function field(
  label,
  id,
  value = "",
  type = "text"
) {

  return `

    <label
      class="block text-sm
             font-semibold"
    >

      ${esc(label)}

      <input
        id="${esc(id)}"
        type="${esc(type)}"
        value="${esc(value)}"
        class="mt-1 w-full
               border rounded-xl p-3"
      >

    </label>

  `;
}

/* ============================================================
   GUARDAR PRODUTO
============================================================ */

async function saveProduct(p, isNew) {

  try {

    let image_url =
      p.image_url || null;

    const file =
      $("#productImage")?.files?.[0];

    if (file) {

      image_url =
        await uploadImage(
          file,
          "products"
        );
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
        $("#sku").value.trim(),

      unit:
        $("#unit").value.trim(),

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
      throw result.error;
    }

    toast(
      isNew
        ? "Produto adicionado com sucesso."
        : "Produto atualizado com sucesso."
    );

    await load();

    renderProducts();

  } catch (error) {

    console.error(error);

    toast(
      "Erro ao guardar produto: " +
      error.message
    );
  }
}

/* ============================================================
   RANCHO DO MÊS
============================================================ */

function renderBundles() {

  shell(`

    <div
      class="flex flex-col md:flex-row
             md:items-center
             justify-between gap-4"
    >

      <div>

        <h1
          class="font-[Montserrat]
                 text-3xl font-bold"
        >
          Rancho do Mês
        </h1>

        <p
          class="text-sm
                 text-[#717971] mt-2"
        >
          Gerir imagem, preço e produtos
          de cada Rancho do Mês.
        </p>

      </div>

      <div
        class="text-sm
               text-[#717971]"
      >
        ${bundles.length}
        Rancho(s)
      </div>

    </div>

    ${
      bundles.length
        ? `

          <div
            class="grid sm:grid-cols-2
                   xl:grid-cols-3
                   gap-5 mt-6"
          >

            ${
              bundles
                .map(bundle => {

                  const name =
                    localized(bundle.name) ||
                    bundle.id;

                  const description =
                    localized(bundle.description);

                  const image =
                    imageUrl(bundle);

                  const ids =
                    bundleProductIds(bundle);

                  const selectedProducts =
                    products.filter(
                      p =>
                        ids.includes(
                          String(p.id)
                        )
                    );

                  return `

                    <article
                      class="bg-white
                             rounded-2xl
                             shadow-sm
                             overflow-hidden"
                    >

                      <div
                        class="h-48
                               bg-[#eef5f7]
                               relative"
                      >

                        ${
                          image
                            ? `
                              <img
                                src="${esc(image)}"
                                class="w-full h-full
                                       object-cover"
                              >
                            `
                            : `
                              <div
                                class="w-full h-full
                                       flex items-center
                                       justify-center
                                       text-[#717971]"
                              >
                                <span
                                  class="material-symbols-outlined
                                         text-5xl"
                                >
                                  image
                                </span>
                              </div>
                            `
                        }

                        <span
                          class="
                            absolute top-3 right-3
                            px-3 py-1 rounded-full
                            text-xs font-bold
                            ${
                              bundle.active === false
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }
                          "
                        >
                          ${
                            bundle.active === false
                              ? "Inativo"
                              : "Ativo"
                          }
                        </span>

                      </div>

                      <div class="p-5">

                        <h2
                          class="font-[Montserrat]
                                 text-xl font-bold"
                        >
                          ${esc(name)}
                        </h2>

                        ${
                          description
                            ? `
                              <p
                                class="text-sm
                                       text-[#717971]
                                       mt-1"
                              >
                                ${esc(description)}
                              </p>
                            `
                            : ""
                        }

                        <p
                          class="font-bold
                                 text-[#00361a]
                                 text-lg
                                 mt-3"
                        >
                          ${money(bundle.price)}
                        </p>

                        <div
                          class="mt-4
                                 border-t pt-4"
                        >

                          <p
                            class="text-sm
                                   font-bold"
                          >
                            Produtos incluídos
                          </p>

                          ${
                            selectedProducts.length
                              ? `
                                <ul
                                  class="mt-2
                                         space-y-1
                                         text-sm"
                                >

                                  ${
                                    selectedProducts
                                      .map(p => `
                                        <li
                                          class="flex
                                                 items-center
                                                 gap-2"
                                        >
                                          <span
                                            class="material-symbols-outlined
                                                   text-base
                                                   text-[#00361a]"
                                          >
                                            check_circle
                                          </span>

                                          <span>
                                            ${esc(
                                              localized(
                                                p.name
                                              )
                                            )}
                                          </span>
                                        </li>
                                      `)
                                      .join("")
                                  }

                                </ul>
                              `
                              : `
                                <p
                                  class="text-sm
                                         text-[#717971]
                                         mt-2"
                                >
                                  Nenhum produto selecionado.
                                </p>
                              `
                          }

                        </div>

                        <button
                          data-edit-bundle="${esc(bundle.id)}"
                          class="mt-5 w-full
                                 px-4 py-3
                                 rounded-xl
                                 bg-[#00361a]
                                 text-white
                                 font-bold"
                        >
                          Editar Rancho
                        </button>

                      </div>

                    </article>
                  `;
                })
                .join("")
            }

          </div>
        `
        : `

          <div
            class="mt-6 bg-white
                   rounded-2xl p-6"
          >

            <p
              class="text-[#717971]"
            >
              Nenhum Rancho do Mês encontrado.
            </p>

          </div>
        `
    }

  `);

  document
    .querySelectorAll("[data-edit-bundle]")
    .forEach(button => {

      button.onclick = () => {

        const bundle =
          bundles.find(
            b =>
              String(b.id) ===
              String(button.dataset.editBundle)
          );

        if (bundle) {
          bundleForm(bundle);
        }
      };
    });
}

/* ============================================================
   FORM COMPLETO DO RANCHO
============================================================ */

function bundleForm(bundle) {

  const currentImage =
    imageUrl(bundle);

  const currentProductIds =
    bundleProductIds(bundle);

  const name =
    localized(bundle.name);

  const description =
    localized(bundle.description);

  const badge =
    localized(bundle.badge);

  shell(`

    <div class="max-w-5xl">

      <button
        id="backBundles"
        class="text-sm
               text-[#414942]"
      >
        ← Voltar
      </button>

      <div
        class="flex flex-col md:flex-row
               md:items-end
               justify-between gap-4"
      >

        <div>

          <h1
            class="font-[Montserrat]
                   text-3xl
                   font-bold mt-3"
          >
            Editar Rancho do Mês
          </h1>

          <p
            class="text-sm
                   text-[#717971] mt-2"
          >
            ${esc(name || bundle.id)}
          </p>

        </div>

        <div
          class="text-sm
                 text-[#717971]"
        >
          ID:
          <strong>
            ${esc(bundle.id)}
          </strong>
        </div>

      </div>

      <form
        id="bundleForm"
        class="space-y-6 mt-6"
      >

        <!-- INFORMAÇÕES -->

        <section
          class="bg-white
                 rounded-2xl
                 p-6 shadow-sm"
        >

          <h2
            class="font-[Montserrat]
                   text-xl font-bold"
          >
            Informações do Rancho
          </h2>

          <div
            class="grid md:grid-cols-2
                   gap-4 mt-5"
          >

            ${field(
              "Nome",
              "bundle_name",
              name
            )}

            ${field(
              "Preço (MZN)",
              "bundle_price",
              bundle.price || 0,
              "number"
            )}

          </div>

          <div class="mt-4">

            ${field(
              "Descrição",
              "bundle_description",
              description
            )}

          </div>

          <div class="mt-4">

            ${field(
              "Badge",
              "bundle_badge",
              badge
            )}

          </div>

          <div class="mt-5">

            <label
              class="flex items-center
                     gap-3 text-sm
                     font-semibold"
            >

              <input
                id="bundle_active"
                type="checkbox"
                ${
                  bundle.active !== false
                    ? "checked"
                    : ""
                }
              >

              Rancho ativo

            </label>

          </div>

        </section>

        <!-- IMAGEM -->

        <section
          class="bg-white
                 rounded-2xl
                 p-6 shadow-sm"
        >

          <h2
            class="font-[Montserrat]
                   text-xl font-bold"
          >
            Imagem do Rancho
          </h2>

          <p
            class="text-sm
                   text-[#717971]
                   mt-1"
          >
            Esta é a imagem apresentada
            para este Rancho.
          </p>

          <div class="mt-5">

            ${
              currentImage
                ? `
                  <img
                    id="bundlePreview"
                    src="${esc(currentImage)}"
                    class="w-full
                           max-w-3xl
                           h-80
                           object-cover
                           rounded-2xl"
                  >
                `
                : `
                  <div
                    id="bundlePreviewBox"
                    class="w-full
                           max-w-3xl
                           h-80
                           bg-[#eef5f7]
                           rounded-2xl
                           flex items-center
                           justify-center"
                  >
                    <span
                      class="material-symbols-outlined
                             text-6xl
                             text-[#717971]"
                    >
                      image
                    </span>
                  </div>

                  <img
                    id="bundlePreview"
                    class="hidden w-full
                           max-w-3xl h-80
                           object-cover
                           rounded-2xl"
                  >
                `
            }

          </div>

          <label
            class="block text-sm
                   font-semibold mt-5"
          >

            Nova imagem

            <input
              id="bundleImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="mt-2 block w-full"
            >

          </label>

        </section>

        <!-- PRODUTOS -->

        <section
          class="bg-white
                 rounded-2xl
                 p-6 shadow-sm"
        >

          <div
            class="flex flex-col
                   md:flex-row
                   md:items-center
                   justify-between gap-3"
          >

            <div>

              <h2
                class="font-[Montserrat]
                       text-xl font-bold"
              >
                Produtos que compõem o Rancho
              </h2>

              <p
                class="text-sm
                       text-[#717971]
                       mt-1"
              >
                Selecione os produtos que
                o cliente verá dentro deste Rancho.
              </p>

            </div>

            <span
              id="bundleProductCount"
              class="px-3 py-1
                     rounded-full
                     bg-[#eef5f7]
                     text-sm font-bold"
            >
              ${currentProductIds.length}
              selecionado(s)
            </span>

          </div>

          <div
            class="mt-5"
          >

            <input
              id="bundleProductSearch"
              type="search"
              placeholder="Pesquisar produto..."
              class="w-full border
                     rounded-xl p-3"
            >

          </div>

          <div
            id="bundleProductsList"
            class="mt-4
                   grid md:grid-cols-2
                   gap-3"
          >

            ${
              products.length
                ? products
                    .map(product => {

                      const productId =
                        String(product.id);

                      const selected =
                        currentProductIds
                          .includes(productId);

                      return `

                        <label
                          data-bundle-product-row
                          data-product-name="${esc(
                            localized(product.name)
                          ).toLowerCase()}"
                          class="
                            flex items-center
                            gap-3 p-3
                            border rounded-xl
                            cursor-pointer
                            hover:bg-[#f5f7f6]
                          "
                        >

                          <input
                            type="checkbox"
                            name="bundle_products"
                            value="${esc(product.id)}"
                            ${
                              selected
                                ? "checked"
                                : ""
                            }
                            class="bundle-product-checkbox"
                          >

                          ${
                            product.image_url
                              ? `
                                <img
                                  src="${esc(product.image_url)}"
                                  class="w-12 h-12
                                         rounded-lg
                                         object-cover"
                                >
                              `
                              : `
                                <div
                                  class="w-12 h-12
                                         rounded-lg
                                         bg-[#eef5f7]
                                         flex items-center
                                         justify-center"
                                >
                                  <span
                                    class="material-symbols-outlined"
                                  >
                                    image
                                  </span>
                                </div>
                              `
                          }

                          <div
                            class="min-w-0 flex-1"
                          >

                            <div
                              class="font-semibold"
                            >
                              ${esc(
                                localized(
                                  product.name
                                )
                              )}
                            </div>

                            <div
                              class="text-xs
                                     text-[#717971]"
                            >
                              ${esc(
                                product.sku ||
                                product.id
                              )}
                              ·
                              ${money(product.price)}
                            </div>

                          </div>

                        </label>

                      `;
                    })
                    .join("")
                : `
                  <p
                    class="text-sm
                           text-[#717971]"
                  >
                    Nenhum produto encontrado.
                  </p>
                `
            }

          </div>

        </section>

        <!-- GUARDAR -->

        <section
          class="bg-white
                 rounded-2xl
                 p-6 shadow-sm"
        >

          <div
            class="flex flex-col
                   sm:flex-row
                   gap-3"
          >

            <button
              type="submit"
              class="px-6 py-3
                     bg-[#00361a]
                     text-white
                     rounded-xl
                     font-bold"
            >
              Guardar Rancho
            </button>

            <button
              type="button"
              id="cancelBundle"
              class="px-6 py-3
                     border rounded-xl"
            >
              Cancelar
            </button>

          </div>

        </section>

      </form>

    </div>
  `);

  /* ========================================================
     VOLTAR
  ======================================================== */

  $("#backBundles").onclick =
    renderBundles;

  $("#cancelBundle").onclick =
    renderBundles;

  /* ========================================================
     PREVIEW DA IMAGEM
  ======================================================== */

  $("#bundleImage").onchange =
    e => {

      const file =
        e.target.files[0];

      if (!file) {
        return;
      }

      const preview =
        $("#bundlePreview");

      preview.src =
        URL.createObjectURL(file);

      preview.classList.remove("hidden");

      $("#bundlePreviewBox")
        ?.classList
        .add("hidden");
    };

  /* ========================================================
     PESQUISA DE PRODUTOS
  ======================================================== */

  $("#bundleProductSearch").oninput =
    e => {

      const search =
        e.target.value
          .trim()
          .toLowerCase();

      document
        .querySelectorAll(
          "[data-bundle-product-row]"
        )
        .forEach(row => {

          const name =
            row.dataset.productName || "";

          row.style.display =
            !search ||
            name.includes(search)
              ? ""
              : "none";
        });
    };

  /* ========================================================
     CONTADOR
  ======================================================== */

  function updateBundleProductCount() {

    const count =
      document.querySelectorAll(
        ".bundle-product-checkbox:checked"
      ).length;

    const element =
      $("#bundleProductCount");

    if (element) {

      element.textContent =
        `${count} selecionado(s)`;
    }
  }

  document
    .querySelectorAll(
      ".bundle-product-checkbox"
    )
    .forEach(checkbox => {

      checkbox.onchange =
        updateBundleProductCount;
    });

  /* ========================================================
     GUARDAR RANCHO
  ======================================================== */

  $("#bundleForm").onsubmit =
    async e => {

      e.preventDefault();

      try {

        toast(
          "A guardar Rancho..."
        );

        /* ==================================================
           IMAGEM
        ================================================== */

        let image_url =
          currentImage || null;

        const file =
          $("#bundleImage")
            ?.files?.[0];

        if (file) {

          image_url =
            await uploadImage(
              file,
              "bundles"
            );
        }

        /* ==================================================
           PRODUTOS SELECIONADOS
        ================================================== */

        const productIds =
          Array.from(
            document.querySelectorAll(
              ".bundle-product-checkbox:checked"
            )
          )
          .map(
            checkbox =>
              checkbox.value
          );

        /* ==================================================
           DADOS
        ================================================== */

        const row = {

          name: {
            pt:
              $("#bundle_name")
                .value
                .trim()
          },

          description: {
            pt:
              $("#bundle_description")
                .value
                .trim()
          },

          price:
            Number(
              $("#bundle_price")
                .value || 0
            ),

          product_ids:
            productIds,

          image_url,

          badge:
            $("#bundle_badge")
              .value
              .trim()
              ? {
                  pt:
                    $("#bundle_badge")
                      .value
                      .trim()
                }
              : {},

          active:
            $("#bundle_active")
              .checked,

          updated_at:
            new Date()
              .toISOString()
        };

        const { error } =
          await supabase
            .from("bundles")
            .update(row)
            .eq("id", bundle.id);

        if (error) {
          throw error;
        }

        toast(
          "Rancho atualizado com sucesso."
        );

        await load();

        renderBundles();

      } catch (error) {

        console.error(
          "Erro ao guardar Rancho:",
          error
        );

        toast(
          "Erro ao guardar Rancho: " +
          error.message
        );
      }
    };
}

/* ============================================================
   CATEGORIAS
============================================================ */

function renderCategories() {

  shell(`

    <div>

      <h1
        class="font-[Montserrat]
               text-3xl font-bold"
      >
        Categorias
      </h1>

      <p
        class="text-sm
               text-[#717971] mt-2"
      >
        Altere a imagem de cada categoria.
      </p>

    </div>

    ${
      categories.length
        ? `
          <div
            class="grid sm:grid-cols-2
                   lg:grid-cols-3
                   xl:grid-cols-4
                   gap-5 mt-6"
          >

            ${
              categories
                .map(category => {

                  const name =
                    localized(category.name);

                  const image =
                    imageUrl(category);

                  return `

                    <article
                      class="bg-white
                             rounded-2xl
                             shadow-sm
                             overflow-hidden"
                    >

                      <div
                        class="h-40
                               bg-[#eef5f7]"
                      >

                        ${
                          image
                            ? `
                              <img
                                src="${esc(image)}"
                                class="w-full h-full
                                       object-cover"
                              >
                            `
                            : `
                              <div
                                class="w-full h-full
                                       flex items-center
                                       justify-center
                                       text-[#717971]"
                              >
                                <span
                                  class="material-symbols-outlined
                                         text-5xl"
                                >
                                  image
                                </span>
                              </div>
                            `
                        }

                      </div>

                      <div class="p-4">

                        <h2 class="font-bold">
                          ${esc(name)}
                        </h2>

                        <button
                          data-edit-category="${esc(category.id)}"
                          class="mt-4 w-full
                                 px-4 py-3
                                 rounded-xl
                                 bg-[#00361a]
                                 text-white
                                 font-bold"
                        >
                          Alterar imagem
                        </button>

                      </div>

                    </article>

                  `;
                })
                .join("")
            }

          </div>
        `
        : `
          <div
            class="mt-6 bg-white
                   rounded-2xl p-6"
          >

            <p
              class="text-[#717971]"
            >
              Nenhuma categoria encontrada.
            </p>

          </div>
        `
    }

  `);

  document
    .querySelectorAll("[data-edit-category]")
    .forEach(button => {

      button.onclick = () => {

        const category =
          categories.find(
            c =>
              String(c.id) ===
              String(button.dataset.editCategory)
          );

        if (category) {
          categoryImageForm(category);
        }
      };
    });
}

/* ============================================================
   FORM IMAGEM CATEGORIA
============================================================ */

function categoryImageForm(category) {

  const currentImage =
    imageUrl(category);

  shell(`

    <div class="max-w-2xl">

      <button
        id="backCategories"
        class="text-sm
               text-[#414942]"
      >
        ← Voltar
      </button>

      <h1
        class="font-[Montserrat]
               text-3xl
               font-bold mt-3"
      >
        ${esc(localized(category.name))}
      </h1>

      <p
        class="text-sm
               text-[#717971] mt-2"
      >
        Altere a imagem desta categoria.
      </p>

      <form
        id="categoryImageForm"
        class="bg-white
               rounded-2xl
               p-6 shadow-sm
               mt-6"
      >

        ${
          currentImage
            ? `
              <img
                id="categoryPreview"
                src="${esc(currentImage)}"
                class="w-full h-64
                       object-cover
                       rounded-2xl
                       mb-5"
              >
            `
            : `
              <div
                id="categoryPreviewBox"
                class="w-full h-64
                       rounded-2xl
                       bg-[#eef5f7]
                       flex items-center
                       justify-center
                       mb-5"
              >
                <span
                  class="material-symbols-outlined
                         text-6xl
                         text-[#717971]"
                >
                  image
                </span>
              </div>

              <img
                id="categoryPreview"
                class="hidden w-full h-64
                       object-cover
                       rounded-2xl
                       mb-5"
              >
            `
        }

        <label
          class="block text-sm
                 font-semibold"
        >

          Nova imagem

          <input
            id="categoryImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="mt-2 block w-full"
          >

        </label>

        <button
          class="mt-5 px-5 py-3
                 bg-[#00361a]
                 text-white
                 rounded-xl
                 font-bold"
        >
          Guardar imagem
        </button>

      </form>

    </div>
  `);

  $("#backCategories").onclick =
    renderCategories;

  $("#categoryImage").onchange =
    e => {

      const file =
        e.target.files[0];

      if (!file) return;

      const preview =
        $("#categoryPreview");

      preview.src =
        URL.createObjectURL(file);

      preview.classList.remove(
        "hidden"
      );

      $("#categoryPreviewBox")
        ?.classList
        .add("hidden");
    };

  $("#categoryImageForm").onsubmit =
    async e => {

      e.preventDefault();

      try {

        const file =
          $("#categoryImage")
            .files?.[0];

        if (!file) {

          toast(
            "Selecione uma imagem."
          );

          return;
        }

        toast(
          "A carregar imagem..."
        );

        const url =
          await uploadImage(
            file,
            "categories"
          );

        const { error } =
          await supabase
            .from("categories")
            .update({
              image_url: url,
              updated_at:
                new Date().toISOString()
            })
            .eq("id", category.id);

        if (error) {
          throw error;
        }

        toast(
          "Imagem da categoria atualizada."
        );

        await load();

        renderCategories();

      } catch (error) {

        console.error(error);

        toast(
          "Erro: " +
          error.message
        );
      }
    };
}

/* ============================================================
   IMAGEM GRANDE DO TOPO
============================================================ */

function renderHeroSettings() {

  const heroImage =
    settings.hero_image || "";

  shell(`

    <div class="max-w-3xl">

      <button
        id="backSettings"
        class="text-sm
               text-[#414942]"
      >
        ← Voltar
      </button>

      <h1
        class="font-[Montserrat]
               text-3xl
               font-bold mt-3"
      >
        Imagem grande do topo
      </h1>

      <p
        class="text-sm
               text-[#717971] mt-2"
      >
        Imagem principal da página inicial.
      </p>

      <form
        id="heroForm"
        class="bg-white
               rounded-2xl
               p-6 shadow-sm
               mt-6"
      >

        ${
          heroImage
            ? `
              <img
                id="heroPreview"
                src="${esc(heroImage)}"
                class="w-full
                       h-80
                       object-cover
                       rounded-2xl
                       mb-5"
              >
            `
            : `
              <div
                class="w-full h-80
                       bg-[#eef5f7]
                       rounded-2xl
                       flex items-center
                       justify-center
                       mb-5"
              >
                <span
                  class="material-symbols-outlined
                         text-6xl
                         text-[#717971]"
                >
                  image
                </span>
              </div>

              <img
                id="heroPreview"
                class="hidden w-full
                       h-80
                       object-cover
                       rounded-2xl
                       mb-5"
              >
            `
        }

        <label
          class="block text-sm
                 font-semibold"
        >

          Nova imagem do topo

          <input
            id="heroImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="mt-2 block w-full"
          >

        </label>

        <button
          class="mt-5 px-5 py-3
                 bg-[#00361a]
                 text-white
                 rounded-xl
                 font-bold"
        >
          Guardar imagem
        </button>

      </form>

    </div>
  `);

  $("#backSettings").onclick =
    renderSettings;

  $("#heroImage").onchange =
    e => {

      const file =
        e.target.files[0];

      if (!file) return;

      const preview =
        $("#heroPreview");

      preview.src =
        URL.createObjectURL(file);

      preview.classList.remove(
        "hidden"
      );
    };

  $("#heroForm").onsubmit =
    async e => {

      e.preventDefault();

      try {

        const file =
          $("#heroImage")
            .files?.[0];

        if (!file) {

          toast(
            "Selecione uma imagem."
          );

          return;
        }

        toast(
          "A carregar imagem..."
        );

        const url =
          await uploadImage(
            file,
            "hero"
          );

        const { error } =
          await supabase
            .from("site_settings")
            .upsert({
              key: "hero_image",
              value: url,
              updated_at:
                new Date().toISOString()
            });

        if (error) {
          throw error;
        }

        settings.hero_image =
          url;

        toast(
          "Imagem do topo atualizada."
        );

        await load();

        renderHeroSettings();

      } catch (error) {

        console.error(error);

        toast(
          "Erro: " +
          error.message
        );
      }
    };
}

/* ============================================================
   PEDIDOS
============================================================ */

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
    >
      A carregar...
    </div>

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

    $("#orders").innerHTML = `

      <div
        class="bg-red-50
               text-red-700
               rounded-xl p-4"
      >
        ${esc(error.message)}
      </div>

    `;

    return;
  }

  $("#orders").innerHTML = `

    <div
      class="bg-white
             rounded-2xl
             overflow-x-auto"
    >

      <table
        class="w-full text-sm"
      >

        <thead
          class="bg-[#eef5f7]"
        >

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
              .map(order => `

                <tr
                  class="border-t"
                >

                  <td
                    class="p-4 font-bold"
                  >
                    ${esc(
                      order.order_number ||
                      order.id
                    )}
                  </td>

                  <td class="p-4">

                    ${esc(
                      order.customer_name
                    )}

                    <br>

                    <span
                      class="text-xs"
                    >
                      ${esc(
                        order.customer_phone
                      )}
                    </span>

                  </td>

                  <td
                    class="p-4 font-bold"
                  >
                    ${money(order.total)}
                  </td>

                  <td class="p-4">

                    <select
                      data-status="${esc(order.id)}"
                      class="border
                             rounded-lg
                             p-2"
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
              .join("")
          }

        </tbody>

      </table>

    </div>

  `;

  document
    .querySelectorAll("[data-status]")
    .forEach(select => {

      const row =
        (data || []).find(
          x =>
            String(x.id) ===
            String(select.dataset.status)
        );

      if (!row) return;

      select.value =
        row.status || "new";

      select.onchange =
        async () => {

          const { error } =
            await supabase
              .from("orders")
              .update({
                status:
                  select.value,
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
    });
}

/* ============================================================
   CONFIGURAÇÕES
============================================================ */

function renderSettings() {

  const whatsapp =
    settings.whatsapp || "";

  const email =
    settings.contact_email || "";

  const defaultLanguage =
    settings.default_language ||
    "pt";

  /*
   * IMPORTANTE:
   * Rancho do Mês NÃO aparece mais aqui.
   * A gestão dos Ranchos fica exclusivamente
   * na secção "Rancho do Mês".
   */

  shell(`

    <div>

      <h1
        class="font-[Montserrat]
               text-3xl font-bold"
      >
        Configurações
      </h1>

      <p
        class="text-sm
               text-[#717971] mt-2"
      >
        Gerir as configurações gerais do site.
      </p>

    </div>

    <div
      class="bg-white
             rounded-2xl p-6
             mt-6 max-w-3xl"
    >

      <div
        class="mb-6"
      >

        <button
          id="heroButton"
          class="w-full
                 p-5
                 border rounded-2xl
                 text-left
                 hover:bg-[#f5f7f6]"
        >

          <div
            class="flex items-start
                   gap-4"
          >

            <span
              class="material-symbols-outlined
                     text-[#00361a]"
            >
              panorama
            </span>

            <div>

              <h2
                class="font-bold"
              >
                Imagem grande do topo
              </h2>

              <p
                class="text-sm
                       text-[#717971]"
              >
                Alterar a imagem principal
                da página inicial.
              </p>

            </div>

          </div>

        </button>

      </div>

      <form
        id="settingsForm"
        class="space-y-4"
      >

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

        <label
          class="block text-sm
                 font-semibold"
        >

          Idioma padrão

          <select
            id="defaultLang"
            class="mt-1 w-full
                   border rounded-xl p-3"
          >

            <option
              value="pt"
              ${
                defaultLanguage === "pt"
                  ? "selected"
                  : ""
              }
            >
              Português
            </option>

            <option
              value="en"
              ${
                defaultLanguage === "en"
                  ? "selected"
                  : ""
              }
            >
              English
            </option>

            <option
              value="fr"
              ${
                defaultLanguage === "fr"
                  ? "selected"
                  : ""
              }
            >
              Français
            </option>

            <option
              value="zh"
              ${
                defaultLanguage === "zh"
                  ? "selected"
                  : ""
              }
            >
              中文
            </option>

            <option
              value="chg"
              ${
                defaultLanguage === "chg"
                  ? "selected"
                  : ""
              }
            >
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
  `);

  $("#heroButton").onclick =
    renderHeroSettings;

  $("#settingsForm").onsubmit =
    async e => {

      e.preventDefault();

      try {

        const values = [

          [
            "whatsapp",
            $("#wa").value.trim()
          ],

          [
            "contact_email",
            $("#email").value.trim()
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

          const { error } =
            await supabase
              .from("site_settings")
              .upsert({
                key,
                value,
                updated_at:
                  new Date().toISOString()
              });

          if (error) {
            throw error;
          }
        }

        toast(
          "Configurações guardadas."
        );

        await load();

      } catch (error) {

        console.error(error);

        toast(
          "Erro: " +
          error.message
        );
      }
    };
}

/* ============================================================
   INICIAR
============================================================ */

boot();
