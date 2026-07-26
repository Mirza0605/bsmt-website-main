"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const { query, transaction } = require("./db");
const { verifyCredentials, issueToken, requireAuth, hashPassword } = require("./auth");
const C = require("./content");

const router = express.Router();

/* ---------------------- yardimcilar ---------------------- */

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;

// Async rota hatalarini merkezi hata yakalayiciya tasir.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const TABLES = {
  events: { table: "events", prefix: "ev", toRow: C.eventToRow, toApi: C.eventToApi },
  team: { table: "team", prefix: "tm", toRow: C.teamToRow, toApi: C.teamToApi },
  faq: { table: "faq", prefix: "faq", toRow: C.faqToRow, toApi: C.faqToApi }
};

async function nextSortOrder(table) {
  const rows = await query(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM \`${table}\``);
  return rows[0].n;
}

/* ------------------------ yukleme ------------------------ */

const UPLOAD_DIR = path.resolve(__dirname, "..", "image", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const EXT = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "image/gif": ".gif", "image/svg+xml": ".svg"
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const base = path.basename(file.originalname, path.extname(file.originalname))
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "gorsel";
      cb(null, `${base}-${crypto.randomBytes(4).toString("hex")}${EXT[file.mimetype] || ".jpg"}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error("Sadece görsel dosyaları yüklenebilir."));
    cb(null, true);
  }
});

/* ------------------------- public ------------------------- */

// Sitenin actigi tek uc nokta.
router.get("/content", wrap(async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await C.getContent());
}));

router.post("/messages", wrap(async (req, res) => {
  const b = req.body || {};
  await query(
    "INSERT INTO messages (name, email, department, class_year, message) VALUES (?, ?, ?, ?, ?)",
    [
      String(b.name || "").slice(0, 160),
      String(b.email || "").slice(0, 200),
      String(b.department || "").slice(0, 160),
      String(b.classYear || "").slice(0, 32),
      String(b.message || "")
    ]
  );
  res.status(201).json({ ok: true });
}));

/* -------------------------- auth -------------------------- */

router.post("/auth/login", wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli." });
  }

  const user = await verifyCredentials(username, password);
  if (!user) return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });

  res.json({ token: issueToken(user), user });
}));

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, username: req.user.username, displayName: req.user.name } });
});

router.post("/auth/password", requireAuth, wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Yeni şifre en az 8 karakter olmalı." });
  }

  const ok = await verifyCredentials(req.user.username, currentPassword || "");
  if (!ok) return res.status(401).json({ error: "Mevcut şifre hatalı." });

  await query("UPDATE admin_users SET password_hash = ? WHERE id = ?", [
    await hashPassword(newPassword), req.user.sub
  ]);
  res.json({ ok: true });
}));

/* ------------------- koleksiyon CRUD --------------------- */

function collectionRoutes(name) {
  const cfg = TABLES[name];

  router.get(`/${name}`, requireAuth, wrap(async (req, res) => {
    const order = name === "events" ? "sort_order ASC, event_date DESC" : "sort_order ASC";
    const rows = await query(`SELECT * FROM \`${cfg.table}\` ORDER BY ${order}`);
    res.json(rows.map(cfg.toApi));
  }));

  router.post(`/${name}`, requireAuth, wrap(async (req, res) => {
    const row = cfg.toRow(req.body || {});
    const id = req.body?.id || newId(cfg.prefix);
    row.id = id;
    row.sort_order = await nextSortOrder(cfg.table);

    const cols = Object.keys(row);
    await query(
      `INSERT INTO \`${cfg.table}\` (${cols.map((c) => `\`${c}\``).join(", ")})
       VALUES (${cols.map(() => "?").join(", ")})`,
      cols.map((c) => row[c])
    );

    const [created] = await query(`SELECT * FROM \`${cfg.table}\` WHERE id = ?`, [id]);
    res.status(201).json(cfg.toApi(created));
  }));

  router.put(`/${name}/:id`, requireAuth, wrap(async (req, res) => {
    const row = cfg.toRow(req.body || {});
    const cols = Object.keys(row);
    const result = await query(
      `UPDATE \`${cfg.table}\` SET ${cols.map((c) => `\`${c}\` = ?`).join(", ")} WHERE id = ?`,
      [...cols.map((c) => row[c]), req.params.id]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Kayıt bulunamadı." });

    const [updated] = await query(`SELECT * FROM \`${cfg.table}\` WHERE id = ?`, [req.params.id]);
    res.json(cfg.toApi(updated));
  }));

  router.delete(`/${name}/:id`, requireAuth, wrap(async (req, res) => {
    const result = await query(`DELETE FROM \`${cfg.table}\` WHERE id = ?`, [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Kayıt bulunamadı." });
    res.json({ ok: true });
  }));

  // Govde: { ids: ["id1","id2", ...] } — gonderilen sirayi kaydeder.
  router.post(`/${name}/reorder`, requireAuth, wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ error: "ids dizisi gerekli." });

    await transaction(async (conn) => {
      for (let i = 0; i < ids.length; i++) {
        await conn.execute(`UPDATE \`${cfg.table}\` SET sort_order = ? WHERE id = ?`, [i, ids[i]]);
      }
    });
    res.json({ ok: true });
  }));
}

Object.keys(TABLES).forEach(collectionRoutes);

/* --------------------- metin & ayarlar -------------------- */

router.get("/texts", requireAuth, wrap(async (req, res) => res.json(await C.getTexts())));

router.put("/texts", requireAuth, wrap(async (req, res) => {
  const texts = req.body || {};
  const entries = Object.entries(texts);

  await transaction(async (conn) => {
    for (const [key, val] of entries) {
      await conn.execute(
        `INSERT INTO texts (tkey, tr, en) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE tr = VALUES(tr), en = VALUES(en)`,
        [key, val?.tr || "", val?.en || ""]
      );
    }
  });
  res.json(await C.getTexts());
}));

router.get("/settings", requireAuth, wrap(async (req, res) => res.json(await C.getSettings())));

router.put("/settings", requireAuth, wrap(async (req, res) => {
  const settings = req.body || {};

  await transaction(async (conn) => {
    for (const [key, val] of Object.entries(settings)) {
      await conn.execute(
        `INSERT INTO settings (skey, sval) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE sval = VALUES(sval)`,
        [key, JSON.stringify(val)]
      );
    }
  });
  res.json(await C.getSettings());
}));

/* -------------------------- diger ------------------------- */

router.post("/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Dosya alınamadı." });
  // Sitedeki goreli yollarla uyumlu olmasi icin image/uploads/... donuyoruz.
  res.status(201).json({ path: `image/uploads/${req.file.filename}` });
});

router.get("/messages", requireAuth, wrap(async (req, res) => {
  res.json(await query("SELECT * FROM messages ORDER BY created_at DESC LIMIT 200"));
}));

router.delete("/messages/:id", requireAuth, wrap(async (req, res) => {
  await query("DELETE FROM messages WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

// Yedek amacli: veritabanindaki icerigi data.json bicimide indir.
router.get("/export", requireAuth, wrap(async (req, res) => {
  res.set("Content-Disposition", 'attachment; filename="data.json"');
  res.json(await C.getContent());
}));

module.exports = router;
