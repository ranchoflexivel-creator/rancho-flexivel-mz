import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://omwxktpktugunpkcxoim.supabase.co";
const SUPABASE_KEY = "sb_publishable_vNA-GPPgGCg_gCduUqPTqQ_QOnpuCnd";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// DADOS DEMO / FALLBACK
// ============================================================

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
  { id: 10, name: { pt: "Higiene e limpeza", en: "Hygiene & cleaning", zh: "卫生和清洁", fr: "Hygiène et nettoyage", chg: "Ku basisa ni ku basisa" }, icon: "cleaning_services" }
];

const demoProducts = [
  ["RF-001","Arroz Jasmine Dona Ana",1,621.50,690,"5 kg","https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80","Promoção"],["RF-002","Arroz Jasmine Excella",1,451,null,"5 kg","https://images.unsplash.com/photo-1536304993881-ff6e9e8f3b9d?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-003","Arroz Jasmine Royal Aroma",1,412.50,458,"5 kg","https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80","Promoção"],["RF-004","Arroz Basmati Arya Azul",1,687.50,null,"5 kg","https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=700&q=80","Recomendado"],["RF-005","Arroz Mariana Supremo Rosa",1,324.50,null,"5 kg","https://images.unsplash.com/photo-1586201375754-1421e2aa6f25?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-006","Arroz Tio António Azul",1,616,null,"10 kg","https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=700&q=80","Poucas unidades"],
  ["RF-007","Massa Esparguete Bella",2,34.10,38,"1 pacote","https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=700&q=80","Promoção"],["RF-008","Massa Esparguete Polana",2,31.90,null,"1 pacote","https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-009","Massa Lasanha Milaneza",2,112.20,null,"1 pacote","https://images.unsplash.com/photo-1574894709920-11b28e7367a0?auto=format&fit=crop&w=700&q=80","Novidade"],
  ["RF-010","Farinha de Trigo Bela",3,687.50,null,"10 kg","https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80",""],["RF-011","Farinha de Milho White Star",3,52.25,null,"1 kg","https://images.unsplash.com/photo-1598514982901-ae6270c1f1c7?auto=format&fit=crop&w=700&q=80","Recomendado"],
  ["RF-012","Açúcar Branco",4,89.90,null,"1 kg","https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=700&q=80",""],["RF-013","Feijão Catarino",4,129.90,null,"1 kg","https://images.unsplash.com/photo-1585991182723-3b9f0e3a6a8d?auto=format&fit=crop&w=700&q=80",""],["RF-014","Feijão Manteiga",4,139.90,null,"1 kg","https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80",""],["RF-015","Sal Refinado",4,34.90,null,"1 kg","https://images.unsplash.com/photo-1518110925495-5cce4d6b3a03?auto=format&fit=crop&w=700&q=80",""],
  ["RF-016","Caldo Knorr",8,65.00,null,"60 g","https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",""],["RF-017","Óleo Somol",5,749.10,null,"5 L","https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80","Recomendado"],["RF-018","Vinagre Neymat",5,27.50,null,"750 ml","https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=700&q=80",""],["RF-019","Azeite Gourmet",5,632.50,null,"500 ml","https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80","Novidade"],
  ["RF-020","Leite Parmalat",6,86.90,null,"1 L","https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-021","Leite Nido Normal",6,393.80,439,"600 g","https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=700&q=80","Promoção"],["RF-022","Café Ricoffy",6,130.63,null,"100 g","https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80",""],["RF-023","Chá Five Roses",6,101.98,null,"65 g","https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&q=80","Recomendado"],
  ["RF-024","Sardinha Lucky Star",7,61.88,null,"155 g","https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-025","Atum Gourmet em Óleo Vegetal",7,95.70,null,"110 g","https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80",""],["RF-026","Molho de Tomate All Gold",8,119.16,null,"350 ml","https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80","Recomendado"],["RF-027","Aromat Knorr",8,55,null,"75 g","https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80",""],
  ["RF-028","Água Vumba",9,42.16,null,"1,5 L","https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-029","Água Namaacha",9,34.38,39,"1,5 L","https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=700&q=80","Promoção"],["RF-030","Refrigerante Coca-Cola",9,104.50,null,"2 L","https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=700&q=80",""],["RF-031","Sumo Compal",9,129.71,null,"1 L","https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=700&q=80","Novidade"],
  ["RF-032","Pasta Colgate Maximum",10,72.57,null,"140 g","https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=80",""],["RF-033","Papel Higiénico Baby Soft",10,43.54,null,"1 rolo","https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=700&q=80","Mais vendido"],["RF-034","OMO Flexi Powder",10,320.84,355,"2 kg","https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=700&q=80","Promoção"],["RF-035","Sunlight Líquido",10,140.80,null,"750 ml","https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80","Recomendado"],["RF-036","Amaciador Maq",10,189.44,null,"2 L","https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=700&q=80",""]
].map((x, i) => ({ id:x[0], name:{pt:x[1],en:x[1],zh:x[1],fr:x[1],chg:x[1]}, category_id:x[2], price:x[3], old_price:x[4], unit:x[5], image_url:x[6], tag:{pt:x[7],en:x[7],zh:x[7],fr:x[7],chg:x[7]}, stock:25, active:true, featured:i<6, description:{pt:"Produto selecionado do Rancho Flexível.",en:"Selected Rancho Flexível product.",zh:"精选商品。",fr:"Produit sélectionné.",chg:"Xihlawulekisiwile."} }));

