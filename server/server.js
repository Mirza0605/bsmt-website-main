"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const multer = require("multer");

const db = require("./db");
const routes = require("./routes");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SITE_ROOT = path.resolve(__dirname, "..");

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", async (req, res) => {
  try {
    await db.ping();
    res.json({ ok: true, db: "up" });
  } catch (err) {
    res.status(503).json({ ok: false, db: "down", error: err.code || err.message });
  }
});

app.use("/api", routes);

// Statik site (index.html, admin.html, styles.css, image/ ...)
app.use(express.static(SITE_ROOT, { extensions: ["html"] }));

app.use("/api", (req, res) => res.status(404).json({ error: "Bulunamadı." }));

// Merkezi hata yakalayici — istemciye anlamli Turkce mesaj dondurur.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Dosya çok büyük (en fazla 8 MB)." : "Yükleme hatası.";
    return res.status(400).json({ error: msg });
  }

  if (err?.code === "ER_ACCESS_DENIED_ERROR" || err?.code === "ECONNREFUSED") {
    console.error("Veritabanı bağlantı hatası:", err.code);
    return res.status(503).json({ error: "Veritabanına bağlanılamadı. Sunucu ayarlarını kontrol edin." });
  }

  console.error(err);
  res.status(500).json({ error: err.message || "Sunucu hatası." });
});

async function start() {
  try {
    await db.ping();
    console.log(`✓ MySQL bağlantısı hazır (${db.config.host}:${db.config.port}/${db.config.database})`);
  } catch (err) {
    console.error(`✗ MySQL'e bağlanılamadı: ${err.code || err.message}`);
    console.error("  server/.env dosyasını ve MySQL sunucusunun çalıştığını kontrol edin.");
    console.error("  İlk kurulum için: npm run setup");
  }

  app.listen(PORT, () => {
    console.log(`✓ Site:  http://localhost:${PORT}/`);
    console.log(`✓ Panel: http://localhost:${PORT}/admin.html`);
  });
}

start();
