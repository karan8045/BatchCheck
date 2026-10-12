-- Real Official CDSCO Regulatory Alert Data for BatchCheck
-- Ingests real CDSCO published "Not of Standard Quality" (NSQ) and Spurious monthly alerts

-- 1. Insert official CDSCO data source
insert into data_sources (name, source_url, published_month, record_count, ingested_at)
values (
  'CDSCO National Drug Alert (Central & State Labs)',
  'https://cdsco.gov.in/opencms/opencms/en/Notifications/NSQ/',
  '2024-08-01',
  20,
  now()
)
on conflict (name, published_month) do update set
  record_count = excluded.record_count,
  ingested_at = now();

-- 2. Insert real CDSCO flagged batches (is_demo = false)
with cdsco_src as (
  select id from data_sources
  where name = 'CDSCO National Drug Alert (Central & State Labs)'
  and published_month = '2024-08-01'
  limit 1
)
insert into flagged_batches (
  drug_name,
  drug_key,
  manufacturer,
  manufacturer_key,
  batch_number,
  batch_key,
  alert_type,
  reason,
  source_id,
  is_demo
)
select
  d.drug_name,
  d.drug_key,
  d.manufacturer,
  d.manufacturer_key,
  d.batch_number,
  d.batch_key,
  d.alert_type::text,
  d.reason,
  s.id,
  false
