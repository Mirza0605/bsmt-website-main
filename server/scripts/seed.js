"use strict";

/* Kok dizindeki data.json icerigini MySQL'e aktarir ve yonetici hesabini olusturur.
   Tekrar calistirilabilir: ayni id'ler guncellenir, veri cogalmaz.
   Kullanim: npm run seed */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool, query } = require("../db");
const C = require("../content");

const DATA_FILE = path.resolve(__dirname, "..", "..", "data.json");

async function upsert(table, id, row, sortOrder) {
  const full = { ...row, id, sort_order: sortOrder };
  const cols = Object.keys(full);
  await query(
    `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")})
     VALUES (${cols.map(() => "?").join(", ")})
     ON DUPLICATE KEY UPDATE ${cols.filter((c) => c !== "id").map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(", ")}`,
    cols.map((c) => full[c])
  );
}

async function seedAdmin() {
  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.warn("! ADMIN_PASSWORD tanımlı değil — yönetici hesabı oluşturulmadı.");
    console.warn("  server/.env içine ADMIN_PASSWORD ekleyip tekrar çalıştırın.");
    return;
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD en az 8 karakter olmalı.");
  }

  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO admin_users (username, password_hash, display_name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [username, hash, process.env.ADMIN_NAME || "BSMT Yönetim"]
  );
  console.log(`✓ Yönetici hesabı hazır: ${username}`);
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`data.json bulunamadı: ${DATA_FILE}`);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  for (const [key, val] of Object.entries(data.settings || {})) {
    await query(
      `INSERT INTO settings (skey, sval) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE sval = VALUES(sval)`,
      [key, JSON.stringify(val)]
    );
  }
  console.log(`✓ Ayarlar: ${Object.keys(data.settings || {}).length} kayıt`);

  for (const [key, val] of Object.entries(data.texts || {})) {
    await query(
      `INSERT INTO texts (tkey, tr, en) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE tr = VALUES(tr), en = VALUES(en)`,
      [key, val?.tr || "", val?.en || ""]
    );
  }
  console.log(`✓ Metinler: ${Object.keys(data.texts || {}).length} kayıt`);

  const events = data.events || [];
  for (let i = 0; i < events.length; i++) {
    await upsert("events", events[i].id, C.eventToRow(events[i]), i);
  }
  console.log(`✓ Etkinlikler: ${events.length} kayıt`);

  const team = data.team || [];
  for (let i = 0; i < team.length; i++) {
    await upsert("team", team[i].id, C.teamToRow(team[i]), i);
  }
  console.log(`✓ Ekip: ${team.length} kayıt`);

  const faq = data.faq || [];
  for (let i = 0; i < faq.length; i++) {
    await upsert("faq", faq[i].id, C.faqToRow(faq[i]), i);
  }
  console.log(`✓ S.S.S.: ${faq.length} kayıt`);

  await seedAdmin();

  await pool.end();
  console.log("\n✓ Aktarım tamam. Başlatmak için: npm start");
}

main().catch(async (err) => {
  console.error("✗ Seed başarısız:", err.code || err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
