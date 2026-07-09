import { useState, useRef } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Sun, Moon, Save, Bell, Database, Percent, CheckCircle } from 'lucide-react';

const BACKUP_KEYS = ['applications', 'commissions', 'agents', 'leasing', 'users', 'notifications', 'auditLogs', 'statusLogs'];

function Toggle({ label, name, desc, value, onChange }) {
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

function Field({ label, name, type = 'text', value, onChange, suffix, prefix }) {
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

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="#3b82f6" />
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Settings() {
  const app = useApp();
  const { darkMode, setDarkMode, settings, saveSettings, showToast } = app;
  const fileInputRef = useRef(null);
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

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

  const setterFor = {
    applications: app.setApplications, commissions: app.setCommissions, agents: app.setAgents,
    leasing: app.setLeasing, users: app.setUsers, notifications: app.setNotifications,
    auditLogs: app.setAuditLogs, statusLogs: app.setStatusLogs,
  };

  const handleImportFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const data = parsed.data || parsed;
        let restored = 0;
        BACKUP_KEYS.forEach(key => {
          if (Array.isArray(data[key]) && setterFor[key]) {
            setterFor[key](data[key]);
            restored++;
          }
        });
        if (restored === 0) throw new Error('Format file tidak dikenali');
        showToast(`Data berhasil dipulihkan dari backup (${restored} bagian)`);
      } catch (err) {
        showToast('Gagal memuat file backup: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Layout title="Pengaturan Sistem" subtitle="Konfigurasi perusahaan, komisi, dan notifikasi">
      <div className="rgrid rgrid-2" style={{ gap: 20 }}>
        {/* Company profile */}
        <Section icon={SettingsIcon} title="Profil Perusahaan">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nama Perusahaan" name="companyName" value={localSettings.companyName} onChange={sf('companyName')} />
            <Field label="Alamat" name="address" value={localSettings.address} onChange={sf('address')} />
            <Field label="Telepon" name="phone" value={localSettings.phone} onChange={sf('phone')} />
            <Field label="Email" name="email" type="email" value={localSettings.email} onChange={sf('email')} />
          </div>
        </Section>

        {/* Commission & SLA */}
        <Section icon={Percent} title="Aturan Komisi & SLA">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Rate Komisi Default (%)" value={localSettings.commissionRate} type="number" onChange={sf('commissionRate')} suffix="%" />
            <Field label="SLA Proses Berkas (hari)" value={localSettings.slaProses} type="number" onChange={sf('slaProses')} suffix=" hari" />
            <Field label="SLA Review Admin (hari)" value={localSettings.slaReview} type="number" onChange={sf('slaReview')} suffix=" hari" />
            <Toggle
              label="Hitung Komisi Otomatis"
              desc="Komisi dibuat otomatis saat pengajuan approve"
              value={localSettings.autoCommission}
              onChange={toggle('autoCommission')}
            />
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Pengaturan Notifikasi">
          <Toggle label="Berkas Baru Masuk" desc="Notifikasi setiap ada berkas baru" value={localSettings.notifBerkasBaru} onChange={toggle('notifBerkasBaru')} />
          <Toggle label="Perubahan Status" desc="Notifikasi setiap status berkas berubah" value={localSettings.notifStatusUbah} onChange={toggle('notifStatusUbah')} />
          <Toggle label="Jadwal Survey Hari Ini" desc="Pengingat survey yang terjadwal hari ini" value={localSettings.notifSurveyHariIni} onChange={toggle('notifSurveyHariIni')} />
          <Toggle label="Komisi Belum Dibayar" desc="Pengingat komisi yang belum dibayarkan" value={localSettings.notifKomisiUnpaid} onChange={toggle('notifKomisiUnpaid')} />
          <Toggle label="Berkas Aging" desc="Alert untuk berkas yang terlalu lama diproses" value={localSettings.notifBerkasAging} onChange={toggle('notifBerkasAging')} />
        </Section>

        {/* Appearance */}
        <Section icon={Sun} title="Tampilan & Tema">
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)', marginBottom: 12 }}>Mode Tampilan</p>
            <div className="rgrid rgrid-2" style={{ gap: 10, marginBottom: 20 }}>
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

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Database size={14} color="var(--c-64748b)" />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-0f172a)' }}>Backup & Data</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleExportBackup}>Export Backup</button>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>Import Data</button>
                <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
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
