# SmartCopy - Sistem Otomasi Dokumen & Webhook Router

## 📋 Deskripsi Proyek

SmartCopy adalah sistem cerdas yang mengotomatisasi penerimaan, pemrosesan, dan manajemen print dokumen melalui WhatsApp. Sistem ini juga berfungsi sebagai **Central Dispatcher** untuk menghubungkan WAHA (WhatsApp API) dengan berbagai aplikasi lain (POS, Member, CetakFoto).

## 🌟 Fungsi Utama

1.  **Otomasi Penerimaan Dokumen**
    - Menerima file (PDF, Docx) langsung dari WhatsApp pelanggan.
    - Otomatis menghitung estimasi harga dan halaman.
    - Mengirim notifikasi status order real-time.

2.  **Processing Engine (Kecerdasan Buatan)**
    - **Auto-Format**: Merapikan margin skripsi/makalah secara otomatis.
    - **Auto-Count**: Menghitung jumlah halaman warna vs hitam-putih.
    - **Convert**: Konversi Word ke PDF siap cetak.

3.  **Webhook Router (Pengganti n8n)**
    - Menjadi pintu gerbang tunggal untuk WAHA.
    - Memilah pesan berdasarkan keyword:
      - `FILE` -> Proses di SmartCopy.
      - `CEK POIN` -> Kirim ke App Member.
      - `TAGIHAN` -> Kirim ke App POS.
    - Lebih hemat RAM dan cepat dibanding menggunakan tools pihak ketiga.

## 💰 Manfaat Bisnis

- **Efisiensi Waktu**: Karyawan tidak perlu download manual, cek file satu-satu, atau hitung halaman manual.
- **Hemat Biaya**: Mengurangi kebutuhan admin khusus untuk membalas chat orderan.
- **Layanan 24/7**: Pelanggan bisa kirim file jam 2 pagi, sistem tetap melayani dan mencatat order.
- **Terpusat**: Manajemen satu pintu untuk semua jenis layanan digital printing.

## 🏗️ Arsitektur Teknis

- **Frontend**: React + Vite (Dashboard Admin)
- **Backend**: Express.js (API & Router Logika)
- **Engine**: Python (Manipulasi Dokumen)
- **Database**: PostgreSQL & Redis
- **Infra**: Docker Container (Mudah dideploy & diamankan)

---

_Dideploy di Server: tholib_server (192.168.1.27)_