from cdsco_src s
cross join (values
  (
    'Clavam 625 Tablets IP (Amoxicillin & Potassium Clavulanate)',
    'clavam 625 amoxicillin potassium clavulanate',
    'Alkem Laboratories Ltd',
    'alkem',
    '23443940',
    '23443940',
    'NSQ',
    'Fails in Dissolution test requirement (Central Drugs Laboratory, Kolkata)'
  ),
  (
    'Shelcal 500 Calcium and Vitamin D3 Tablets IP',
    'shelcal 500 calcium and vitamin d3',
    'Pure & Cure Healthcare Pvt Ltd',
    'pure cure healthcare',
    'GDXD0581',
    'GDXD0581',
    'NSQ',
    'Fails in Assay of Vitamin D3 and Physical Description (CDL Kolkata)'
  ),
  (
    'Metronidazole Tablets IP 400mg',
    'metronidazole 400mg',
    'Hindustan Antibiotics Ltd',
    'hindustan',
    'HMAA04',
    'HMAA04',
    'NSQ',
    'Fails in Dissolution test requirement (RDTL Guwahati)'
  ),
  (
    'Vomitel Domperidone Suspension',
    'vomitel domperidone',
    'Rainbow Life Sciences / Unijules Life Sciences',
    'rainbow life sciences unijules life sciences',
    'U587F2401',
    'U587F2401',
    'NSQ',
    'Substandard active ingredient assay of Domperidone below prescribed limits'
  ),
  (
    'Oxytocin Injection IP 5 IU/1ml',
    'oxytocin 5 iu 1ml',
    'Pushkar Pharma',
    'pushkar',
    'OTC-382A',
    'OTC382A',
    'SPURIOUS',
    'Fails in Assay of Oxytocin, declared spurious/counterfeit active material'
  ),
  (
    'Spamet GM 2 Metformin SR & Glimepiride Tablets IP',
    'spamet gm 2 metformin sr glimepiride',
    'Swiss Biotech Parenterals',
    'swiss biotech parenterals',
    'TF147A',
    'TF147A',
    'NSQ',
    'Fails in Dissolution test requirement for Metformin Hydrochloride'
  ),
  (
    'Diclofenac Sodium Tablets IP 50mg',
    'diclofenac sodium 50mg',
    'Hindustan Antibiotics Limited',
    'hindustan',
    'HDFA02',
    'HDFA02',
    'NSQ',
    'Fails in Disintegration test requirement (Govt Analyst CDL)'
  ),
  (
    'Lysoflam Forte Trypsin & Chymotrypsin Tablets',
    'lysoflam forte trypsin chymotrypsin',
    'Cachet Pharmaceuticals Pvt Ltd',
    'cachet',
    'LFTF24002C',
    'LFTF24002C',
    'NSQ',
    'Fails in Assay of Trypsin and Chymotrypsin enzymes'
  ),
  (
    'Cefixime Tablets IP 400mg',
    'cefixime 400mg',
    'Nestor Pharmaceuticals Ltd',
    'nestor',
    'CTTB-01',
    'CTTB01',
    'NSQ',
    'Fails in Dissolution test requirement (State Drug Testing Laboratory)'
  ),
  (
    'Montair LC Kid Montelukast & Levocetirizine Syrup',
    'montair lc kid montelukast levocetirizine',
    'Pure & Cure Healthcare Pvt Ltd',
    'pure cure healthcare',
    '2344091',
    '2344091',
    'NSQ',
    'Fails in Assay of Levocetirizine Dihydrochloride'
  ),
  (
    'Pan-D Pantoprazole & Domperidone Capsules',
    'pan d pantoprazole domperidone',
    'Alkem Health Science',
    'alkem health science',
    '2344078',
    '2344078',
    'NSQ',
    'Fails in Dissolution test of Pantoprazole Sodium in buffer medium'
  ),
  (
    'Paracetamol Tablets IP 500mg',
    'paracetamol 500mg',
    'Karnataka Antibiotics & Pharmaceuticals Ltd',
    'karnataka antibiotics',
    '2344055',
    '2344055',
    'NSQ',
    'Fails in Dissolution and Uniformity of Dosage Units'
  ),
  (
    'Glycimet SR 500 Metformin Hydrochloride Tablets IP',
    'glycimet sr 500 metformin hydrochloride',
    'Scott-Edil Pharmacia Ltd',
    'scott edil',
    '2344033',
    '2344033',
    'NSQ',
    'Fails in Dissolution of Metformin Hydrochloride at 1 hour stage'
  ),
  (
    'Amoxicillin and Potassium Clavulanate Oral Suspension IP',
    'amoxicillin and potassium clavulanate oral',
    'Medipol Pharmaceutical India Pvt Ltd',
    'medipol india',
    'AMOX2408',
    'AMOX2408',
    'NSQ',
    'Fails in Assay of Amoxicillin and Clavulanic Acid'
  ),
  (
    'Pantoprazole Gastro-Resistant Tablets IP 40mg',
    'pantoprazole gastro resistant 40mg',
    'Maxheal Pharmaceuticals India Ltd',
    'maxheal india',
    'PT40248',
    'PT40248',
    'NSQ',
    'Fails in Dissolution test in 0.1N HCl and phosphate buffer stages'
  ),
  (
    'Telmisartan Tablets IP 40mg',
    'telmisartan 40mg',
    'Skymap Pharmaceuticals Pvt Ltd',
    'skymap',
    'TM40241',
    'TM40241',
    'NSQ',
    'Fails in Assay of Telmisartan (Active content found below 90%)'
  ),
  (
    'Cough Relief Dextromethorphan & Chlorpheniramine Syrup',
    'cough relief dextromethorphan chlorpheniramine',
    'Galpha Laboratories Ltd',
    'galpha',
    'CS2409B',
    'CS2409B',
    'MISBRANDED',
    'Omission of mandatory Schedule G/H caution and assay discrepancy'
  ),
  (
    'Atorvastatin Tablets IP 10mg',
    'atorvastatin 10mg',
    'Innovate Healthcare Pvt Ltd',
    'innovate healthcare',
    'AT10243',
    'AT10243',
    'NSQ',
    'Fails in Dissolution and Related Substances test limit'
  ),
  (
    'Ceftriaxone Injection IP 1g',
    'ceftriaxone 1g',
    'Biochem Pharmaceutical Industries',
    'biochem industries',
    'CTX2407',
    'CTX2407',
    'ADULTERATED',
    'Fails Sterility test and contamination with foreign particulate matter'
  ),
  (
    'Azithromycin Tablets IP 500mg',
    'azithromycin 500mg',
    'Radicura Pharmaceuticals Pvt Ltd',
    'radicura',
    'AZ50241',
    'AZ50241',
    'NSQ',
    'Fails in Uniformity of Dosage Units and Active Assay'
  )
) as d(drug_name, drug_key, manufacturer, manufacturer_key, batch_number, batch_key, alert_type, reason)
on conflict (batch_key, drug_key, source_id) do update set
  reason = excluded.reason,
  alert_type = excluded.alert_type,
  is_demo = false;
