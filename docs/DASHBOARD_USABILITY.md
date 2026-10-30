# Perbaikan alur dashboard

## Alur pengguna

- Form outlet, template, tim, testimoni, voucher, lokasi, dan galeri menunggu konfirmasi server sebelum tertutup. Saat gagal, dialog dan isiannya tetap ada. Selama proses simpan, input/tombol dan penutupan dialog dinonaktifkan untuk menghindari submit ganda atau kehilangan isian.
- Pesan kegagalan muncul di dalam form. Dialog mendukung Escape, penguncian fokus keyboard, serta pengembalian fokus ke pemicu setelah ditutup.
- Header memakai identitas akun dan nama usaha sebenarnya. Pencarian menyebut cakupan menu aktif dan dibersihkan saat berpindah menu.
- Manager memperoleh penanda mode baca dan tidak melihat tombol tambah, ubah, hapus, persetujuan, atau penerbitan kunci perangkat. Perlindungan server tetap berlaku; menyembunyikan tombol hanya memperjelas UI.
- Galeri/template/logo/banner menerima upload JPG, PNG, atau WebP hingga 4 MB per gambar. Unggahan yang gagal dapat dicoba ulang. Galeri menyediakan pemilihan outlet dan kode otomatis; input URL dipindahkan ke pengaturan lanjutan.
- Outlet baru memiliki kode perangkat otomatis. Koordinat peta opsional; lokasi juga dapat diisi dari URL Google Maps lengkap. Tautan pendek perlu dibuka terlebih dahulu agar koordinat tersedia dalam URL.
- Dialog Hubungkan booth menggantikan popup browser dengan langkah penyiapan, kredensial read-only, dan tombol salin. Kunci tidak disimpan pada state persisten browser.
- Laporan memakai data transaksi sebenarnya tanpa persentase pertumbuhan contoh. Periode 7/30/365 hari dan outlet memfilter tampilan serta ekspor CSV. CSV memakai UTF-8 BOM dan melindungi sel teks dari formula spreadsheet.
- Pemberitahuan dimuat saat panel dibuka. Data berasal dari testimoni belum disetujui dan status/kabar perangkat outlet dalam tenant akun, maksimal lima item per kategori. Panel menyediakan muat ulang dan tautan ke menu terkait.

## Pemeriksaan

- Unit: filter periode/outlet, penanganan CSV termasuk formula, parsing koordinat, reset pencarian, pembersihan sesi, identitas tenant, serta pembatasan tenant pada pemberitahuan.
- Regresi keamanan: akses tanpa login, hak baca manager, isolasi tenant, pembayaran, voucher, dan perangkat yang dicabut tetap diperiksa oleh suite keamanan.
- Browser lokal dengan fixture: kegagalan simpan lalu retry pada tujuh form, isian tetap ada, submit ganda, gagal upload lalu retry, dialog kunci, identitas akun, pergantian menu, CSV unduhan dan filter, notifikasi, serta viewport mobile.
- Browser manager: tombol perubahan disembunyikan, form identitas usaha nonaktif, tidak ada request mutasi saat navigasi, dan ekspor laporan tetap dapat dipakai.

Pengujian browser memakai API/storage fixture; tidak menulis database atau Supabase Storage produksi. Draft form dipertahankan selama dialog terbuka, belum disimpan lintas reload/navigasi. Kegagalan jaringan setelah request terkirim dapat membuat hasil server belum terkonfirmasi; periksa daftar data sebelum mengirim ulang. Kebijakan retensi file storage dan konfigurasi layanan produksi tetap mengikuti dokumentasi operasional.
