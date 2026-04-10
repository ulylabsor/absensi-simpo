/**
 * Code.gs - Google Apps Script Backend
 * Absensi Online Simposium Alumni UIN Raden Fatah Palembang
 *
 * CARA SETUP:
 * 1. Buka https://script.google.com
 * 2. Klik "New Project"
 * 3. Hapus kode default, paste seluruh kode ini
 * 4. Ganti SHEET_ID di bawah dengan ID Google Sheet Anda
 *    (ID ada di URL Google Sheet: docs.google.com/spreadsheets/d/[SHEET_ID]/edit)
 * 5. Buat Google Sheet dengan sheet bernama "Peserta"
 * 6. Header baris 1: Timestamp | Nama | No HP/WA | Email | Tahun Masuk | Fakultas | Jurusan/Prodi | Alamat | Pekerjaan/Instansi
 * 7. Save project (Ctrl+S)
 * 8. Deploy → New deployment → Select type: Web app
 *    - Description: Absensi API v1
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 9. Authorize dan copy Web App URL
 * 10. Paste URL ke CONFIG.js di proyek frontend
 */

// ==================== KONFIGURASI ====================
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Peserta';

// ==================== COLUMN INDEX ====================
// 1-based index untuk Google Sheets
const COL = {
  timestamp: 1,
  nama: 2,
  nohp: 3,
  email: 4,
  tahun_masuk: 5,
  fakultas: 6,
  jurusan: 7,
  alamat: 8,
  pekerjaan: 9
};

// ==================== GET ====================
function doGet(e) {
  if (!e || !e.parameter) {
    return returnJSON({ message: 'API aktif. Gunakan parameter ?action=register, ?action=check, atau ?action=stats' });
  }
  const action = e.parameter.action;

  try {
    if (action === 'register') {
      return handleRegisterGet(e);
    }
    if (action === 'check') {
      return handleCheck(e);
    }
    if (action === 'stats') {
      return handleStats();
    }
    return returnJSON({ error: 'Unknown action' });
  } catch (err) {
    return returnJSON({ error: err.toString() });
  }
}

function handleCheck(e) {
  const nohp = e.parameter.nohp;
  if (!nohp) {
    return returnJSON({ error: 'nohp is required' });
  }

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // Skip header (row 0), check rows 1+
  for (let i = 1; i < data.length; i++) {
    if (normalizeNohp(data[i][COL.nohp - 1]) === normalizeNohp(nohp)) {
      return returnJSON({
        status: 'registered',
        nama: data[i][COL.nama - 1]
      });
    }
  }

  return returnJSON({ status: 'not_found' });
}

function handleStats() {
  const sheet = getSheet();
  const count = Math.max(0, sheet.getLastRow() - 1); // minus header row
  return returnJSON({ count: count });
}

// ==================== REGISTER (GET - query params) ====================
function handleRegisterGet(e) {
  if (!e || !e.parameter) {
    return returnJSON({ status: 'error', message: 'Missing parameters' });
  }
  const data = {
    nama: e.parameter.nama,
    nohp: e.parameter.nohp,
    email: e.parameter.email,
    tahun_masuk: e.parameter.tahun_masuk,
    fakultas: e.parameter.fakultas,
    jurusan: e.parameter.jurusan,
    alamat: e.parameter.alamat,
    pekerjaan: e.parameter.pekerjaan
  };

  // 1. Validate
  const validation = validateRegistration(data);
  if (!validation.valid) {
    return returnJSON({ status: 'error', message: validation.message });
  }

  // 2. Check duplicate nohp
  if (isDuplicateNohp(data.nohp)) {
    return returnJSON({
      status: 'error',
      message: 'Nomor HP sudah terdaftar. Jika sudah pernah daftar, silakan hubungi petugas.',
      code: 'DUPLICATE_NOHp'
    });
  }

  // 3. Write to sheet
  const sheet = getSheet();
  sheet.appendRow([
    new Date(),
    sanitize(data.nama),
    sanitize(data.nohp),
    sanitize(data.email),
    sanitize(data.tahun_masuk),
    sanitize(data.fakultas),
    sanitize(data.jurusan),
    sanitize(data.alamat),
    sanitize(data.pekerjaan)
  ]);

  return returnJSON({
    status: 'success',
    message: 'Pendaftaran berhasil!'
  });
}

