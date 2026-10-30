# Keamanan dan operasi

Perbaikan ini tidak mengubah schema database atau memodifikasi data produksi. Data sesi kosong yang sudah dibuat oleh versi lama tidak dihapus otomatis.

## Sebelum menggunakan integrasi nyata

- Tetapkan `JWT_SECRET` minimal 32 karakter dan `NEXT_PUBLIC_APP_URL` sesuai origin deployment. Perubahan JWT secret mengakhiri sesi yang sedang aktif.
- Buat API key dari menu Outlets untuk setiap perangkat; key produksi disimpan sebagai hash. Key demo ditolak di produksi. Pencabutan key dapat dilakukan dengan menonaktifkan record ApiKey; endpoint sesi perangkat memeriksa status key pada setiap request.
- Konfigurasikan kredensial Midtrans, bucket Supabase `photos`, provider WhatsApp, dan printer yang sesuai. Jalankan transaksi sandbox dan uji cetak fisik sebelum penggunaan nyata.
- Token WhatsApp yang sebelumnya ditulis langsung dalam kode telah dihapus. Ganti/revoke token lama pada provider jika token tersebut pernah aktif atau dibagikan melalui repository.
- `db-exports/` berisi ekspor historis. Periksa data personal sebelum membagikan repository; perbaikan ini tidak menghapus arsip atau riwayat Git.

## Batas yang masih berlaku

- Rate limiter aplikasi berada dalam memori proses. Untuk beberapa instance/serverless, gunakan rate limiting bersama pada reverse proxy/WAF. Header alamat IP harus disanitasi proxy yang dipercaya.
- Pembayaran diperiksa melalui polling server. Rekonsiliasi latar belakang/webhook untuk sesi yang ditinggalkan belum tersedia. Jika pengguna menutup browser sebelum polling mengonfirmasi settlement, buka kembali sesi dan periksa pembayaran yang sama; jangan membuat order baru untuk pembayaran yang sudah dilakukan.
- Voucher parsial mengonsumsi kuota saat ditukarkan. Pembatalan/pelepasan kuota reservasi dan refund masih memerlukan proses operasional.
- Pengiriman TCP printer tidak memberi konfirmasi kertas, tinta, atau pemotongan selesai. Setelah error koneksi, periksa perangkat sebelum mengulang agar tidak mencetak ganda. Tidak ada klaim sukses ketika printer belum dikonfigurasi.
- Batas kedaluwarsa galeri diperiksa API. Bucket `photos` memakai public URL untuk kompatibilitas; URL objek yang sudah diketahui masih bisa dibuka langsung setelah kedaluwarsa API. Untuk retensi ketat, gunakan bucket privat dengan signed URL dan job penghapusan file. Tidak ada kebijakan bucket cloud yang diubah oleh perbaikan lokal ini.
- Service worker dan antrean offline yang ada belum menjadi jaminan upload offline penuh. Pembayaran dan penyelesaian sesi membutuhkan server.
- Dashboard mengambil transaksi satu tahun terakhir. Pemantauan booth memakai heartbeat terbaru; booth tanpa heartbeat baru ditampilkan offline.
- Warna sekunder dan tagline tetap default karena belum memiliki kolom penyimpanan. Field harga template belum menjadi tambahan biaya pada alur booth.

## Uji penerimaan manual

1. Login sebagai dua owner dari tenant berbeda; pastikan daftar/ubah/hapus tidak dapat mengakses tenant lain. MANAGER hanya dapat membaca; akun nonaktif ditolak.
2. Login perangkat dengan Machine ID dan API key yang cocok. Key salah, nonaktif, kedaluwarsa, atau milik outlet lain harus ditolak.
3. Buat QRIS sandbox; klik ?Sudah Bayar? sebelum settlement dan pastikan sesi tetap menunggu. Bayar sesuai jumlah, lalu pastikan hanya satu transaksi dan satu sesi yang diselesaikan.
4. Uji voucher penuh, parsial, kedaluwarsa, tenant berbeda, dan penggunaan serentak pada voucher sekali pakai.
5. Simulasikan upload gagal; preview tetap tersedia untuk retry dan aplikasi tidak membuat kode galeri palsu. Galeri selesai dapat dibuka dan ZIP diunduh.
6. Putuskan koneksi printer dan pastikan muncul error. Uji perangkat ESC/POS nyata dengan lebar raster yang cocok. Simpan galeri tanpa mencetak juga harus berhasil.
