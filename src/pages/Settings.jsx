import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/dummyData';
import { Settings as SettingsIcon, Sun, Moon, Save, Database, Percent, CheckCircle, Info, Bell, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const BACKUP_KEYS = ['applications', 'commissions', 'agents', 'leasing', 'users', 'notifications', 'auditLogs', 'statusLogs'];

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginTop: 2 }}>{desc}</p>}
      </div>
      <button onClick={onChange}
        style={{
          position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: value ? '#3b82f6' : 'var(--border)', transition: 'background .2s', flexShrink: 0, marginLeft: 16,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20,
          background: 'var(--surface)', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          transition: 'left .2s',
        }} />
      </button>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, suffix, prefix }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-94a3b8)', fontSize: 13 }}>{prefix}</span>}
        <input
          className="input" type={type} value={value}
          onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          style={{ paddingLeft: prefix ? 30 : undefined, paddingRight: suffix ? 40 : undefined }}
        />
        {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-94a3b8)', fontSize: 13 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, desc, color = '#3b82f6', bg = '#eff6ff', children }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 22px', borderBottom: '1px solid var(--border-light)',
        background: 'var(--surface-alt)',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{title}</h3>
          {desc && <p style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginTop: 1 }}>{desc}</p>}
        </div>
      </div>
      <div style={{ padding: '20px 22px' }}>
        {children}
      </div>
    </div>
  );
}

