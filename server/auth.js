"use strict";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { query } = require("./db");

const SECRET = process.env.JWT_SECRET || "";
const EXPIRES_IN = process.env.JWT_EXPIRES || "8h";

if (!SECRET) {
  console.error("HATA: JWT_SECRET tanimli degil. server/.env dosyasini olusturun.");
  process.exit(1);
}

async function verifyCredentials(username, password) {
  const rows = await query(
    "SELECT id, username, password_hash, display_name FROM admin_users WHERE username = ? LIMIT 1",
    [username]
  );
  if (!rows.length) return null;

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;

  await query("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [user.id]);
  return { id: user.id, username: user.username, displayName: user.display_name };
}

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, name: user.displayName },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

// Yazma islemlerini koruyan middleware.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Oturum gerekli." });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Oturum süresi doldu, tekrar giriş yapın." });
  }
}

const hashPassword = (plain) => bcrypt.hash(plain, 12);

module.exports = { verifyCredentials, issueToken, requireAuth, hashPassword };
