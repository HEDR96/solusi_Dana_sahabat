import { useEffect, useState, useCallback } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { RATE_TABLE_DEFS } from '../data/rateTables';
import { Plus, Trash2, Eye, EyeOff, Save, RotateCcw, Edit2 } from 'lucide-react';

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

  if (!rows) return <p style={{ fontSize:13, color:'var(--c-94a3b8)', padding:20 }}>Memuat...</p>;

  const isFee = def.tipe.includes('fee');
  const colW  = 68;
  const pinjW = 90;

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
                Pinjaman
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
                <td style={{ padding:'5px 10px', fontWeight:600, color:'var(--c-64748b)', fontSize:11, position:'sticky', left:0, background: ri % 2 ? 'var(--surface-alt)' : 'var(--surface)', borderRight:'1px solid var(--border-light)' }}>
                  {(r.pinjaman).toLocaleString('id')}
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

// ─── Halaman utama MasterData ─────────────────────────────────────────────────
export function MasterData() {
  const { showToast, leasing, setLeasing } = useApp();

  // Mode: 'options' | 'rates'
  const [mode,     setMode]     = useState('options');

  // --- Dropdown options state ---
  const [category, setCategory] = useState('unit_type');
  const [options,  setOptions]  = useState([]);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loading,  setLoading]  = useState(false);

  // --- Rate tables state ---
  const [rateTab,      setRateTab]      = useState(RATE_TABLE_DEFS[0].id);
  const [ratesLeasing, setRatesLeasing] = useState('CMD'); // 'CMD' | leasing.id.toString()

  const currentCat = CATEGORIES.find(c => c.key === category);
  const currentDef = RATE_TABLE_DEFS.find(d => d.id === rateTab);

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

          {/* Tab pilih jenis tabel */}
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {RATE_TABLE_DEFS.map(d => (
              <button
                key={d.id}
                className={`btn btn-sm ${rateTab === d.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRateTab(d.id)}
                style={{ fontSize:11 }}
              >
                {d.label}
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
            {currentDef && (
              <RateTableEditor
                key={`${ratesLeasing}_${currentDef.id}`}
                def={currentDef}
                showToast={showToast}
                leasingKey={ratesLeasing}
                leasingName={ratesLeasing === 'CMD' ? 'CMD Finance' : (leasing.find(l => String(l.id) === ratesLeasing)?.name || ratesLeasing)}
              />
            )}
          </div>
        </>
      )}


    </Layout>
  );
}
