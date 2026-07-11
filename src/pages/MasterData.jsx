import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { RATE_TABLE_DEFS, RATE_TABLE_GROUPS, PRODUCTS, findDef } from '../data/rateTables';
import { OTR_YEARS, getLtv, getMaxPinjaman, formatKategori } from '../data/otrCatalog';

function getJenis(brand, tipe) {
  const b = (brand || '').toUpperCase().trim();
  const t = (tipe || '').toUpperCase().trim();
  if (b === 'YAMAHA' || b === 'HONDA') return 'Motor';
  if (b === 'TRAGA' || b === 'CARRY') return 'Pick Up';
  if (b === 'GRAND MAX') return t.includes('MB') ? 'Mobil' : 'Pick Up';
  return 'Mobil';
}

const JENIS_STYLE = {
  'Motor':   { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'Pick Up': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'Mobil':   { color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
};
import { Plus, Trash2, Eye, EyeOff, Save, RotateCcw, Edit2, X } from 'lucide-react';

// ─── Dropdown options (kategori) ─────────────────────────────────────────────
const CATEGORIES = [
  { key: 'unit_type',        label: 'Tipe Unit' },
  { key: 'tenor',            label: 'Tenor (bulan)' },
  { key: 'bank',             label: 'Bank' },
  { key: 'payment_method',   label: 'Metode Pembayaran' },
  { key: 'city',             label: 'Kota' },
  { key: 'doc_type',         label: 'Tipe Dokumen' },
  { key: 'activity_type',    label: 'Jenis Aktivitas', hasLabel: true },
  { key: 'activity_outcome', label: 'Hasil Aktivitas', hasLabel: true },
  { key: 'role',             label: 'Role (label tampilan)', hasLabel: true },
  { key: 'leasing_type',     label: 'Nama Leasing' },
];

// ─── Editor satu tabel rate ───────────────────────────────────────────────────
function RateTableEditor({ def, showToast, leasingKey = 'CMD', leasingName = 'CMD Finance' }) {
  const [rows,    setRows]    = useState(null);   // [{pinjaman, vals:[]}]
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [fromDB,  setFromDB]  = useState(false);

  const toRows = (obj) =>
    Object.keys(obj).map(Number).sort((a, b) => a - b).map(k => ({ pinjaman: k, vals: [...obj[k]] }));

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('dsd_rate_tables')
      .select('data')
      .eq('leasing_key', leasingKey)
      .eq('product', def.product)
      .eq('tipe', def.tipe)
      .maybeSingle();
    if (data?.data && Object.keys(data.data).length) {
      setRows(toRows(data.data));
      setFromDB(true);
    } else {
      // Untuk leasing selain CMD: gunakan tabel CMD Finance sebagai template awal
      setRows(toRows(def.fallback));
      setFromDB(false);
    }
    setEditing(false);
  }, [def, leasingKey]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const data = {};
    rows.forEach(r => { data[r.pinjaman] = r.vals.map(Number); });
    const { error } = await supabase
      .from('dsd_rate_tables')
      .upsert(
        { leasing_key: leasingKey, product: def.product, tipe: def.tipe, data, updated_at: new Date().toISOString() },
        { onConflict: 'leasing_key,product,tipe' }
      );
    setSaving(false);
    if (error) { showToast('Gagal menyimpan: ' + error.message, 'error'); return; }
    setFromDB(true);
    setEditing(false);
    showToast(`${def.label} (${leasingName}) berhasil disimpan`);
  };

  const reset = async () => {
    const msg = leasingKey === 'CMD'
      ? 'Reset tabel ini ke nilai default dari brosur CMD Finance?'
      : `Reset tabel ini ke nilai referensi CMD Finance? Data ${leasingName} yang tersimpan akan ditimpa.`;
    if (!confirm(msg)) return;
    setRows(toRows(def.fallback));
    const data = {};
    toRows(def.fallback).forEach(r => { data[r.pinjaman] = r.vals; });
    await supabase.from('dsd_rate_tables')
      .upsert(
        { leasing_key: leasingKey, product: def.product, tipe: def.tipe, data, updated_at: new Date().toISOString() },
        { onConflict: 'leasing_key,product,tipe' }
      );
    setFromDB(true);
    showToast(`${def.label} direset ke nilai CMD Finance`);
  };

  const updateCell = (ri, ci, val) => {
    setRows(prev => prev.map((r, i) =>
      i !== ri ? r : { ...r, vals: r.vals.map((v, j) => j === ci ? val : v) }
    ));
  };

  const addRow = () => {
    const raw = window.prompt('Nilai pinjaman baru (ribuan rupiah, contoh: 21000 = Rp 21.000.000):');
    if (!raw) return;
    const val = Number(raw.replace(/\D/g, ''));
    if (!val || val <= 0) return;
    if (rows.find(r => r.pinjaman === val)) { alert('Nilai sudah ada'); return; }
    setRows(prev => [...prev, { pinjaman: val, vals: Array(def.tenors.length).fill(0) }]
      .sort((a, b) => a.pinjaman - b.pinjaman));
  };

  const removeRow = (ri) => {
    setRows(prev => prev.filter((_, i) => i !== ri));
  };

  if (!rows) return <p style={{ fontSize:13, color:'var(--c-94a3b8)', padding:20 }}>Memuat...</p>;

  const isFee = def.tipe.includes('fee');
  const colW  = 68;
  const pinjW = editing ? 110 : 90;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600,
          background: fromDB ? '#dbeafe' : '#fef9c3',
          color:      fromDB ? '#1d4ed8' : '#a16207' }}>
          {fromDB ? `Data dari Supabase (${leasingName})` : leasingKey === 'CMD' ? 'Fallback (belum disimpan)' : `Template CMD Finance — belum disimpan untuk ${leasingName}`}
        </span>
        <div style={{ flex:1 }} />
        {editing ? (
          <>
            <button className="btn btn-sm btn-secondary" onClick={addRow} title="Tambah baris pinjaman baru">
              <Plus size={13} /> Tambah Baris
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => { load(); }}>Batal</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={saving}>
              <Save size={13} /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-secondary" onClick={reset} title="Reset ke default brosur">
              <RotateCcw size={13} /> Reset Default
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setEditing(true)}>
              <Edit2 size={13} /> Edit Tabel
            </button>
          </>
        )}
      </div>

      {/* Grid tabel */}
      <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid var(--border-light)' }}>
        <table style={{ borderCollapse:'collapse', fontSize:12, minWidth: pinjW + colW * def.tenors.length }}>
          <thead>
            <tr style={{ background:'var(--surface-alt)' }}>
              <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:'var(--c-64748b)', width:pinjW, position:'sticky', left:0, background:'var(--surface-alt)', borderRight:'1px solid var(--border-light)' }}>
                Pinjaman (rb)
              </th>
              {def.tenors.map(t => (
                <th key={t} style={{ padding:'8px 6px', textAlign:'right', fontWeight:700, color:'var(--c-64748b)', width:colW, minWidth:colW }}>
                  {t} bln
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.pinjaman} style={{ borderTop:'1px solid var(--border-light)', background: ri % 2 ? 'var(--surface-alt)' : 'var(--surface)' }}>
                <td style={{ padding:'5px 6px', fontWeight:600, color:'var(--c-64748b)', fontSize:11, position:'sticky', left:0, background: ri % 2 ? 'var(--surface-alt)' : 'var(--surface)', borderRight:'1px solid var(--border-light)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {editing && (
                      <button onClick={() => removeRow(ri)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:'0 2px', lineHeight:1, flexShrink:0 }} title="Hapus baris">
                        <X size={11} />
                      </button>
                    )}
                    {(r.pinjaman).toLocaleString('id')}
                  </div>
                </td>
                {r.vals.map((v, ci) => (
                  <td key={ci} style={{ padding:'3px 4px', textAlign:'right' }}>
                    {editing ? (
                      <input
                        type="number"
                        value={v}
                        onChange={e => updateCell(ri, ci, e.target.value)}
                        style={{ width: colW - 10, textAlign:'right', padding:'3px 4px', fontSize:12, border:'1px solid var(--border-light)', borderRadius:4, background:'var(--surface)', color:'var(--c-0f172a)' }}
                      />
                    ) : (
                      <span style={{ paddingRight:4, color: isFee ? '#15803d' : 'var(--c-0f172a)', fontWeight: isFee ? 600 : 400 }}>
                        {Number(v).toLocaleString('id')}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:11, color:'var(--c-94a3b8)', marginTop:8 }}>
        Nilai dalam ribuan rupiah (×1.000) · {rows.length} baris · {def.tenors.length} tenor
      </p>
    </div>
  );
}

// ─── OTR Catalog Editor ───────────────────────────────────────────────────────

function OtrCatalogEditor({ showToast }) {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [jenisFilter,setJenisFilter]= useState('');
  const [editing,    setEditing]    = useState(null);
  const [editBuf,    setEditBuf]    = useState({});

  const [loadErr, setLoadErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    const { data, error } = await supabase.from('dsd_otr_catalog')
      .select('*').eq('leasing_key','CMD').order('brand').order('tipe');
    if (error) setLoadErr(error.message);
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => {
      if (jenisFilter && getJenis(r.brand, r.tipe) !== jenisFilter) return false;
      if (q) return r.brand.toLowerCase().includes(q) || r.tipe.toLowerCase().includes(q);
      return true;
    });
  }, [rows, search, jenisFilter]);

  const saveRow = async (row) => {
    const payload = { ...row, updated_at: new Date().toISOString() };
    delete payload.id; delete payload.created_at;
    const { error } = await supabase.from('dsd_otr_catalog')
      .update(payload).eq('id', row.id);
    if (error) { showToast('Gagal simpan: ' + error.message, 'error'); return; }
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...payload } : r));
    setEditing(null);
    showToast('Tersimpan');
  };

  const deleteRow = async (id) => {
    if (!confirm('Hapus baris ini?')) return;
    const { error } = await supabase.from('dsd_otr_catalog').delete().eq('id', id);
    if (error) { showToast('Gagal hapus: ' + error.message, 'error'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    showToast('Dihapus');
  };

  const addRow = async () => {
    const brand = prompt('Brand (contoh: HONDA):');
    if (!brand) return;
    const tipe = prompt('Tipe (contoh: Beat CBS):');
    if (!tipe) return;
    const { data, error } = await supabase.from('dsd_otr_catalog')
      .insert({ brand: brand.toUpperCase(), tipe, ltv: 0.7, kategori: 'slow_moving', leasing_key: 'CMD' })
      .select().single();
    if (error) { showToast('Gagal tambah: ' + error.message, 'error'); return; }
    setRows(prev => [...prev, data].sort((a,b) => a.brand.localeCompare(b.brand) || a.tipe.localeCompare(b.tipe)));
    showToast('Ditambahkan — edit nilai OTR per tahun');
  };

  if (loading) return <p style={{ fontSize:13, color:'var(--c-94a3b8)', padding:20 }}>Memuat katalog OTR...</p>;
  if (loadErr) return (
    <div style={{ padding:20, background:'#fef2f2', borderRadius:10, border:'1px solid #fecaca' }}>
      <p style={{ fontSize:13, fontWeight:700, color:'#dc2626', marginBottom:6 }}>Tabel belum tersedia</p>
      <p style={{ fontSize:12, color:'#ef4444', marginBottom:12 }}>Jalankan migrasi SQL terlebih dahulu di Supabase SQL Editor:</p>
      <code style={{ fontSize:11, background:'#fff', padding:'6px 10px', borderRadius:6, display:'block', color:'#b91c1c' }}>
        supabase/migrations/002_otr_catalog.sql
      </code>
    </div>
  );

  const curRow = editing ? rows.find(r => r.id === editing) : null;

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
        <p style={{ fontSize:12, color:'var(--c-64748b)', flex:1 }}>
          {filtered.length} unit ditampilkan · Harga OTR dalam rupiah · LTV dipakai untuk hitung maks pinjaman di Simulasi
        </p>
        <div style={{ display:'flex', gap:6 }}>
          {['','Motor','Mobil','Pick Up'].map(j => (
            <button key={j} onClick={() => setJenisFilter(j)}
              style={{
                padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                border: `1px solid ${jenisFilter===j ? '#3b82f6' : 'var(--border)'}`,
                background: jenisFilter===j ? '#3b82f6' : 'var(--surface)',
                color: jenisFilter===j ? '#fff' : 'var(--c-64748b)',
              }}>
              {j || 'Semua'}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Cari brand / tipe..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ width:180, fontSize:13 }} />
        <button className="btn btn-sm btn-primary" onClick={addRow}><Plus size={13}/> Tambah Unit</button>
      </div>

      {/* Modal edit baris */}
      {curRow && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:24, width:560, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>{curRow.brand} — {curRow.tipe}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label className="label">LTV (contoh: 0.70)</label>
                <input className="input" type="number" step="0.01" min="0" max="1"
                  value={editBuf.ltv ?? curRow.ltv ?? ''}
                  onChange={e => setEditBuf(b => ({...b, ltv: Number(e.target.value)}))} />
              </div>
              <div>
                <label className="label">LTV Rule</label>
                <select className="input" value={editBuf.ltv_rule ?? curRow.ltv_rule ?? ''}
                  onChange={e => setEditBuf(b => ({...b, ltv_rule: e.target.value || null}))}>
                  <option value="">Fixed (pakai nilai LTV)</option>
                  <option value="year_based">Year-based (80% ≥2021, 75% lainnya)</option>
                </select>
              </div>
              <div>
                <label className="label">Kategori</label>
                <select className="input" value={editBuf.kategori ?? curRow.kategori ?? ''}
                  onChange={e => setEditBuf(b => ({...b, kategori: e.target.value}))}>
                  <option value="fast_moving">Fast Moving</option>
                  <option value="slow_moving">Slow Moving</option>
                </select>
              </div>
            </div>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--c-64748b)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>Harga OTR per Tahun</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
              {OTR_YEARS.map(y => (
                <div key={y}>
                  <label className="label" style={{ fontSize:11 }}>{y}</label>
                  <input className="input" type="number" style={{ fontSize:13 }}
                    value={editBuf[`otr_${y}`] ?? curRow[`otr_${y}`] ?? ''}
                    onChange={e => setEditBuf(b => ({...b, [`otr_${y}`]: e.target.value ? Number(e.target.value) : null}))}
                    placeholder="—" />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(null); setEditBuf({}); }}>Batal</button>
              <button className="btn btn-sm btn-primary" onClick={() => saveRow({ ...curRow, ...editBuf })}>
                <Save size={13}/> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid var(--border-light)' }}>
        <table style={{ borderCollapse:'collapse', fontSize:12, width:'100%' }}>
          <thead>
            <tr style={{ background:'var(--surface-alt)' }}>
              {['Jenis','Brand','Tipe','LTV','Kategori','OTR Terbaru','Maks Pinjaman',''].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:'var(--c-64748b)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border-light)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const latestYear = OTR_YEARS.find(y => r[`otr_${y}`]);
              const latestOtr  = latestYear ? r[`otr_${latestYear}`] : null;
              const ltv        = latestYear ? getLtv(r, latestYear) : null;
              const maxP       = latestYear ? getMaxPinjaman(r, latestYear) : null;
              const jenis = getJenis(r.brand, r.tipe);
              const js = JENIS_STYLE[jenis];
              return (
                <tr key={r.id} style={{ borderTop:'1px solid var(--border-light)', background: i%2 ? 'var(--surface-alt)':'var(--surface)' }}>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700, color:js.color, background:js.bg, border:`1px solid ${js.border}`, whiteSpace:'nowrap' }}>{jenis}</span>
                  </td>
                  <td style={{ padding:'6px 10px', fontWeight:600 }}>{r.brand}</td>
                  <td style={{ padding:'6px 10px' }}>{r.tipe}</td>
                  <td style={{ padding:'6px 10px', color:'#1d4ed8' }}>
                    {r.ltv_rule === 'year_based' ? '75–80%*' : `${((r.ltv||0)*100).toFixed(0)}%`}
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:600,
                      background: r.kategori==='fast_moving' ? '#dcfce7' : '#fef9c3',
                      color:      r.kategori==='fast_moving' ? '#15803d' : '#a16207' }}>
                      {formatKategori(r.kategori)}
                    </span>
                  </td>
                  <td style={{ padding:'6px 10px', color:'var(--c-64748b)' }}>
                    {latestOtr ? `${latestYear} — Rp ${latestOtr.toLocaleString('id')}` : '—'}
                  </td>
                  <td style={{ padding:'6px 10px', fontWeight:700, color:'#1d4ed8' }}>
                    {maxP ? `Rp ${maxP.toLocaleString('id')}` : '—'}
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(r.id); setEditBuf({}); }}>
                        <Edit2 size={12}/>
                      </button>
                      <button className="btn btn-sm" style={{ color:'#ef4444', background:'#fef2f2', border:'1px solid #fecaca' }}
                        onClick={() => deleteRow(r.id)}>
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:11, color:'var(--c-94a3b8)', marginTop:8 }}>
        * LTV year_based: 80% untuk tahun kendaraan 2021–2026, 75% untuk sebelumnya
      </p>
    </div>
  );
}

