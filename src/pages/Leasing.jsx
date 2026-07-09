import { useState, useMemo, useCallback, memo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/dummyData';
import { useDebounce } from '../utils/useDebounce';
import { Plus, Search, Edit2, Building2, Phone, Mail, Percent } from 'lucide-react';

const LF = memo(({ label, name, type = 'text', form, sf, errors }) => (
  <div>
    <label className="label">{label}</label>
    <input className="input" type={type} value={form[name] || ''} onChange={e => sf(name)(e.target.value)} style={errors[name] ? { borderColor: '#ef4444' } : undefined} />
    {errors[name] && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors[name]}</p>}
  </div>
));

const EMPTY = {
  name: '', branch: '', pic: '', contact: '', email: '', products: '',
  rate: '', tenors: '', minPinjaman: '', maxPinjaman: '', syarat: '', status: 'aktif', notes: '',
};

export function Leasing() {
  const { addLeasing, updateLeasing, leasing, showToast } = useApp();
  const [search, setSearch]     = useState('');
  const [showModal, setShow]    = useState(false);
  const [editItem, setEdit]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return leasing.filter(l => !q || l.name.toLowerCase().includes(q) || l.branch.toLowerCase().includes(q) || l.pic.toLowerCase().includes(q));
  }, [leasing, debouncedSearch]);

  const openEdit = useCallback(item => { setEdit(item); setForm({ ...item }); setErrors({}); setShow(true); }, []);
  const openAdd  = useCallback(()   => { setEdit(null); setForm(EMPTY); setErrors({}); setShow(true); }, []);
  const sf = useCallback(k => v => setForm(p => ({ ...p, [k]: v })), []);

  const validate = () => {
    const e = {};
    if (!form.name?.trim())    e.name    = 'Nama leasing wajib diisi';
    if (!form.branch?.trim())  e.branch  = 'Cabang/kota wajib diisi';
    if (!form.pic?.trim())     e.pic     = 'PIC wajib diisi';
    if (!form.contact?.trim()) e.contact = 'Nomor kontak wajib diisi';
    if (!form.rate?.toString().trim()) e.rate = 'Rate wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    let ok;
    if (editItem) {
      ok = await updateLeasing(editItem.id, form);
      if (ok) showToast(`Data leasing ${form.name} berhasil diperbarui`);
    } else {
      ok = await addLeasing(form);
      if (ok) showToast(`Leasing ${form.name} berhasil ditambahkan`);
    }
    setSaving(false);
    if (ok) setShow(false);
  };


  const aktif    = leasing.filter(l => l.status === 'aktif').length;
  const nonaktif = leasing.filter(l => l.status === 'nonaktif').length;

  return (
    <Layout
      title="Master Data Leasing"
      subtitle={`${aktif} mitra aktif · ${nonaktif} nonaktif`}
      actions={
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah Leasing</button>
      }
    >
      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div className="search-input" style={{ maxWidth: 400 }}>
          <Search size={14} color="var(--c-94a3b8)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama leasing, kota, PIC..." />
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-0f172a)' }}>Tidak ada leasing ditemukan</p>
            <p style={{ fontSize: 13, color: 'var(--c-94a3b8)' }}>Coba ubah kata kunci pencarian</p>
          </div>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {filtered.map(l => (
          <LeasingCard key={l.id} l={l} onEdit={openEdit} />
        ))}
      </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShow(false)}
        title={editItem ? 'Edit Data Leasing' : 'Tambah Mitra Leasing'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShow(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <LF label="Nama Leasing" name="name" form={form} sf={sf} errors={errors} />
          </div>
          <LF label="Cabang/Kota" name="branch" form={form} sf={sf} errors={errors} />
          <LF label="PIC Leasing" name="pic" form={form} sf={sf} errors={errors} />
          <LF label="Nomor Kontak" name="contact" form={form} sf={sf} errors={errors} />
          <LF label="Email" name="email" type="email" form={form} sf={sf} errors={errors} />
          <div style={{ gridColumn: 'span 2' }}>
            <LF label="Produk Pinjaman" name="products" form={form} sf={sf} errors={errors} />
          </div>
          <LF label="Rate/Bunga (%)" name="rate" form={form} sf={sf} errors={errors} />
          <LF label="Tenor Tersedia (pisah koma)" name="tenors" form={form} sf={sf} errors={errors} />
          <LF label="Min. Pinjaman (Rp)" name="minPinjaman" type="number" form={form} sf={sf} errors={errors} />
          <LF label="Maks. Pinjaman (Rp)" name="maxPinjaman" type="number" form={form} sf={sf} errors={errors} />
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => sf('status')(e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Syarat Dokumen</label>
            <textarea className="input textarea" value={form.syarat || ''} onChange={e => sf('syarat')(e.target.value)} rows={2} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Catatan Kerja Sama</label>
            <textarea className="input textarea" value={form.notes || ''} onChange={e => sf('notes')(e.target.value)} rows={2} />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

function LeasingCard({ l, onEdit }) {
  return (
    <div className="card" style={{ transition: 'transform .15s, box-shadow .15s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={20} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)', lineHeight: 1.3 }}>{l.name}</h3>
            <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginTop: 1 }}>{l.branch}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge status={l.status} />
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }} onClick={() => onEdit(l)}>
            <Edit2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-64748b)' }}>
          <Phone size={12} color="var(--c-94a3b8)" /> {l.pic} · {l.contact}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-64748b)' }}>
          <Mail size={12} color="var(--c-94a3b8)" /> {l.email}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-64748b)' }}>
          <Percent size={12} color="var(--c-94a3b8)" /> Rate: <strong style={{ color: 'var(--c-0f172a)' }}>{l.rate}</strong>/bulan · Tenor: {l.tenors} bln
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <div style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, color: 'var(--c-94a3b8)', marginBottom: 4 }}>Min. Pinjaman</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-0f172a)' }}>{formatRupiah(l.minPinjaman)}</p>
        </div>
        <div style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, color: 'var(--c-94a3b8)', marginBottom: 4 }}>Maks. Pinjaman</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-0f172a)' }}>{formatRupiah(l.maxPinjaman)}</p>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 10 }}>
        Produk: <span style={{ color: 'var(--c-64748b)' }}>{l.products}</span>
      </p>
    </div>
  );
}
