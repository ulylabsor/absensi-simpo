# Absensi Online - Simposium Alumni UIN Raden Fatah Palembang

Sistem absensi online untuk acara Simposium Alumni UIN Raden Fatah Palembang dengan tagline **"Berkarya dan Bersinergi untuk Indonesia Berdaya"**.

## Fitur

- Formulir pendaftaran 8 kolom (Nama, No HP/WA, Email, Tahun Masuk, Fakultas, Jurusan/Prodi, Alamat, Pekerjaan/Instansi)
- Dropdown fakultas dengan filter jurusan/prodi dinamis
- Validasi real-time setiap field
- Duplicate prevention (nomor HP tidak bisa daftar 2x)
- LocalStorage untuk deteksi pendaftaran sebelumnya
- Counter peserta terdaftar
- QR scanner untuk scan QR code via kamera HP
- Desain mobile-first, elegan, responsif
- Integrasi Google Sheets sebagai backend

## Struktur File

```
absen-online/
├── index.html        # Halaman utama (landing + form + success)
├── CONFIG.js         # Konfigurasi (Apps Script URL)
├── apps-script/
│   └── Code.gs       # Google Apps Script (backend)
└── README.md
```

## Cara Setup

### Langkah 1: Buat Google Sheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru
3. Rename sheet pertama menjadi **`Peserta`**
4. Tambahkan header di baris 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Timestamp | Nama | No HP/WA | Email | Tahun Masuk | Fakultas | Jurusan/Prodi | Alamat | Pekerjaan/Instansi |

5. Copy **Sheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### Langkah 2: Setup Google Apps Script

1. Buka [script.google.com](https://script.google.com)
2. Klik **New Project**
3. Hapus kode default
4. Buka folder `apps-script/`, copy seluruh isi `Code.gs`
5. Paste ke project
6. Ganti `YOUR_GOOGLE_SHEET_ID_HERE` dengan Sheet ID dari langkah 1
7. Save (Ctrl+S)
8. **Deploy**:
   - Klik **Deploy** > **New deployment**
   - Description: `Absensi API v1`
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
   - **Authorize** permissions
   - Copy **Web App URL**

### Langkah 3: Update CONFIG.js

Buka `CONFIG.js`, paste Web App URL:

```javascript
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec',
  ...
};
```

### Langkah 4: Deploy Frontend ke GitHub Pages

1. Buat GitHub repository baru
2. Push semua file (`index.html`, `CONFIG.js`, `README.md`)
3. Buka repository **Settings** > **Pages**
4. Source: **Deploy from a branch** > **main** > **/ (root)**
5. Save. Tunggu ~2 menit
6. Copy URL GitHub Pages: `https://username.github.io/absen-online`

### Langkah 5: Generate QR Code

1. Buka [qr-code-generator.com](https://www.qr-code-generator.com/) atau [bit.ly](https://bitly.com/)
2. Masukkan GitHub Pages URL
3. Download QR code
4. Print dan letakkan di venue acara

## Testing

1. Buka GitHub Pages URL di HP
2. Scan QR code atau klik tombol "Isi Form Manual"
3. Isi formulir
4. Submit
5. Cek Google Sheet — data harus muncul
6. Submit lagi dengan nohp yang sama — harus ditolak

## Kolom Formulir

1. **Nama Lengkap** - minimal 3 karakter, huruf dan spasi
2. **No HP / WhatsApp** - format Indonesia (08xx... atau +62xx...)
3. **Email** - format email valid
4. **Tahun Masuk IAIN/UIN** - 1970 sampai tahun ini
5. **Fakultas** - 9 fakultas UIN Raden Fatah
6. **Jurusan / Prodi** - dropdown dinamis berdasarkan fakultas
7. **Alamat** - minimal 10 karakter
8. **Pekerjaan / Instansi** - minimal 3 karakter

## Prevent Duplikat

- **Server-side**: Google Apps Script cek kolom No HP/WA sebelum insert
- **Client-side**: localStorage simpan nohp setelah berhasil daftar
- Jika peserta akses ulang, tampilkan halaman "Sudah Terdaftar"

## Warna & Desain

- Primary: `#006D32` (Islamic Green)
- Accent: `#FFB300` (Gold)
- Background: `#FAFAF8`
- Fonts: Plus Jakarta Sans + Cormorant Garamond
- Aesthetic: Modern Islamic Professional
