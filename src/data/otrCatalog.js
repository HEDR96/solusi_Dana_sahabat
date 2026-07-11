// OTR Catalog helpers
// ltv_rule='year_based' → 80% untuk tahun 2021-2026, sisanya 75%

export const OTR_YEARS = [2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015];

export function getLtv(row, tahun) {
  if (row.ltv_rule === 'year_based') {
    return tahun >= 2021 ? 0.8 : 0.75;
  }
  return row.ltv ?? 0.7;
}

export function getOtr(row, tahun) {
  return row[`otr_${tahun}`] ?? null;
}

export function getMaxPinjaman(row, tahun) {
  const otr = getOtr(row, tahun);
  if (!otr) return null;
  return Math.floor(otr * getLtv(row, tahun));
}

export function formatKategori(k) {
  return k === 'fast_moving' ? 'Fast Moving' : 'Slow Moving';
}
