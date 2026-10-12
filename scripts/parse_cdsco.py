#!/usr/bin/env python3
"""
CDSCO Alert PDF Ingestion Script for BatchCheck
Extracts drug alert tables from official CDSCO alert PDFs and ingests them into Supabase.

Usage:
  python parse_cdsco.py --pdf alert.pdf --source-name "CDSCO NSQ alert" --month 2026-08 --source-url https://cdsco.gov.in/alert [--commit]
"""

import argparse
import csv
import os
import re
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


# ==============================================================================
# Normalization Functions (IDENTICAL to src/lib/normalize.ts)
# ==============================================================================

def normalize_batch(raw: str) -> str:
    """
    Normalizes batch number:
    - Uppercase
    - Remove every character that is not A-Z or 0-9
    - Fold O -> 0 and I -> 1
    """
    if not raw:
        return ""
    s = raw.upper()
    # Remove non-alphanumeric
    s = re.sub(r"[^A-Z0-9]", "", s)
    # Fold O -> 0
    s = s.replace("O", "0")
    # Fold I -> 1
    s = s.replace("I", "1")
    return s


def normalize_drug(raw: str) -> str:
    """
    Normalizes drug name:
    - Lowercase
    - Replace punctuation with spaces
    - Remove words: tablet(s), capsule(s), injection, syrup, suspension, ip, bp, usp
    - Collapse whitespace
    """
    if not raw:
        return ""
    s = raw.lower()
    # Replace punctuation with spaces
    s = re.sub(r"[^a-z0-9]", " ", s)
    # Remove stop words as whole words
    stop_words = r"\b(tablets?|capsules?|injection|syrup|suspension|ip|bp|usp)\b"
    s = re.sub(stop_words, " ", s)
    # Collapse whitespace and trim
    s = re.sub(r"\s+", " ", s).strip()
    return s


def normalize_manufacturer(raw: str) -> str:
    """
    Normalizes manufacturer name:
    - Lowercase
    - Replace punctuation with spaces
    - Remove words: pvt, ltd, limited, private, pharma, pharmaceuticals, laboratories, labs
    - Collapse whitespace
    """
    if not raw:
        return ""
    s = raw.lower()
    # Replace punctuation with spaces
    s = re.sub(r"[^a-z0-9]", " ", s)
    # Remove stop words as whole words
    stop_words = r"\b(pvt|ltd|limited|private|pharma|pharmaceuticals|laboratories|labs)\b"
    s = re.sub(stop_words, " ", s)
    # Collapse whitespace and trim
    s = re.sub(r"\s+", " ", s).strip()
    return s


def determine_alert_type(source_name: str, reason: str) -> str:
    """
    Determines alert_type check constraint: 'NSQ','SPURIOUS','ADULTERATED','MISBRANDED','OTHER'
    """
    combined = f"{source_name} {reason}".lower()
    if "spurious" in combined or "counterfeit" in combined:
        return "SPURIOUS"
    elif "adulterat" in combined:
        return "ADULTERATED"
    elif "misbrand" in combined:
        return "MISBRANDED"
    elif "nsq" in combined or "not of standard quality" in combined or "standard quality" in combined:
        return "NSQ"
    return "OTHER"


# ==============================================================================
# Fuzzy Column Header Matching
# ==============================================================================

def map_column_headers(header_row):
    """
    Maps table columns to standard names:
    'drug_name', 'batch_number', 'manufacturer', 'reason'
    """
    mapping = {}
    for idx, cell in enumerate(header_row):
        if not cell:
            continue
        cleaned = re.sub(r"\s+", " ", str(cell)).lower().strip()

        # Batch number
        if any(term in cleaned for term in ["batch no", "batch number", "batch", "lot no", "b.no"]):
            mapping["batch_number"] = idx
        # Drug name
        elif any(term in cleaned for term in ["name of drug", "drug name", "name of product", "product name", "drugs/cosmetics"]):
            mapping["drug_name"] = idx
        # Manufacturer
        elif any(term in cleaned for term in ["manufactured by", "manufacturer", "mfg by", "name of mfr"]):
            mapping["manufacturer"] = idx
        # Reason
        elif any(term in cleaned for term in ["reason", "remarks", "fails in", "test", "result", "assay"]):
            mapping["reason"] = idx

    return mapping


# ==============================================================================
# PDF Table Parsing
# ==============================================================================