const demoKits = [
  { id:"essential", name:{pt:"Rancho Essencial",en:"Essential Bundle",zh:"基础套餐",fr:"Panier essentiel",chg:"Rancho wa nkoka"}, description:{pt:"O básico indispensável para a sua cozinha.",en:"The essentials for your kitchen.",zh:"厨房必需品。",fr:"Les essentiels de la cuisine.",chg:"Swilo swa nkoka endlwini."}, price:1127.05, product_ids:["RF-001","RF-007","RF-012","RF-013","RF-020","RF-024"], image_url:"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
  { id:"economy", name:{pt:"Rancho Económico",en:"Economy Bundle",zh:"经济套餐",fr:"Panier économique",chg:"Rancho wa nkoka"}, description:{pt:"Foco no rendimento e economia.",en:"Value and savings.",zh:"注重性价比。",fr:"Économie et rendement.",chg:"Ku hlayisa mali."}, price:822.69, product_ids:["RF-005","RF-008","RF-011","RF-012","RF-013","RF-015"], image_url:"https://images.unsplash.com/photo-1601598851547-4302969d5f4f?auto=format&fit=crop&w=800&q=80" },
  { id:"couple", name:{pt:"Rancho para Casal",en:"Couple Bundle",zh:"双人套餐",fr:"Panier couple",chg:"Rancho wa vukati"}, description:{pt:"Na medida certa para dois.",en:"Sized for two.",zh:"适合两人。",fr:"À la mesure de deux.",chg:"Swi ringanile vanhu vambirhi."}, price:1780.51, product_ids:["RF-001","RF-009","RF-014","RF-019","RF-022","RF-026"], image_url:"https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=800&q=80" },
  { id:"family", name:{pt:"Rancho Familiar",en:"Family Bundle",zh:"家庭套餐",fr:"Panier familial",chg:"Rancho wa ndyangu"}, description:{pt:"Quantidade para toda a família.",en:"For the whole family.",zh:"适合全家。",fr:"Pour toute la famille.",chg:"Swa ndyangu hinkwawu."}, price:2865.24, product_ids:["RF-006","RF-010","RF-013","RF-015","RF-017","RF-021"], image_url:"https://images.unsplash.com/photo-1601598851547-4302969d5f4f?auto=format&fit=crop&w=800&q=80" }
];

const demoSettings = { contact_email:"contato@ranchoflexivel.co.mz", whatsapp:"+258840000000", delivery:{Maputo:400,Matola:1000,"Zonas circunvizinhas":700,"Levantamento na mercearia":0} };

const withTimeout = (promise, ms = 3500) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), ms))
]);

export async function getProducts() {
  try {
    const { data, error } = await withTimeout(supabase.from("products").select("id,name,category_id,price,old_price,unit,image_url,image,photo_url,imageUrl,tag,stock,active,featured,description,sort_order").order("sort_order", { ascending:true }));
    if (error) throw error;
    return data?.length ? data : demoProducts;
  } catch (error) {
    console.warn("Produtos indisponíveis; fallback local ativo:", error);
    return demoProducts;
  }
}

export async function getCategories() {
  try {
    const { data, error } = await withTimeout(supabase.from("categories").select("id,name,icon,active,sort_order").eq("active",true).order("sort_order"), 3000);
    if (error) throw error;
    return data?.length ? data : demoCategories;
  } catch (error) {
    console.warn("Categorias indisponíveis; fallback local ativo:", error);
    return demoCategories;
  }
}

export async function getKits() {
  try {
    const { data, error } = await withTimeout(supabase.from("bundles").select("id,name,description,price,product_ids,image_url,active,sort_order").eq("active",true).order("sort_order"), 3000);
    if (error) throw error;
    return data?.length ? data : demoKits;
  } catch (error) {
    console.warn("Combos indisponíveis; fallback local ativo:", error);
    return demoKits;
  }
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
