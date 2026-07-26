/* ---------------------------------------------------------------
   BSMT — genel site betiği

   İçerik MySQL'de tutulur, admin.html üzerinden yönetilir.
   Yükleme sırası:
     1) /api/content  — MySQL destekli canlı içerik
     2) data.json     — sunucusuz (statik) yayın için dışa aktarılmış kopya
     3) FALLBACK      — hiçbiri okunamazsa site yine de açılsın diye
   --------------------------------------------------------------- */

// Hiçbir kaynak okunamazsa (ör. file:// protokolü) devreye girer.
const FALLBACK = {
  settings: {
    brand: { tr: "BİLİŞİM SİSTEMLERİ MÜHENDİSLİĞİ TOPLULUĞU", en: "INFORMATION SYSTEMS ENGINEERING COMMUNITY" },
    heroTitle: { tr: "BİLİŞİM SİSTEMLERİ MÜHENDİSLİĞİ TOPLULUĞU", en: "INFORMATION SYSTEMS ENGINEERING COMMUNITY" },
    contactEmail: "bsmt@sakarya.edu.tr",
    links: {
      sabis: "https://sabis.sakarya.edu.tr/",
      whatsapp: "https://chat.whatsapp.com/Ltrsb86Mns03nwCVO3CJ9i",
      instagram: "https://www.instagram.com/saubsmt/",
      linkedin: "https://www.linkedin.com/in/bsmt/"
    },
    heroImages: ["image/100.jpg", "image/75.jpeg", "image/80.jpeg", "image/85.jpeg", "image/90.jpeg", "image/95.jpeg", "image/105.jpeg"]
  },
  texts: {},
  events: [],
  team: [],
  faq: []
};

// Yalnızca arayüz metinleri (panelden yönetilmiyor). data.texts bunları ezebilir.
const UI = {
  pageTitle: {
    tr: "BSMT — Sakarya Üniversitesi Bilişim Sistemleri Mühendisliği Topluluğu",
    en: "BSMT — Sakarya University Information Systems Engineering Community"
  },
  skipLink: { tr: "İçeriğe geç", en: "Skip to content" },
  logoAlt: {
    tr: "Bilişim Sistemleri Mühendisliği Topluluğu Logosu",
    en: "Information Systems Engineering Community Logo"
  },
  menuAria: { tr: "Menü", en: "Menu" },
  brandName: { tr: "BİLİŞİM SİSTEMLERİ MÜHENDİSLİĞİ TOPLULUĞU", en: "INFORMATION SYSTEMS ENGINEERING COMMUNITY" },
  heroTitle: { tr: "BİLİŞİM SİSTEMLERİ MÜHENDİSLİĞİ TOPLULUĞU", en: "INFORMATION SYSTEMS ENGINEERING COMMUNITY" },
  navAbout: { tr: "Hakkımızda", en: "About" },
  navEvents: { tr: "Etkinlikler", en: "Events" },
  navTeam: { tr: "Ekip", en: "Team" },
  navFaq: { tr: "SSS", en: "FAQ" },
  navContact: { tr: "İletişim", en: "Contact" },
  navJoin: { tr: "Üye Ol", en: "Join Us" },
  langSwitchAria: { tr: "Dil seçimi", en: "Language selection" },

  aboutWhatTitle: { tr: "Bilişim Sistemleri Mühendisliği Nedir?", en: "What is Information Systems Engineering?" },
  aboutWhoTitle: { tr: "Biz Kimiz?", en: "Who Are We?" },
  missionTitle: { tr: "Misyonumuz", en: "Our Mission" },
  visionTitle: { tr: "Vizyonumuz", en: "Our Vision" },
  joinTitle: { tr: "Kulübe Üye Ol", en: "Join the Club" },
  pastEventsTitle: { tr: "Geçmiş Etkinlikler", en: "Past Events" },
  teamSectionTitle: { tr: "Yönetim Ekibimiz", en: "Our Management Team" },
  faqTitle: { tr: "Sıkça Sorulan Sorular", en: "Frequently Asked Questions" },
  contactTitle: { tr: "Fikirlerinizi bizimle paylaşabilirsiniz", en: "Share your thoughts with us" },

  prevEventAria: { tr: "Önceki etkinlik", en: "Previous event" },
  nextEventAria: { tr: "Sonraki etkinlik", en: "Next event" },
  teamPrevAria: { tr: "Geri", en: "Previous" },
  teamNextAria: { tr: "İleri", en: "Next" },

  iframeTitle: { tr: "Form gönderim çerçevesi", en: "Form submission frame" },
  formNameLabel: { tr: "Ad Soyad", en: "Full Name" },
  formEmailLabel: { tr: "E-posta", en: "Email" },
  formDeptLabel: { tr: "Bölümünüz", en: "Department" },
  formClassLabel: { tr: "Sınıf", en: "Class Year" },
  formClassPrep: { tr: "Hazırlık", en: "Preparatory" },
  formMessageLabel: { tr: "Mesaj", en: "Message" },
  formSubmit: { tr: "Gönder", en: "Send" },
  formSending: { tr: "Gönderiliyor…", en: "Sending…" },
  formSent: { tr: "Teşekkürler! Mesajınız bize ulaştı.", en: "Thank you! Your message has reached us." },

  footerOrg: { tr: "Bilişim Sistemleri Mühendisliği Topluluğu", en: "Information Systems Engineering Community" },

  eventsEmpty: {
    tr: "Şu anda planlanmış bir etkinlik yok. Yakında duyuracağız.",
    en: "There are no events scheduled right now. Stay tuned!"
  },
  nextEventBadgeEmpty: { tr: "📌 Yaklaşan Etkinlik", en: "📌 Upcoming Event" },
  registerDetail: { tr: "Kayıt / Detay", en: "Register / Details" },
  countdownDays: { tr: "Gün", en: "Days" },
  countdownHours: { tr: "Saat", en: "Hours" },
  countdownMinutes: { tr: "Dakika", en: "Minutes" },
  countdownSeconds: { tr: "Saniye", en: "Seconds" },
  eventStartingNow: { tr: "Etkinlik şu anda başlıyor!", en: "The event is starting now!" },

  lightboxAria: { tr: "Etkinlik fotoğrafı", en: "Event photo" },
  lightboxCloseAria: { tr: "Kapat", en: "Close" }
};

