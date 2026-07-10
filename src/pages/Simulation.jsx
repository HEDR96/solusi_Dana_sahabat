import { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { formatRupiah } from '../data/dummyData';
import { supabase } from '../lib/supabaseClient';
import {
  MOTOR_TENORS, CAR_TENORS,
  M_NEW_ANG, M_RO_ANG, M_NEW_FEE, M_RO_FEE,
  C_REG_ANG, C_RO_ANG, C_REG_FEE, C_RO_FEE,
  lookupVal,
} from '../data/rateTables';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';

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
  const [jenis,     setJenis]     = useState('motor');
  const [isRO,      setIsRO]      = useState(false);
  const [pencairan, setPencairan] = useState('');
  const [tenor,     setTenor]     = useState(12);
  const [dbTables,  setDbTables]  = useState(null); // data dari Supabase jika ada

  // Load tabel dari DB (override fallback jika owner sudah edit)
  useEffect(() => {
    supabase.from('dsd_rate_tables').select('product,tipe,data')
      .then(({ data }) => {
        if (!data?.length) return;
        const map = {};
        data.forEach(r => { map[`${r.product}_${r.tipe}`] = r.data; });
        setDbTables(map);
      });
  }, []);

  const getTable = (key, fallback) => (dbTables?.[key] && Object.keys(dbTables[key]).length ? dbTables[key] : fallback);

  const tenorList  = jenis === 'motor' ? MOTOR_TENORS : CAR_TENORS;
  const validTenor = tenorList.includes(tenor) ? tenor : tenorList[0];
  const minP       = jenis === 'motor' ?  5_000_000 :  30_000_000;
  const maxP       = jenis === 'motor' ? 20_000_000 : 200_000_000;

  const handleJenis = (v) => {
    setJenis(v);
    const tList = v === 'motor' ? MOTOR_TENORS : CAR_TENORS;
    if (!tList.includes(tenor)) setTenor(tList[0]);
    setPencairan('');
  };

  const result = useMemo(() => {
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
    return {
      angsuran,
      fee,
      totalBayar: angsuran * validTenor,
      outOfRange: p < minP || p > maxP,
      rangeMsg:   p < minP ? `Minimum pencairan ${formatRupiah(minP)}` : p > maxP ? `Maksimum pencairan ${formatRupiah(maxP)}` : null,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenis, isRO, pencairan, validTenor, minP, maxP, dbTables]);

  const labelJenis = jenis === 'motor' ? 'Motor' : 'Mobil';
  const labelTipe  = isRO ? 'RO' : (jenis === 'motor' ? 'NEW' : 'REGULER');

  return (
    <Layout title="Simulasi CMD Finance" subtitle="CMD Finance Medan · Hitung angsuran dan komisi dari tabel resmi">
      <div className="rgrid rgrid-2" style={{ gap:20, alignItems:'start' }}>

        {/* ── FORM ── */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <Calculator size={18} color="#3b82f6" />
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--c-0f172a)' }}>Parameter Pinjaman</h3>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

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

            <div>
              <label className="label">
                Jumlah Pencairan (Rp)
                <span style={{ marginLeft:8, fontSize:11, color:'var(--c-94a3b8)', fontWeight:400 }}>
                  {formatRupiah(minP)} – {formatRupiah(maxP)}
                </span>
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--c-94a3b8)', pointerEvents:'none' }}>Rp</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  placeholder={jenis === 'motor' ? '8500000' : '50000000'}
                  value={pencairan}
                  onChange={e => setPencairan(e.target.value)}
                  style={{ paddingLeft:36 }}
                  min={minP} max={maxP}
                  step={jenis === 'motor' ? 500000 : 5000000}
                />
              </div>
              {pencairan && Number(pencairan) > 0 && (
                <p style={{ fontSize:12, color:'var(--c-64748b)', marginTop:4 }}>
                  = {formatRupiah(Number(pencairan))}
                </p>
              )}
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

          </div>
        </div>

        {/* ── RESULT ── */}
        {result ? (
          result.outOfRange ? (
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:12, textAlign:'center' }}>
              <div style={{ width:52, height:52, background:'#fef2f2', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertCircle size={26} color="#ef4444" />
              </div>
              <p style={{ fontSize:14, fontWeight:700, color:'#dc2626' }}>{result.rangeMsg}</p>
              <p style={{ fontSize:12, color:'var(--c-64748b)' }}>Silakan sesuaikan jumlah pencairan</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius:16, padding:'24px 20px' }}>
                <p style={{ fontSize:11, color:'#93c5fd', marginBottom:4, letterSpacing:'.04em', textTransform:'uppercase' }}>
                  CMD Finance Medan · {labelJenis} {labelTipe} · {validTenor} Bulan
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
                    Fee Agent / Komisi
                  </p>
                </div>
                <p style={{ fontSize:30, fontWeight:800, color:'#15803d', marginBottom:4 }}>
                  {formatRupiah(result.fee)}
                </p>
                <p style={{ fontSize:12, color:'#16a34a' }}>
                  Per berkas disetujui · {labelJenis} {labelTipe}
                </p>
              </div>

              <div style={{ background:'var(--surface-alt)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:11, color:'var(--c-64748b)', lineHeight:1.6 }}>
                  Nilai berdasarkan tabel resmi <strong>CMD Finance</strong>. Owner dapat mengubah tabel di <strong>Master Data → Tabel Rate</strong>.
                </p>
              </div>
            </div>
          )
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
