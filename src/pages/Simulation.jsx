import { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { formatRupiah } from '../data/dummyData';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';
import {
  MOTOR_TENORS, CAR_TENORS,
  M_NEW_ANG, M_RO_ANG, M_NEW_FEE, M_RO_FEE,
  C_REG_ANG, C_RO_ANG, C_REG_FEE, C_RO_FEE,
  lookupVal, getPinjamanOptions,
} from '../data/rateTables';
import { Calculator, TrendingUp, Building2, Car } from 'lucide-react';
import { OTR_YEARS, getLtv, getOtr, getMaxPinjaman } from '../data/otrCatalog';

// ─── Segmented toggle ────────────────────────────────────────────────────────
function Toggle({ value, onChange, options }) {
  return (
    <div style={{ display:'flex', background:'var(--surface-alt)', borderRadius:10, padding:3, gap:2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, transition:'all .15s',
          background: value === o.value ? 'var(--surface)' : 'transparent',
          color:       value === o.value ? 'var(--c-0f172a)' : 'var(--c-64748b)',
          boxShadow:   value === o.value ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─── Komponen utama ──────────────────────────────────────────────────────────
export function Simulation() {
  const { leasing: leasingList } = useApp();
  const activeLeasings = leasingList.filter(l => l.status === 'aktif');

  const [selectedLeasingId, setLeasingId] = useState('');
  const [jenis,     setJenis]     = useState('motor');
  const [isRO,      setIsRO]      = useState(false);
  const [pencairan, setPencairan] = useState('');
  const [tenor,     setTenor]     = useState(12);
  const [dbTables,  setDbTables]  = useState(null);

  // OTR catalog state
  const [otrList,        setOtrList]        = useState([]);
  const [otrBrand,       setOtrBrand]       = useState('');
  const [otrTipe,        setOtrTipe]        = useState('');
  const [tahunKendaraan, setTahunKendaraan] = useState('');
  const [otrRow,         setOtrRow]         = useState(null);

  const selectedLeasing = activeLeasings.find(l => String(l.id) === selectedLeasingId);
  // Baris "CMD Finance" di leasing partners memakai kunci rate khusus 'CMD'
  const rateKey = selectedLeasing?.name?.trim().toLowerCase() === 'cmd finance' ? 'CMD' : selectedLeasingId;

  // Load tabel dari DB saat leasing berubah
  useEffect(() => {
    if (!rateKey) {
      setDbTables(null);
      return;
    }
    supabase.from('dsd_rate_tables').select('product,tipe,data')
      .eq('leasing_key', rateKey)
      .then(({ data }) => {
        if (!data?.length) { setDbTables(null); return; }
        const map = {};
        data.forEach(r => { map[`${r.product}_${r.tipe}`] = r.data; });
        setDbTables(map);
      });
  }, [rateKey]);

  const getTable = (key, fallback) => (dbTables?.[key] && Object.keys(dbTables[key]).length ? dbTables[key] : fallback);

  const tenorList  = jenis === 'motor' ? MOTOR_TENORS : CAR_TENORS;
  const validTenor = tenorList.includes(tenor) ? tenor : tenorList[0];

  const handleJenis = (v) => {
    setJenis(v);
    const tList = v === 'motor' ? MOTOR_TENORS : CAR_TENORS;
    if (!tList.includes(tenor)) setTenor(tList[0]);
    setPencairan('');
    setOtrBrand(''); setOtrTipe(''); setOtrRow(null);
  };

  // Load OTR catalog CMD Finance
  useEffect(() => {
    supabase.from('dsd_otr_catalog')
      .select('brand,tipe,ltv,ltv_rule,kategori,otr_2026,otr_2025,otr_2024,otr_2023,otr_2022,otr_2021,otr_2020,otr_2019,otr_2018,otr_2017,otr_2016,otr_2015')
      .eq('leasing_key', 'CMD')
      .order('brand').order('tipe')
      .then(({ data }) => { if (data) setOtrList(data); });
  }, []);

  // Derived OTR values
  const otrBrands  = useMemo(() => [...new Set(otrList.map(r => r.brand))], [otrList]);
  const otrTipes   = useMemo(() => otrList.filter(r => r.brand === otrBrand).map(r => r.tipe), [otrList, otrBrand]);
  const otrInfo = useMemo(() => {
    if (!otrRow || !tahunKendaraan) return null;
    const tahun = Number(tahunKendaraan);
    const otr   = getOtr(otrRow, tahun);
    const ltv   = getLtv(otrRow, tahun);
    const max   = getMaxPinjaman(otrRow, tahun);
    return { otr, ltv, max, tahun, kategori: otrRow.kategori };
  }, [otrRow, tahunKendaraan]);

  // Pinjaman options: keys dari tabel angsuran (ribuan × 1000), dibatasi maks pinjaman jika ada
  const pinjamanOptions = useMemo(() => {
    const typeKey = isRO ? 'ro' : (jenis === 'motor' ? 'new' : 'reg');
    const dbKey   = jenis === 'motor'
      ? (isRO ? 'motor_ro_ang'  : 'motor_new_ang')
      : (isRO ? 'mobil_ro_ang'  : 'mobil_reg_ang');
    const dbTable = dbTables?.[dbKey];
    const all = getPinjamanOptions(dbTable, jenis, typeKey).map(v => v * 1000);
    return otrInfo?.max ? all.filter(v => v <= otrInfo.max) : all;
  }, [jenis, isRO, dbTables, otrInfo]);

  const result = useMemo(() => {
    if (!selectedLeasingId) return null;
    const p = Number(pencairan);
    if (!p || p <= 0) return null;
    const pRibu    = p / 1000;
    const tenors   = jenis === 'motor' ? MOTOR_TENORS : CAR_TENORS;
    const angTable = jenis === 'motor'
      ? getTable(isRO ? 'motor_ro_ang'  : 'motor_new_ang', isRO ? M_RO_ANG  : M_NEW_ANG)
      : getTable(isRO ? 'mobil_ro_ang'  : 'mobil_reg_ang', isRO ? C_RO_ANG  : C_REG_ANG);
    const feeTable = jenis === 'motor'
      ? getTable(isRO ? 'motor_ro_fee'  : 'motor_new_fee', isRO ? M_RO_FEE  : M_NEW_FEE)
      : getTable(isRO ? 'mobil_ro_fee'  : 'mobil_reg_fee', isRO ? C_RO_FEE  : C_REG_FEE);
    const angsuran = lookupVal(angTable, tenors, pRibu, validTenor);
    const fee      = lookupVal(feeTable, tenors, pRibu, validTenor);
    if (!angsuran || !fee) return null;
    return { angsuran, fee, totalBayar: angsuran * validTenor };
  }, [jenis, isRO, pencairan, validTenor, dbTables, selectedLeasingId]);

  const labelJenis = jenis === 'motor' ? 'Motor' : 'Mobil';
  const labelTipe  = isRO ? 'RO' : (jenis === 'motor' ? 'NEW' : 'REGULER');
  const leasingName = selectedLeasing?.name || '';

  return (
    <Layout title="Simulasi Angsuran" subtitle="Pilih leasing dan hitung angsuran + komisi dari tabel resmi">
      <div className="rgrid rgrid-2" style={{ gap:20, alignItems:'start' }}>

        {/* ── FORM ── */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <Calculator size={18} color="#3b82f6" />
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--c-0f172a)' }}>Parameter Pinjaman</h3>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div>
              <label className="label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Building2 size={13} color="var(--c-64748b)" /> Leasing
              </label>
              <select
                className="input"
                value={selectedLeasingId}
                onChange={e => { setLeasingId(e.target.value); setPencairan(''); }}
              >
                <option value="">— Pilih Leasing Tujuan —</option>
                {activeLeasings.map(l => (
                  <option key={l.id} value={String(l.id)}>{l.name}</option>
                ))}
              </select>
              {activeLeasings.length === 0 && (
                <p style={{ fontSize:11, color:'var(--c-94a3b8)', marginTop:4 }}>Belum ada mitra leasing aktif di Master Data</p>
              )}
            </div>

            {selectedLeasingId && <>
              <div>
                <label className="label">Jenis Produk</label>
                <Toggle value={jenis} onChange={handleJenis} options={[
                  { value:'motor', label:'Motor (BPKB)' },
                  { value:'mobil', label:'Mobil (BPKB)' },
                ]} />
              </div>

              <div>
                <label className="label">Jenis Pengajuan</label>
                <Toggle
                  value={isRO ? 'ro' : 'new'}
                  onChange={v => setIsRO(v === 'ro')}
                  options={[
                    { value:'new', label: jenis === 'motor' ? 'NEW' : 'REGULER' },
                    { value:'ro',  label:'RO (Repeat Order)' },
                  ]}
                />
              </div>

              {/* ── Tahun Kendaraan + OTR Catalog (CMD Finance only) ── */}
              {rateKey === 'CMD' && <>
              <div>
                <label className="label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Car size={13} color="var(--c-64748b)" /> Tahun Kendaraan
                </label>
                <select className="input" value={tahunKendaraan} onChange={e => setTahunKendaraan(e.target.value)}>
                  <option value="">— Pilih Tahun —</option>
                  {OTR_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* ── OTR Catalog ── */}
              <div style={{ background:'var(--surface-alt)', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <Car size={13} color="var(--c-64748b)" />
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--c-64748b)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                    Lookup OTR Kendaraan (opsional)
                  </span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label className="label" style={{ fontSize:11 }}>Brand</label>
                    <select className="input" style={{ fontSize:13 }} value={otrBrand} onChange={e => {
                      setOtrBrand(e.target.value); setOtrTipe(''); setOtrRow(null);
                    }}>
                      <option value="">— Brand —</option>
                      {otrBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" style={{ fontSize:11 }}>Tipe</label>
                    <select className="input" style={{ fontSize:13 }} value={otrTipe} onChange={e => {
                      const t = e.target.value;
                      setOtrTipe(t);
                      const row = otrList.find(r => r.brand === otrBrand && r.tipe === t);
                      setOtrRow(row || null);
                    }} disabled={!otrBrand}>
                      <option value="">— Tipe —</option>
                      {otrTipes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {otrInfo && (
                  <div style={{ background:'#eff6ff', borderRadius:8, padding:'10px 12px', fontSize:12 }}>
                    <div style={{ marginBottom:6 }}>
                      <span style={{ color:'var(--c-64748b)' }}>Maks Pinjaman ({otrInfo.tahun})</span>
                      <br/>
                      <strong style={{ fontSize:16, color:'#1d4ed8' }}>{formatRupiah(otrInfo.max)}</strong>
                    </div>
                    <button className="btn btn-sm btn-primary" style={{ width:'100%', fontSize:12 }}
                      onClick={() => setPencairan(String(otrInfo.max))}>
                      Pakai sebagai Jumlah Pinjaman
                    </button>
                  </div>
                )}
                {otrRow && !tahunKendaraan && (
                  <p style={{ fontSize:11, color:'#f59e0b', margin:0 }}>⚠ Pilih tahun kendaraan di atas untuk melihat OTR & maks pinjaman</p>
                )}
              </div>
              </>}

              {/* Pencairan & Tenor: untuk CMD harus pilih tahun dulu, untuk lain langsung tampil */}
              {(rateKey !== 'CMD' || tahunKendaraan) && <>
              <div>
                <label className="label">Jumlah Pencairan</label>
                <select
                  className="input"
                  value={pencairan}
                  onChange={e => setPencairan(e.target.value)}
                >
                  <option value="">— Pilih jumlah pinjaman —</option>
                  {pinjamanOptions.map(v => (
                    <option key={v} value={v}>{formatRupiah(v)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tenor</label>
                <select
                  className="input"
                  value={validTenor}
                  onChange={e => setTenor(Number(e.target.value))}
                >
                  {tenorList.map(t => (
                    <option key={t} value={t}>{t} bulan</option>
                  ))}
                </select>
              </div>
              </>}
            </>}

          </div>
        </div>

        {/* ── RESULT ── */}
        {!selectedLeasingId ? (
          <div className="card" style={{ minHeight:340, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
            <div style={{ width:64, height:64, background:'#eff6ff', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Building2 size={30} color="#93c5fd" />
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:14, fontWeight:600, color:'var(--c-0f172a)', marginBottom:4 }}>Pilih leasing tujuan</p>
              <p style={{ fontSize:12, color:'var(--c-64748b)', lineHeight:1.6 }}>
                Setiap leasing memiliki tabel angsuran & komisi berbeda
              </p>
            </div>
          </div>
        ) : result ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius:16, padding:'24px 20px' }}>
                <p style={{ fontSize:11, color:'#93c5fd', marginBottom:4, letterSpacing:'.04em', textTransform:'uppercase' }}>
                  {leasingName} · {labelJenis} {labelTipe} · {validTenor} Bulan
                </p>
                <p style={{ fontSize:11, color:'#93c5fd', marginBottom:2 }}>Angsuran per Bulan</p>
                <p style={{ fontSize:34, fontWeight:800, color:'#fff', marginBottom:16 }}>
                  {formatRupiah(result.angsuran)}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { l:'Jumlah Pinjaman',    v: formatRupiah(Number(pencairan)) },
                    { l:'Tenor',              v: `${validTenor} bulan` },
                    { l:'Total Bayar Nasabah',v: formatRupiah(result.totalBayar) },
                    { l:'Jenis Pengajuan',    v: labelTipe },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p style={{ fontSize:11, color:'#93c5fd', marginBottom:2 }}>{l}</p>
                      <p style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <TrendingUp size={16} color="#16a34a" />
                  <p style={{ fontSize:12, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:'.04em' }}>
                    Komisi Leasing
                  </p>
                </div>
                <p style={{ fontSize:30, fontWeight:800, color:'#15803d', marginBottom:4 }}>
                  {formatRupiah(result.fee)}
                </p>
                <p style={{ fontSize:12, color:'#16a34a' }}>
                  Per berkas disetujui · {leasingName} · {labelJenis} {labelTipe}
                </p>
              </div>

              <div style={{ background:'var(--surface-alt)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:11, color:'var(--c-64748b)', lineHeight:1.6 }}>
                  Nilai berdasarkan tabel resmi <strong>{leasingName}</strong>. Owner dapat mengubah tabel di <strong>Master Data → Tabel Rate</strong>.
                </p>
              </div>
            </div>
        ) : (
          <div className="card" style={{ minHeight:340, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
            <div style={{ width:64, height:64, background:'#eff6ff', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Calculator size={30} color="#93c5fd" />
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:14, fontWeight:600, color:'var(--c-0f172a)', marginBottom:4 }}>Masukkan jumlah pencairan</p>
              <p style={{ fontSize:12, color:'var(--c-64748b)', lineHeight:1.6 }}>
                Pilih produk, jenis pengajuan, dan<br/>tenor untuk melihat angsuran & komisi
              </p>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
