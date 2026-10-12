-- Seed Data for BatchCheck (Fictional Demo Data)
-- Fictional data source
insert into data_sources (name, source_url, published_month, record_count, ingested_at)
values (
  'DEMO DATA (fictional)',
  'https://cdsco.gov.in/demo-alerts',
  '2026-08-01',
  8,
  now()
)
on conflict (name, published_month) do nothing;

-- Insert 8 fictional demo flagged batches
with demo_source as (
  select id from data_sources where name = 'DEMO DATA (fictional)' and published_month = '2026-08-01' limit 1
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
  true
from demo_source s
cross join (values
  (
    'Altopan Pantoprazole Tablets 40mg',
    'altopan pantoprazole 40mg',
    'Novagen Healthcare Pvt Ltd',
    'novagen healthcare',
    'BX2417A',
    'BX2417A',
    'NSQ',
    'Fails dissolution test requirement'
  ),
  (
    'Curocef Cefixime Suspension 100mg/5ml',
    'curocef cefixime 100mg 5ml',
    'Zenith Bioceuticals Limited',
    'zenith bioceuticals',
    'ZN9804B',
    'ZN9804B',
    'NSQ',
    'Substandard assay of active ingredient'
  ),
  (
    'Vitamax B-Complex Syrup with Lysine',
    'vitamax b complex with lysine',
    'Aster Remedies Pvt Ltd',
    'aster remedies',
    'AS5541C',
    'AS5541C',
    'MISBRANDED',
    'Omission of mandatory warning declarations and inaccurate labeling'
  ),
  (
    'Cardiomil Amlodipine Tablets 5mg IP',
    'cardiomil amlodipine 5mg',
    'Medisphere Therapeutics Pvt Ltd',
    'medisphere therapeutics',
    'MS1092D',
    'MS1092D',
    'SPURIOUS',
    'Does not contain declared active pharmaceutical ingredient'
  ),
  (
    'Glucorest Metformin Hydrochloride 500mg Tablets',
    'glucorest metformin hydrochloride 500mg',
    'BioNexus Formulations Ltd',
    'bionexus formulations',
    'BN7732E',
    'BN7732E',
    'NSQ',
    'Fails uniformity of dosage units test'
  ),
  (
    'Respifree Levocetirizine and Montelukast Tablets',
    'respifree levocetirizine and montelukast',
    'Horizon Life Sciences Private Limited',
    'horizon life sciences',
    'HL4310F',
    'HL4310F',
    'ADULTERATED',
    'Contaminated with foreign particulate matter'
  ),
  (
    'Dolozox Paracetamol and Diclofenac Tablets',
    'dolozox paracetamol and diclofenac',
    'Starlight Wellness Labs Pvt Ltd',
    'starlight wellness',
    'SW6205G',
    'SW6205G',
    'NSQ',
    'Fails disintegration time requirement'
  ),
  (
    'Gastrocalm Omeprazole Capsules 20mg BP',
    'gastrocalm omeprazole 20mg',
    'Aura BioLabs Limited',
    'aura biolabs',
    'AB3189H',
    'AB3189H',
    'OTHER',
    'Packaging seal compromised and discoloration observed'
  )
) as d(drug_name, drug_key, manufacturer, manufacturer_key, batch_number, batch_key, alert_type, reason)
on conflict (batch_key, drug_key, source_id) do nothing;

-- ============================================================================
-- USER DEMO ROW HOOK
-- Add one extra row below for the batch number printed on your demo strip:
-- Replace the values below with your demo strip details.
-- Remember to apply normalization rules:
--   batch_key: uppercase, alphanumeric only, O->0, I->1
--   drug_key: lowercase, remove punctuation and 'tablets','capsules', etc.
--   manufacturer_key: lowercase, remove punctuation and 'pvt','ltd', etc.
-- ============================================================================
/*
with demo_source as (
  select id from data_sources where name = 'DEMO DATA (fictional)' and published_month = '2026-08-01' limit 1
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
  'Your Demo Drug 500mg',
  'your demo drug 500mg',
  'Your Demo Pharma Ltd',
  'your demo',
  'YOUR_BATCH_123',
  'YOURBATCH123',
  'NSQ',
  'Demo flagged batch reason for live testing',
  s.id,
  true
from demo_source s
on conflict (batch_key, drug_key, source_id) do nothing;
*/

