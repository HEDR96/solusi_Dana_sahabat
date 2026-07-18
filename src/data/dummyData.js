export const STATUSES = [
  { key: 'pending', label: 'Pending', color: 'status-pending', hex: '#475569' },
  { key: 'cek-data', label: 'Cek Data', color: 'status-cek-data', hex: '#1d4ed8' },
  { key: 'janji-survey', label: 'Janji Survey', color: 'status-janji-survey', hex: '#6d28d9' },
  { key: 'survey', label: 'Survey', color: 'status-survey', hex: '#b45309' },
  { key: 'komite', label: 'Komite', color: 'status-komite', hex: '#c2410c' },
  { key: 'approve', label: 'Approve', color: 'status-approve', hex: '#15803d' },
  { key: 'cancel', label: 'Cancel', color: 'status-cancel', hex: '#be185d' },
  { key: 'reject', label: 'Reject', color: 'status-reject', hex: '#dc2626' },
];

export const leasingPartners = [
  { id: 1, name: 'Adira Finance', branch: 'Jakarta Pusat', pic: 'Budi Santoso', contact: '08123456701', email: 'budi@adira.co.id', products: 'Kendaraan Bermotor, Elektronik', rate: '1.5%', tenors: '12,24,36,48,60', minPinjaman: 5000000, maxPinjaman: 500000000, status: 'aktif' },
  { id: 2, name: 'BFI Finance', branch: 'Jakarta Selatan', pic: 'Rina Marlina', contact: '08123456702', email: 'rina@bfi.co.id', products: 'Mobil, Motor, Properti', rate: '1.3%', tenors: '12,24,36,48,60', minPinjaman: 10000000, maxPinjaman: 1000000000, status: 'aktif' },
  { id: 3, name: 'FIF Group', branch: 'Bandung', pic: 'Hendra Kusuma', contact: '08123456703', email: 'hendra@fifgroup.co.id', products: 'Motor Honda', rate: '1.2%', tenors: '12,18,24,36', minPinjaman: 2000000, maxPinjaman: 50000000, status: 'aktif' },
  { id: 4, name: 'Mandiri Utama Finance', branch: 'Surabaya', pic: 'Dewi Rahayu', contact: '08123456704', email: 'dewi@muf.co.id', products: 'Mobil, Alat Berat', rate: '1.4%', tenors: '12,24,36,48,60', minPinjaman: 15000000, maxPinjaman: 2000000000, status: 'aktif' },
  { id: 5, name: 'OTO Finance', branch: 'Medan', pic: 'Ahmad Fauzi', contact: '08123456705', email: 'ahmad@oto.co.id', products: 'Motor, Mobil Bekas', rate: '1.6%', tenors: '12,24,36', minPinjaman: 3000000, maxPinjaman: 200000000, status: 'aktif' },
  { id: 6, name: 'Clipan Finance', branch: 'Semarang', pic: 'Sri Wahyuni', contact: '08123456706', email: 'sri@clipan.co.id', products: 'Mobil Baru & Bekas', rate: '1.35%', tenors: '12,24,36,48', minPinjaman: 20000000, maxPinjaman: 800000000, status: 'aktif' },
  { id: 7, name: 'ACC (Astra Credit Companies)', branch: 'Yogyakarta', pic: 'Doni Prasetyo', contact: '08123456707', email: 'doni@acc.co.id', products: 'Mobil Astra', rate: '1.1%', tenors: '12,24,36,48,60', minPinjaman: 30000000, maxPinjaman: 1500000000, status: 'aktif' },
  { id: 8, name: 'WOM Finance', branch: 'Makassar', pic: 'Fitri Handayani', contact: '08123456708', email: 'fitri@wom.co.id', products: 'Motor Yamaha', rate: '1.25%', tenors: '12,18,24,36', minPinjaman: 2000000, maxPinjaman: 40000000, status: 'nonaktif' },
];