/* --------------------------------------------------------------- */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lang = localStorage.getItem("bsmt-lang") === "en" ? "en" : "tr";
let data = FALLBACK;
let countdownTimer = null;

// Metin çözümleme: önce panelden yönetilen data.texts, sonra sabit UI sözlüğü.
function t(key) {
  const fromData = data.texts && data.texts[key];
  if (fromData && fromData[lang]) return fromData[lang];
  return UI[key] ? UI[key][lang] : key;
}

// {tr, en} biçimindeki alanlardan aktif dildekini al.
function L(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field.tr || field.en || "";
}

const AVATAR_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23142033'/%3E%3Ccircle cx='50' cy='38' r='16' fill='%232B3B55'/%3E%3Cpath d='M18 92c0-18 14-30 32-30s32 12 32 30z' fill='%232B3B55'/%3E%3C/svg%3E";

const COVER_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23142033'/%3E%3Cpath d='M0 72l42-30 30 21 26-25 62 44z' fill='%232B3B55'/%3E%3Ccircle cx='120' cy='24' r='11' fill='%232B3B55'/%3E%3C/svg%3E";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const tsOf = (d) => new Date(d + "T00:00:00").getTime();

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00")
    .toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function startOfTodayTs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* ---------------------------- veri ----------------------------- */

function normalize(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  return {
    settings: { ...FALLBACK.settings, ...(d.settings || {}), links: { ...FALLBACK.settings.links, ...((d.settings || {}).links || {}) } },
    texts: d.texts || {},
    events: Array.isArray(d.events) ? d.events : [],
    team: Array.isArray(d.team) ? d.team : [],
    faq: Array.isArray(d.faq) ? d.faq : []
  };
}

async function loadData() {
  // 1) MySQL destekli API (sunucu çalışıyorsa canlı içerik buradan gelir)
  try {
    const res = await fetch("/api/content", { cache: "no-store" });
    if (res.ok) {
      data = normalize(await res.json());
      return;
    }
  } catch {
    // Sunucu yok — statik yayın olabilir, aşağıdaki yedeklere düş.
  }

  // 2) Statik yayın için dışa aktarılmış data.json
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (res.ok) {
      data = normalize(await res.json());
      return;
    }
  } catch {
    // yoksay
  }

  // 3) file:// ile açıldıysa veya hiçbiri okunamadıysa site boş görünmesin.
  data = FALLBACK;
}

