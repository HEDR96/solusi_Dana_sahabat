import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const CATEGORIES = [
  { key: 'unit_type',        label: 'Tipe Unit' },
  { key: 'tenor',            label: 'Tenor (bulan)' },
  { key: 'bank',             label: 'Bank' },
  { key: 'payment_method',   label: 'Metode Pembayaran' },
  { key: 'city',             label: 'Kota' },
  { key: 'activity_type',    label: 'Jenis Aktivitas', hasLabel: true },
  { key: 'activity_outcome', label: 'Hasil Aktivitas', hasLabel: true },
  { key: 'role',             label: 'Role (label tampilan)', hasLabel: true },
];

export function MasterData() {
  const { showToast } = useApp();
  const [category, setCategory] = useState('unit_type');
  const [options, setOptions]   = useState([]);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading]   = useState(false);

  const currentCat = CATEGORIES.find(c => c.key === category);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('master_options')
      .select('*')
      .eq('category', category)
      .order('sort')
      .order('value');
    setOptions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [category]);

  const add = async () => {
    const v = newValue.trim();
    if (!v) return;
    const maxSort = Math.max(0, ...options.map(o => o.sort || 0));
    const row = { category, value: v, sort: maxSort + 1, active: true };
    if (currentCat?.hasLabel && newLabel.trim()) row.label = newLabel.trim();
    const { error } = await supabase.from('master_options').insert(row);
    if (error) showToast(error.message.includes('duplicate') ? 'Nilai sudah ada' : error.message, 'error');
    else { setNewValue(''); setNewLabel(''); showToast(`"${v}" ditambahkan`); load(); }
  };

  const toggle = async (opt) => {
    await supabase.from('master_options').update({ active: !opt.active }).eq('id', opt.id);
    load();
  };

  const remove = async (opt) => {
    if (!confirm(`Hapus "${opt.value}"? Dropdown di web & aplikasi tidak akan menampilkannya lagi.`)) return;
    await supabase.from('master_options').delete().eq('id', opt.id);
    showToast(`"${opt.value}" dihapus`);
    load();
  };

  return (
    <Layout title="Master Data" subtitle="Kelola pilihan dropdown untuk web & aplikasi Android">
      {/* Kategori */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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

      <div className="card" style={{ padding: 20, maxWidth: 560 }}>
        {/* Tambah baru */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 140 }}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder={currentCat?.hasLabel ? 'Kunci (mis. tipe-baru)' : `Tambah ${currentCat?.label.toLowerCase()}...`}
          />
          {currentCat?.hasLabel && (
            <input
              className="input"
              style={{ flex: 1, minWidth: 140 }}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Label tampilan (mis. Tipe Baru)"
            />
          )}
          <button className="btn btn-primary" onClick={add}><Plus size={15} /> Tambah</button>
        </div>

        {/* Daftar */}
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Memuat...</p>
        ) : options.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Belum ada data — jalankan migration 004 dulu di Supabase</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {options.map(opt => (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: opt.active ? 'var(--c-0f172a)' : 'var(--c-94a3b8)', textDecoration: opt.active ? 'none' : 'line-through' }}>
                  {opt.label || opt.value}
                  {opt.label && <span style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginLeft: 8, fontFamily: 'monospace' }}>{opt.value}</span>}
                </span>
                {!opt.active && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Nonaktif</span>}
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

      <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginTop: 14, maxWidth: 560 }}>
        💡 Perubahan langsung berlaku di form web dan aplikasi Android (app memuat ulang saat dibuka; tersimpan offline sebagai cache).
      </p>
    </Layout>
  );
}
