function escapeCsvValue(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

// columns: [{ label: 'Nama', key: 'name' }, ...] or [{ label, get: row => value }]
export function exportToCsv(filename, columns, rows) {
  const headerLine = columns.map(c => escapeCsvValue(c.label)).join(',');
  const lines = rows.map(row =>
    columns.map(c => escapeCsvValue(c.get ? c.get(row) : row[c.key])).join(',')
  );
  const csv = '﻿' + [headerLine, ...lines].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
