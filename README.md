# BatchCheck 🔍💊

**BatchCheck** is a mobile-first Progressive Web App (PWA) designed to empower Indian citizens to photograph a medicine blister strip and quickly learn whether that batch appears on official Indian drug-regulator alert lists published by the **Central Drugs Standard Control Organisation (CDSCO)** (including Not of Standard Quality [NSQ], spurious, adulterated, or misbranded alerts).

The result is rendered as a large color-coded status card and read aloud in **Hindi** or **English** using the Web Speech API. The app features an interactive 3D procedural blister strip powered by Three.js & React Three Fiber, with graceful degradation to a 2D lightweight mode for low-resource devices or user preference.

---

## ⚠️ Core Safety Rules

1. **Informational Utility Only**: The app **NEVER** labels a medicine as *"safe"*, *"genuine"*, *"OK"*, or *"verified"*.
2. **Template-Driven Outputs**: All result copy is generated strictly from fixed, verified templates—**never from an LLM**.
3. **Transparent Boundaries**: If no match is found, the clean result explicitly states:
   > *"This batch was not found in the lists we checked. That does not mean the medicine is safe. If in doubt, ask a pharmacist."*
4. **Lists & Dates Grounding**: Every result explicitly names the regulatory lists checked and their latest published month.
5. **Privacy First**: Uploaded images are resized in-browser and processed in-memory only. No images are ever saved to disk or persistent storage.

---

## 📱 Features & Screens

1. **Home Screen**:
   - **Live Camera Viewfinder**: Tap "Scan Medicine" to prompt browser camera permissions and open an interactive viewfinder with alignment framing brackets, flash/torch toggle, camera switcher, and shutter button.
   - Fallback gallery/files upload option for desktop and devices without cameras.
   - "Type details manually" fallback link.
   - "Try a sample (Demo)" button that runs an instant live check against seeded fictional demo data.
   - English / हिन्दी language toggle (persisted in `localStorage`).
   - 3D interactive floating blister foil pack that tilts with touch and sweeps a scanning light bar during OCR.
2. **Confirm Screen**:
   - **Worldwide Pharmacopeia Identification**: Identifies the generic active salts, composition strengths, therapeutic class, container type, and clinical indications (across Indian Pharmacopoeia IP, British BP, United States USP, and WHO Essential Medicines).
   - Clean form displaying extracted fields: Drug Name, Manufacturer, Batch Number, and Expiry Date.
   - All fields are user-editable to verify against the physical blister strip or syrup bottle.
   - Automatic fallback to this screen if image extraction fails or API is unreachable.
3. **Result Screen**:
   - 3D status reaction:
     - 🔴 **FLAGGED**: Blister strip turns red, triggers a single damped shake, and pulses a warning ring.
     - 🟠 **EXPIRED**: Blister strip turns amber, dims, and displays a rotating clock indicator.
     - ⚪ **NO MATCH**: Blister strip turns neutral grey/blue with a calm idle float (Zero green, zero checkmarks, zero shields).
   - Large color-coded card with alert reason, alert category (NSQ, Spurious, Adulterated, Misbranded), and source publication details.
   - Displays recognized chemical composition and therapeutic category.
   - Audible speech readout in `hi-IN` or `en-IN` with toggle and graceful fallbacks.
   - Prominent `DEMO DATA` badge when testing fictional demo records.
4. **About & Data Screen**:
   - Displays all ingested regulatory lists, record counts, and publication months.
   - Prominent medical safety disclaimer.
   - Explanation of in-browser compression and memory-only processing.
   - Toggleable "Lite mode (no 3D)" in footer (persisted in `localStorage`).

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Dark navy palette, high-contrast text, 48px min touch targets)
- **Vision Model**: Google Gemini via `@google/genai` SDK (`gemini-3.8-flash` / `gemini-2.5-flash`)
- **3D Graphics**: Three.js, `@react-three/fiber` v9, `@react-three/drei` (100% procedural primitives)
- **Database**: Supabase Postgres with `pg_trgm` fuzzy matching, RLS, and `check_batch` RPC
- **PDF Extraction**: Python CLI with `pdfplumber`, `supabase-py`, and fuzzy header matching

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory (based on `.env.example`):

```bash
# Google Gemini API Key from Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model name (default to current flash model)
GEMINI_MODEL=gemini-3.8-flash

# Supabase Project URL
SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Service Role Key (SERVER ONLY - NEVER EXPOSED TO BROWSER)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

> **Security Note**: `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are only ever accessed in Next.js Server Route Handlers (`/api/*`). They are never bundled into client-side code.

---

## 🗄 Database Setup (Supabase)

### 1. Run Migration
In your Supabase project dashboard, open the **SQL Editor** and run the contents of [`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql):
- Enables `pg_trgm` extension for trigram similarity matching.
- Creates `data_sources` table.
- Creates `flagged_batches` table with foreign key to `data_sources` and unique constraint `(batch_key, drug_key, source_id)`.
- Enables Row Level Security (RLS) on both tables with **no public policies** (strictly service-role access).
- Creates the `check_batch` RPC function for trigram similarity querying.

### 2. Run Seed Data
In the **SQL Editor**, execute [`supabase/seed.sql`](./supabase/seed.sql):
- Inserts one `data_sources` row: `"DEMO DATA (fictional)"`.
- Inserts 8 realistic but **100% fictional** flagged batch records (e.g., `BX2417A`).
- Contains a clearly commented block at the bottom where you can add your own demo strip batch number for live testing.

---

## 🚀 Local Development

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Unit Tests**:
   Verify string normalization and expiry parsing:
   ```bash
   npx tsx scripts/test-units.ts
   python3 scripts/test_python_normalize.py
   ```

3. **Start Next.js Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your mobile browser or emulator.

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🐍 Python CDSCO Ingestion Script

The ingestion pipeline parses monthly PDF alert bulletins published by CDSCO.

### Setup
```bash
pip install -r scripts/requirements.txt
```

### Dry Run / Review Mode
Extracts tables, fuzzy-maps columns, applies identical normalization rules, and writes `parsed_review.csv` without modifying the database:
```bash
python scripts/parse_cdsco.py \
  --pdf path/to/cdsco_alert.pdf \
  --source-name "CDSCO NSQ Alert" \
  --month 2026-08 \
  --source-url "https://cdsco.gov.in"
```

### Commit Mode
Upserts validated records into Supabase and updates `data_sources.record_count`:
```bash
python scripts/parse_cdsco.py \
  --pdf path/to/cdsco_alert.pdf \
  --source-name "CDSCO NSQ Alert" \
  --month 2026-08 \
  --source-url "https://cdsco.gov.in" \
  --commit
```

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New...** -> **Project** and import your repository.
3. In **Environment Variables**, add the four variables:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**.
5. Once deployed, open the URL on mobile and use **"Add to Home Screen"** to install BatchCheck as a PWA.

