import { useState, useMemo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { formatRupiah } from '../data/dummyData';
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';

// ─── TABEL CMD Finance (nilai dalam ribuan rupiah) ───────────────────────────
const MOTOR_TENORS = [6, 12, 18, 24, 30, 36];
const CAR_TENORS   = [12, 24, 36, 48];

// Motor Angsuran NEW  [t6, t12, t18, t24, t30, t36]
const M_NEW_ANG = {
  5000:[1108,626,480,431,388,359],  5500:[1237,686,526,412,365,333],
  6000:[1344,718,545,448,396,362],  6500:[1452,776,588,484,428,391],
  7000:[1498,821,619,519,459,420],  7500:[1601,877,662,555,491,448],
  8000:[1704,933,704,591,522,477],  8500:[1807,990,747,626,554,506],
  9000:[1886,1046,789,662,585,535], 9500:[1988,1103,832,698,617,564],
  10000:[2090,1159,875,704,619,563],10500:[2173,1215,917,739,649,591],
  11000:[2274,1281,969,774,681,620],11500:[2375,1338,1012,805,708,643],
  12000:[2476,1364,1024,839,738,671],12500:[2577,1419,1066,873,768,698],
  13000:[2678,1475,1107,908,798,725],13500:[2779,1531,1149,942,828,753],
  14000:[2880,1586,1191,976,858,780],14500:[2981,1642,1232,1010,888,807],
  15000:[3030,1671,1274,1044,918,834],15500:[3129,1726,1316,1078,948,862],
  16000:[3228,1781,1357,1113,978,889],16500:[3328,1821,1399,1147,1008,916],
  17000:[3427,1876,1441,1181,1038,944],17500:[3511,1930,1483,1215,1068,971],
  18000:[3610,1984,1509,1226,1059,959],18500:[3709,2038,1550,1259,1088,985],
  19000:[3808,2093,1591,1293,1117,1011],19500:[3906,2147,1632,1326,1146,1037],
  20000:[4005,2201,1674,1360,1175,1064],
};
// Motor Angsuran RO  [t6, t12, t18, t24, t30, t36]
const M_RO_ANG = {
  5000:[1088,603,447,362,322,291],  5500:[1173,643,482,392,351,316],
  6000:[1273,692,522,422,381,341],  6500:[1364,742,557,451,406,370],
  7000:[1467,802,596,496,430,395],  7500:[1567,852,631,516,460,420],
  8000:[1662,901,666,545,485,444],  8500:[1757,961,706,595,514,469],
  9000:[1846,1006,745,610,544,494], 9500:[1946,1061,780,645,574,518],
  10000:[2056,1110,825,674,603,543],10500:[2141,1170,879,709,632,572],
  11000:[2235,1220,919,745,658,597],11500:[2330,1270,959,773,683,617],
  12000:[2430,1324,999,808,707,642],12500:[2525,1379,1038,838,732,656],
  13000:[2620,1429,1078,867,757,686],13500:[2719,1484,1118,902,781,701],
  14000:[2804,1533,1158,937,806,725],14500:[2909,1588,1197,962,826,745],
  15000:[2999,1633,1232,991,851,765],15500:[3093,1683,1272,1021,870,789],
  16000:[3193,1738,1311,1056,900,814],16500:[3288,1787,1351,1085,920,839],
  17000:[3383,1842,1391,1120,945,863],17500:[3478,1892,1441,1150,969,888],
  18000:[3572,1942,1470,1180,994,913],18500:[3672,1996,1510,1214,1019,937],
  19000:[3762,2046,1550,1244,1043,962],19500:[3862,2101,1590,1279,1068,987],
  20000:[3957,2151,1629,1308,1093,1011],
};
// Motor Fee/Insentif NEW  [t6, t12, t18, t24, t30, t36]
const M_NEW_FEE = {
  5000:[125,175,225,300,375,400],   5500:[125,175,225,300,375,400],
  6000:[200,300,400,500,600,650],   6500:[200,300,400,500,600,650],
  7000:[200,300,400,500,600,650],   7500:[200,300,400,500,600,650],
  8000:[250,350,550,650,675,700],   8500:[250,350,550,650,675,700],
  9000:[250,350,550,650,675,700],   9500:[250,350,550,650,675,700],
  10000:[250,350,550,650,675,700],  10500:[275,375,575,675,700,725],
  11000:[275,375,575,675,700,725],  11500:[275,375,575,675,700,725],
  12000:[275,375,575,675,700,725],  12500:[275,375,575,675,700,725],
  13000:[275,375,575,675,700,725],  13500:[275,375,575,675,700,725],
  14000:[275,375,575,675,700,725],  14500:[275,375,575,675,700,725],
  15000:[275,375,575,675,700,725],  15500:[275,375,575,675,700,725],
  16000:[275,375,575,675,700,725],  16500:[275,375,575,675,700,725],
  17000:[275,375,575,675,700,725],  17500:[275,375,575,675,700,725],
  18000:[275,375,575,675,700,725],  18500:[275,375,575,675,700,725],
  19000:[275,375,575,675,700,725],  19500:[275,375,575,675,700,725],
  20000:[275,375,575,675,700,725],
};
// Motor Fee/Insentif RO  [t6, t12, t18, t24, t30, t36]
const M_RO_FEE = {
  5000:[100,100,150,150,200,200],   5500:[100,100,150,150,200,200],
  6000:[150,150,200,200,250,250],   6500:[150,150,200,200,250,250],
  7000:[150,150,200,200,250,250],   7500:[150,150,200,200,250,250],
  8000:[150,150,200,200,250,250],   8500:[200,200,250,250,300,300],
  9000:[200,200,250,250,300,300],   9500:[200,200,250,250,300,300],
  10000:[200,200,250,250,300,300],  10500:[200,200,250,250,300,300],
  11000:[225,225,275,275,325,325],  11500:[225,225,275,275,325,325],
  12000:[225,225,275,275,325,325],  12500:[225,225,275,275,325,325],
  13000:[225,225,275,275,325,325],  13500:[225,225,275,275,325,325],
  14000:[225,225,275,275,325,325],  14500:[225,225,275,275,325,325],
  15000:[225,225,275,275,325,325],  15500:[225,225,275,275,325,325],
  16000:[225,225,275,275,325,325],  16500:[225,225,275,275,325,325],
  17000:[225,225,275,275,325,325],  17500:[225,225,275,275,325,325],
  18000:[225,225,275,275,325,325],  18500:[225,225,275,275,325,325],
  19000:[225,225,275,275,325,325],  19500:[225,225,275,275,325,325],
  20000:[225,225,275,275,325,325],
};

// Mobil Angsuran REGULER (non-RO)  [t12, t24, t36, t48]
const C_REG_ANG = {
  30000:[3462,1842,1364,1141],  35000:[3959,2111,1559,1299],
  40000:[4453,2382,1755,1458],  45000:[4964,2649,1947,1615],
  50000:[5471,2918,2142,1774],  55000:[5981,3188,2338,1936],
  60000:[6491,3456,2531,2095],  65000:[7000,3726,2728,2255],
  70000:[7510,3993,2922,2411],  75000:[8023,4266,3119,2572],
  80000:[8539,4536,3312,2729],  85000:[9047,4806,3507,2889],
  90000:[9557,5073,3699,3045],  95000:[10077,5355,3903,3211],
  100000:[10600,5637,4106,3376],110000:[11619,6174,4493,3692],
  120000:[12637,6712,4883,4010],130000:[13666,7258,5284,4343],
  140000:[14682,7797,5675,4662],150000:[15703,8334,6078,4978],
  160000:[16743,8894,6480,5321],170000:[17762,9430,6876,5636],
  180000:[18910,10080,7343,6041],190000:[19957,10658,7757,6385],
  200000:[21010,11201,8150,6705],
};
// Mobil Fee Agent REGULER  [t12, t24, t36, t48]
const C_REG_FEE = {
  30000:[850,1450,1600,1750],   35000:[1075,1775,1950,2125],
  40000:[1300,2100,2300,2500],  45000:[1525,2425,2650,2875],
  50000:[1500,2500,2750,3000],  55000:[1725,2825,3100,3375],
  60000:[1950,3150,3450,3750],  65000:[2175,3475,3800,4125],
  70000:[2400,3800,4150,4500],  75000:[2625,4125,4500,4875],
  80000:[2600,4200,4600,5000],  85000:[2825,4525,4950,5375],
  90000:[3050,4850,5300,5750],  95000:[3275,5175,5650,6125],
  100000:[3500,5500,6000,6500], 110000:[3950,6150,6700,7250],
  120000:[4400,6800,7400,8000], 130000:[4600,7200,7850,8500],
  140000:[5050,7850,8550,9250], 150000:[5500,8500,9250,10000],
  160000:[5950,9150,9950,10750],170000:[6150,9550,10400,11250],
  180000:[6600,10200,11100,12000],190000:[7050,10850,11800,12750],
  200000:[7500,11500,12500,13500],
};
// Mobil Angsuran RO  [t12, t24, t36, t48]
const C_RO_ANG = {
  30000:[3434,1818,1347,1127],  35000:[3924,2082,1538,1282],
  40000:[4410,2347,1730,1438],  45000:[4914,2609,1918,1592],
  50000:[5421,2877,2112,1749],  55000:[5924,3141,2304,1908],
  60000:[6426,3404,2493,2064],  65000:[6928,3669,2686,2221],
  70000:[7430,3930,2876,2374],  75000:[7936,4198,3069,2532],
  80000:[8453,4466,3261,2688],  85000:[8953,4731,3452,2845],
  90000:[9456,4993,3641,2998],  95000:[9968,5269,3841,3160],
  100000:[10484,5546,4040,3322],110000:[11488,6072,4419,3632],
  120000:[12491,6599,4801,3944],130000:[13513,7138,5197,4273],
  140000:[14514,7667,5580,4585],150000:[15520,8193,5976,4895],
  160000:[16545,8742,6370,5232],170000:[17557,9271,6761,5543],
  180000:[18690,9910,7220,5941],190000:[19722,10478,7626,6279],
  200000:[20760,11010,8012,6593],
};
// Mobil Fee Agent RO  [t12, t24, t36, t48]
const C_RO_FEE = {
  30000:[510,870,960,1050],     35000:[645,1065,1170,1275],
  40000:[780,1260,1380,1500],   45000:[915,1455,1590,1725],
  50000:[900,1500,1650,1800],   55000:[1035,1695,1860,2025],
  60000:[1170,1890,2070,2250],  65000:[1305,2085,2280,2475],
  70000:[1440,2280,2490,2700],  75000:[1575,2475,2700,2925],
  80000:[1560,2520,2760,3000],  85000:[1695,2715,2970,3225],
  90000:[1830,2910,3180,3450],  95000:[1965,3105,3390,3675],
  100000:[2100,3300,3600,3900], 110000:[2370,3690,4020,4350],
  120000:[2640,4080,4440,4800], 130000:[2760,4320,4710,5100],
  140000:[3030,4710,5130,5550], 150000:[3300,5100,5550,6000],
  160000:[3570,5490,5970,6450], 170000:[3690,5730,6240,6750],
  180000:[3960,6120,6660,7200], 190000:[4230,6510,7080,7650],
  200000:[4500,6900,7500,8100],
};

// ─── Interpolasi linear antar baris tabel ────────────────────────────────────
function lookupVal(table, tenors, pinjRibu, tenorBln) {
  const ti = tenors.indexOf(tenorBln);
  if (ti === -1) return null;
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (pinjRibu <= keys[0])              return table[keys[0]][ti] * 1000;
  if (pinjRibu >= keys[keys.length - 1]) return table[keys[keys.length - 1]][ti] * 1000;
  let lo = keys[0], hi = keys[1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (pinjRibu >= keys[i] && pinjRibu <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; break; }
  }
  const v1 = table[lo][ti], v2 = table[hi][ti];
  return Math.round(v1 + (pinjRibu - lo) / (hi - lo) * (v2 - v1)) * 1000;
}

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
  const [jenis,     setJenis]     = useState('motor');   // motor | mobil
  const [akad,      setAkad]      = useState('konven');  // konven | syariah
  const [isRO,      setIsRO]      = useState(false);
  const [pencairan, setPencairan] = useState('');
  const [tenor,     setTenor]     = useState(12);

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
    const angTable = jenis === 'motor' ? (isRO ? M_RO_ANG : M_NEW_ANG) : (isRO ? C_RO_ANG : C_REG_ANG);
    const feeTable = jenis === 'motor' ? (isRO ? M_RO_FEE : M_NEW_FEE) : (isRO ? C_RO_FEE : C_REG_FEE);
    const angsuran = lookupVal(angTable, tenors, pRibu, validTenor);
    const fee      = lookupVal(feeTable, tenors, pRibu, validTenor);
    if (!angsuran || !fee) return null;
    return {
      angsuran,
      fee,
      totalBayar:  angsuran * validTenor,
      outOfRange:  p < minP || p > maxP,
      rangeMsg:    p < minP ? `Minimum pencairan ${formatRupiah(minP)}` : p > maxP ? `Maksimum pencairan ${formatRupiah(maxP)}` : null,
    };
  }, [jenis, isRO, pencairan, validTenor, minP, maxP]);

  const labelJenis  = jenis === 'motor' ? 'Motor' : 'Mobil';
  const labelAkad   = akad  === 'syariah' ? 'Syariah' : 'Konvensional';
  const labelJenis2 = isRO  ? 'RO' : (jenis === 'motor' ? 'NEW' : 'REGULER');

  return (
    <Layout title="Simulasi CMD Finance" subtitle="Hitung angsuran dan komisi dari tabel resmi CMD Finance">
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
              <label className="label">Akad</label>
              <Toggle value={akad} onChange={setAkad} options={[
                { value:'konven',  label:'Konvensional' },
                { value:'syariah', label:'Syariah' },
              ]} />
              <p style={{ fontSize:11, color:'var(--c-94a3b8)', marginTop:5 }}>
                Tabel angsuran Konvensional dan Syariah identik untuk produk ini
              </p>
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
              <p style={{ fontSize:12, color:'var(--c-64748b)' }}>
                Silakan sesuaikan jumlah pencairan
              </p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Header angsuran */}
              <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', borderRadius:16, padding:'24px 20px' }}>
                <p style={{ fontSize:11, color:'#93c5fd', marginBottom:4, letterSpacing:'.04em', textTransform:'uppercase' }}>
                  {labelJenis} {labelAkad} · {labelJenis2} · {validTenor} Bulan
                </p>
                <p style={{ fontSize:11, color:'#93c5fd', marginBottom:2 }}>Angsuran per Bulan</p>
                <p style={{ fontSize:34, fontWeight:800, color:'#fff', marginBottom:16 }}>
                  {formatRupiah(result.angsuran)}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { l:'Jumlah Pinjaman',   v: formatRupiah(Number(pencairan)) },
                    { l:'Tenor',             v: `${validTenor} bulan` },
                    { l:'Total Bayar Nasabah', v: formatRupiah(result.totalBayar) },
                    { l:'Jenis Akad',        v: labelAkad },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p style={{ fontSize:11, color:'#93c5fd', marginBottom:2 }}>{l}</p>
                      <p style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee agent */}
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
                  Per berkas disetujui · {labelJenis} {labelJenis2}
                </p>
              </div>

              {/* Info tabel */}
              <div style={{ background:'var(--surface-alt)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:11, color:'var(--c-64748b)', lineHeight:1.6 }}>
                  Nilai berdasarkan tabel resmi <strong>CMD Finance</strong>. Angsuran dan fee dapat berbeda jika ada penyesuaian kebijakan internal leasing.
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