export const agents = [
  { id: 'AGT001', name: 'Reza Pratama', phone: '08211234501', email: 'reza@email.com', city: 'Jakarta', address: 'Jl. Kebayoran Baru No.12, Jakarta Selatan', nik: '3174011204950001', status: 'aktif', joinDate: '2023-01-15', bank: 'BCA', accountNumber: '1234567890', accountName: 'Reza Pratama', target: 10, notes: 'Agen senior berpengalaman', totalApprove: 87, totalReject: 12, totalBerkas: 142 },
  { id: 'AGT002', name: 'Sari Dewi', phone: '08211234502', email: 'sari@email.com', city: 'Bandung', address: 'Jl. Dago No.45, Bandung', nik: '3273025504920002', status: 'aktif', joinDate: '2023-03-20', bank: 'Mandiri', accountNumber: '9876543210', accountName: 'Sari Dewi', target: 8, notes: '', totalApprove: 65, totalReject: 8, totalBerkas: 98 },
  { id: 'AGT003', name: 'Budi Hartono', phone: '08211234503', email: 'budi.h@email.com', city: 'Surabaya', address: 'Jl. Rungkut Indah No.7, Surabaya', nik: '3578031107880003', status: 'aktif', joinDate: '2022-11-10', bank: 'BNI', accountNumber: '1122334455', accountName: 'Budi Hartono', target: 12, notes: 'Spesialis kendaraan roda empat', totalApprove: 110, totalReject: 18, totalBerkas: 185 },
  { id: 'AGT004', name: 'Anisa Putri', phone: '08211234504', email: 'anisa@email.com', city: 'Medan', address: 'Jl. Gatot Subroto No.22, Medan', nik: '1271045508950004', status: 'aktif', joinDate: '2023-06-01', bank: 'BRI', accountNumber: '5544332211', accountName: 'Anisa Putri', target: 7, notes: '', totalApprove: 42, totalReject: 7, totalBerkas: 67 },
  { id: 'AGT005', name: 'Dimas Setiawan', phone: '08211234505', email: 'dimas@email.com', city: 'Semarang', address: 'Jl. Pemuda No.33, Semarang', nik: '3374050909900005', status: 'aktif', joinDate: '2022-08-15', bank: 'BCA', accountNumber: '6677889900', accountName: 'Dimas Setiawan', target: 10, notes: 'Agen terbaik bulan lalu', totalApprove: 93, totalReject: 10, totalBerkas: 156 },
  { id: 'AGT006', name: 'Maya Sari', phone: '08211234506', email: 'maya@email.com', city: 'Yogyakarta', address: 'Jl. Malioboro No.15, Yogyakarta', nik: '3401046604930006', status: 'nonaktif', joinDate: '2023-09-10', bank: 'Mandiri', accountNumber: '1099887766', accountName: 'Maya Sari', target: 5, notes: 'Sementara nonaktif', totalApprove: 21, totalReject: 5, totalBerkas: 35 },
  { id: 'AGT007', name: 'Eko Nugroho', phone: '08211234507', email: 'eko@email.com', city: 'Jakarta', address: 'Jl. Cempaka Putih No.8, Jakarta Pusat', nik: '3173030303870007', status: 'aktif', joinDate: '2022-05-20', bank: 'BNI', accountNumber: '2233445566', accountName: 'Eko Nugroho', target: 15, notes: 'Agen dengan jaringan luas', totalApprove: 134, totalReject: 22, totalBerkas: 210 },
  { id: 'AGT008', name: 'Fitri Handayani', phone: '08211234508', email: 'fitri.h@email.com', city: 'Makassar', address: 'Jl. Sultan Hasanuddin No.19, Makassar', nik: '7371047707960008', status: 'aktif', joinDate: '2023-02-14', bank: 'BRI', accountNumber: '7788990011', accountName: 'Fitri Handayani', target: 8, notes: '', totalApprove: 55, totalReject: 9, totalBerkas: 88 },
];