// Kept for backwards compatibility if using POST
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handleRegisterGet(e);
  } catch (err) {
    return returnJSON({ status: 'error', message: err.toString() });
  }
}

// ==================== VALIDATION ====================
function validateRegistration(data) {
  // Nama
  if (!data.nama || data.nama.trim().length < 3) {
    return { valid: false, message: 'Nama minimal 3 karakter' };
  }
  if (!/^[a-zA-Z\s'.]+$/i.test(data.nama.trim())) {
    return { valid: false, message: 'Nama hanya boleh huruf dan spasi' };
  }

  // No HP
  if (!data.nohp) {
    return { valid: false, message: 'Nomor HP harus diisi' };
  }
  const cleanNohp = data.nohp.replace(/\s/g, '');
  if (!/^(?:\+?62|0)[2-9][0-9]{7,11}$/.test(cleanNohp)) {
    return { valid: false, message: 'Format nomor HP tidak valid' };
  }

  // Email
  if (!data.email) {
    return { valid: false, message: 'Email harus diisi' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    return { valid: false, message: 'Format email tidak valid' };
  }

  // Tahun Masuk
  if (!data.tahun_masuk) {
    return { valid: false, message: 'Pilih tahun masuk' };
  }
  const tahun = parseInt(data.tahun_masuk);
  const currentYear = new Date().getFullYear();
  if (tahun < 1970 || tahun > currentYear) {
    return { valid: false, message: 'Tahun masuk tidak valid' };
  }

  // Fakultas
  if (!data.fakultas) {
    return { valid: false, message: 'Pilih fakultas' };
  }

  // Jurusan
  if (!data.jurusan) {
    return { valid: false, message: 'Pilih jurusan/prodi' };
  }

  // Alamat
  if (!data.alamat || data.alamat.trim().length < 10) {
    return { valid: false, message: 'Alamat minimal 10 karakter' };
  }

  // Pekerjaan
  if (!data.pekerjaan || data.pekerjaan.trim().length < 3) {
    return { valid: false, message: 'Pekerjaan/instansi minimal 3 karakter' };
  }

  return { valid: true };
}

// ==================== HELPERS ====================
function getSheet() {
  if (SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE' || !SHEET_ID) {
    throw new Error('SHEET_ID belum di-set. Buka Code.gs dan ganti SHEET_ID dengan ID Google Sheet Anda.');
  }
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Auto-create if not exists
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.getRange(1, 1, 1, 9).setValues([[
      'Timestamp', 'Nama', 'No HP/WA', 'Email',
      'Tahun Masuk', 'Fakultas', 'Jurusan/Prodi',
      'Alamat', 'Pekerjaan/Instansi'
    ]]);
    // Style headers
    sheet.getRange(1, 1, 1, 9)
      .setBackground('#006D32')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function isDuplicateNohp(nohp) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // Only header

  const nohpCol = sheet.getRange(2, COL.nohp, lastRow - 1, 1).getValues();
  const normalized = normalizeNohp(nohp);

  for (let i = 0; i < nohpCol.length; i++) {
    if (normalizeNohp(nohpCol[i][0]) === normalized) {
      return true;
    }
  }
  return false;
}

function normalizeNohp(nohp) {
  if (!nohp) return '';
  let num = nohp.toString().replace(/\s/g, '').replace(/^0/, '62');
  if (!num.startsWith('62')) {
    num = '62' + num.replace(/^0+/, '');
  }
  return num;
}

function sanitize(str) {
  if (str === undefined || str === null) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function returnJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
