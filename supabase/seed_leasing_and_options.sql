-- Seed: dsd_leasing_partners (mitra leasing)
-- Jalankan sekali di Supabase SQL Editor

INSERT INTO dsd_leasing_partners (name, branch, pic, contact, email, products, rate, tenors, min_pinjaman, max_pinjaman, status, syarat, notes) VALUES
('Adira Finance',          'Jakarta Pusat',   'Budi Santoso',   '08123456701', 'budi@adira.co.id',     'Kendaraan Bermotor, Elektronik', '1.5%',  '12,24,36,48,60',    5000000,    500000000,  'aktif',    'KTP, KK, Slip Gaji, STNK', ''),
('BFI Finance',            'Jakarta Selatan', 'Rina Marlina',   '08123456702', 'rina@bfi.co.id',       'Mobil, Motor, Properti',         '1.3%',  '12,24,36,48,60',   10000000,   1000000000, 'aktif',    'KTP, KK, BPKB, Slip Gaji', ''),
('FIF Group',              'Bandung',         'Hendra Kusuma',  '08123456703', 'hendra@fifgroup.co.id','Motor Honda',                    '1.2%',  '12,18,24,36',       2000000,    50000000,   'aktif',    'KTP, KK, STNK',            ''),
('Mandiri Utama Finance',  'Surabaya',        'Dewi Rahayu',    '08123456704', 'dewi@muf.co.id',       'Mobil, Alat Berat',              '1.4%',  '12,24,36,48,60',   15000000,   2000000000, 'aktif',    'KTP, KK, Slip Gaji, BPKB', ''),
('OTO Finance',            'Medan',           'Ahmad Fauzi',    '08123456705', 'ahmad@oto.co.id',      'Motor, Mobil Bekas',             '1.6%',  '12,24,36',          3000000,    200000000,  'aktif',    'KTP, KK, STNK, BPKB',     ''),
('Clipan Finance',         'Semarang',        'Sri Wahyuni',    '08123456706', 'sri@clipan.co.id',     'Mobil Baru & Bekas',             '1.35%', '12,24,36,48',      20000000,    800000000,  'aktif',    'KTP, NPWP, Slip Gaji',     ''),
('ACC (Astra Credit)',     'Yogyakarta',      'Doni Prasetyo',  '08123456707', 'doni@acc.co.id',       'Mobil Astra',                    '1.1%',  '12,24,36,48,60',   30000000,   1500000000, 'aktif',    'KTP, KK, Slip Gaji, BPKB', ''),
('WOM Finance',            'Makassar',        'Fitri Handayani','08123456708', 'fitri@wom.co.id',      'Motor Yamaha',                   '1.25%', '12,18,24,36',       2000000,    40000000,   'aktif',    'KTP, KK, STNK',            ''),
('Wahana Finance',         'Denpasar',        'Agus Setiawan',  '08123456709', 'agus@wahana.co.id',    'Motor, Elektronik',              '1.45%', '12,24,36',          1500000,    30000000,   'aktif',    'KTP, Slip Gaji',           ''),
('CIMB Niaga Auto Finance','Palembang',       'Maya Putri',     '08123456710', 'maya@cnaf.co.id',      'Mobil',                          '1.2%',  '12,24,36,48,60',   25000000,   1200000000, 'aktif',    'KTP, KK, NPWP, Slip Gaji', '')
ON CONFLICT DO NOTHING;

-- Seed: dsd_master_options (doc_type)
INSERT INTO dsd_master_options (category, value, label, sort_order, active) VALUES
('doc_type', 'KTP',            'KTP',                    1, true),
('doc_type', 'KK',             'Kartu Keluarga',         2, true),
('doc_type', 'STNK',           'STNK',                   3, true),
('doc_type', 'BPKB',           'BPKB',                   4, true),
('doc_type', 'Slip Gaji',      'Slip Gaji',              5, true),
('doc_type', 'Foto Unit',      'Foto Unit',              6, true),
('doc_type', 'Dok. Pendukung', 'Dokumen Pendukung',      7, true),
('doc_type', 'NPWP',           'NPWP',                   8, true),
('doc_type', 'Rekening Koran', 'Rekening Koran',         9, true),
('doc_type', 'SPT Tahunan',    'SPT Tahunan',           10, true)
ON CONFLICT DO NOTHING;

-- Seed: dsd_master_options (bank)
INSERT INTO dsd_master_options (category, value, label, sort_order, active) VALUES
('bank', 'BCA',      'BCA',             1, true),
('bank', 'BNI',      'BNI',             2, true),
('bank', 'BRI',      'BRI',             3, true),
('bank', 'Mandiri',  'Bank Mandiri',    4, true),
('bank', 'BSI',      'BSI',             5, true),
('bank', 'BTPN',     'BTPN',            6, true),
('bank', 'Danamon',  'Bank Danamon',    7, true),
('bank', 'Permata',  'Bank Permata',    8, true),
('bank', 'CIMB',     'CIMB Niaga',      9, true),
('bank', 'Jenius',   'Jenius (BTPN)',  10, true),
('bank', 'Jago',     'Bank Jago',      11, true),
('bank', 'Neo',      'Bank Neo',       12, true)
ON CONFLICT DO NOTHING;