/* --------------------------- render ---------------------------- */

function applyImageFallbacks(root) {
  root.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "1";
      img.src = img.dataset.fallback === "cover" ? COVER_FALLBACK : AVATAR_FALLBACK;
    });
    if (img.complete && img.naturalWidth === 0) {
      img.dispatchEvent(new Event("error"));
    }
  });
}

function renderEventCards(list, target) {
  if (!target) return;

  if (!list.length) {
    target.innerHTML = `<p class="muted">${t("eventsEmpty")}</p>`;
    return;
  }

  const todayTs = startOfTodayTs();

  target.innerHTML = list.map((e) => {
    const title = L(e.title);
    const dateLabel = e.time ? `${formatDate(e.date)} • ${escapeHtml(e.time)}` : formatDate(e.date);
    const badgeClass = tsOf(e.date) >= todayTs ? "badge badge-upcoming" : "badge";

    return `
      <article class="card event-card">
        ${e.image ? `<img class="event-photo" src="${escapeHtml(e.image)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" data-fallback="cover" role="button" tabindex="0">` : ""}
        <span class="${badgeClass}">${escapeHtml(L(e.type))}</span>
        <h3>${escapeHtml(title)}</h3>
        ${L(e.desc) ? `<p>${escapeHtml(L(e.desc))}</p>` : ""}
        <div class="meta">
          <span class="pill">📅 ${dateLabel}</span>
          <span class="pill">📍 ${escapeHtml(L(e.place))}</span>
          ${e.link ? `<a class="pill" href="${escapeHtml(e.link)}" target="_blank" rel="noopener noreferrer">${t("registerDetail")}</a>` : ""}
        </div>
      </article>
    `;
  }).join("");

  applyImageFallbacks(target);
}

function renderTeam(target) {
  if (!target) return;

  if (!data.team.length) {
    target.innerHTML = "";
    return;
  }

  target.innerHTML = data.team.map((m) => {
    const role = L(m.role);
    return `
    <article class="card team-card">
      <img class="team-photo" src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name || role)}" loading="lazy" decoding="async" data-fallback="avatar">
      <h3>${escapeHtml(m.name)}</h3>
      <p class="muted">${escapeHtml(role)}</p>
    </article>
  `;
  }).join("");

  applyImageFallbacks(target);
}

function renderFAQ(target) {
  if (!target) return;

  target.innerHTML = data.faq.map((item) => `
    <div class="faq-item card">
      <button class="faq-question" type="button" aria-expanded="false">
        <span>${escapeHtml(L(item.q))}</span>
        <span class="faq-icon" aria-hidden="true">+</span>
      </button>
      <div class="faq-answer">
        <p>${escapeHtml(L(item.a))}</p>
      </div>
    </div>
  `).join("");
}

function renderNextEvent(upcoming) {
  const card = $("#nextEventCard");
  if (!card) return;

  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (!upcoming.length) {
    card.innerHTML = `
      <span class="badge badge-upcoming">${t("nextEventBadgeEmpty")}</span>
      <p class="muted" style="margin-top:12px">${t("eventsEmpty")}</p>
    `;
    return;
  }

  const next = upcoming[0];
  const target = new Date(`${next.date}T${next.time || "00:00"}:00`).getTime();

  card.innerHTML = `
    <span class="badge badge-upcoming">📌 ${escapeHtml(L(next.type))}</span>
    <h3 class="next-event-title">${escapeHtml(L(next.title))}</h3>
    <div class="countdown" id="nextEventCountdown"></div>
    <div class="meta">
      <span class="pill">📅 ${formatDate(next.date)}${next.time ? " • " + escapeHtml(next.time) : ""}</span>
      <span class="pill">📍 ${escapeHtml(L(next.place))}</span>
    </div>
    ${L(next.desc) ? `<p>${escapeHtml(L(next.desc))}</p>` : ""}
    ${next.link ? `<a class="btn btn-small" href="${escapeHtml(next.link)}" target="_blank" rel="noopener noreferrer">${t("registerDetail")}</a>` : ""}
  `;

  const countdownEl = $("#nextEventCountdown");

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      countdownEl.innerHTML = `<p class="countdown-live">${t("eventStartingNow")}</p>`;
      window.clearInterval(countdownTimer);
      countdownTimer = null;
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");

    countdownEl.innerHTML = `
      <div class="countdown-item"><span class="countdown-num">${days}</span><span class="countdown-label">${t("countdownDays")}</span></div>
      <div class="countdown-item"><span class="countdown-num">${pad(hours)}</span><span class="countdown-label">${t("countdownHours")}</span></div>
      <div class="countdown-item"><span class="countdown-num">${pad(minutes)}</span><span class="countdown-label">${t("countdownMinutes")}</span></div>
      <div class="countdown-item"><span class="countdown-num">${pad(seconds)}</span><span class="countdown-label">${t("countdownSeconds")}</span></div>
    `;
  }

  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function splitEvents() {
  const todayTs = startOfTodayTs();
  const upcoming = [];
  const past = [];

  for (const e of data.events) {
    if (!e.date) continue;
    (tsOf(e.date) >= todayTs ? upcoming : past).push(e);
  }

  upcoming.sort((a, b) => tsOf(a.date) - tsOf(b.date));
  past.sort((a, b) => tsOf(b.date) - tsOf(a.date));

  return { upcoming, past };
}