export const users = [
  { id: 1, name: 'Super Admin', email: 'admin@finance.co.id', role: 'super-admin', status: 'aktif', agentId: null, lastLogin: '2026-07-07 08:30' },
  { id: 3, name: 'Reza Pratama', email: 'reza@email.com', role: 'agen', status: 'aktif', agentId: 'AGT001', lastLogin: '2026-07-07 09:00' },
  { id: 4, name: 'Sari Dewi', email: 'sari@email.com', role: 'agen', status: 'aktif', agentId: 'AGT002', lastLogin: '2026-07-06 16:20' },
  { id: 5, name: 'Budi Hartono', email: 'budi.h@email.com', role: 'agen', status: 'aktif', agentId: 'AGT003', lastLogin: '2026-07-07 07:55' },
];

const generateApplicationId = (i) => `BRK${String(2026001 + i).padStart(7, '0')}`;

export const applications = [
  {
    id: generateApplicationId(0), status: 'approve', agentId: 'AGT001', agentName: 'Reza Pratama',
    customerName: 'Hendra Gunawan', nik: '3174010101900001', phone: '08512345601', city: 'Jakarta',
    address: 'Jl. Mampang No.5, Jakarta Selatan', unitType: 'Mobil', unitYear: 2021,
    unitBrand: 'Toyota Avanza', pinjaman: 120000000, tenor: 48, estimasiAngsuran: 3250000,
    leasingId: 1, leasingName: 'Adira Finance', inputDate: '2026-06-01', notes: 'Dokumen lengkap',
    surveyDate: '2026-06-05', surveyTime: '10:00', surveyResult: 'Kondisi unit baik, nilai sesuai',
    approveDate: '2026-06-10', approvePinjaman: 115000000,
  },
  {
    id: generateApplicationId(1), status: 'approve', agentId: 'AGT003', agentName: 'Budi Hartono',
    customerName: 'Dewi Ratnasari', nik: '3273025504920002', phone: '08512345602', city: 'Surabaya',
    address: 'Jl. Rungkut Industri No.12, Surabaya', unitType: 'Mobil', unitYear: 2020,
    unitBrand: 'Honda Jazz', pinjaman: 95000000, tenor: 36, estimasiAngsuran: 3100000,
    leasingId: 2, leasingName: 'BFI Finance', inputDate: '2026-06-03', notes: '',
    surveyDate: '2026-06-07', surveyTime: '14:00', surveyResult: 'Unit layak, dokumen valid',
    approveDate: '2026-06-12', approvePinjaman: 90000000,
  },
  {
    id: generateApplicationId(2), status: 'pending', agentId: 'AGT002', agentName: 'Sari Dewi',
    customerName: 'Andri Susanto', nik: '3201011012880003', phone: '08512345603', city: 'Bandung',
    address: 'Jl. Cihampelas No.77, Bandung', unitType: 'Motor', unitYear: 2022,
    unitBrand: 'Honda Beat', pinjaman: 12000000, tenor: 24, estimasiAngsuran: 580000,
    leasingId: 3, leasingName: 'FIF Group', inputDate: '2026-07-05', notes: 'Perlu verifikasi income',
    surveyDate: null, surveyTime: null, surveyResult: null, approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(3), status: 'cek-data', agentId: 'AGT005', agentName: 'Dimas Setiawan',
    customerName: 'Linda Permata', nik: '3374045008920004', phone: '08512345604', city: 'Semarang',
    address: 'Jl. Pandanaran No.100, Semarang', unitType: 'Mobil', unitYear: 2019,
    unitBrand: 'Suzuki Ertiga', pinjaman: 80000000, tenor: 48, estimasiAngsuran: 2150000,
    leasingId: 4, leasingName: 'Mandiri Utama Finance', inputDate: '2026-07-03', notes: '',
    surveyDate: null, surveyTime: null, surveyResult: null, approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(4), status: 'janji-survey', agentId: 'AGT001', agentName: 'Reza Pratama',
    customerName: 'Bambang Wibowo', nik: '3173031508850005', phone: '08512345605', city: 'Jakarta',
    address: 'Jl. Kebon Jeruk No.23, Jakarta Barat', unitType: 'Mobil', unitYear: 2022,
    unitBrand: 'Daihatsu Xenia', pinjaman: 130000000, tenor: 60, estimasiAngsuran: 2800000,
    leasingId: 1, leasingName: 'Adira Finance', inputDate: '2026-07-01', notes: 'Priority',
    surveyDate: '2026-07-08', surveyTime: '09:30', surveyResult: null, approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(5), status: 'survey', agentId: 'AGT007', agentName: 'Eko Nugroho',
    customerName: 'Siti Aisyah', nik: '3172044404930006', phone: '08512345606', city: 'Jakarta',
    address: 'Jl. Thamrin No.88, Jakarta Pusat', unitType: 'Mobil', unitYear: 2021,
    unitBrand: 'Mitsubishi Xpander', pinjaman: 175000000, tenor: 60, estimasiAngsuran: 3750000,
    leasingId: 7, leasingName: 'ACC', inputDate: '2026-07-02', notes: '',
    surveyDate: '2026-07-07', surveyTime: '11:00', surveyResult: null, approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(6), status: 'komite', agentId: 'AGT003', agentName: 'Budi Hartono',
    customerName: 'Agus Priyono', nik: '3578031201870007', phone: '08512345607', city: 'Surabaya',
    address: 'Jl. Ahmad Yani No.45, Surabaya', unitType: 'Mobil', unitYear: 2020,
    unitBrand: 'Nissan Livina', pinjaman: 110000000, tenor: 48, estimasiAngsuran: 2950000,
    leasingId: 4, leasingName: 'Mandiri Utama Finance', inputDate: '2026-06-25', notes: '',
    surveyDate: '2026-06-29', surveyTime: '13:00', surveyResult: 'Kondisi unit terawat, dokumen lengkap',
    approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(7), status: 'reject', agentId: 'AGT004', agentName: 'Anisa Putri',
    customerName: 'Rizky Maulana', nik: '1271040308910008', phone: '08512345608', city: 'Medan',
    address: 'Jl. Gatot Subroto No.11, Medan', unitType: 'Motor', unitYear: 2020,
    unitBrand: 'Yamaha NMAX', pinjaman: 20000000, tenor: 24, estimasiAngsuran: 960000,
    leasingId: 5, leasingName: 'OTO Finance', inputDate: '2026-06-20', notes: 'History kredit buruk',
    surveyDate: '2026-06-24', surveyTime: '10:00', surveyResult: 'Ada catatan kredit macet sebelumnya',
    approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(8), status: 'cancel', agentId: 'AGT002', agentName: 'Sari Dewi',
    customerName: 'Putu Agus', nik: '5105090606940009', phone: '08512345609', city: 'Bandung',
    address: 'Jl. Ir. H. Juanda No.30, Bandung', unitType: 'Mobil', unitYear: 2018,
    unitBrand: 'Toyota Rush', pinjaman: 85000000, tenor: 36, estimasiAngsuran: 2900000,
    leasingId: 6, leasingName: 'Clipan Finance', inputDate: '2026-06-18', notes: 'Nasabah membatalkan',
    surveyDate: null, surveyTime: null, surveyResult: null, approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(9), status: 'approve', agentId: 'AGT007', agentName: 'Eko Nugroho',
    customerName: 'Wulandari Kusuma', nik: '3173024504890010', phone: '08512345610', city: 'Jakarta',
    address: 'Jl. Sudirman No.100, Jakarta Pusat', unitType: 'Mobil', unitYear: 2023,
    unitBrand: 'Honda CRV', pinjaman: 280000000, tenor: 60, estimasiAngsuran: 5900000,
    leasingId: 7, leasingName: 'ACC', inputDate: '2026-06-10', notes: '',
    surveyDate: '2026-06-14', surveyTime: '09:00', surveyResult: 'Unit baru, dokumen resmi',
    approveDate: '2026-06-20', approvePinjaman: 275000000,
  },
  {
    id: generateApplicationId(10), status: 'pending', agentId: 'AGT008', agentName: 'Fitri Handayani',
    customerName: 'Irfan Hakim', nik: '7371040101920011', phone: '08512345611', city: 'Makassar',
    address: 'Jl. Perintis Kemerdekaan No.8, Makassar', unitType: 'Motor', unitYear: 2023,
    unitBrand: 'Honda PCX', pinjaman: 25000000, tenor: 36, estimasiAngsuran: 800000,
    leasingId: 3, leasingName: 'FIF Group', inputDate: '2026-07-06', notes: '',
    surveyDate: null, surveyTime: null, surveyResult: null, approveDate: null, approvePinjaman: null,
  },
  {
    id: generateApplicationId(11), status: 'cek-data', agentId: 'AGT005', agentName: 'Dimas Setiawan',
    customerName: 'Nisa Aprilia', nik: '3374041204960012', phone: '08512345612', city: 'Semarang',
    address: 'Jl. Pemuda No.50, Semarang', unitType: 'Mobil', unitYear: 2020,
    unitBrand: 'Wuling Almaz', pinjaman: 140000000, tenor: 48, estimasiAngsuran: 3700000,
    leasingId: 2, leasingName: 'BFI Finance', inputDate: '2026-07-04', notes: '',
    surveyDate: null, surveyTime: null, surveyResult: null, approveDate: null, approvePinjaman: null,
  },
];

