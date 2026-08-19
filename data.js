import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://omwxktpktugunpkcxoim.supabase.co";
const SUPABASE_KEY = "sb_publishable_vNA-GPPgGCg_gCduUqPTqQ_QOnpuCnd";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OFFICIAL_CATEGORIES = [
  { id: "rf-cat-1", name: { pt: "Arroz e cereais", en: "Rice & cereals", zh: "大米和谷物", fr: "Riz et céréales", chg: "Rice ni swigweto" }, icon: "rice_bowl", sort_order: 1 },
  { id: "rf-cat-2", name: { pt: "Massas", en: "Pasta", zh: "面食", fr: "Pâtes", chg: "Makaroni" }, icon: "lunch_dining", sort_order: 2 },
  { id: "rf-cat-3", name: { pt: "Farinhas", en: "Flours", zh: "面粉", fr: "Farines", chg: "Mafurha" }, icon: "bakery_dining", sort_order: 3 },
  { id: "rf-cat-4", name: { pt: "Mercearia", en: "Groceries", zh: "杂货", fr: "Épicerie", chg: "Swakudya" }, icon: "storefront", sort_order: 4 },
  { id: "rf-cat-5", name: { pt: "Óleo e temperos", en: "Oil & seasonings", zh: "食用油和调味料", fr: "Huiles et assaisonnements", chg: "Mafurha ni swinongo" }, icon: "oil_barrel", sort_order: 5 },
  { id: "rf-cat-6", name: { pt: "Leite e pequeno-almoço", en: "Dairy & breakfast", zh: "牛奶和早餐", fr: "Lait et petit-déjeuner", chg: "Masi ni swakudya swa mixo" }, icon: "emoji_food_beverage", sort_order: 6 },
  { id: "rf-cat-7", name: { pt: "Conservas", en: "Canned foods", zh: "罐头食品", fr: "Conserves", chg: "Swakudya swa makani" }, icon: "kitchen", sort_order: 7 },
  { id: "rf-cat-8", name: { pt: "Molhos e temperos", en: "Sauces & seasonings", zh: "酱料和调味料", fr: "Sauces et condiments", chg: "Masosi" }, icon: "soup_kitchen", sort_order: 8 },
  { id: "rf-cat-9", name: { pt: "Bebidas", en: "Drinks", zh: "饮料", fr: "Boissons", chg: "Swinwelo" }, icon: "water_drop", sort_order: 9 },
  { id: "rf-cat-10", name: { pt: "Higiene e limpeza", en: "Hygiene & cleaning", zh: "卫生和清洁", fr: "Hygiène et nettoyage", chg: "Ku basisa ni ku basisa" }, icon: "cleaning_services", sort_order: 10 }
];

const demoCategories = OFFICIAL_CATEGORIES;
const demoProducts = [];
const demoKits = [];
const demoSettings = {
  contact_email: "contato@ranchoflexivel.co.mz",
  whatsapp: "+258840000000",
  delivery: { "Maputo Cidade": 400, "Zonas circunvizinhas": 700, "Matola": 1000, "Levantamento": 0 },
  mpesa_number: "",
  emola_number: "",
  bank_details: "",
  footer_tagline: "Do nosso mercado para a sua mesa — escolha, peça e receba com simplicidade."
};

const withTimeout = (promise, ms = 3500) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), ms))
]);

export async function getProducts() {
  try {
    const { data, error } = await withTimeout(
      supabase.from("products").select("id,name,description,category_id,price,old_price,unit,image_url,image,tag,stock,active,featured,sort_order").order("sort_order", { ascending: true }),
      3500
    );
    if (error) throw error;
    return Array.isArray(data) ? data : demoProducts;
  } catch (error) {
    console.warn("Produtos indisponíveis; fallback local ativo:", error);
    return demoProducts;
  }
}

export async function getCategories() {
  try {
    const { data, error } = await withTimeout(
      supabase.from("categories").select("id,name,description,icon,image_url,active,sort_order").eq("active", true).order("sort_order", { ascending: true }),
      3000
    );
    if (error) throw error;
    const remote = Array.isArray(data) ? data : [];
    if (!remote.length) return OFFICIAL_CATEGORIES;
    const result = OFFICIAL_CATEGORIES.map((official) => {
      const officialName = String(official.name?.pt || "").toLowerCase().trim();
      const found = remote.find((remoteCat) => {
        const remoteName = typeof remoteCat.name === "string" ? remoteCat.name : remoteCat.name?.pt || "";
        return String(remoteName).toLowerCase().trim() === officialName;
      });
      if (!found) return official;
      return {
        ...official,
        ...found,
        name: typeof found.name === "object" ? { ...official.name, ...found.name } : official.name,
        icon: found.icon || official.icon,
        sort_order: Number.isFinite(Number(found.sort_order)) ? Number(found.sort_order) : official.sort_order
      };
    });
    return result.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  } catch (error) {
    console.warn("Categorias indisponíveis; categorias oficiais locais ativas:", error);
    return OFFICIAL_CATEGORIES;
  }
}

export async function getKits() {
  try {
    const { data, error } = await withTimeout(
      supabase.from("bundles").select("id,name,description,price,product_ids,image_url,badge,active,sort_order").eq("active", true).order("sort_order", { ascending: true }),
      3000
    );
    if (error) throw error;
    return Array.isArray(data) ? data : demoKits;
  } catch (error) {
    console.warn("Combos indisponíveis; fallback local ativo:", error);
    return demoKits;
  }
}

export async function getSettings() {
  try {
    const { data, error } = await withTimeout(supabase.from("site_settings").select("key,value"), 3000);
    if (error) throw error;
    if (!Array.isArray(data) || !data.length) return demoSettings;
    const remoteSettings = Object.fromEntries(data.map((item) => [item.key, item.value]));
    return {
      ...demoSettings,
      ...remoteSettings,
      delivery: { ...demoSettings.delivery, ...(remoteSettings.delivery || {}) }
    };
  } catch (error) {
    console.warn("Configurações indisponíveis; fallback local ativo:", error);
    return demoSettings;
  }
}

export async function getPublicContent() {
  try {
    const { data, error } = await withTimeout(supabase.from("public_content").select("*"), 3000);
    if (error) {
      console.warn("Tabela public_content indisponível:", error);
      return {};
    }
    return data || {};
  } catch (error) {
    console.warn("Conteúdo público indisponível:", error);
    return {};
  }
}

export { demoProducts, demoCategories, demoKits, demoSettings, OFFICIAL_CATEGORIES };
