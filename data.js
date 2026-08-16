import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://omwxktpktugunpkcxoim.supabase.co";
const SUPABASE_KEY = "sb_publishable_vNA-GPPgGCg_gCduUqPTqQ_QOnpuCnd";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const demoCategories = [
  { id: 1, name: { pt: "Arroz e cereais", en: "Rice & cereals", zh: "大米和谷物", fr: "Riz et céréales", chg: "Rice ni swigweto" }, icon: "rice_bowl" },
  { id: 2, name: { pt: "Massas", en: "Pasta", zh: "面食", fr: "Pâtes", chg: "Makaroni" }, icon: "lunch_dining" },
  { id: 3, name: { pt: "Farinhas", en: "Flours", zh: "面粉", fr: "Farines", chg: "Mafurha" }, icon: "bakery_dining" },
  { id: 4, name: { pt: "Mercearia", en: "Groceries", zh: "杂货", fr: "Épicerie", chg: "Swakudya" }, icon: "storefront" },
  { id: 5, name: { pt: "Óleo e temperos", en: "Oil & seasonings", zh: "食用油和调味料", fr: "Huiles et assaisonnements", chg: "Mafurha ni swinongo" }, icon: "oil_barrel" },
  { id: 6, name: { pt: "Leite e pequeno-almoço", en: "Dairy & breakfast", zh: "牛奶和早餐", fr: "Lait et petit-déjeuner", chg: "Masi ni swakudya swa mixo" }, icon: "emoji_food_beverage" },
  { id: 7, name: { pt: "Conservas", en: "Canned foods", zh: "罐头食品", fr: "Conserves", chg: "Swakudya swa makani" }, icon: "kitchen" },
  { id: 8, name: { pt: "Molhos e temperos", en: "Sauces & seasonings", zh: "酱料和调味料", fr: "Sauces et condiments", chg: "Masosi" }, icon: "soup_kitchen" },
  { id: 9, name: { pt: "Bebidas", en: "Drinks", zh: "饮料", fr: "Boissons", chg: "Swinwelo" }, icon: "water_drop" },
  { id: 10, name: { pt: "Higiene e limpeza", en: "Hygiene & cleaning", zh: "卫生和清洁", fr: "Hygiène et nettoyage", chg: "Ku basisa ni ku basisa" }
];

const demoProducts = [];
const demoKits = [];
const demoSettings = { contact_email:"contato@ranchoflexivel.co.mz", whatsapp:"+258840000000", delivery:{Maputo:400,Matola:1000,"Zonas circunvizinhas":700,"Levantamento na mercearia":0} };

const withTimeout = (promise, ms = 3500) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), ms))
]);

export async function getProducts() {
  const { data, error } = await withTimeout(
    supabase.from("products").select("id,name,description,category_id,price,old_price,unit,image_url,image,tag,stock,active,featured,sort_order").order("sort_order", { ascending:true }),
    3500
  );
  if (error) throw error;
  return data || [];
}

export async function getCategories() {
  const { data, error } = await withTimeout(
    supabase.from("categories").select("id,name,description,icon,image_url,active,sort_order").eq("active",true).order("sort_order", { ascending:true }),
    3000
  );
  if (error) throw error;
  return data || [];
}

export async function getKits() {
  const { data, error } = await withTimeout(
    supabase.from("bundles").select("id,name,description,price,product_ids,image_url,badge,active,sort_order").eq("active",true).order("sort_order", { ascending:true }),
    3000
  );
  if (error) throw error;
  return data || [];
}

export async function getSettings() {
  try {
    const { data, error } = await withTimeout(supabase.from("site_settings").select("key,value"), 3000);
    if (error || !data?.length) throw error || new Error("Sem configurações");
    return Object.fromEntries(data.map(x => [x.key,x.value]));
  } catch (error) {
    console.warn("Configurações indisponíveis; fallback local ativo:", error);
    return demoSettings;
  }
}

export async function getPublicContent() { return {}; }

export { demoProducts, demoCategories, demoKits, demoSettings };