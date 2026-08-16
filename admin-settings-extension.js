import { supabase } from "./data.js";

const EXT_ID = "rf-admin-settings-extension";

const esc = value => String(value ?? "").replace(/[&<>\"']/g, m => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
}[m]));

const valueOf = (settings, key, fallback = "") => {
  const value = settings?.[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

async function readSettings() {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.key, row.value]));
}

async function saveSettings(values) {
  for (const [key, value] of Object.entries(values)) {
    const { error } = await supabase.from("site_settings").upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  }
}

function input(label, id, value, type = "text") {
  return `<label class="block text-sm font-semibold">${esc(label)}<input id="${id}" type="${type}" value="${esc(value)}" class="mt-1 w-full border rounded-xl p-3 font-normal"></label>`;
}

function textarea(label, id, value) {
  return `<label class="block text-sm font-semibold">${esc(label)}<textarea id="${id}" rows="3" class="mt-1 w-full border rounded-xl p-3 font-normal">${esc(value)}</textarea></label>`;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(window.__rfAdminSettingsToast);
  window.__rfAdminSettingsToast = setTimeout(() => toast.classList.add("hidden"), 3000);
}

async function mount() {
  if (!document.querySelector("#settingsForm")) return;
  if (document.querySelector(`#${EXT_ID}`)) return;

  let settings;
  try {
    settings = await readSettings();
  } catch (error) {
    console.error("Não foi possível carregar as configurações adicionais:", error);
    return;
  }

  const section = document.createElement("section");
  section.id = EXT_ID;
  section.className = "bg-white rounded-2xl p-6 mt-6 max-w-3xl";
  section.innerHTML = `
    <h2 class="font-[Montserrat] text-xl font-bold">Operação e conteúdo do site</h2>
    <p class="text-sm text-[#717971] mt-1">Edite os dados que aparecem ao cliente no checkout e na página pública.</p>

    <div class="mt-6">
      <h3 class="font-bold">Formas de pagamento</h3>
      <p class="text-xs text-[#717971] mt-1">Estes dados aparecem quando o cliente escolhe o respectivo método de pagamento.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-4">
        ${input("Número M-Pesa", "rf_mpesa", valueOf(settings, "mpesa_number"))}
        ${input("Número E-Mola", "rf_emola", valueOf(settings, "emola_number"))}
        ${textarea("Dados da Transferência Bancária", "rf_bank", valueOf(settings, "bank_details"))}
      </div>
    </div>

    <div class="mt-8 pt-6 border-t">
      <h3 class="font-bold">Taxas de entrega</h3>
      <p class="text-xs text-[#717971] mt-1">Altere os valores sem precisar mexer no código.</p>
      <div class="grid md:grid-cols-2 gap-4 mt-4">
        ${input("Maputo Cidade (MZN)", "rf_delivery_maputo", valueOf(settings, "delivery_maputo", "400"), "number")}
        ${input("Zonas Circunvizinhas (MZN)", "rf_delivery_zonas", valueOf(settings, "delivery_zonas", "700"), "number")}
        ${input("Matola (MZN)", "rf_delivery_matola", valueOf(settings, "delivery_matola", "1000"), "number")}
        ${input("Levantamento (MZN)", "rf_delivery_pickup", valueOf(settings, "delivery_pickup", "0"), "number")}
      </div>
    </div>

    <div class="mt-8 pt-6 border-t">
      <h3 class="font-bold">Textos — Dúvidas frequentes</h3>
      <p class="text-xs text-[#717971] mt-1">Edite o título, a etiqueta e as perguntas/respostas apresentadas na página pública.</p>
      <div class="space-y-4 mt-4">
        ${input("Etiqueta", "rf_faq_label", valueOf(settings, "faq_label", "Dúvidas frequentes"))}
        ${input("Título", "rf_faq_title", valueOf(settings, "faq_title", "Perguntas frequentes"))}
        ${[1,2,3,4].map(i => `
          <div class="rounded-xl border p-4 space-y-3">
            <div class="font-semibold">Pergunta ${i}</div>
            ${input("Pergunta", `rf_faq_q${i}`, valueOf(settings, `faq_q${i}`))}
            ${textarea("Resposta", `rf_faq_a${i}`, valueOf(settings, `faq_a${i}`))}
          </div>
        `).join("")}
      </div>
    </div>

    <button id="rfSaveExtraSettings" type="button" class="mt-6 px-5 py-3 bg-[#00361a] text-white rounded-xl font-bold">Guardar dados e textos</button>
  `;

  document.querySelector("#settingsForm")?.closest(".bg-white")?.insertAdjacentElement("afterend", section);

  document.querySelector("#rfSaveExtraSettings").onclick = async () => {
    const get = id => document.querySelector(`#${id}`)?.value?.trim() || "";
    const numeric = id => Number(document.querySelector(`#${id}`)?.value || 0);
    const values = {
      mpesa_number: get("rf_mpesa"),
      emola_number: get("rf_emola"),
      bank_details: get("rf_bank"),
      delivery_maputo: numeric("rf_delivery_maputo"),
      delivery_zonas: numeric("rf_delivery_zonas"),
      delivery_matola: numeric("rf_delivery_matola"),
      delivery_pickup: numeric("rf_delivery_pickup"),
      faq_label: get("rf_faq_label"),
      faq_title: get("rf_faq_title")
    };
    for (let i = 1; i <= 4; i++) {
      values[`faq_q${i}`] = get(`rf_faq_q${i}`);
      values[`faq_a${i}`] = get(`rf_faq_a${i}`);
    }

    try {
      await saveSettings(values);
      showToast("Dados de pagamento, entregas e textos guardados.");
    } catch (error) {
      console.error(error);
      showToast(`Erro: ${error.message}`);
    }
  };
}

const observer = new MutationObserver(() => mount());
observer.observe(document.body, { childList: true, subtree: true });
mount();
