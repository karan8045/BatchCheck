export type Locale = "en" | "hi";

export interface MatchedRecord {
  id?: string;
  drug_name: string;
  manufacturer?: string | null;
  batch_number: string;
  alert_type: "NSQ" | "SPURIOUS" | "ADULTERATED" | "MISBRANDED" | "OTHER";
  reason?: string | null;
  source_name: string;
  source_url?: string | null;
  published_month?: string | null;
  is_demo: boolean;
  drug_sim?: number;
  mfr_sim?: number;
}

export interface DataSourceItem {
  id: string;
  name: string;
  source_url?: string | null;
  published_month?: string | null;
  record_count: number;
  ingested_at: string;
}

export const DICTIONARY = {
  en: {
    appName: "BatchCheck",
    tagline: "Indian Drug Regulatory Alert Checker",
    plainLanguageIntro:
      "Check your medicine strip batch against official Indian drug-regulator (CDSCO) alert lists for Not of Standard Quality (NSQ), spurious, adulterated, or misbranded medicines.",
    home: {
      scanButton: "Scan Medicine (Strip / Syrup / Pack)",
      scanningAction: "Analyzing medicine & packaging...",
      manualEntryLink: "Type details manually",
      sampleButton: "Try a sample strip (Demo)",
      photoTip: "Take a clear photo of your medicine strip, syrup bottle label, or pack.",
    },
    confirm: {
      title: "Verify Extracted Details",
      subtitle: "Please check that these details match your medicine strip or bottle label.",
      drugNameLabel: "Drug / Brand Name",
      drugNamePlaceholder: "e.g., Altopan Pantoprazole 40mg or Ascoril-D Syrup",
      mfrLabel: "Manufacturer (optional)",
      mfrPlaceholder: "e.g., Novagen Healthcare",
      batchLabel: "Batch Number",
      batchPlaceholder: "e.g., BX2417A",
      expiryLabel: "Expiry Date (as printed)",
      expiryPlaceholder: "e.g., 08/2026 or MAR 2026",
      checkButton: "Check Batch",
      checkingButton: "Checking lists...",
      batchRequiredError: "Batch number is required to perform the check.",
      manualFallbackNotice: "Extraction could not read all fields clearly. Please type or confirm the values from your medicine.",
      insightsHeader: "Worldwide Pharmacopeia Identification",
      ingredientsLabel: "Active Composition (Salts)",
      categoryLabel: "Therapeutic Category",
      packagingLabel: "Container Type",
      usageLabel: "Clinical Indication",
    },
    result: {
      title: "Batch Check Result",
      readAloud: "Read aloud",
      stopSpeech: "Stop reading",
      voiceUnavailable: "Voice not available on this device",
      voiceLanguageNotice: "Speaking in English (en-IN)",
      scanAnother: "Check another medicine",
      backHome: "Back to Home",
      flaggedHighBadge: "FLAGGED: ALERT LIST MATCH",
      flaggedLowBadge: "FLAGGED: BATCH MATCH (DIFFERENT PRODUCT)",
      expiredBadge: "EXPIRED MEDICINE",
      noMatchBadge: "NOT FOUND IN LISTS CHECKED",
      demoBadge: "DEMO DATA",
      matchedDetailsHeader: "Regulatory Alert Details",
      drugName: "Drug Name",
      manufacturer: "Manufacturer",
      batchNumber: "Batch Number",
      alertType: "Alert Classification",
      reason: "Reported Reason",
      sourceList: "Source List",
      publishedDate: "Published Date",
      similarityScore: "Name Match Confidence",
      alsoExpiredNotice: "Note: This medicine has also passed its printed expiry date.",
      pharmacopeiaHeader: "Recognized Drug Information",
    },
    about: {
      title: "About BatchCheck & Data Sources",
      intro:
        "BatchCheck is an informational utility developed to help citizens quickly cross-reference medicine batch numbers against published Indian regulatory alerts.",
      safetyDisclaimerTitle: "Important Safety Disclaimer",
      safetyDisclaimer:
        "This is an informational tool and does NOT provide medical advice. A 'Not found' result means only that the batch was not present in the ingested regulatory alert lists at the time of check; it does NOT verify that a medicine is authentic, safe, genuine, or standard quality. Always consult a licensed pharmacist or physician for medical advice.",
      sourcesHeader: "Ingested Regulatory Lists",
      noSourcesYet: "No external regulatory lists ingested yet. Demonstrating with seeded demo data.",
      tableName: "List Name",
      tableMonth: "Latest Month",
      tableRecords: "Records",
      tableSource: "Official Link",
      lastIngested: "Last Ingested",
      backButton: "Back to Scanner",
      howItWorksTitle: "How It Works",
      howItWorksText:
        "Photos are analyzed locally in your browser and processed in-memory. Image files are never stored. The extracted batch and drug identifiers are normalized and cross-referenced with CDSCO alert records.",
    },
    footer: {
      liteModeOn: "Lite mode: ON (3D disabled)",
      liteModeOff: "3D enabled (Click for Lite mode)",
      toggleLang: "हिन्दी में बदलें",
      aboutLink: "Data & Disclaimer",
      homeLink: "Home",
    },
    alertTypes: {
      NSQ: "Not of Standard Quality (NSQ)",
      SPURIOUS: "Spurious / Counterfeit",
      ADULTERATED: "Adulterated",
      MISBRANDED: "Misbranded",
      OTHER: "Regulatory Warning / Other",
    },
  },
  hi: {
    appName: "बैच चेक (BatchCheck)",
    tagline: "भारतीय दवा नियामक चेतावनी जाँच",
    plainLanguageIntro:
      "अपनी दवा की स्ट्रिप के बैच नंबर को भारतीय दवा नियामक (CDSCO) की अमानक (NSQ), नकली, मिलावटी या भ्रामक लेबल वाली दवाओं की चेतावनी सूचियों से मिलाएँ।",
    home: {
      scanButton: "दवा स्कैन करें (स्ट्रिप / सिरप / बॉटल)",
      scanningAction: "दवा और पैकिंग का विश्लेषण हो रहा है...",
      manualEntryLink: "हाथ से विवरण दर्ज करें",
      sampleButton: "नमूना स्ट्रिप जाँचें (डेमो)",
      photoTip: "दवा की पन्नी, सिरप की बोतल या पैक के लेबल की साफ़ तस्वीर लें।",
    },
    confirm: {
      title: "विवरण की पुष्टि करें",
      subtitle: "कृपया जाँच लें कि ये विवरण आपकी दवा की स्ट्रिप या सिरप बोतल से मेल खाते हैं।",
      drugNameLabel: "दवा / ब्रांड का नाम",
      drugNamePlaceholder: "जैसे: Altopan 40 या Ascoril-D Syrup",
      mfrLabel: "निर्माता (वैकल्पिक)",
      mfrPlaceholder: "जैसे: Novagen Healthcare",
      batchLabel: "बैच नंबर",
      batchPlaceholder: "जैसे: BX2417A",
      expiryLabel: "एक्सपायरी तारीख (जैसे छपी हो)",
      expiryPlaceholder: "जैसे: 08/2026 या MAR 2026",
      checkButton: "बैच जाँचें",
      checkingButton: "सूचियों में जाँच जारी...",
      batchRequiredError: "जाँच के लिए बैच नंबर आवश्यक है।",
      manualFallbackNotice: "तस्वीर से पूरा विवरण नहीं पढ़ा जा सका। कृपया दवा देखकर विवरण भरें या ठीक करें।",
      insightsHeader: "वैश्विक फ़ार्माकोपिया पहचान (संरचना व उपयोग)",
      ingredientsLabel: "सक्रिय घटक (साल्ट)",
      categoryLabel: "चिकित्सीय श्रेणी",
      packagingLabel: "पैकिंग प्रकार",
      usageLabel: "चिकित्सीय उपयोग",
    },
    result: {
      title: "बैच जाँच परिणाम",
      readAloud: "बोलकर सुनाएँ",
      stopSpeech: "रोकें",
      voiceUnavailable: "इस डिवाइस पर आवाज़ उपलब्ध नहीं है",
      voiceLanguageNotice: "हिंदी (hi-IN) में बोला जा रहा है",
      scanAnother: "दूसरी दवा जाँचें",
      backHome: "मुखपृष्ठ पर जाएँ",
      flaggedHighBadge: "चेतावनी: सूची में दर्ज बैच",
      flaggedLowBadge: "चेतावनी: बैच नंबर मिला (अलग दवा)",
      expiredBadge: "एक्सपायर हो चुकी दवा",
      noMatchBadge: "जाँची गई सूचियों में नहीं मिला",
      demoBadge: "डेमो डेटा",
      matchedDetailsHeader: "नियामक चेतावनी का विवरण",
      drugName: "दवा का नाम",
      manufacturer: "निर्माता",
      batchNumber: "बैच नंबर",
      alertType: "चेतावनी का प्रकार",
      reason: "दर्ज कारण",
      sourceList: "स्रोत सूची",
      publishedDate: "प्रकाशन माह",
      similarityScore: "नाम मिलान विश्वसनीयता",
      alsoExpiredNotice: "ध्यान दें: यह दवा अपनी छपी हुई एक्सपायरी तिथि भी पार कर चुकी है।",
      pharmacopeiaHeader: "पहचानी गई दवा संरचना व जानकारी",
    },
    about: {
      title: "बैच चेक और डेटा स्रोत के बारे में",
      intro:
        "बैच चेक एक सूचनात्मक उपकरण है जो नागरिकों को भारतीय दवा नियामक द्वारा जारी अलर्ट सूचियों से दवाओं के बैच नंबर का मिलान करने में सहायता करता है।",
      safetyDisclaimerTitle: "महत्वपूर्ण सुरक्षा अस्वीकरण",
      safetyDisclaimer:
        "यह एक सूचनात्मक उपकरण है और यह कोई चिकित्सीय सलाह नहीं देता है। 'नहीं मिला' परिणाम का केवल यह अर्थ है कि जाँची गई नियामक सूचियों में यह बैच मौजूद नहीं था; इसका अर्थ यह कतई नहीं है कि दवा असली, सुरक्षित या प्रमाणित है। किसी भी चिकित्सीय सलाह के लिए हमेशा प्रमाणित डॉक्टर या फार्मासिस्ट से संपर्क करें।",
      sourcesHeader: "शामिल नियामक सूचियाँ",
      noSourcesYet: "अभी कोई बाहरी नियामक सूची नहीं जुड़ी है। डेमो डेटा के साथ दिखाया जा रहा है।",
      tableName: "सूची का नाम",
      tableMonth: "नवीनतम माह",
      tableRecords: "रिकॉर्ड संख्या",
      tableSource: "आधिकारिक लिंक",
      lastIngested: "अंतिम अद्यतन",
      backButton: "स्कैनर पर वापस जाएँ",
      howItWorksTitle: "यह कैसे काम करता है",
      howItWorksText:
        "तस्वीरों का विश्लेषण आपके ब्राउज़र में होता है। इमेज फाइलें सर्वर पर कभी स्टोर नहीं की जाती हैं। निकाले गए बैच नंबर का मिलान CDSCO की अलर्ट सूचियों से किया जाता है।",
    },
    footer: {
      liteModeOn: "लाइट मोड: चालू (3D बंद)",
      liteModeOff: "3D चालू (लाइट मोड के लिए क्लिक करें)",
      toggleLang: "Switch to English",
      aboutLink: "डेटा और अस्वीकरण",
      homeLink: "होम",
    },
    alertTypes: {
      NSQ: "मानक गुणवत्ता के अनुरूप नहीं (NSQ)",
      SPURIOUS: "नकली / जाली दवा",
      ADULTERATED: "मिलावटी दवा",
      MISBRANDED: "भ्रामक लेबल वाली दवा",
      OTHER: "नियामक चेतावनी / अन्य",
    },
  },
} as const;

