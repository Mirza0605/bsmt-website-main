/* ---------------------------------------------------------------
   BSMT — Yönetim Paneli

   Tüm veri MySQL'de tutulur ve /api üzerinden okunup yazılır.
   Kaydettiğin an yayına girer; ayrı bir "yayınla" adımı yoktur.
   --------------------------------------------------------------- */

const TOKEN_KEY = "bsmt-admin-token";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

let data = { settings: {}, texts: {}, events: [], team: [], faq: [] };
let messages = [];
let token = sessionStorage.getItem(TOKEN_KEY) || null;

/* ---------------------------- yardımcı ---------------------------- */

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("is-error", isError);
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3000);
}

function startOfTodayTs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const tsOf = (d) => new Date(d + "T00:00:00").getTime();
const isUpcoming = (e) => Boolean(e.date) && tsOf(e.date) >= startOfTodayTs();

function fmtDate(d) {
  if (!d) return "Tarih yok";
  return new Date(d + "T00:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtDateTime(v) {
  return new Date(v).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

/* ------------------------------ API ------------------------------ */

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function api(method, url, body) {
  const res = await fetch(`/api${url}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    token = null;
    showLogin("Oturum süresi doldu. Tekrar giriş yapın.");
    throw new ApiError("Oturum gerekli", 401);
  }

  const payload = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(payload?.error || `Sunucu hatası (${res.status})`, res.status);
  return payload;
}

// Rota çağrılarını tek yerden sarmalayıp hata mesajını kullanıcıya gösterir.
async function run(fn, successMsg) {
  try {
    const result = await fn();
    if (successMsg) toast(successMsg);
    return result;
  } catch (err) {
    if (err.status !== 401) toast(err.message || "İşlem başarısız.", true);
    throw err;
  }
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(payload?.error || "Yükleme başarısız.", res.status);
  return payload.path;
}

/* ------------------------------ şema ------------------------------ */

const SCHEMAS = {
  events: {
    single: "Etkinlik",
    fields: [
      { key: "title", type: "i18n", label: "Başlık" },
      { key: "type", type: "i18n", label: "Tür (rozet metni)" },
      { key: "date", type: "date", label: "Tarih" },
      { key: "time", type: "time", label: "Saat (boş bırakılabilir)" },
      { key: "place", type: "i18n", label: "Yer" },
      { key: "desc", type: "i18n-area", label: "Açıklama" },
      { key: "image", type: "image", label: "Etkinlik Görseli" },
      { key: "link", type: "url", label: "Kayıt / Detay Linki (opsiyonel)" }
    ],
    blank: () => ({
      title: { tr: "", en: "" }, type: { tr: "", en: "" },
      date: "", time: "",
      place: { tr: "", en: "" }, desc: { tr: "", en: "" },
      image: "", link: ""
    })
  },

  team: {
    single: "Ekip Üyesi",
    fields: [
      { key: "name", type: "text", label: "Ad Soyad" },
      { key: "role", type: "i18n", label: "Görev" },
      { key: "photo", type: "image", label: "Fotoğraf", round: true }
    ],
    blank: () => ({ name: "", role: { tr: "", en: "" }, photo: "" })
  },

  faq: {
    single: "Soru",
    fields: [
      { key: "q", type: "i18n-area", label: "Soru" },
      { key: "a", type: "i18n-area", label: "Cevap" }
    ],
    blank: () => ({ q: { tr: "", en: "" }, a: { tr: "", en: "" } })
  }
};

const TEXT_FIELDS = [
  ["aboutWhatTitle", "\"Nedir?\" bölümü — başlık", "text"],
  ["aboutWhatText", "\"Nedir?\" bölümü — metin", "area"],
  ["aboutWhoTitle", "\"Biz Kimiz?\" — başlık", "text"],
  ["aboutWhoText", "\"Biz Kimiz?\" — metin", "area"],
  ["aboutWhoMuted", "\"Biz Kimiz?\" — alt paragraf", "area"],
  ["missionTitle", "Misyon — başlık", "text"],
  ["missionText", "Misyon — metin", "area"],
  ["visionTitle", "Vizyon — başlık", "text"],
  ["visionText", "Vizyon — metin", "area"],
  ["joinTitle", "Üye Ol kartı — başlık", "text"],
  ["joinIntro", "Üye Ol kartı — açıklama", "area"],
  ["joinSabisTitle", "SABİS satırı — başlık", "text"],
  ["joinSabisDesc", "SABİS satırı — açıklama", "text"],
  ["joinWhatsappTitle", "WhatsApp satırı — başlık", "text"],
  ["joinWhatsappDesc", "WhatsApp satırı — açıklama", "text"],
  ["joinInstagramTitle", "Instagram satırı — başlık", "text"],
  ["joinInstagramDesc", "Instagram satırı — açıklama", "text"],
  ["joinLinkedinTitle", "LinkedIn satırı — başlık", "text"],
  ["joinLinkedinDesc", "LinkedIn satırı — açıklama", "text"],
  ["pastEventsTitle", "Geçmiş Etkinlikler — başlık", "text"],
  ["teamSectionTitle", "Yönetim Ekibi — başlık", "text"],
  ["faqTitle", "S.S.S. — başlık", "text"],
  ["contactTitle", "İletişim — başlık", "text"]
];

const PANEL_META = {
  dashboard: ["Genel Bakış", "Sitenin güncel durumu."],
  events: ["Etkinlikler", "Tarihi gelecekte olanlar otomatik \"yaklaşan\" olur."],
  team: ["Yönetim Ekibi", "Üyeleri yönet ve sıralamayı değiştir."],
  faq: ["S.S.S.", "Sıkça sorulan soruları yönet."],
  texts: ["Site Metinleri", "Sabit bölüm başlıkları ve paragraflar."],
  settings: ["Ayarlar", "Bağlantılar, iletişim e-postası ve arka plan görselleri."],
  messages: ["Mesajlar", "İletişim formundan gelen mesajlar."],
  account: ["Hesap", "Şifre değiştirme ve yedekleme."]
};

/* ----------------------------- yükleme ---------------------------- */

async function loadAll() {
  const content = await api("GET", "/content");
  data = {
    settings: content.settings || {},
    texts: content.texts || {},
    events: content.events || [],
    team: content.team || [],
    faq: content.faq || []
  };
}

async function loadMessages() {
  try {
    messages = await api("GET", "/messages");
  } catch {
    messages = [];
  }
}

/* ------------------------------ render ---------------------------- */

function render() {
  $("#countEvents").textContent = data.events.length;
  $("#countTeam").textContent = data.team.length;
  $("#countFaq").textContent = data.faq.length;
  $("#countMessages").textContent = messages.length;

  renderDashboard();
  renderList("events");
  renderList("team");
  renderList("faq");
  renderTexts();
  renderSettings();
  renderHeroImages();
  renderMessages();
}

function renderDashboard() {
  const upcoming = data.events.filter(isUpcoming).sort((a, b) => tsOf(a.date) - tsOf(b.date));

  $("#statUpcoming").textContent = upcoming.length;
  $("#statPast").textContent = data.events.length - upcoming.length;
  $("#statTeam").textContent = data.team.length;
  $("#statMessages").textContent = messages.length;

  const next = upcoming[0];
  $("#dashNext").innerHTML = next
    ? `<h3>Sıradaki Etkinlik</h3>
       <p class="muted"><strong style="color:var(--text)">${esc(next.title?.tr || "(başlıksız)")}</strong><br>
       ${esc(fmtDate(next.date))}${next.time ? " • " + esc(next.time) : ""} — ${esc(next.place?.tr || "")}</p>`
    : `<h3>Sıradaki Etkinlik</h3>
       <p class="muted">Yaklaşan etkinlik yok — sitedeki geri sayım kartı boş görünüyor.
       Etkinlikler bölümünden ileri tarihli bir etkinlik ekleyebilirsin.</p>`;

  const warnings = [];
  data.team.forEach((m) => {
    if (!m.name?.trim()) warnings.push(`Ekip: "${m.role?.tr || "?"}" görevindeki üyenin adı boş.`);
    if (!m.photo?.trim()) warnings.push(`Ekip: "${m.name || m.role?.tr || "?"}" için fotoğraf yok.`);
  });
  data.events.forEach((e) => {
    if (!e.title?.tr?.trim()) warnings.push("Etkinlik: başlığı boş bir kayıt var.");
    if (!e.date) warnings.push(`Etkinlik: "${e.title?.tr || "?"}" için tarih girilmemiş (sitede görünmez).`);
  });
  if (!data.settings.contactEmail) warnings.push("Ayarlar: iletişim e-postası boş.");

  $("#dashWarnings").innerHTML = warnings.length
    ? `<h3>Eksikler (${warnings.length})</h3>` +
      warnings.map((w) => `<div class="warn-line">⚠️ <span>${esc(w)}</span></div>`).join("")
    : `<h3>Eksikler</h3><p class="muted">✅ Her şey tamam görünüyor.</p>`;
}

function itemMeta(type, it) {
  if (type === "events") {
    return {
      title: it.title?.tr || "(başlıksız etkinlik)",
      sub: `${fmtDate(it.date)}${it.time ? " • " + it.time : ""} — ${it.place?.tr || "yer yok"}`,
      thumb: it.image,
      tag: it.date ? (isUpcoming(it) ? "Yaklaşan" : "Geçmiş") : "Tarihsiz",
      upcoming: isUpcoming(it)
    };
  }
  if (type === "team") {
    return { title: it.name || "(isim girilmemiş)", sub: it.role?.tr || "", thumb: it.photo, round: true };
  }
  return { title: it.q?.tr || "(soru boş)", sub: (it.a?.tr || "").slice(0, 110) };
}

function renderList(type) {
  const wrap = $(`#list${type[0].toUpperCase()}${type.slice(1)}`);
  const items = data[type];
  wrap.dataset.type = type;

  if (!items.length) {
    wrap.innerHTML = `<div class="empty">Henüz kayıt yok. Yukarıdaki butonla ekleyebilirsin.</div>`;
    return;
  }

  wrap.innerHTML = items.map((it, i) => {
    const m = itemMeta(type, it);
    const thumb = m.thumb
      ? `<img class="item-thumb${m.round ? " is-round" : ""}" src="${esc(m.thumb)}" alt="">`
      : `<div class="item-thumb${m.round ? " is-round" : ""}"></div>`;

    return `
      <div class="item" data-id="${esc(it.id)}">
        ${thumb}
        <div class="item-body">
          <span class="item-title">${esc(m.title)}
            ${m.tag ? `<span class="tag${m.upcoming ? " is-upcoming" : ""}">${esc(m.tag)}</span>` : ""}
          </span>
          <span class="item-sub">${esc(m.sub)}</span>
        </div>
        <div class="item-actions">
          <button class="icon-btn" type="button" data-move="up" title="Yukarı" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-btn" type="button" data-move="down" title="Aşağı" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn btn-sm" type="button" data-edit>Düzenle</button>
          <button class="btn btn-sm btn-danger" type="button" data-delete>Sil</button>
        </div>
      </div>`;
  }).join("");
}

function renderTexts() {
  $("#textsForm").innerHTML = TEXT_FIELDS.map(([key, label, kind]) => {
    const v = data.texts[key] || {};
    const field = (loc) => kind === "area"
      ? `<textarea class="field" data-text="${key}" data-locale="${loc}">${esc(v[loc] || "")}</textarea>`
      : `<input class="field" type="text" data-text="${key}" data-locale="${loc}" value="${esc(v[loc] || "")}">`;

    return `
      <div class="box">
        <div class="form-field">
          <label>${esc(label)}</label>
          <div class="i18n-pair">
            <div class="i18n-cell"><span class="i18n-flag">🇹🇷 Türkçe</span>${field("tr")}</div>
            <div class="i18n-cell"><span class="i18n-flag">🇬🇧 English</span>${field("en")}</div>
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderSettings() {
  const s = data.settings;
  const links = s.links || {};
  const pair = (key, label) => `
    <div class="form-field">
      <label>${esc(label)}</label>
      <div class="i18n-pair">
        <div class="i18n-cell"><span class="i18n-flag">🇹🇷 Türkçe</span>
          <input class="field" type="text" data-setting="${key}.tr" value="${esc(s[key]?.tr || "")}"></div>
        <div class="i18n-cell"><span class="i18n-flag">🇬🇧 English</span>
          <input class="field" type="text" data-setting="${key}.en" value="${esc(s[key]?.en || "")}"></div>
      </div>
    </div>`;

  $("#settingsForm").innerHTML = `
    <div class="box">
      <h3>Genel</h3>
      <div class="form-grid">
        ${pair("brand", "Üst menüdeki topluluk adı")}
        ${pair("heroTitle", "Ana sayfa büyük başlık")}
        <div class="form-field">
          <label>İletişim formu e-postası</label>
          <input class="field" type="email" data-setting="contactEmail" value="${esc(s.contactEmail || "")}">
        </div>
      </div>
    </div>

    <div class="box">
      <h3>Bağlantılar</h3>
      <div class="form-grid">
        <div class="form-cols">
          <div class="form-field"><label>SABİS (Üye Ol)</label>
            <input class="field" type="url" data-setting="links.sabis" value="${esc(links.sabis || "")}"></div>
          <div class="form-field"><label>WhatsApp grubu</label>
            <input class="field" type="url" data-setting="links.whatsapp" value="${esc(links.whatsapp || "")}"></div>
        </div>
        <div class="form-cols">
          <div class="form-field"><label>Instagram</label>
            <input class="field" type="url" data-setting="links.instagram" value="${esc(links.instagram || "")}"></div>
          <div class="form-field"><label>LinkedIn</label>
            <input class="field" type="url" data-setting="links.linkedin" value="${esc(links.linkedin || "")}"></div>
        </div>
      </div>
    </div>`;
}

function renderHeroImages() {
  const list = data.settings.heroImages || [];
  $("#heroImages").innerHTML = list.length
    ? list.map((src, i) => `
        <div class="hero-img">
          <img src="${esc(src)}" alt="">
          <button type="button" data-hero-remove="${i}" title="Kaldır">✕</button>
          <span>${esc(src)}</span>
        </div>`).join("")
    : `<div class="empty">Arka plan görseli yok.</div>`;
}

function renderMessages() {
  $("#listMessages").innerHTML = messages.length
    ? messages.map((m) => `
        <div class="box" data-msg="${m.id}">
          <div class="msg-head">
            <div>
              <strong>${esc(m.name || "(isimsiz)")}</strong>
              <span class="muted"> · ${esc(m.email || "")}</span>
            </div>
            <div class="msg-actions">
              <span class="muted" style="font-size:12px">${esc(fmtDateTime(m.created_at))}</span>
              <button class="btn btn-sm btn-danger" type="button" data-msg-delete="${m.id}">Sil</button>
            </div>
          </div>
          <p class="muted" style="font-size:12.5px;margin:4px 0 8px">
            ${esc(m.department || "-")}${m.class_year ? " · " + esc(m.class_year) + ". sınıf" : ""}
          </p>
          <p style="white-space:pre-wrap;margin:0">${esc(m.message || "")}</p>
        </div>`).join("")
    : `<div class="empty">Henüz mesaj yok.</div>`;
}

/* ------------------------------ modal ----------------------------- */

let modalCtx = null;

function fieldHtml(f, item) {
  const v = item[f.key];

  if (f.type === "i18n" || f.type === "i18n-area") {
    const area = f.type === "i18n-area";
    const one = (loc) => area
      ? `<textarea class="field" data-field="${f.key}" data-locale="${loc}">${esc(v?.[loc] || "")}</textarea>`
      : `<input class="field" type="text" data-field="${f.key}" data-locale="${loc}" value="${esc(v?.[loc] || "")}">`;
    return `
      <div class="form-field">
        <label>${esc(f.label)}</label>
        <div class="i18n-pair">
          <div class="i18n-cell"><span class="i18n-flag">🇹🇷 Türkçe</span>${one("tr")}</div>
          <div class="i18n-cell"><span class="i18n-flag">🇬🇧 English</span>${one("en")}</div>
        </div>
      </div>`;
  }

  if (f.type === "image") {
    return `
      <div class="form-field">
        <label>${esc(f.label)}</label>
        <div class="img-picker">
          <img class="img-preview${f.round ? " is-round" : ""}" id="imgPreview_${f.key}" src="${esc(v || "")}" alt="">
          <div class="img-picker-controls">
            <input class="field" type="text" data-field="${f.key}"
                   placeholder="image/ornek.jpg" value="${esc(v || "")}">
            <label class="btn btn-sm">
              📁 Bilgisayardan Yükle
              <input type="file" accept="image/*" hidden data-upload="${f.key}">
            </label>
            <span class="muted" style="font-size:11.5px">
              Yüklenen dosya sunucuda <code>image/uploads/</code> klasörüne kaydedilir.
            </span>
          </div>
        </div>
      </div>`;
  }

  const type = f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "url" ? "url" : "text";
  return `
    <div class="form-field">
      <label>${esc(f.label)}</label>
      <input class="field" type="${type}" data-field="${f.key}" value="${esc(v || "")}">
    </div>`;
}

function openModal(type, id) {
  const schema = SCHEMAS[type];
  const isNew = !id;
  const item = isNew
    ? schema.blank()
    : JSON.parse(JSON.stringify(data[type].find((x) => x.id === id)));

  modalCtx = { type, id, isNew, item };

  $("#modalTitle").textContent = `${schema.single} ${isNew ? "Ekle" : "Düzenle"}`;
  $("#modalForm").innerHTML = `<div class="form-grid">${schema.fields.map((f) => fieldHtml(f, item)).join("")}</div>`;
  $("#modal").hidden = false;
  $("#modalForm").querySelector("input, textarea")?.focus();
}

function closeModal() {
  $("#modal").hidden = true;
  modalCtx = null;
}

function collectModal() {
  const { item } = modalCtx;
  $$("[data-field]", $("#modalForm")).forEach((el) => {
    const key = el.dataset.field;
    const loc = el.dataset.locale;
    if (loc) {
      if (typeof item[key] !== "object" || item[key] === null) item[key] = { tr: "", en: "" };
      item[key][loc] = el.value;
    } else {
      item[key] = el.value;
    }
  });
  return item;
}

async function saveModal() {
  const { type, id, isNew } = modalCtx;
  const item = collectModal();
  const btn = $("#modalSave");
  btn.disabled = true;

  try {
    await run(
      () => isNew ? api("POST", `/${type}`, item) : api("PUT", `/${type}/${id}`, item),
      `${SCHEMAS[type].single} ${isNew ? "eklendi" : "güncellendi"}.`
    );
    closeModal();
    await loadAll();
    render();
  } catch {
    // hata mesajı run() içinde gösterildi
  } finally {
    btn.disabled = false;
  }
}

/* ----------------------------- olaylar ---------------------------- */

function switchPanel(name) {
  $$(".nav-item").forEach((b) => b.classList.toggle("is-active", b.dataset.panel === name));
  $$(".panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  const [title, desc] = PANEL_META[name];
  $("#panelTitle").textContent = title;
  $("#panelDesc").textContent = desc;
  window.scrollTo({ top: 0 });
}

// Metin/ayar alanları yazarken değil, odaktan çıkınca kaydedilir.
let saveTimer = null;
function scheduleSave(kind) {
  clearTimeout(saveTimer);
  $("#savingDot").hidden = false;
  saveTimer = setTimeout(async () => {
    try {
      if (kind === "texts") await api("PUT", "/texts", data.texts);
      else await api("PUT", "/settings", data.settings);
      $("#savingDot").hidden = true;
      toast("Kaydedildi.");
    } catch (err) {
      $("#savingDot").hidden = true;
      if (err.status !== 401) toast(err.message, true);
    }
  }, 700);
}

function bindEvents() {
  $$(".nav-item").forEach((btn) => btn.addEventListener("click", () => switchPanel(btn.dataset.panel)));

  $("#btnLogout").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);
    token = null;
    location.reload();
  });

  $("#btnRefresh").addEventListener("click", async () => {
    await run(async () => { await loadAll(); await loadMessages(); render(); }, "Yenilendi.");
  });

  $$("[data-add]").forEach((btn) => btn.addEventListener("click", () => openModal(btn.dataset.add, null)));

  $$(".list").forEach((list) => {
    list.addEventListener("click", async (e) => {
      const row = e.target.closest(".item");
      if (!row) return;
      const type = list.dataset.type;
      const id = row.dataset.id;
      const arr = data[type];
      const i = arr.findIndex((x) => x.id === id);
      if (i === -1) return;

      if (e.target.closest("[data-edit]")) return openModal(type, id);

      if (e.target.closest("[data-delete]")) {
        if (!confirm(`"${itemMeta(type, arr[i]).title}" silinecek. Emin misin?`)) return;
        await run(() => api("DELETE", `/${type}/${id}`), "Silindi.");
        await loadAll();
        render();
        return;
      }

      const move = e.target.closest("[data-move]")?.dataset.move;
      if (move) {
        const j = move === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        renderList(type);
        await run(() => api("POST", `/${type}/reorder`, { ids: arr.map((x) => x.id) }), "Sıralama kaydedildi.");
      }
    });
  });

  $("#textsForm").addEventListener("input", (e) => {
    const key = e.target.dataset.text;
    if (!key) return;
    if (!data.texts[key]) data.texts[key] = { tr: "", en: "" };
    data.texts[key][e.target.dataset.locale] = e.target.value;
    scheduleSave("texts");
  });

  $("#settingsForm").addEventListener("input", (e) => {
    const path = e.target.dataset.setting;
    if (!path) return;
    const parts = path.split(".");
    let ref = data.settings;
    while (parts.length > 1) {
      const p = parts.shift();
      if (typeof ref[p] !== "object" || ref[p] === null) ref[p] = {};
      ref = ref[p];
    }
    ref[parts[0]] = e.target.value;
    scheduleSave("settings");
  });

  $("#heroImages").addEventListener("click", async (e) => {
    const idx = e.target.dataset.heroRemove;
    if (idx === undefined) return;
    data.settings.heroImages.splice(Number(idx), 1);
    renderHeroImages();
    await run(() => api("PUT", "/settings", data.settings), "Görsel kaldırıldı.");
  });

  $("#heroUpload").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    toast(`${files.length} görsel yükleniyor…`);
    if (!Array.isArray(data.settings.heroImages)) data.settings.heroImages = [];

    for (const file of files) {
      try {
        data.settings.heroImages.push(await uploadFile(file));
      } catch (err) {
        toast(`"${file.name}": ${err.message}`, true);
      }
    }
    renderHeroImages();
    await run(() => api("PUT", "/settings", data.settings), "Arka plan görselleri kaydedildi.");
  });

  $("#heroAddPath").addEventListener("click", async () => {
    const p = prompt("Görsel dosya yolu (ör. image/70.jpeg):");
    if (!p?.trim()) return;
    if (!Array.isArray(data.settings.heroImages)) data.settings.heroImages = [];
    data.settings.heroImages.push(p.trim());
    renderHeroImages();
    await run(() => api("PUT", "/settings", data.settings), "Eklendi.");
  });

  // Modal
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);
  $("#modalSave").addEventListener("click", saveModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal").hidden) closeModal();
  });

  $("#modalForm").addEventListener("change", async (e) => {
    const key = e.target.dataset.upload;
    if (!key) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    toast("Görsel yükleniyor…");
    try {
      const p = await uploadFile(file);
      $(`[data-field="${key}"]`, $("#modalForm")).value = p;
      $(`#imgPreview_${key}`).src = p;
      toast("Görsel yüklendi.");
    } catch (err) {
      toast(err.message, true);
    }
  });

  $("#modalForm").addEventListener("input", (e) => {
    const key = e.target.dataset.field;
    const preview = key && $(`#imgPreview_${key}`);
    if (preview) preview.src = e.target.value;
  });

  // Mesajlar
  $("#listMessages").addEventListener("click", async (e) => {
    const id = e.target.dataset.msgDelete;
    if (!id) return;
    if (!confirm("Mesaj silinecek. Emin misin?")) return;
    await run(() => api("DELETE", `/messages/${id}`), "Mesaj silindi.");
    await loadMessages();
    render();
  });

  // Hesap
  $("#passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = $("#curPass").value;
    const newPassword = $("#newPass").value;
    if (newPassword !== $("#newPass2").value) return toast("Yeni şifreler eşleşmiyor.", true);

    try {
      await run(() => api("POST", "/auth/password", { currentPassword, newPassword }), "Şifre değiştirildi.");
      e.target.reset();
    } catch { /* mesaj gösterildi */ }
  });

  $("#btnExport").addEventListener("click", async () => {
    try {
      const content = await api("GET", "/export");
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "data.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("data.json indirildi.");
    } catch { /* mesaj gösterildi */ }
  });
}

/* ------------------------------ giriş ----------------------------- */

function showLogin(message) {
  $("#adminApp").hidden = true;
  $("#loginScreen").hidden = false;
  const err = $("#loginError");
  if (message) { err.textContent = message; err.hidden = false; }
}

async function startApp() {
  $("#loginScreen").hidden = true;
  $("#adminApp").hidden = false;

  await loadAll();
  await loadMessages();
  render();
  bindEvents();
  switchPanel("dashboard");
}

async function boot() {
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginSubmit");
    btn.disabled = true;
    $("#loginError").hidden = true;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: $("#loginUser").value, password: $("#loginPass").value })
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        $("#loginError").textContent = payload?.error || "Giriş başarısız.";
        $("#loginError").hidden = false;
        $("#loginPass").value = "";
        return;
      }

      token = payload.token;
      sessionStorage.setItem(TOKEN_KEY, token);
      await startApp();
    } catch {
      $("#loginError").textContent = "Sunucuya ulaşılamadı. Sunucunun çalıştığından emin olun.";
      $("#loginError").hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  // Kayıtlı token varsa doğrudan devam et.
  if (token) {
    try {
      await api("GET", "/auth/me");
      await startApp();
    } catch {
      showLogin();
    }
  }
}

boot();