def parse_pdf(pdf_path, source_name):
    import pdfplumber

    records = []
    skipped_count = 0
    parsed_count = 0
    column_mapping = {}

    print(f"📖 Opening PDF: {pdf_path}")
    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables()
            if not tables:
                continue

            for table in tables:
                if not table:
                    continue

                start_row = 0
                # Check first row for header matching
                if not column_mapping or page_idx == 1:
                    first_row = table[0]
                    detected_mapping = map_column_headers(first_row)
                    if "batch_number" in detected_mapping:
                        column_mapping = detected_mapping
                        start_row = 1
                    elif not column_mapping:
                        # Fallback default indices if headers aren't explicitly matched
                        # S.No (0), Drug Name (1), Batch (2), Mfr (3), Reason (4)
                        column_mapping = {
                            "drug_name": 1,
                            "batch_number": 2,
                            "manufacturer": 3,
                            "reason": 4,
                        }

                # Process table data rows
                for row_idx in range(start_row, len(table)):
                    row = table[row_idx]
                    if not row:
                        continue

                    def get_cell(col_name):
                        idx = column_mapping.get(col_name)
                        if idx is not None and idx < len(row) and row[idx]:
                            return str(row[idx]).replace("\n", " ").strip()
                        return ""

                    raw_batch = get_cell("batch_number")
                    batch_key = normalize_batch(raw_batch)

                    # Skip row if batch number is missing or empty
                    if not raw_batch or not batch_key:
                        skipped_count += 1
                        print(f"  ⚠️ Page {page_idx} Row {row_idx}: Skipped (No batch number found: '{raw_batch}')")
                        continue

                    drug_name = get_cell("drug_name") or "Unknown Drug"
                    drug_key = normalize_drug(drug_name)
                    manufacturer = get_cell("manufacturer")
                    manufacturer_key = normalize_manufacturer(manufacturer)
                    reason = get_cell("reason")
                    alert_type = determine_alert_type(source_name, reason)

                    record = {
                        "drug_name": drug_name,
                        "drug_key": drug_key,
                        "manufacturer": manufacturer,
                        "manufacturer_key": manufacturer_key,
                        "batch_number": raw_batch,
                        "batch_key": batch_key,
                        "alert_type": alert_type,
                        "reason": reason,
                        "is_valid": True,
                    }
                    records.append(record)
                    parsed_count += 1

    return records, parsed_count, skipped_count


# ==============================================================================
# CSV Review Exporter
# ==============================================================================

def export_review_csv(records, output_path="parsed_review.csv"):
    fieldnames = [
        "drug_name",
        "drug_key",
        "manufacturer",
        "manufacturer_key",
        "batch_number",
        "batch_key",
        "alert_type",
        "reason",
        "is_valid",
    ]
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow(r)
    print(f"📝 Review CSV exported to: {output_path}")


# ==============================================================================
# Supabase Commit Operation
# ==============================================================================

def commit_to_supabase(records, source_name, published_month, source_url):
    from supabase import create_client

    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from environment.")
        sys.exit(1)

    print("🔌 Connecting to Supabase using service role key...")
    client = create_client(supabase_url, service_role_key)

    # 1. Format published month as YYYY-MM-01 date
    month_parts = published_month.split("-")
    if len(month_parts) == 2:
        month_date = f"{month_parts[0]}-{month_parts[1]}-01"
    else:
        month_date = published_month

    # 2. Upsert data_source
    print(f"📊 Upserting data_sources: '{source_name}', Month: {month_date}...")
    source_payload = {
        "name": source_name,
        "source_url": source_url,
        "published_month": month_date,
        "record_count": len(records),
    }

    src_res = client.table("data_sources").upsert(
        source_payload,
        on_conflict="name,published_month"
    ).execute()

    if not src_res.data:
        print("❌ Failed to upsert data_sources row.")
        sys.exit(1)

    source_id = src_res.data[0]["id"]
    print(f"✅ Data source linked: {source_id}")

    # 3. Upsert flagged_batches
    print(f"💾 Ingesting {len(records)} flagged batch records...")
    batch_payloads = []
    for r in records:
        batch_payloads.append({
            "drug_name": r["drug_name"],
            "drug_key": r["drug_key"],
            "manufacturer": r["manufacturer"] or None,
            "manufacturer_key": r["manufacturer_key"] or None,
            "batch_number": r["batch_number"],
            "batch_key": r["batch_key"],
            "alert_type": r["alert_type"],
            "reason": r["reason"] or None,
            "source_id": source_id,
            "is_demo": False,
        })

    # Upsert in chunks of 100 to prevent payload overflow
    chunk_size = 100
    committed = 0
    for i in range(0, len(batch_payloads), chunk_size):
        chunk = batch_payloads[i:i + chunk_size]
        client.table("flagged_batches").upsert(
            chunk,
            on_conflict="batch_key,drug_key,source_id"
        ).execute()
        committed += len(chunk)
        print(f"   Committed {committed}/{len(batch_payloads)} records...")

    # 4. Update data_sources record_count
    client.table("data_sources").update({"record_count": len(records)}).eq("id", source_id).execute()
    print("🎉 Ingestion complete and record_count updated successfully!")


# ==============================================================================
# CLI Main
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="CDSCO NSQ PDF Parser and Supabase Ingestion")
    parser.add_argument("--pdf", required=True, help="Path to PDF file")
    parser.add_argument("--source-name", required=True, help="Source name (e.g. 'CDSCO NSQ alert')")
    parser.add_argument("--month", required=True, help="Published month (YYYY-MM, e.g. '2026-08')")
    parser.add_argument("--source-url", default="https://cdsco.gov.in", help="Official source link")
    parser.add_argument("--commit", action="store_true", help="Commit parsed records to Supabase")

    args = parser.parse_args()

    if not os.path.exists(args.pdf):
        print(f"❌ Error: PDF file not found at: {args.pdf}")
        sys.exit(1)

    records, parsed_count, skipped_count = parse_pdf(args.pdf, args.source_name)

    print("\n" + "=" * 50)
    print("📊 PARSE SUMMARY")
    print("=" * 50)
    print(f"Total Rows Extracted: {parsed_count + skipped_count}")
    print(f"Valid Parsed Batches: {parsed_count}")
    print(f"Skipped Rows (No B#): {skipped_count}")
    print("=" * 50 + "\n")

    export_review_csv(records, "parsed_review.csv")

    if args.commit:
        commit_to_supabase(records, args.source_name, args.month, args.source_url)
    else:
        print("ℹ️ Dry-run mode: Review 'parsed_review.csv'. To commit to Supabase, run with --commit.")


if __name__ == "__main__":
    main()