/* -------------------------- davranış --------------------------- */

function setupSlider(trackSel, prevSel, nextSel, cardSel, fallbackWidth) {
  const track = $(trackSel);
  const prev = $(prevSel);
  const next = $(nextSel);
  if (!track || !prev || !next) return;

  const scrollAmount = () => {
    const first = track.querySelector(cardSel);
    return first ? first.getBoundingClientRect().width + 14 : fallbackWidth;
  };

  const syncButtons = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    const scrollable = maxScroll > 1;
    prev.disabled = !scrollable || track.scrollLeft <= 1;
    next.disabled = !scrollable || track.scrollLeft >= maxScroll - 1;
  };

  const behavior = prefersReducedMotion ? "auto" : "smooth";
  prev.addEventListener("click", () => track.scrollBy({ left: -scrollAmount(), behavior }));
  next.addEventListener("click", () => track.scrollBy({ left: scrollAmount(), behavior }));

  track.addEventListener("scroll", syncButtons, { passive: true });
  window.addEventListener("resize", syncButtons);
  syncButtons();
}

function setupMenu() {
  const btn = $("#menuBtn");
  const nav = $("#nav");
  if (!btn || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
  };

  btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));

  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

// SSS içeriği dinamik üretildiği için her render sonrası yeniden bağlanır.
function setupFAQ() {
  const faqItems = $$(".faq-item");

  const close = (item) => {
    item.classList.remove("active");
    item.querySelector(".faq-answer").style.maxHeight = null;
    item.querySelector(".faq-question").setAttribute("aria-expanded", "false");
  };

  const open = (item) => {
    const answer = item.querySelector(".faq-answer");
    item.classList.add("active");
    answer.style.maxHeight = answer.scrollHeight + "px";
    item.querySelector(".faq-question").setAttribute("aria-expanded", "true");
  };

  faqItems.forEach((item) => {
    item.querySelector(".faq-question").addEventListener("click", () => {
      const isOpen = item.classList.contains("active");
      faqItems.forEach(close);
      if (!isOpen) open(item);
    });
  });
}

function setupFAQResize() {
  window.addEventListener("resize", () => {
    $$(".faq-item.active").forEach((item) => {
      const answer = item.querySelector(".faq-answer");
      answer.style.maxHeight = answer.scrollHeight + "px";
    });
  });
}

function setupContactForm() {
  const form = $("#contactForm");
  const status = $("#formStatus");
  if (!form || !status) return;

  form.addEventListener("submit", () => {
    status.textContent = t("formSending");

    // Formsubmit e-posta gönderimi gizli iframe üzerinden devam eder;
    // sunucu varsa mesajın bir kopyası veritabanına da düşer.
    const fd = new FormData(form);
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("Ad Soyad") || "",
        email: fd.get("E-posta") || "",
        department: fd.get("Bölüm") || "",
        classYear: fd.get("Sınıf") || "",
        message: fd.get("Mesaj") || ""
      })
    }).catch(() => { /* sunucusuz yayında sessizce atlanır */ });

    window.setTimeout(() => {
      status.textContent = t("formSent");
      form.reset();
    }, 1200);
  });
}