export const statusLogs = [
  { id: 1, appId: generateApplicationId(0), fromStatus: null, toStatus: 'pending', user: 'Reza Pratama', date: '2026-06-01 09:00', notes: 'Berkas baru masuk' },
  { id: 2, appId: generateApplicationId(0), fromStatus: 'pending', toStatus: 'cek-data', user: 'Admin Proses', date: '2026-06-02 10:30', notes: 'Dokumen sedang diverifikasi' },
  { id: 3, appId: generateApplicationId(0), fromStatus: 'cek-data', toStatus: 'janji-survey', user: 'Admin Proses', date: '2026-06-03 14:00', notes: 'Jadwal survey dikonfirmasi' },
  { id: 4, appId: generateApplicationId(0), fromStatus: 'janji-survey', toStatus: 'survey', user: 'Surveyor Utama', date: '2026-06-05 10:00', notes: 'Survey dilaksanakan' },
  { id: 5, appId: generateApplicationId(0), fromStatus: 'survey', toStatus: 'komite', user: 'Admin Proses', date: '2026-06-07 09:00', notes: 'Masuk proses komite' },
  { id: 6, appId: generateApplicationId(0), fromStatus: 'komite', toStatus: 'approve', user: 'Admin Proses', date: '2026-06-10 11:00', notes: 'Disetujui komite, pinjaman Rp 115.000.000' },
];

