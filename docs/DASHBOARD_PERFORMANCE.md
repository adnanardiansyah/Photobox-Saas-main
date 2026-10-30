# Optimasi performa dashboard

Animasi dekoratif berulang, backdrop blur, animasi box-shadow, penghitung angka per frame, dan stagger pada daftar diganti dengan permukaan statis dan transisi CSS singkat. Warna aksen, kartu statistik, sidebar, tema gelap, serta fungsi pengelolaan tetap tersedia.

## Perubahan

- Halaman admin memuat modul pengelolaan melalui dynamic import ketika menu dibuka.
- Overview menampilkan angka langsung tanpa spring atau pembaruan state setiap frame.
- Indikator status tidak lagi berdenyut terus-menerus. Tidak ada Framer Motion pada komponen dashboard dan modul admin.
- Perpindahan menu menggunakan fade opacity 140 ms; dialog menggunakan transisi 160 ms. Preferensi `prefers-reduced-motion` menonaktifkan transisi dan animasi dashboard.
- Langganan Zustand memilih field yang digunakan, sehingga pencarian tidak memicu render ulang overview dan sidebar.
- Snapshot dashboard hanya diminta saat membuka overview, laporan, atau lokasi. Modul lain memakai API datanya sendiri.
- Perhitungan omzet harian memakai batas waktu Jakarta dan di-memoize; formatter mata uang digunakan ulang.
- Margin dari `space-y-*` tidak lagi menggeser overlay dialog dari tepi viewport.

## Hasil pemeriksaan

Perbandingan menggunakan production build lokal, Edge headless, viewport desktop 1440 x 1000, dan fixture 4 outlet serta 80 transaksi. Pengamatan idle berlangsung tiga detik setelah animasi awal selesai.

| Pengukuran | Sebelum | Sesudah |
|---|---:|---:|
| First Load JS `/admin`, laporan Next.js | sekitar 166 KB | sekitar 106 KB |
| Animasi terus-menerus pada overview saat idle | 6 | 0 |
| Recalculation style selama jendela idle tiga detik | 238 | 0 |
| Request snapshot pada alur Dashboard ? Outlets ? Dashboard | 3 | 2 |

Build produksi dan pemeriksaan tipe berhasil. Pemeriksaan browser mencakup semua menu, collapse/expand sidebar, pencarian outlet, dialog dan Escape, tema gelap, reduced motion, serta viewport mobile 390 x 844. Tidak ada exception browser pada alur pengujian.

Pengujian memakai fixture lokal; latensi jaringan, database produksi, dan performa perangkat pengguna belum diukur. Menu yang pertama kali dibuka memuat chunk JavaScript-nya saat itu dan menampilkan indikator pemuatan.
