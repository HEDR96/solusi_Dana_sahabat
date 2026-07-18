import * as XLSX from 'xlsx';

// Unduh array of objects sebagai file .xlsx (satu sheet).
// columns: [{ label: 'Nama', key: 'name' }, ...] — urutan kolom & header sesuai array ini.
export function exportToXlsx(filename, columns, rows) {
  const data = rows.map(row => {
    const obj = {};
    columns.forEach(c => { obj[c.label] = c.get ? c.get(row) : row[c.key]; });
    return obj;
  });
  const sheet = XLSX.utils.json_to_sheet(data, { header: columns.map(c => c.label) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

// Baca file .xlsx dari <input type="file"> → array of objects (header baris pertama jadi key).
export function parseXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}