export const commissions = [
  { id: 1, appId: generateApplicationId(0), customerName: 'Hendra Gunawan', agentId: 'AGT001', agentName: 'Reza Pratama', leasingName: 'Adira Finance', approvePinjaman: 115000000, approveDate: '2026-06-10', commissionRate: 1.5, commissionAmount: 1725000, status: 'paid', paymentDate: '2026-06-20', paymentMethod: 'Transfer Bank', notes: '' },
  { id: 2, appId: generateApplicationId(1), customerName: 'Dewi Ratnasari', agentId: 'AGT003', agentName: 'Budi Hartono', leasingName: 'BFI Finance', approvePinjaman: 90000000, approveDate: '2026-06-12', commissionRate: 1.5, commissionAmount: 1350000, status: 'paid', paymentDate: '2026-06-22', paymentMethod: 'Transfer Bank', notes: '' },
  { id: 3, appId: generateApplicationId(9), customerName: 'Wulandari Kusuma', agentId: 'AGT007', agentName: 'Eko Nugroho', leasingName: 'ACC', approvePinjaman: 275000000, approveDate: '2026-06-20', commissionRate: 1.5, commissionAmount: 4125000, status: 'unpaid', paymentDate: null, paymentMethod: null, notes: 'Menunggu verifikasi rekening' },
];

