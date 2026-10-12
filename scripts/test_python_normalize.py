#!/usr/bin/env python3
from parse_cdsco import normalize_batch, normalize_drug, normalize_manufacturer, determine_alert_type

def test_normalization():
    # Batch normalization
    assert normalize_batch("BX2417A") == "BX2417A"
    assert normalize_batch("bx-2417a") == "BX2417A"
    assert normalize_batch("KL-9021-O") == "KL90210"
    assert normalize_batch("I-8812-O") == "188120"
    assert normalize_batch("b_x/2026") == "BX2026"
    assert normalize_batch("") == ""
    assert normalize_batch(None) == ""

    # Drug normalization
    assert normalize_drug("Paracetamol Tablets IP 500mg") == "paracetamol 500mg"
    assert normalize_drug("Amoxicillin Capsules BP 250mg") == "amoxicillin 250mg"
    assert normalize_drug("Cough Relief Syrup USP 100ml") == "cough relief 100ml"
    assert normalize_drug("Curocef Cefixime Suspension 100mg/5ml") == "curocef cefixime 100mg 5ml"
    assert normalize_drug("Ceftriaxone Injection 1g") == "ceftriaxone 1g"
    assert normalize_drug("Altopan Pantoprazole Tablet 40mg") == "altopan pantoprazole 40mg"

    # Manufacturer normalization
    assert normalize_manufacturer("Novagen Healthcare Pvt Ltd") == "novagen healthcare"
    assert normalize_manufacturer("Zenith Bioceuticals Limited") == "zenith bioceuticals"
    assert normalize_manufacturer("Horizon Life Sciences Private Limited") == "horizon life sciences"
    assert normalize_manufacturer("Starlight Wellness Labs Pvt. Ltd.") == "starlight wellness"
    assert normalize_manufacturer("Apex Pharma Pharmaceuticals & Laboratories") == "apex"

    # Alert types
    assert determine_alert_type("CDSCO NSQ List", "Fails dissolution test") == "NSQ"
    assert determine_alert_type("Alert", "Spurious drug found") == "SPURIOUS"
    assert determine_alert_type("Alert", "Adulterated with foreign matter") == "ADULTERATED"
    assert determine_alert_type("Alert", "Misbranded labeling") == "MISBRANDED"
    assert determine_alert_type("General Warning", "Packaging torn") == "OTHER"

    print("🎉 All Python normalization and alert classification tests passed!")

if __name__ == "__main__":
    test_normalization()

