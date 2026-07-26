-- BSMT icerik veritabani semasi
-- Calistirmak icin: npm run migrate  (ya da: mysql -u root -p < schema.sql)

CREATE DATABASE IF NOT EXISTS bsmt
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bsmt;

-- Yonetici hesaplari (sifreler bcrypt ile hashlenir, duz metin tutulmaz)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(120) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP    NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Genel ayarlar: deger JSON metni olarak tutulur (string, nesne ya da dizi)
CREATE TABLE IF NOT EXISTS settings (
  skey       VARCHAR(64) PRIMARY KEY,
  sval       TEXT        NOT NULL,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site metinleri (bolum basliklari, paragraflar)
CREATE TABLE IF NOT EXISTS texts (
  tkey       VARCHAR(64) PRIMARY KEY,
  tr         TEXT        NULL,
  en         TEXT        NULL,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id         VARCHAR(64) PRIMARY KEY,
  title_tr   VARCHAR(255) NOT NULL DEFAULT '',
  title_en   VARCHAR(255) NOT NULL DEFAULT '',
  type_tr    VARCHAR(120) NOT NULL DEFAULT '',
  type_en    VARCHAR(120) NOT NULL DEFAULT '',
  event_date DATE         NULL,
  event_time VARCHAR(10)  NOT NULL DEFAULT '',
  place_tr   VARCHAR(255) NOT NULL DEFAULT '',
  place_en   VARCHAR(255) NOT NULL DEFAULT '',
  desc_tr    TEXT         NULL,
  desc_en    TEXT         NULL,
  image      TEXT         NULL,
  link       VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date),
  INDEX idx_events_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team (
  id         VARCHAR(64) PRIMARY KEY,
  name       VARCHAR(160) NOT NULL DEFAULT '',
  role_tr    VARCHAR(160) NOT NULL DEFAULT '',
  role_en    VARCHAR(160) NOT NULL DEFAULT '',
  photo      TEXT         NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_team_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq (
  id         VARCHAR(64) PRIMARY KEY,
  q_tr       TEXT NULL,
  q_en       TEXT NULL,
  a_tr       TEXT NULL,
  a_en       TEXT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_faq_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Iletisim formundan gelen mesajlar (opsiyonel; site formu buraya da yazabilir)
CREATE TABLE IF NOT EXISTS messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(160) NOT NULL DEFAULT '',
  email      VARCHAR(200) NOT NULL DEFAULT '',
  department VARCHAR(160) NOT NULL DEFAULT '',
  class_year VARCHAR(32)  NOT NULL DEFAULT '',
  message    TEXT         NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