export const ACTIVITY_TYPES = [
  { key: 'kunjungan-dealer', label: 'Kunjungan Dealer' },
  { key: 'follow-up',        label: 'Follow Up Nasabah' },
  { key: 'cold-call',        label: 'Cold Call / Telepon' },
  { key: 'referral',         label: 'Referral Nasabah' },
  { key: 'survey-lokasi',    label: 'Survey Lokasi' },
  { key: 'networking',       label: 'Networking / Event' },
  { key: 'lainnya',          label: 'Lainnya' },
];

export const ACTIVITY_OUTCOMES = [
  { key: 'prospek-baru',        label: 'Prospek Baru',     hex: '#3b82f6' },
  { key: 'follow-up-lanjutan',  label: 'Perlu Follow Up',  hex: '#f59e0b' },
  { key: 'menghasilkan-berkas', label: 'Menghasilkan Berkas', hex: '#22c55e' },
  { key: 'tidak-berhasil',      label: 'Tidak Berhasil',   hex: '#ef4444' },
];

export const agentActivities = [
  { id: 1, agentId: 'AGT001', agentName: 'Reza Pratama', date: '2026-07-07', type: 'kunjungan-dealer', description: 'Kunjungan ke dealer Toyota Kebayoran, follow up 3 calon nasabah unit Avanza', outcome: 'prospek-baru', relatedAppId: null },
  { id: 2, agentId: 'AGT001', agentName: 'Reza Pratama', date: '2026-07-06', type: 'follow-up', description: 'Follow up nasabah Bambang Wibowo terkait jadwal survey', outcome: 'follow-up-lanjutan', relatedAppId: 'BRK2026005' },
  { id: 3, agentId: 'AGT001', agentName: 'Reza Pratama', date: '2026-06-01', type: 'referral', description: 'Referral dari nasabah lama untuk pengajuan Toyota Avanza', outcome: 'menghasilkan-berkas', relatedAppId: 'BRK2026001' },
  { id: 4, agentId: 'AGT002', agentName: 'Sari Dewi', date: '2026-07-05', type: 'cold-call', description: 'Telepon 8 calon nasabah dari daftar leads bulan ini', outcome: 'prospek-baru', relatedAppId: null },
  { id: 5, agentId: 'AGT002', agentName: 'Sari Dewi', date: '2026-07-03', type: 'survey-lokasi', description: 'Cek lokasi domisili nasabah Andri Susanto sebelum input berkas', outcome: 'menghasilkan-berkas', relatedAppId: 'BRK2026003' },
  { id: 6, agentId: 'AGT003', agentName: 'Budi Hartono', date: '2026-07-06', type: 'kunjungan-dealer', description: 'Kunjungan dealer Honda Surabaya, presentasi program cicilan', outcome: 'prospek-baru', relatedAppId: null },
  { id: 7, agentId: 'AGT003', agentName: 'Budi Hartono', date: '2026-06-03', type: 'referral', description: 'Referral dari sesama sales dealer untuk Honda Jazz', outcome: 'menghasilkan-berkas', relatedAppId: 'BRK2026002' },
  { id: 8, agentId: 'AGT005', agentName: 'Dimas Setiawan', date: '2026-07-04', type: 'networking', description: 'Hadir gathering komunitas mobil bekas Semarang', outcome: 'prospek-baru', relatedAppId: null },
  { id: 9, agentId: 'AGT005', agentName: 'Dimas Setiawan', date: '2026-07-01', type: 'follow-up', description: 'Follow up dokumen nasabah Nisa Aprilia yang masih kurang', outcome: 'follow-up-lanjutan', relatedAppId: 'BRK2026012' },
  { id: 10, agentId: 'AGT007', agentName: 'Eko Nugroho', date: '2026-07-02', type: 'cold-call', description: 'Telepon leads dari database lama, tidak ada yang tertarik saat ini', outcome: 'tidak-berhasil', relatedAppId: null },
  { id: 11, agentId: 'AGT007', agentName: 'Eko Nugroho', date: '2026-06-10', type: 'kunjungan-dealer', description: 'Kunjungan dealer Honda premium Jakarta Pusat untuk unit CRV', outcome: 'menghasilkan-berkas', relatedAppId: 'BRK2026010' },
];

