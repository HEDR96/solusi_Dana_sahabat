-- Tambah kolom unit_type ke dsd_otr_catalog
-- r2 = motor, r4 = mobil

ALTER TABLE dsd_otr_catalog ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'r2';

-- Brand khusus R4 (mobil saja)
UPDATE dsd_otr_catalog SET unit_type = 'r4'
WHERE brand IN (
  'TOYOTA','DAIHATSU','MITSUBISHI','WULING','HYUNDAI','KIA',
  'NISSAN','MAZDA','ISUZU','DATSUN','LEXUS','BMW','MERCEDES-BENZ',
  'MERCEDES','AUDI','VOLVO','FORD','LAND ROVER','JEEP','SUBARU',
  'INFINITI','CHEVROLET','RENAULT','PEUGEOT','KIJANG','GWM',
  'TANK','HAVAL','MG','CHERY','DFSK','GEELY','VW','VOLKSWAGEN',
  'PORSCHE','MASERATI','FERRARI','LAMBORGHINI','JAGUAR','MINI'
);

-- Honda R4 (model mobil Honda)
UPDATE dsd_otr_catalog SET unit_type = 'r4'
WHERE brand = 'HONDA' AND (
  tipe ILIKE '%brio%' OR tipe ILIKE '%mobilio%' OR tipe ILIKE '%jazz%'
  OR tipe ILIKE '%city%' OR tipe ILIKE '%civic%' OR tipe ILIKE '%cr-v%'
  OR tipe ILIKE '%crv%' OR tipe ILIKE '%br-v%' OR tipe ILIKE '%brv%'
  OR tipe ILIKE '%hr-v%' OR tipe ILIKE '%hrv%' OR tipe ILIKE '%freed%'
  OR tipe ILIKE '%accord%' OR tipe ILIKE '%odyssey%' OR tipe ILIKE '%pilot%'
  OR tipe ILIKE '%passport%' OR tipe ILIKE '%ridgeline%'
);

-- Suzuki R4 (model mobil Suzuki)
UPDATE dsd_otr_catalog SET unit_type = 'r4'
WHERE brand = 'SUZUKI' AND (
  tipe ILIKE '%ertiga%' OR tipe ILIKE '%ignis%' OR tipe ILIKE '%carry%'
  OR tipe ILIKE '%apv%' OR tipe ILIKE '%xl7%' OR tipe ILIKE '%baleno%'
  OR tipe ILIKE '%jimny%' OR tipe ILIKE '%grand vitara%' OR tipe ILIKE '%vitara%'
  OR tipe ILIKE '%new carry%' OR tipe ILIKE '%karimun%'
);

-- Pastikan Honda motor tetap r2 (brand HONDA, model motor)
UPDATE dsd_otr_catalog SET unit_type = 'r2'
WHERE brand = 'HONDA' AND unit_type = 'r4'
  AND (
    tipe ILIKE '%beat%' OR tipe ILIKE '%vario%' OR tipe ILIKE '%supra%'
    OR tipe ILIKE '%revo%' OR tipe ILIKE '%pcx%' OR tipe ILIKE '%adv%'
    OR tipe ILIKE '%cbr%' OR tipe ILIKE '%cb%' OR tipe ILIKE '%crf%'
    OR tipe ILIKE '%nc750%' OR tipe ILIKE '%xadv%' OR tipe ILIKE '%forza%'
    OR tipe ILIKE '%genio%' OR tipe ILIKE '%spacy%' OR tipe ILIKE '%tiger%'
    OR tipe ILIKE '%sonic%' OR tipe ILIKE '%blade%' OR tipe ILIKE '%megapro%'
    OR tipe ILIKE '%scoopy%'
  );
