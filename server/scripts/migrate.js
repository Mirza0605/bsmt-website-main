"use strict";

/* schema.sql dosyasini calistirir. Veritabani yoksa olusturur.
   Kullanim: npm run migrate */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const sql = fs.readFileSync(path.resolve(__dirname, "..", "schema.sql"), "utf8");

  // CREATE DATABASE ifadesi icin once veritabani secmeden baglaniyoruz.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
    charset: "utf8mb4"
  });

  console.log("→ schema.sql çalıştırılıyor…");
  await conn.query(sql);
  await conn.end();

  console.log("✓ Tablolar hazır.");
  console.log("  Sıradaki adım: npm run seed");
}

main().catch((err) => {
  console.error("✗ Migration başarısız:", err.code || err.message);
  if (err.code === "ECONNREFUSED") {
    console.error("  MySQL sunucusu çalışmıyor olabilir.");
  }
  if (err.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("  server/.env içindeki DB_USER / DB_PASSWORD değerlerini kontrol edin.");
  }
  process.exit(1);
});
