import { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/dummyData';
import { Calculator, Star } from 'lucide-react';

export function Simulation() {
  const { leasing } = useApp();
  const [form, setForm] = useState({
    harga: 200000000, uangMuka: 40000000, tenor: 48, rate: 1.4,
    leasingId: 1, biayaAdmin: 1500000, biayaAsuransi: 2000000, biayaProvisi: 1, biayaLain: 500000,
  });
  const [result, setResult] = useState(null);

  const calcAngsuran = (pokok, rate, tenor) => {
    const flat = pokok * (rate / 100);
    return Math.round(pokok / tenor + flat);
  };

  const calculate = () => {
    const pokok      = form.harga - form.uangMuka;
    const provisi    = pokok * (form.biayaProvisi / 100);
    const totalBiaya = form.biayaAdmin + form.biayaAsuransi + provisi + form.biayaLain;
    const angsuran   = calcAngsuran(pokok, form.rate, form.tenor);
    const totalBayar = angsuran * form.tenor;
    const totalBunga = totalBayar - pokok;
    const pencairan  = pokok - totalBiaya;

    const comparisons = leasing.filter(l => l.status === 'aktif').slice(0, 4).map(l => ({
      leasing: l.name,
      rate: parseFloat(l.rate),
      angsuran: calcAngsuran(pokok, parseFloat(l.rate), form.tenor),
    }));

    setResult({ pokok, totalBiaya, angsuran, totalBayar, totalBunga, pencairan, comparisons });
  };

  const sf = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  const Field = ({ label, name, prefix, suffix, type = 'number' }) => (
    <div>
      <label className="label">{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--c-94a3b8)' }}>{prefix}</span>}
        <input
          className="input" type={type} value={form[name]}
          onChange={sf(name)}
          style={{ paddingLeft: prefix ? 36 : undefined, paddingRight: suffix ? 40 : undefined }}
        />
        {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--c-94a3b8)' }}>{suffix}</span>}
      </div>
    </div>
  );

  return (
    <Layout title="Simulasi Angsuran" subtitle="Hitung estimasi cicilan dan bandingkan antar leasing">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Calculator size={18} color="#3b82f6" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)' }}>Parameter Simulasi</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Harga / Nilai Taksasi Unit (Rp)" name="harga" prefix="Rp" />
            <Field label="Uang Muka / DP (Rp)" name="uangMuka" prefix="Rp" />

            <div>
              <label className="label">Tenor (bulan)</label>
              <select className="input" value={form.tenor} onChange={e => setForm(p => ({ ...p, tenor: Number(e.target.value) }))}>
                {[12, 18, 24, 36, 48, 60].map(t => <option key={t} value={t}>{t} bulan</option>)}
              </select>
            </div>

            <div>
              <label className="label">Leasing</label>
              <select className="input" value={form.leasingId} onChange={e => {
                const l = leasing.find(ls => ls.id === Number(e.target.value));
                setForm(p => ({ ...p, leasingId: Number(e.target.value), rate: parseFloat(l?.rate) || p.rate }));
              }}>
                {leasing.filter(l => l.status === 'aktif').map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.rate}%)</option>
                ))}
              </select>
            </div>

            <Field label="Rate / Bunga per Bulan (%)" name="rate" suffix="%" />

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-94a3b8)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Biaya Tambahan</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Biaya Admin (Rp)" name="biayaAdmin" prefix="Rp" />
                <Field label="Biaya Asuransi (Rp)" name="biayaAsuransi" prefix="Rp" />
                <Field label="Biaya Provisi (%)" name="biayaProvisi" suffix="%" />
                <Field label="Biaya Lain-lain (Rp)" name="biayaLain" prefix="Rp" />
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={calculate}>
              <Calculator size={17} /> Hitung Simulasi
            </button>
          </div>
        </div>

        {/* Result */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Main result */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius: 16, padding: '28px 24px' }}>
              <p style={{ fontSize: 12, color: '#93c5fd', marginBottom: 4 }}>Estimasi Angsuran per Bulan</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16 }}>{formatRupiah(result.angsuran)}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { l: 'Pokok Pinjaman', v: formatRupiah(result.pokok) },
                  { l: 'Total Pembayaran', v: formatRupiah(result.totalBayar) },
                  { l: 'Total Bunga', v: formatRupiah(result.totalBunga) },
                  { l: 'Total Biaya Lain', v: formatRupiah(result.totalBiaya) },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p style={{ fontSize: 11, color: '#93c5fd', marginBottom: 2 }}>{l}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pencairan */}
            <div className="alert alert-success" style={{ padding: '14px 18px', borderRadius: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Estimasi Pencairan ke Agen</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#15803d', marginTop: 2 }}>{formatRupiah(result.pencairan)}</p>
                <p style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Setelah dikurangi semua biaya</p>
              </div>
            </div>

            {/* Comparison */}
            <div className="card">
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-0f172a)', marginBottom: 14 }}>Perbandingan Antar Leasing</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.comparisons.sort((a, b) => a.angsuran - b.angsuran).map((comp, i) => (
                  <div key={comp.leasing} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', borderRadius: 10,
                    background: i === 0 ? '#f0fdf4' : 'var(--surface-alt)',
                    border: i === 0 ? '1.5px solid #bbf7d0' : '1px solid var(--border-light)',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#15803d' : 'var(--c-0f172a)' }}>{comp.leasing}</p>
                        {i === 0 && <span style={{ fontSize: 10, background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>Termurah</span>}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>Rate: {comp.rate}%/bulan</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? '#15803d' : 'var(--c-0f172a)' }}>{formatRupiah(comp.angsuran)}</p>
                      <p style={{ fontSize: 11, color: 'var(--c-94a3b8)' }}>/bulan</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#eff6ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Calculator size={30} color="#93c5fd" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--c-64748b)', textAlign: 'center', lineHeight: 1.6 }}>
              Isi parameter di sebelah kiri<br />dan klik <strong>Hitung Simulasi</strong>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
