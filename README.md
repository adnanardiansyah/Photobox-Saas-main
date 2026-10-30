# SnapNext ? SaaS Photo Booth

Aplikasi photobox berbasis Next.js **14.1**, React 18, TypeScript, Tailwind, Zustand, Prisma, dan PostgreSQL/Supabase. File foto menggunakan Supabase Storage; autentikasi admin menggunakan bcrypt dan JWT melalui cookie HttpOnly.

## Menjalankan lokal

1. Install dependency: `npm install`.
2. Salin `.env.example` menjadi `.env.local`, lalu isi koneksi database, Supabase, `NEXT_PUBLIC_APP_URL`, dan `JWT_SECRET` minimal 32 karakter. Generate secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Database baru: `npm run db:push`. Database yang sudah ada tidak memerlukan perubahan schema untuk perbaikan ini. Jangan menjalankan seed demo pada database produksi.
4. Opsional untuk database development kosong: `npm run db:seed`.
5. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

PowerShell dengan execution policy ketat dapat memakai `npm.cmd` sebagai pengganti `npm`.

## Struktur

- `src/app`: halaman publik, `/admin`, `/booth`, `/gallery`, dan API routes.
- `src/components`: komponen landing page, dashboard, dan booth.
- `src/lib`: autentikasi, pemeriksaan izin, database, Zustand, komposisi foto, pembayaran, dan WhatsApp.
- `prisma/schema.prisma`: relasi tenant, outlet, pengguna, sesi foto, transaksi, template, dan voucher.
- `public`: aset statis dan template.
- `tests/security.test.ts`: pengujian regresi keamanan tanpa akses database/gateway nyata.
- `docs/SECURITY_AND_OPERATIONS.md`: konfigurasi, perubahan perilaku, dan batas integrasi.

## Akses dan konfigurasi booth

Login admin di `/admin/login`. OWNER dan SUPER_ADMIN dapat mengelola data dalam tenant akun tersebut; MANAGER memiliki akses baca. STAFF tidak dapat membuka API admin. Tidak ada akses lintas tenant otomatis, termasuk untuk SUPER_ADMIN.

Di menu **Outlets**, atur harga sesi, metode pembayaran, dan opsi cetak. Gunakan **Buat API key** untuk membuat kredensial perangkat. API key ditampilkan sekali dan disimpan sebagai hash SHA-256. Login di `/booth/login` menggunakan Machine ID dan API key tersebut. Key contoh dari seed hanya diterima di development.

Template booth diambil dari database tenant. Harga dasar berasal dari konfigurasi outlet; field harga template belum ditambahkan sebagai biaya tambahan dalam alur booth.

Set `PUBLIC_TENANT_ID` untuk memilih data outlet, testimoni yang disetujui, dan branding halaman publik. Tanpa konfigurasi ini, halaman publik tidak menampilkan data tenant. Nama, warna utama, logo, dan hero banner dapat disimpan dari menu branding; warna sekunder dan tagline saat ini menggunakan nilai default.

## Pembayaran

Alur transaksi nyata menggunakan **Midtrans Core API QRIS**. Isi `MIDTRANS_SERVER_KEY` dan pilih lingkungan melalui `MIDTRANS_IS_PRODUCTION`. Adapter placeholder Doku, Tokopay, dan generator QRIS langsung tidak digunakan untuk transaksi nyata. Petunjuk API: [QRIS](https://docs.midtrans.com/reference/qris) dan [Get Transaction Status](https://docs.midtrans.com/reference/get-transaction-status).

Harga dibaca dari sesi di database. Status lunas hanya ditetapkan setelah server memeriksa referensi, jumlah, mata uang, jenis pembayaran, dan status settlement. Tombol ?Sudah Bayar? memeriksa status tersebut; tombol tidak dapat meloloskan pembayaran sendiri. Gateway yang gagal menghasilkan error, tanpa fallback demo.

Voucher divalidasi per tenant dan ditukarkan dalam transaksi database serializable. Voucher parsial menyisakan tagihan QRIS. Kuota voucher digunakan saat penukaran, termasuk jika pembayaran sisa belum selesai; pelepasan reservasi voucher yang ditinggalkan belum diotomatisasi. Mode event hanya berlaku untuk outlet dengan harga nol.

Untuk development saja, `DEMO_MODE=true` mengaktifkan pembayaran simulasi. Mode demo selalu nonaktif pada build produksi.

## Foto dan printer

Satu sesi server digunakan sejak pembayaran sampai upload dan galeri. Upload hanya menerima gambar JPG/PNG/WebP maksimal 10 MB per file dari perangkat yang berizin. File disimpan pada folder galeri sesi tersebut. Kode galeri baru menggunakan 128 bit acak; kode lama masih bisa dibaca. Galeri yang belum selesai, belum lunas, atau kedaluwarsa tidak tersedia melalui API galeri/download.

Cetak memerlukan printer jaringan **ESC/POS raster** yang dapat dijangkau server Next.js. Isi `PRINTER_HOST`, `PRINTER_PORT`, `PRINTER_PROTOCOL=escpos`, dan `PRINTER_WIDTH_DOTS`. Driver foto Windows, USB, dan printer dye-sub memerlukan adapter tersendiri. Server cloud seperti Vercel tidak otomatis dapat menjangkau printer di LAN booth. Kegagalan koneksi mengembalikan error; tidak ada sukses simulasi. Respons sukses berarti data terkirim ke socket printer, bukan bukti kertas selesai dicetak. Satu cetakan per sesi; pembayaran cetak tambahan dinonaktifkan sampai memiliki alur transaksi terverifikasi.

## Verifikasi

```sh
npm run test:security
npx tsc --noEmit --incremental false
npm run build
```

Skrip pengujian galeri lama di root merupakan utilitas manual dan sebagian dapat menulis database. Jangan jalankan pada produksi untuk pemeriksaan rutin.

## Kredit

Project oleh [@adnanadriansyah](https://github.com/adnanadriansyah).