export function Settings() {
  const app = useApp();
  const { darkMode, setDarkMode, settings, saveSettings, showToast, currentUser } = app;
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  const canAccess = ['owner', 'super-admin'].includes(currentUser?.role);
  if (!canAccess) return (
    <Layout title="Pengaturan">
      <div className="empty-state"><p>Anda tidak memiliki akses ke halaman ini.</p></div>
    </Layout>
  );

  // Notification push state
  const [users, setUsers] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [roleMsg, setRoleMsg] = useState('');

  useEffect(() => {
    supabase.from('dsd_profiles').select('id,name,email,role,agent_id').order('name')
      .then(({ data }) => { if (data) setUsers(data); });
  }, []);

  // Fitur 2: Kirim notif per-agen berdasarkan berkas aktif mereka
  const sendBerkasNotifPerAgen = async () => {
    setNotifLoading(true);
    try {
      const { data: apps, error: appsErr } = await supabase
        .from('dsd_applications')
        .select('id,customer_name,status,agent_id,agent_name,input_date')
        .not('status', 'in', '(approve,cancel,reject)');
      if (appsErr) throw new Error(appsErr.message);
      if (!apps || apps.length === 0) { showToast('Tidak ada berkas aktif'); return; }

      // Kelompokkan per agent_id
      const byAgent = {};
      apps.forEach(a => {
        if (!a.agent_id) return;
        if (!byAgent[a.agent_id]) byAgent[a.agent_id] = { name: a.agent_name, berkas: [] };
        byAgent[a.agent_id].berkas.push(a);
      });

      // Cari user account tiap agen, kirim push message
      let sent = 0;
      for (const [agentId, data] of Object.entries(byAgent)) {
        // State `users` memakai camelCase (agentId) — u.agent_id selalu undefined
        const user = users.find(u => u.agentId === agentId);
        if (!user) continue;
        const list = data.berkas.map(b => {
          const sla = b.input_date
            ? Math.floor((Date.now() - new Date(b.input_date).getTime()) / 86400000)
            : 0;
          return `• ${b.customer_name} (${b.status}, SLA ${sla} hari)`;
        }).join('\n');
        const { error } = await supabase.from('dsd_push_messages').insert({
          target_user_id: user.id,
          title: `📋 ${data.berkas.length} Berkas Aktif Menunggu`,
          body: list,
        });
        if (!error) sent++;
      }
      showToast(`Notifikasi dikirim ke ${sent} agen`);
    } catch (e) {
      showToast('Gagal kirim notifikasi: ' + e.message);
    } finally {
      setNotifLoading(false);
    }
  };

  // Fitur 3: Kirim pesan ke semua user dengan role tertentu
  const sendRoleNotif = async () => {
    if (!targetRole) { showToast('Pilih role tujuan'); return; }
    if (!roleMsg.trim()) { showToast('Tulis isi pesan'); return; }
    setNotifLoading(true);
    try {
      const roleUsers = users.filter(u => u.role === targetRole);
      if (roleUsers.length === 0) { showToast(`Tidak ada user dengan role ${targetRole}`); return; }
      let sent = 0;
      for (const u of roleUsers) {
        const { error } = await supabase.from('dsd_push_messages').insert({
          target_user_id: u.id,
          title: '📬 Pesan dari Owner',
          body: roleMsg.trim(),
        });
        if (!error) sent++;
      }
      showToast(`Pesan terkirim ke ${sent} akun (${targetRole})`);
      setRoleMsg('');
      setTargetRole('');
    } catch (e) {
      showToast('Gagal kirim: ' + e.message);
    } finally {
      setNotifLoading(false);
    }
  };

  const sendTargetedNotif = async () => {
    if (!targetUserId) { showToast('Pilih akun tujuan'); return; }
    if (!customMsg.trim()) { showToast('Tulis pesan notifikasi'); return; }
    setNotifLoading(true);
    try {
      const target = users.find(u => u.id === targetUserId);
      const { error } = await supabase.from('dsd_push_messages').insert({
        target_user_id: targetUserId,
        title: '📬 Pesan dari Owner',
        body: customMsg.trim(),
      });
      if (error) throw new Error(error.message);
      showToast(`Pesan terkirim ke ${target?.name || targetUserId}`);
      setCustomMsg('');
      setTargetUserId('');
    } catch (e) {
      showToast('Gagal kirim: ' + e.message);
    } finally {
      setNotifLoading(false);
    }
  };

  // Ikuti settings dari server saat baru dimuat (sinkron antar user)
  useEffect(() => { setLocalSettings(settings); }, [settings]);

  const sf = key => val => setLocalSettings(p => ({ ...p, [key]: val }));
  const toggle = key => () => setLocalSettings(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    saveSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportBackup = () => {
    const backup = { exportedAt: new Date().toISOString(), data: {} };
    BACKUP_KEYS.forEach(key => { backup.data[key] = app[key]; });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeerp-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup data berhasil diunduh');
  };

  // Contoh perhitungan komisi live berdasarkan setting saat ini
  const contohPinjaman = 10_000_000;
  const contohKomisi   = Math.round(contohPinjaman * (localSettings.commissionRate || 0) / 100);

  return (
    <Layout title="Pengaturan Sistem" subtitle="Konfigurasi perusahaan, komisi, dan tampilan — berlaku untuk semua user">
      <div className="rgrid rgrid-2" style={{ gap: 20 }}>
        {/* Company profile */}
        <Section icon={SettingsIcon} title="Profil Perusahaan" desc="Identitas perusahaan untuk laporan & cetakan" color="#3b82f6" bg="#eff6ff">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nama Perusahaan" value={localSettings.companyName} onChange={sf('companyName')} />
            <Field label="Alamat" value={localSettings.address} onChange={sf('address')} />
            <Field label="Telepon" value={localSettings.phone} onChange={sf('phone')} />
            <Field label="Email" type="email" value={localSettings.email} onChange={sf('email')} />
          </div>
        </Section>

        {/* Commission */}
        <Section icon={Percent} title="Aturan Komisi" desc="Berlaku untuk semua user setelah disimpan" color="#16a34a" bg="#f0fdf4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Rate Komisi Leasing Default (%)" value={localSettings.commissionRate} type="number" onChange={sf('commissionRate')} suffix="%" />
            <Toggle
              label="Hitung Komisi Otomatis"
              desc="Komisi dibuat otomatis saat pengajuan approve"
              value={localSettings.autoCommission !== false}
              onChange={toggle('autoCommission')}
            />
            {/* Ilustrasi perhitungan */}
            <div style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={13} color="var(--c-64748b)" />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-64748b)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  Contoh: pinjaman {formatRupiah(contohPinjaman)}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--c-64748b)' }}>Komisi ({localSettings.commissionRate || 0}%)</span>
                  <strong style={{ color: '#16a34a' }}>{formatRupiah(contohKomisi)}</strong>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 8, lineHeight: 1.5 }}>
                Rate default dipakai jika leasing belum punya tabel komisi sendiri. Tabel per leasing dikelola di <strong>Master Data → Tabel Rate</strong>.
              </p>
            </div>
          </div>
        </Section>

        {/* Appearance & data */}
        <Section icon={Sun} title="Tampilan & Tema" desc="Preferensi tampilan per perangkat" color="#f59e0b" bg="#fffbeb">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)', marginBottom: 12 }}>Mode Tampilan</p>
          <div className="rgrid rgrid-2" style={{ gap: 10 }}>
            {[
              { label: 'Mode Terang', dark: false, icon: Sun, color: '#f59e0b' },
              { label: 'Mode Gelap', dark: true, icon: Moon, color: '#475569' },
            ].map(({ label, dark, icon: Icon, color }) => (
              <button key={label} onClick={() => setDarkMode(dark)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  border: `2px solid ${darkMode === dark ? '#3b82f6' : 'var(--border)'}`,
                  background: darkMode === dark ? 'var(--selected-bg)' : 'var(--surface)',
                  borderRadius: 12, cursor: 'pointer', transition: 'all .15s',
                }}
              >
                <Icon size={18} color={color} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>{label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--c-94a3b8)', marginTop: 10 }}>
            Mode tampilan tersimpan per perangkat, tidak ikut disinkron ke user lain.
          </p>
        </Section>

        {/* Backup */}
        <Section icon={Database} title="Backup Data" desc="Arsip data dalam format JSON" color="#8b5cf6" bg="#f5f3ff">
          <p style={{ fontSize: 12, color: 'var(--c-64748b)', marginBottom: 14, lineHeight: 1.6 }}>
            Unduh salinan seluruh data (berkas, agen, komisi, leasing, user, log) sebagai file JSON untuk arsip.
            Data utama tetap tersimpan aman di server.
          </p>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportBackup}>
            <Database size={15} /> Export Backup (JSON)
          </button>
        </Section>
      </div>

      {/* Notification Push */}
      <div style={{ marginTop: 20 }}>
        <Section icon={Bell} title="Notifikasi Push ke APK" desc="Kirim pesan yang muncul sebagai notifikasi HP di aplikasi agen" color="#ef4444" bg="#fef2f2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Fitur 2: Berikan Notif per agen (berkas aktif) */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 4 }}>Pengingat Berkas Aktif per Agen</p>
              <p style={{ fontSize: 12, color: 'var(--c-64748b)', marginBottom: 10, lineHeight: 1.5 }}>
                Kirim notifikasi ke masing-masing agen berisi daftar berkas aktif mereka (nama debitur, status, SLA hari).
              </p>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={sendBerkasNotifPerAgen}
                disabled={notifLoading}
              >
                <Bell size={15} />
                {notifLoading ? 'Mengirim...' : 'Berikan Notif Berkas ke Semua Agen'}
              </button>
            </div>

            {/* Fitur 3: Pesan ke role */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 4 }}>Kirim Pesan ke Role</p>
              <p style={{ fontSize: 12, color: 'var(--c-64748b)', marginBottom: 10, lineHeight: 1.5 }}>
                Pesan dikirim ke semua akun dengan role yang dipilih.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="label">Pilih Role Tujuan</label>
                  <select className="input" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                    <option value="">-- Pilih role --</option>
                    {[
                      { value: 'agen',       label: 'Agen' },
                      { value: 'spv-agen',   label: 'Supervisor Agen' },
                      { value: 'owner',      label: 'Owner' },
                      { value: 'super-admin', label: 'Super Admin' },
                    ].map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Isi Pesan</label>
                  <textarea
                    className="input" rows={3}
                    placeholder="Tulis pesan untuk semua user dengan role tersebut..."
                    value={roleMsg} onChange={e => setRoleMsg(e.target.value)}
                    style={{ resize: 'vertical', minHeight: 72 }}
                  />
                </div>
                <button
                  className="btn btn-secondary" style={{ justifyContent: 'center' }}
                  onClick={sendRoleNotif} disabled={notifLoading}
                >
                  <Send size={15} />
                  {notifLoading ? 'Mengirim...' : `Kirim ke Semua ${targetRole ? targetRole.charAt(0).toUpperCase() + targetRole.slice(1) : 'Role'}`}
                </button>
              </div>
            </div>

            {/* Pesan ke akun tertentu */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 4 }}>Pesan ke Akun Tertentu</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="label">Pilih Akun</label>
                  <select className="input" value={targetUserId} onChange={e => setTargetUserId(e.target.value)}>
                    <option value="">-- Pilih akun --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Isi Pesan</label>
                  <textarea
                    className="input" rows={3}
                    placeholder="Tulis pesan yang akan diterima sebagai notifikasi HP..."
                    value={customMsg} onChange={e => setCustomMsg(e.target.value)}
                    style={{ resize: 'vertical', minHeight: 72 }}
                  />
                </div>
                <button
                  className="btn btn-secondary" style={{ justifyContent: 'center' }}
                  onClick={sendTargetedNotif} disabled={notifLoading}
                >
                  <Send size={15} />
                  {notifLoading ? 'Mengirim...' : 'Kirim Pesan'}
                </button>
              </div>
            </div>

          </div>
        </Section>
      </div>

      {/* Save button */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave}
          className={`btn btn-lg ${saved ? 'btn-success' : 'btn-primary'}`}
          style={{ justifyContent: 'center', minWidth: 180 }}
        >
          {saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>
    </Layout>
  );
}