function setupHeroBackground() {
  const layers = $$(".hero-bg");
  const bgImages = data.settings.heroImages || [];
  if (!layers.length || !bgImages.length) return;

  const show = (index) => {
    const layer = layers[index % layers.length];
    layer.style.backgroundImage = `url("${bgImages[index % bgImages.length]}")`;
    layers.forEach((l) => l.classList.toggle("is-active", l === layer));
  };

  show(0);
  if (bgImages.length < 2 || prefersReducedMotion || layers.length < 2) return;

  let index = 0;
  let timer = null;

  const preload = (i) => {
    const img = new Image();
    img.src = bgImages[i % bgImages.length];
  };
  preload(1);

  const advance = () => {
    index += 1;
    show(index);
    preload(index + 1);
  };

  const start = () => {
    if (timer === null) timer = window.setInterval(advance, 6000);
  };
  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });
  start();
}

/* -------------------------- lightbox --------------------------- */

let lightboxLastFocused = null;

function openLightbox(src, alt) {
  const lightbox = $("#lightbox");
  const img = $("#lightboxImg");
  if (!lightbox || !img || !src) return;

  img.src = src;
  img.alt = alt || "";
  lightboxLastFocused = document.activeElement;

  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  requestAnimationFrame(() => lightbox.classList.add("is-open"));
  $("#lightboxClose").focus();
}

function closeLightbox() {
  const lightbox = $("#lightbox");
  if (!lightbox || lightbox.hidden) return;

  lightbox.classList.remove("is-open");
  document.body.classList.remove("lightbox-open");

  window.setTimeout(() => {
    lightbox.hidden = true;
    $("#lightboxImg").src = "";
  }, prefersReducedMotion ? 0 : 200);

  if (lightboxLastFocused) lightboxLastFocused.focus();
}

function setupLightbox() {
  const lightbox = $("#lightbox");
  const closeBtn = $("#lightboxClose");
  if (!lightbox || !closeBtn) return;

  document.addEventListener("click", (e) => {
    const photo = e.target.closest(".event-photo");
    if (photo) openLightbox(photo.currentSrc || photo.src, photo.alt);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const photo = e.target.closest?.(".event-photo");
    if (!photo) return;
    e.preventDefault();
    openLightbox(photo.currentSrc || photo.src, photo.alt);
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
}

/* ---------------------- dil / içerik uygula --------------------- */

function applyDynamicLinks() {
  const links = data.settings.links || {};

  $$("[data-link]").forEach((el) => {
    const url = links[el.dataset.link];
    if (url) el.href = url;
  });

  const form = $("#contactForm");
  if (form && data.settings.contactEmail) {
    form.action = `https://formsubmit.co/${data.settings.contactEmail}`;
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = lang;

  // Panelden yönetilen marka/hero başlığı UI sözlüğünü ezer.
  const s = data.settings;
  if (s.brand && s.brand[lang]) UI.brandName = { ...UI.brandName, [lang]: s.brand[lang] };
  if (s.heroTitle && s.heroTitle[lang]) UI.heroTitle = { ...UI.heroTitle, [lang]: s.heroTitle[lang] };

  $$("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = t(key);
    if (value !== key) el.textContent = value;
  });

  $$("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((x) => x.trim());
      const value = t(key);
      if (attr && value !== key) el.setAttribute(attr, value);
    });
  });

  $$(".lang-btn").forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function renderDynamicContent() {
  const { upcoming, past } = splitEvents();
  renderEventCards(upcoming, $("#eventsTrack"));
  renderEventCards(past, $("#pastTrack"));
  renderTeam($("#teamTrack"));
  renderFAQ($("#faqContainer"));
  renderNextEvent(upcoming);
  setupFAQ();
}

function setLanguage(next) {
  lang = next === "en" ? "en" : "tr";
  localStorage.setItem("bsmt-lang", lang);
  applyStaticTranslations();
  renderDynamicContent();
}

function setupLangSwitch() {
  $$(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
}

/* ---------------------------------------------------------------- */

async function init() {
  await loadData();

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  applyDynamicLinks();
  applyStaticTranslations();
  renderDynamicContent();

  setupMenu();
  setupFAQResize();
  setupContactForm();
  setupHeroBackground();
  setupLangSwitch();
  setupLightbox();

  setupSlider("#eventsTrack", "#eventsPrev", "#eventsNext", ".event-card", 340);
  setupSlider("#pastTrack", "#pastPrev", "#pastNext", ".event-card", 340);
  setupSlider("#teamTrack", "#teamPrev", "#teamNext", ".team-card", 320);
}

init();