// ─── Halaman utama MasterData ─────────────────────────────────────────────────
export function MasterData() {
  const { showToast, leasing, setLeasing } = useApp();

  // Mode: 'options' | 'rates' | 'otr'
  const [mode,     setMode]     = useState('options');

  // --- Dropdown options state ---
  const [category, setCategory] = useState('unit_type');
  const [options,  setOptions]  = useState([]);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loading,  setLoading]  = useState(false);

  // --- Rate tables state ---
  const [ratesLeasing,  setRatesLeasing]  = useState('CMD');
  const [rateGroup,     setRateGroup]     = useState('ang');
  const [rateProduct,   setRateProduct]   = useState('motor');
  const [rateType,      setRateType]      = useState('new');

  const currentCat     = CATEGORIES.find(c => c.key === category);
  const currentProduct = PRODUCTS.find(p => p.key === rateProduct);
  const currentDef     = findDef(rateProduct, rateType, rateGroup);

  // Kategori "Nama Leasing" mengelola tabel dsd_leasing_partners langsung —
  // inilah sumber dropdown Leasing Tujuan di form berkas & simulasi.
  const isLeasingCat = category === 'leasing_type';

  const syncLeasingContext = (rows) => {
    setLeasing(rows.map(r => ({
      id: r.id, name: r.name, branch: r.branch, pic: r.pic, contact: r.contact,
      email: r.email, products: r.products, rate: r.rate, tenors: r.tenors,
      minPinjaman: r.min_pinjaman, maxPinjaman: r.max_pinjaman, status: r.status,
      syarat: r.syarat || '', notes: r.notes || '',
    })));
  };

  const load = async () => {
    setLoading(true);
    if (isLeasingCat) {
      const { data } = await supabase.from('dsd_leasing_partners').select('*').order('id');
      setOptions((data || []).map(r => ({ id: r.id, value: r.name, active: r.status === 'aktif' })));
      if (data) syncLeasingContext(data);
    } else {
      const { data } = await supabase
        .from('dsd_master_options')
        .select('*')
        .eq('category', category)
        .order('sort')
        .order('value');
      setOptions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (mode === 'options') load(); }, [category, mode]);

  const add = async () => {
    const v = newValue.trim();
    if (!v) return;
    if (isLeasingCat) {
      const { error } = await supabase.from('dsd_leasing_partners').insert({ name: v, status: 'aktif' });
      if (error) showToast(error.message, 'error');
      else { setNewValue(''); showToast(`Leasing "${v}" ditambahkan`); load(); }
      return;
    }
    const maxSort = Math.max(0, ...options.map(o => o.sort || 0));
    const row = { category, value: v, sort: maxSort + 1, active: true };
    if (currentCat?.hasLabel && newLabel.trim()) row.label = newLabel.trim();
    const { error } = await supabase.from('dsd_master_options').insert(row);
    if (error) showToast(error.message.includes('duplicate') ? 'Nilai sudah ada' : error.message, 'error');
    else { setNewValue(''); setNewLabel(''); showToast(`"${v}" ditambahkan`); load(); }
  };

  const toggle = async (opt) => {
    if (isLeasingCat) {
      await supabase.from('dsd_leasing_partners').update({ status: opt.active ? 'nonaktif' : 'aktif' }).eq('id', opt.id);
      load();
      return;
    }
    await supabase.from('dsd_master_options').update({ active: !opt.active }).eq('id', opt.id);
    load();
  };

  const remove = async (opt) => {
    if (isLeasingCat) {
      if (!confirm(`Hapus leasing "${opt.value}"? Tidak akan muncul lagi di form berkas & simulasi.`)) return;
      const { error } = await supabase.from('dsd_leasing_partners').delete().eq('id', opt.id);
      if (error) {
        // Masih direferensikan berkas lama (FK leasing_id) — nonaktifkan saja
        await supabase.from('dsd_leasing_partners').update({ status: 'nonaktif' }).eq('id', opt.id);
        showToast('Masih dipakai berkas lama — leasing dinonaktifkan saja', 'info');
      } else {
        showToast(`"${opt.value}" dihapus`);
      }
      load();
      return;
    }
    if (!confirm(`Hapus "${opt.value}"? Dropdown di web & aplikasi tidak akan menampilkannya lagi.`)) return;
    await supabase.from('dsd_master_options').delete().eq('id', opt.id);
    showToast(`"${opt.value}" dihapus`);
    load();
  };

  return (
    <Layout title="Master Data" subtitle="Kelola dropdown dan tabel angsuran CMD Finance">

      {/* ── Mode toggle ── */}
      <div style={{ display:'flex', gap:4, background:'var(--surface-alt)', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {[
          { key:'options', label:'Dropdown Opsi' },
          { key:'rates',   label:'Tabel Rate Leasing' },
          { key:'otr',     label:'Katalog OTR' },
        ].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} style={{
            padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: mode === m.key ? 'var(--surface)' : 'transparent',
            color:       mode === m.key ? 'var(--c-0f172a)' : 'var(--c-64748b)',
            boxShadow:   mode === m.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            transition:'all .15s',
          }}>{m.label}</button>
        ))}
      </div>

      {/* ── MODE: Dropdown Options ── */}
      {mode === 'options' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`btn btn-sm ${category === c.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding:20, maxWidth:560 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <input
                className="input"
                style={{ flex:1, minWidth:140 }}
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
                placeholder={currentCat?.hasLabel ? 'Kunci (mis. tipe-baru)' : `Tambah ${currentCat?.label.toLowerCase()}...`}
              />
              {currentCat?.hasLabel && (
                <input
                  className="input"
                  style={{ flex:1, minWidth:140 }}
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && add()}
                  placeholder="Label tampilan"
                />
              )}
              <button className="btn btn-primary" onClick={add}><Plus size={15} /> Tambah</button>
            </div>

            {loading ? (
              <p style={{ fontSize:13, color:'var(--c-94a3b8)' }}>Memuat...</p>
            ) : options.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--c-94a3b8)' }}>Belum ada data</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {options.map(opt => (
                  <div key={opt.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border-light)' }}>
                    <span style={{ flex:1, fontSize:14, fontWeight:500, color: opt.active ? 'var(--c-0f172a)' : 'var(--c-94a3b8)', textDecoration: opt.active ? 'none' : 'line-through' }}>
                      {opt.label || opt.value}
                      {opt.label && <span style={{ fontSize:11, color:'var(--c-94a3b8)', marginLeft:8, fontFamily:'monospace' }}>{opt.value}</span>}
                    </span>
                    {!opt.active && <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>Nonaktif</span>}
                    <button className="btn btn-ghost btn-sm" title={opt.active ? 'Sembunyikan' : 'Aktifkan'} onClick={() => toggle(opt)}>
                      {opt.active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Hapus" onClick={() => remove(opt)}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={{ fontSize:12, color:'var(--c-94a3b8)', marginTop:14, maxWidth:560 }}>
            {isLeasingCat
              ? 'Daftar ini menjadi pilihan "Leasing Tujuan" di form berkas & simulasi (web dan Android). Nonaktifkan untuk menyembunyikan tanpa menghapus.'
              : 'Perubahan langsung berlaku di form web dan aplikasi Android.'}
          </p>
        </>
      )}

      {/* ── MODE: Rate Tables ── */}
      {mode === 'rates' && (
        <>
          <p style={{ fontSize:12, color:'var(--c-64748b)', marginBottom:14, maxWidth:700 }}>
            Edit tabel angsuran dan fee agent per leasing. Nilai dalam <strong>ribuan rupiah</strong> (×1.000). Klik <strong>Edit Tabel</strong>, ubah sel, lalu <strong>Simpan</strong> — langsung dipakai kalkulator di form berkas.
          </p>

          {/* Pilih Leasing */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--c-64748b)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em' }}>
              Pilih Leasing
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button
                className={`btn btn-sm ${ratesLeasing === 'CMD' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRatesLeasing('CMD')}
              >
                CMD Finance
              </button>
              {leasing
                .filter(l => l.status === 'aktif' && l.name.trim().toLowerCase() !== 'cmd finance')
                .map(l => (
                  <button
                    key={l.id}
                    className={`btn btn-sm ${ratesLeasing === String(l.id) ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setRatesLeasing(String(l.id))}
                  >
                    {l.name}
                  </button>
                ))}
            </div>
            {ratesLeasing !== 'CMD' && (
              <p style={{ fontSize:11, color:'#92400e', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'7px 12px', marginTop:10, maxWidth:620 }}>
                Tabel untuk <strong>{leasing.find(l => String(l.id) === ratesLeasing)?.name}</strong>. Jika belum pernah disimpan, nilai awal diambil dari referensi CMD Finance — edit lalu simpan sesuai brosur resmi leasing ini.
              </p>
            )}
          </div>

          {/* Level 1: Group (Angsuran / Komisi Leasing / Komisi Agen) */}
          <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
            {RATE_TABLE_GROUPS.map(g => (
              <button
                key={g.key}
                className={`btn btn-sm ${rateGroup === g.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRateGroup(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Level 2: Produk (Motor / Mobil / Pick Up ...) */}
          <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
            {PRODUCTS.map(p => (
              <button
                key={p.key}
                className={`btn btn-sm ${rateProduct === p.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setRateProduct(p.key);
                  setRateType(p.types[0].key);
                }}
                style={{ fontSize:12 }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Level 3: Tipe (NEW/RO atau REGULER/RO) */}
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {currentProduct?.types.map(t => (
              <button
                key={t.key}
                className={`btn btn-sm ${rateType === t.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRateType(t.key)}
                style={{ fontSize:12 }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--c-0f172a)', marginBottom:14 }}>
              {currentDef?.label}
              {ratesLeasing !== 'CMD' && (
                <span style={{ fontSize:12, fontWeight:500, color:'var(--c-64748b)', marginLeft:8 }}>
                  — {leasing.find(l => String(l.id) === ratesLeasing)?.name}
                </span>
              )}
            </h3>
            {currentDef ? (
              <RateTableEditor
                key={`${ratesLeasing}_${currentDef.id}`}
                def={currentDef}
                showToast={showToast}
                leasingKey={ratesLeasing}
                leasingName={ratesLeasing === 'CMD' ? 'CMD Finance' : (leasing.find(l => String(l.id) === ratesLeasing)?.name || ratesLeasing)}
              />
            ) : (
              <p style={{ fontSize:13, color:'var(--c-94a3b8)' }}>Tabel belum tersedia untuk kombinasi ini.</p>
            )}
          </div>
        </>
      )}

      {/* ── MODE: Katalog OTR ── */}
      {mode === 'otr' && (
        <>
          <p style={{ fontSize:12, color:'var(--c-64748b)', marginBottom:14, maxWidth:700 }}>
            Kelola katalog harga OTR dan LTV kendaraan untuk CMD Finance. Data ini dipakai di <strong>Simulasi</strong> untuk menghitung maks pinjaman otomatis.
          </p>
          <div className="card" style={{ padding:20 }}>
            <OtrCatalogEditor showToast={showToast} />
          </div>
        </>
      )}

    </Layout>
  );
}
