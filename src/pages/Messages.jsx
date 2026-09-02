import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { MessageSquare, Search, Phone } from 'lucide-react';

const STATUS_STYLE = {
  baru:     { label: 'Baru',     color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  diproses: { label: 'Diproses', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  selesai:  { label: 'Selesai',  color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
};

const waLink = (phone, name) => {
  const intl = String(phone || '').replace(/\D/g, '').replace(/^0/, '62');
  const msg = encodeURIComponent(`Halo ${name || ''}, terima kasih sudah menghubungi Solusi Dana Sahabat.`);
  return `https://wa.me/${intl}?text=${msg}`;
};

/**
 * Pesan masuk dari form "Hubungi Kami" di landing page.
 *
 * Dimuat langsung di halaman ini (bukan lewat AppContext) karena hanya
 * owner/super-admin yang boleh melihatnya — menaruhnya di context berarti
 * setiap role ikut menariknya dan hanya ditolak RLS secara diam-diam.
 */
export function Messages() {
  const { showToast, currentUser } = useApp();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dsd_contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else { setError(null); setRows(data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    const { error } = await supabase.from('dsd_contact_messages').update({ status }).eq('id', id);
    if (error) { showToast('Gagal memperbarui status: ' + error.message, 'error'); return; }
    // handled_by/handled_at diisi trigger di server — muat ulang agar tampilan
    // menunjukkan nilai yang benar-benar tersimpan, bukan tebakan lokal.
    await load();
    showToast(`Pesan ditandai ${STATUS_STYLE[status]?.label || status}`);
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const cocokTeks = !q
      || (r.name || '').toLowerCase().includes(q)
      || (r.phone || '').includes(q)
      || (r.message || '').toLowerCase().includes(q);
    return cocokTeks && (filter === 'all' || r.status === filter);
  });

  const jumlahBaru = rows.filter(r => r.status === 'baru').length;

  return (
    <Layout title="Pesan Masuk" subtitle="Pesan dari form Hubungi Kami di website">
      {jumlahBaru > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <MessageSquare size={15} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>
            <strong>{jumlahBaru} pesan belum ditindaklanjuti.</strong> Calon nasabah menunggu dihubungi.
          </span>
        </div>
      )}

      <div className="card no-print" style={{ padding: 14, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-94a3b8)' }} />
          <input
            className="input search-input" style={{ paddingLeft: 34 }}
            placeholder="Cari nama, nomor, atau isi pesan..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ maxWidth: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Semua status</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p>Memuat pesan...</p></div>
      ) : error ? (
        <div className="empty-state"><p>Gagal memuat pesan: {error}</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{rows.length === 0 ? 'Belum ada pesan masuk dari website.' : 'Tidak ada pesan yang cocok dengan filter.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(m => {
            const st = STATUS_STYLE[m.status] || STATUS_STYLE.baru;
            return (
              <div key={m.id} className="card" style={{ padding: 18, borderLeft: `4px solid ${st.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--c-64748b)' }}>{m.phone}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>
                    {m.created_at ? new Date(m.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--c-374151)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--surface-alt)', borderRadius: 9, padding: '10px 14px' }}>
                  {m.message}
                </p>

                {m.handled_by && (
                  <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 8 }}>
                    Ditangani {m.handled_by}
                    {m.handled_at && ` · ${new Date(m.handled_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                )}

                <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <a className="btn btn-secondary btn-sm" href={waLink(m.phone, m.name)} target="_blank" rel="noreferrer">
                    <Phone size={13} /> Balas via WhatsApp
                  </a>
                  {m.status !== 'diproses' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setStatus(m.id, 'diproses')}>Tandai Diproses</button>
                  )}
                  {m.status !== 'selesai' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setStatus(m.id, 'selesai')}>Tandai Selesai</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