export const notifications = [
  { id: 1, type: 'berkas-baru', message: 'Berkas baru dari Agen Sari Dewi - Andri Susanto', time: '5 menit lalu', read: false, link: '/applications' },
  { id: 2, type: 'status-ubah', message: 'Status BRK2026005 diubah ke Janji Survey', time: '1 jam lalu', read: false, link: '/applications' },
  { id: 3, type: 'survey-hari-ini', message: 'Jadwal survey hari ini: 2 survey terjadwal', time: '2 jam lalu', read: true, link: '/calendar' },
  { id: 4, type: 'komisi-unpaid', message: 'Terdapat 1 komisi belum dibayarkan', time: '1 hari lalu', read: true, link: '/commission' },
  { id: 5, type: 'berkas-baru', message: 'Berkas baru dari Agen Fitri Handayani - Irfan Hakim', time: '1 hari lalu', read: true, link: '/applications' },
];

export const auditLogs = [
  { id: 1, user: 'Reza Pratama', role: 'agen', action: 'Input Berkas Baru', detail: 'Berkas BRK2026003 - Andri Susanto', time: '2026-07-05 14:32', ip: '192.168.1.101' },
  { id: 3, user: 'Eko Nugroho', role: 'agen', action: 'Input Berkas Baru', detail: 'Berkas BRK2026006 - Siti Aisyah', time: '2026-07-02 11:20', ip: '192.168.1.107' },
  { id: 4, user: 'Super Admin', role: 'super-admin', action: 'Login', detail: 'Login berhasil', time: '2026-07-07 08:30', ip: '192.168.1.1' },
  { id: 5, user: 'Super Admin', role: 'super-admin', action: 'Bayar Komisi', detail: 'Komisi AGT001 - Reza Pratama dibayarkan', time: '2026-06-20 15:00', ip: '192.168.1.105' },
];

export const monthlyStats = [
  { month: 'Jan', berkas: 28, approve: 18, reject: 4, cancel: 2 },
  { month: 'Feb', berkas: 32, approve: 22, reject: 5, cancel: 1 },
  { month: 'Mar', berkas: 45, approve: 30, reject: 6, cancel: 3 },
  { month: 'Apr', berkas: 38, approve: 25, reject: 5, cancel: 2 },
  { month: 'Mei', berkas: 52, approve: 36, reject: 7, cancel: 3 },
  { month: 'Jun', berkas: 48, approve: 33, reject: 6, cancel: 4 },
  { month: 'Jul', berkas: 22, approve: 14, reject: 3, cancel: 1 },
];

export const agentPerformance = agents.slice(0, 6).map(a => ({
  name: a.name.split(' ')[0],
  approve: a.totalApprove,
  reject: a.totalReject,
  berkas: a.totalBerkas,
}));

export const currentUser = {
  id: 1, name: 'Super Admin', email: 'admin@finance.co.id', role: 'super-admin',
};

export const formatRupiah = (num) => {
  if (!num) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
};

export const getStatusInfo = (status) => {
  const map = {
    'pending': { label: 'Pending', cls: 'status-pending' },
    'cek-data': { label: 'Cek Data', cls: 'status-cek-data' },
    'janji-survey': { label: 'Janji Survey', cls: 'status-janji-survey' },
    'survey': { label: 'Survey', cls: 'status-survey' },
    'komite': { label: 'Komite', cls: 'status-komite' },
    'approve': { label: 'Approve', cls: 'status-approve' },
    'cancel': { label: 'Cancel', cls: 'status-cancel' },
    'reject': { label: 'Reject', cls: 'status-reject' },
    'paid': { label: 'Paid', cls: 'status-paid' },
    'unpaid': { label: 'Unpaid', cls: 'status-unpaid' },
    'aktif': { label: 'Aktif', cls: 'status-approve' },
    'nonaktif': { label: 'Nonaktif', cls: 'status-reject' },
  };
  return map[status] || { label: status, cls: 'status-pending' };
};
