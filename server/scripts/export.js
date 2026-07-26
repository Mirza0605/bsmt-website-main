"use strict";

/* Veritabanindaki icerigi kok dizindeki data.json dosyasina yazar.
   Yedek almak veya sunucusuz (statik) yayina donmek icin kullanilir.
   Kullanim: npm run export */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../db");
const { getContent } = require("../content");

const OUT = path.resolve(__dirname, "..", "..", "data.json");

async function main() {
  const content = await getContent();
  fs.writeFileSync(OUT, JSON.stringify(content, null, 2) + "\n", "utf8");

  console.log(`✓ data.json güncellendi (${OUT})`);
  console.log(`  etkinlik: ${content.events.length} · ekip: ${content.team.length} · sss: ${content.faq.length}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("✗ Dışa aktarma başarısız:", err.code || err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
