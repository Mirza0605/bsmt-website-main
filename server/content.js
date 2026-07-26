"use strict";

/* Veritabani satirlarini sitenin bekledigi data.json bicimine cevirir
   ve tersini yapar. Tek kaynak burasi olsun ki rota dosyalari sade kalsin. */

const { query } = require("./db");

const DEFAULT_SETTINGS = {
  brand: { tr: "", en: "" },
  heroTitle: { tr: "", en: "" },
  contactEmail: "",
  links: { sabis: "", whatsapp: "", instagram: "", linkedin: "" },
  heroImages: []
};

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const i18n = (tr, en) => ({ tr: tr || "", en: en || "" });

function eventToApi(r) {
  return {
    id: r.id,
    title: i18n(r.title_tr, r.title_en),
    type: i18n(r.type_tr, r.type_en),
    date: r.event_date || "",
    time: r.event_time || "",
    place: i18n(r.place_tr, r.place_en),
    desc: i18n(r.desc_tr, r.desc_en),
    image: r.image || "",
    link: r.link || ""
  };
}

function eventToRow(e) {
  return {
    title_tr: e.title?.tr || "",
    title_en: e.title?.en || "",
    type_tr: e.type?.tr || "",
    type_en: e.type?.en || "",
    event_date: e.date || null,
    event_time: e.time || "",
    place_tr: e.place?.tr || "",
    place_en: e.place?.en || "",
    desc_tr: e.desc?.tr || "",
    desc_en: e.desc?.en || "",
    image: e.image || "",
    link: e.link || ""
  };
}

const teamToApi = (r) => ({
  id: r.id,
  name: r.name || "",
  role: i18n(r.role_tr, r.role_en),
  photo: r.photo || ""
});

const teamToRow = (m) => ({
  name: m.name || "",
  role_tr: m.role?.tr || "",
  role_en: m.role?.en || "",
  photo: m.photo || ""
});

const faqToApi = (r) => ({
  id: r.id,
  q: i18n(r.q_tr, r.q_en),
  a: i18n(r.a_tr, r.a_en)
});

const faqToRow = (f) => ({
  q_tr: f.q?.tr || "",
  q_en: f.q?.en || "",
  a_tr: f.a?.tr || "",
  a_en: f.a?.en || ""
});

/* --------------------------------------------------------------- */

async function getSettings() {
  const rows = await query("SELECT skey, sval FROM settings");
  const out = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const r of rows) {
    out[r.skey] = parseJson(r.sval, out[r.skey]);
  }
  out.links = { ...DEFAULT_SETTINGS.links, ...(out.links || {}) };
  if (!Array.isArray(out.heroImages)) out.heroImages = [];
  return out;
}

async function getTexts() {
  const rows = await query("SELECT tkey, tr, en FROM texts");
  const out = {};
  for (const r of rows) out[r.tkey] = i18n(r.tr, r.en);
  return out;
}

async function getEvents() {
  const rows = await query("SELECT * FROM events ORDER BY sort_order ASC, event_date DESC");
  return rows.map(eventToApi);
}

async function getTeam() {
  const rows = await query("SELECT * FROM team ORDER BY sort_order ASC");
  return rows.map(teamToApi);
}

async function getFaq() {
  const rows = await query("SELECT * FROM faq ORDER BY sort_order ASC");
  return rows.map(faqToApi);
}

// Sitenin tek seferde cektigi tam icerik paketi.
async function getContent() {
  const [settings, texts, events, team, faq] = await Promise.all([
    getSettings(), getTexts(), getEvents(), getTeam(), getFaq()
  ]);
  return { version: 1, settings, texts, events, team, faq };
}

module.exports = {
  DEFAULT_SETTINGS,
  eventToApi, eventToRow,
  teamToApi, teamToRow,
  faqToApi, faqToRow,
  getSettings, getTexts, getEvents, getTeam, getFaq, getContent
};
