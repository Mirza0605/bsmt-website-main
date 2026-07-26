# BSMT — Sunucu & Veritabanı

Site içeriği (etkinlikler, ekip, S.S.S., metinler, ayarlar) **MySQL**'de tutulur.
Node.js sunucusu hem içerik API'sini sunar hem de statik siteyi servis eder.

## Gereksinimler

- Node.js 18+
- MySQL 8+ (veya MariaDB 10.4+)

## Kurulum

```bash
# 1) MySQL'i kur ve başlat (macOS)
brew install mysql
brew services start mysql

# 2) Bağımlılıklar
cd server
npm install

# 3) Ortam değişkenleri
cp .env.example .env
```

`.env` dosyasını doldur. `JWT_SECRET` için rastgele değer üret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`ADMIN_PASSWORD` panele gireceğin şifredir (en az 8 karakter).

```bash
# 4) Tabloları oluştur + data.json içeriğini aktar + yönetici hesabını kur
npm run setup

# 5) Başlat
npm start
```

- Site: <http://localhost:3000/>
- Panel: <http://localhost:3000/admin.html>

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm start` | Sunucuyu başlatır |
| `npm run dev` | Dosya değişince otomatik yeniden başlatır |
| `npm run migrate` | `schema.sql`'i çalıştırır (tabloları oluşturur) |
| `npm run seed` | `data.json` içeriğini MySQL'e aktarır + yönetici hesabı kurar |
| `npm run setup` | migrate + seed |
| `npm run export` | Veritabanındaki içeriği `data.json`'a yazar (yedek) |

`seed` tekrar çalıştırılabilir: aynı id'ler güncellenir, kayıt çoğalmaz.

## Tablolar

| Tablo | İçerik |
|---|---|
| `admin_users` | Panel hesapları (şifreler bcrypt ile hashlenir) |
| `settings` | Marka adı, linkler, iletişim e-postası, hero görselleri (JSON değer) |
| `texts` | Site metinleri (`tr` / `en` sütunları) |
| `events` | Etkinlikler |
| `team` | Yönetim ekibi |
| `faq` | Sıkça sorulan sorular |
| `messages` | İletişim formundan gelen mesajlar |

## API

**Herkese açık**

| | |
|---|---|
| `GET /api/content` | Sitenin tüm içeriği (tek çağrı) |
| `GET /api/health` | Sunucu + veritabanı durumu |
| `POST /api/messages` | İletişim formu mesajı kaydeder |

**Oturum gerektirir** (`Authorization: Bearer <token>`)

| | |
|---|---|
| `POST /api/auth/login` | Giriş → JWT token |
| `GET /api/auth/me` | Oturum kontrolü |
| `POST /api/auth/password` | Şifre değiştir |
| `GET·POST /api/{events\|team\|faq}` | Listele / ekle |
| `PUT·DELETE /api/{events\|team\|faq}/:id` | Güncelle / sil |
| `POST /api/{events\|team\|faq}/reorder` | Sıralamayı kaydet |
| `GET·PUT /api/texts` | Site metinleri |
| `GET·PUT /api/settings` | Ayarlar |
| `POST /api/upload` | Görsel yükle → `image/uploads/...` |
| `GET·DELETE /api/messages` | Mesajları oku / sil |
| `GET /api/export` | İçeriği `data.json` olarak indir |

## Sunucusuz (statik) yayın

Sunucu çalışmıyorsa site `data.json`'a düşer, yani GitHub Pages gibi statik
barındırmada da çalışır. Bu durumda panel kullanılamaz; içeriği güncellemek için
sunucuyu çalıştırıp `npm run export` ile `data.json`'ı tazeleyip commit et.

`app.js` içerik yükleme sırası: `/api/content` → `data.json` → gömülü yedek.

## Güvenlik notları

- `.env` **asla commit edilmez** (`.gitignore`'da).
- Şifreler bcrypt (cost 12) ile hashlenir, düz metin saklanmaz.
- Tüm SQL sorguları parametrelidir (SQL injection'a kapalı).
- Yükleme: sadece görsel MIME tipleri, en fazla 8 MB, dosya adı temizlenir.
- Canlıda **HTTPS arkasında** çalıştır; token tarayıcıda `sessionStorage`'da tutulur.
- Veritabanı için `root` yerine yalnızca `bsmt` şemasına yetkili ayrı bir kullanıcı aç.
