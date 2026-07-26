"use strict";

require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bsmt",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL || 10),
  queueLimit: 0,
  // DATE alanlarini JS Date'e cevirmeden ham "YYYY-MM-DD" olarak al;
  // saat dilimi kaymasi yuzunden etkinlik tarihleri bir gun kaymasin.
  dateStrings: true
};

const pool = mysql.createPool(config);

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Tek baglanti uzerinde islem (sirali yeniden siralama gibi toplu yazmalar icin)
async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, transaction, ping, config };