/**
 * FIXED RESULT TEMPLATES
 * MANDATORY SAFETY RULE:
 * All result text MUST come strictly from these templates.
 * NEVER use words like "safe", "genuine", "OK", or "verified".
 */

export interface ResultTemplateArgs {
  status: "flagged" | "expired" | "no_match";
  confidence?: "low" | "high";
  isAlsoExpired?: boolean;
  listsCheckedNames: string;
  latestMonthYear: string;
}

export function getResultText(locale: Locale, args: ResultTemplateArgs): { cardText: string; speechText: string } {
  const { status, confidence, isAlsoExpired, listsCheckedNames, latestMonthYear } = args;

  let baseEn = "";
  let baseHi = "";

  if (status === "flagged") {
    if (confidence === "low") {
      baseEn = "A flagged batch with the same number exists, but for a different product. Please check with a pharmacist.";
      baseHi = "इसी बैच नंबर का एक चेतावनी वाला बैच मिला है, पर दवा का नाम अलग है। कृपया फार्मासिस्ट से जाँच करवाएँ।";
    } else {
      baseEn = "Warning: this batch is on a regulator alert list. Do not use it. Ask your doctor or pharmacist.";
      baseHi = "चेतावनी: यह बैच नियामक की चेतावनी सूची में है। इसे न लें, और अपने डॉक्टर या फार्मासिस्ट से पूछें।";
    }
    if (isAlsoExpired) {
      baseEn += " This medicine has also expired.";
      baseHi += " यह दवा एक्सपायर भी हो चुकी है।";
    }
  } else if (status === "expired") {
    baseEn = "This medicine has expired. Do not use it.";
    baseHi = "यह दवा एक्सपायर हो चुकी है। इसे न लें।";
  } else {
    // NO MATCH
    baseEn = "This batch was not found in the lists we checked. That does not mean the medicine is safe. If in doubt, ask a pharmacist.";
    baseHi = "हमारी जाँची गई सूचियों में यह बैच नहीं मिला। इसका मतलब यह नहीं कि दवा सुरक्षित है। संदेह हो तो फार्मासिस्ट से पूछें।";
  }

  const suffixEn = ` Lists checked: ${listsCheckedNames || "Official CDSCO alerts"}, latest: ${latestMonthYear || "current"}.`;
  const suffixHi = ` जाँची गई सूचियाँ: ${listsCheckedNames || "आधिकारिक CDSCO अलर्ट"}, नवीनतम: ${latestMonthYear || "वर्तमान"}।`;

  const fullEn = baseEn + suffixEn;
  const fullHi = baseHi + suffixHi;

  const cardText = locale === "hi" ? fullHi : fullEn;
  const speechText = locale === "hi" ? fullHi : fullEn;

  return { cardText, speechText };
}

