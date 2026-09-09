import type { Language } from "./translations";

// Devanagari digit converter
export function toLocalizedDigit(num: number | string, lang: Language): string {
  const s = String(num);
  if (lang === "en") return s;
  const devanagariDigits: Record<string, string> = {
    "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
    "5": "५", "6": "६", "7": "७", "8": "८", "9": "९",
  };
  return s.replace(/[0-9]/g, (d) => devanagariDigits[d] || d);
}

// Planet names & abbreviations
export const PLANET_TRANSLATIONS: Record<string, Record<Language, { full: string; abbrev: string }>> = {
  Ascendant: {
    en: { full: "Ascendant (Lagna)", abbrev: "Asc" },
    ne: { full: "लग्न", abbrev: "लग्न" },
    hi: { full: "लग्न", abbrev: "लग्न" },
  },
  Sun: {
    en: { full: "Sun", abbrev: "Su" },
    ne: { full: "सूर्य", abbrev: "सू" },
    hi: { full: "सूर्य", abbrev: "सू" },
  },
  Moon: {
    en: { full: "Moon", abbrev: "Mo" },
    ne: { full: "चन्द्रमा", abbrev: "चं" },
    hi: { full: "चन्द्रमा", abbrev: "चं" },
  },
  Mars: {
    en: { full: "Mars", abbrev: "Ma" },
    ne: { full: "मङ्गल", abbrev: "मं" },
    hi: { full: "मंगल", abbrev: "मं" },
  },
  Mercury: {
    en: { full: "Mercury", abbrev: "Me" },
    ne: { full: "बुध", abbrev: "बु" },
    hi: { full: "बुध", abbrev: "बु" },
  },
  Jupiter: {
    en: { full: "Jupiter", abbrev: "Ju" },
    ne: { full: "बृहस्पति (गुरु)", abbrev: "गु" },
    hi: { full: "बृहस्पति (गुरु)", abbrev: "गु" },
  },
  Venus: {
    en: { full: "Venus", abbrev: "Ve" },
    ne: { full: "शुक्र", abbrev: "शु" },
    hi: { full: "शुक्र", abbrev: "शु" },
  },
  Saturn: {
    en: { full: "Saturn", abbrev: "Sa" },
    ne: { full: "शनि", abbrev: "श" },
    hi: { full: "शनि", abbrev: "श" },
  },
  Rahu: {
    en: { full: "Rahu", abbrev: "Ra" },
    ne: { full: "राहु", abbrev: "रा" },
    hi: { full: "राहु", abbrev: "रा" },
  },
  Ketu: {
    en: { full: "Ketu", abbrev: "Ke" },
    ne: { full: "केतु", abbrev: "के" },
    hi: { full: "केतु", abbrev: "के" },
  },
};

export function getPlanetName(name: string, lang: Language): string {
  return PLANET_TRANSLATIONS[name]?.[lang]?.full || name;
}

export function getPlanetAbbrev(name: string, lang: Language): string {
  return PLANET_TRANSLATIONS[name]?.[lang]?.abbrev || name.slice(0, 2);
}

// Zodiac Signs
export const SIGN_TRANSLATIONS: Record<string, Record<Language, string>> = {
  Aries: { en: "Aries", ne: "मेष", hi: "मेष" },
  Taurus: { en: "Taurus", ne: "वृष", hi: "वृषभ" },
  Gemini: { en: "Gemini", ne: "मिथुन", hi: "मिथुन" },
  Cancer: { en: "Cancer", ne: "कर्कट", hi: "कर्क" },
  Leo: { en: "Leo", ne: "सिंह", hi: "सिंह" },
  Virgo: { en: "Virgo", ne: "कन्या", hi: "कन्या" },
  Libra: { en: "Libra", ne: "तुला", hi: "तुला" },
  Scorpio: { en: "Scorpio", ne: "वृश्चिक", hi: "वृश्चिक" },
  Sagittarius: { en: "Sagittarius", ne: "धनु", hi: "धनु" },
  Capricorn: { en: "Capricorn", ne: "मकर", hi: "मकर" },
  Aquarius: { en: "Aquarius", ne: "कुम्भ", hi: "कुंभ" },
  Pisces: { en: "Pisces", ne: "मीन", hi: "मीन" },
};

export function getSignName(sign: string, lang: Language): string {
  return SIGN_TRANSLATIONS[sign]?.[lang] || sign;
}

// Nakshatra translations
export const NAKSHATRA_TRANSLATIONS: Record<string, Record<Language, string>> = {
  Ashwini: { en: "Ashwini", ne: "अश्विनी", hi: "अश्विनी" },
  Bharani: { en: "Bharani", ne: "भरणी", hi: "भरणी" },
  Krittika: { en: "Krittika", ne: "कृत्तिका", hi: "कृत्तिका" },
  Rohini: { en: "Rohini", ne: "रोहिणी", hi: "रोहिणी" },
  Mrigashira: { en: "Mrigashira", ne: "मृगशिरा", hi: "मृगशिरा" },
  Ardra: { en: "Ardra", ne: "आर्द्रा", hi: "आर्द्रा" },
  Punarvasu: { en: "Punarvasu", ne: "पुनर्वसु", hi: "पुनर्वसु" },
  Pushya: { en: "Pushya", ne: "पुष्य", hi: "पुष्य" },
  Ashlesha: { en: "Ashlesha", ne: "अश्लेषा", hi: "अश्लेषा" },
  Magha: { en: "Magha", ne: "मघा", hi: "मघा" },
  "Purva Phalguni": { en: "Purva Phalguni", ne: "पूर्वा फाल्गुनी", hi: "पूर्वा फाल्गुनी" },
  "Uttara Phalguni": { en: "Uttara Phalguni", ne: "उत्तरा फाल्गुनी", hi: "उत्तरा फाल्गुनी" },
  Hasta: { en: "Hasta", ne: "हस्त", hi: "हस्त" },
  Chitra: { en: "Chitra", ne: "चित्रा", hi: "चित्रा" },
  Swati: { en: "Swati", ne: "स्वाती", hi: "स्वाती" },
  Vishakha: { en: "Vishakha", ne: "विशाखा", hi: "विशाखा" },
  Anuradha: { en: "Anuradha", ne: "अनुराधा", hi: "अनुराधा" },
  Jyeshtha: { en: "Jyeshtha", ne: "ज्येष्ठा", hi: "ज्येष्ठा" },
  Mula: { en: "Mula", ne: "मूल", hi: "मूल" },
  "Purva Ashadha": { en: "Purva Ashadha", ne: "पूर्वाषाढा", hi: "पूर्वाषाढा" },
  "Uttara Ashadha": { en: "Uttara Ashadha", ne: "उत्तराषाढा", hi: "उत्तराषाढा" },
  Shravana: { en: "Shravana", ne: "श्रवण", hi: "श्रवण" },
  Dhanishta: { en: "Dhanishta", ne: "धनिष्ठा", hi: "धनिष्ठा" },
  Shatabhisha: { en: "Shatabhisha", ne: "शतभिषा", hi: "शतभिषा" },
  "Purva Bhadrapada": { en: "Purva Bhadrapada", ne: "पूर्वाभाद्रपदा", hi: "पूर्वाभाद्रपदा" },
  "Uttara Bhadrapada": { en: "Uttara Bhadrapada", ne: "उत्तराभाद्रपदा", hi: "उत्तराभाद्रपदा" },
  Revati: { en: "Revati", ne: "रेवती", hi: "रेवती" },
};

/** The engine spells the nineteenth nakshatra "Mula"; charts cast before
 *  these tables agreed carry "Moola". Both resolve. */
const NAKSHATRA_ALIASES: Record<string, string> = { Moola: "Mula", Mula: "Mula" };

export function canonicalNakshatra(name: string | null | undefined): string {
  const raw = (name ?? "").trim();
  return NAKSHATRA_ALIASES[raw] ?? raw;
}

export function getNakshatraName(nakshatra: string, lang: Language): string {
  nakshatra = canonicalNakshatra(nakshatra);
  return NAKSHATRA_TRANSLATIONS[nakshatra]?.[lang] || nakshatra;
}

// Avakhada Chakra Attribute Translation Mappings
export const AVAKHADA_TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Gana
  Deva: { en: "Deva (Divine)", ne: "देव", hi: "देव" },
  Manushya: { en: "Manushya (Human)", ne: "मनुष्य", hi: "मनुष्य" },
  Rakshasa: { en: "Rakshasa (Demonic)", ne: "राक्षस", hi: "राक्षस" },

  // Nadi
  Adi: { en: "Adi (Beginning)", ne: "आद्य", hi: "आद्य" },
  Madhya: { en: "Madhya (Middle)", ne: "मध्य", hi: "मध्य" },
  Antya: { en: "Antya (End)", ne: "अन्त्य", hi: "अन्त्य" },

  // Yoni
  Horse: { en: "Horse (Ashwa)", ne: "अश्व (घोडा)", hi: "अश्व (घोड़ा)" },
  Elephant: { en: "Elephant (Gaja)", ne: "गज (हात्ती)", hi: "गज (हाथी)" },
  Sheep: { en: "Sheep (Mesha)", ne: "मेष (भेडा)", hi: "मेष (भेड़ा)" },
  Serpent: { en: "Serpent (Sarpa)", ne: "सर्प (साँप)", hi: "सर्प (सांप)" },
  Dog: { en: "Dog (Shwana)", ne: "श्वान (कुकुर)", hi: "श्वान (कुत्ता)" },
  Cat: { en: "Cat (Marjara)", ne: "मार्जार (विरालो)", hi: "मार्जार (बिल्ली)" },
  Rat: { en: "Rat (Mooshaka)", ne: "मूषक (मुसो)", hi: "मूषक (चूहा)" },
  Cow: { en: "Cow (Gau)", ne: "गौ (गाई)", hi: "गौ (गाय)" },
  Buffalo: { en: "Buffalo (Mahisha)", ne: "महिष (भैंसी)", hi: "महिष (भैंस)" },
  Tiger: { en: "Tiger (Vyaghra)", ne: "व्याघ्र (बाघ)", hi: "व्याघ्र (बाघ)" },
  Deer: { en: "Deer (Mriga)", ne: "मृग (हिरण)", hi: "मृग (हिरण)" },
  Monkey: { en: "Monkey (Vanara)", ne: "वानर (बाँदर)", hi: "वानर (बंदर)" },
  Mongoose: { en: "Mongoose (Nakula)", ne: "नकुल (न्याउरी)", hi: "नकुल (नेवला)" },
  Lion: { en: "Lion (Simha)", ne: "सिंह (शेर)", hi: "सिंह (शेर)" },

  // Varna
  Brahmin: { en: "Brahmin (Scholarly)", ne: "ब्राह्मण", hi: "ब्राह्मण" },
  Kshatriya: { en: "Kshatriya (Warrior/Leader)", ne: "क्षत्रिय", hi: "क्षत्रिय" },
  Vaishya: { en: "Vaishya (Merchant)", ne: "वैश्य", hi: "वैश्य" },
  Shudra: { en: "Shudra (Service)", ne: "शूद्र", hi: "शूद्र" },

  // Tatva / Element
  Fire: { en: "Fire (Agni)", ne: "अग्नि (तत्व)", hi: "अग्नि (तत्व)" },
  Earth: { en: "Earth (Prithvi)", ne: "पृथ्वी (तत्व)", hi: "पृथ्वी (तत्व)" },
  Air: { en: "Air (Vayu)", ne: "वायु (तत्व)", hi: "वायु (तत्व)" },
  Water: { en: "Water (Jala)", ne: "जल (तत्व)", hi: "जल (तत्व)" },
};

export function getAvakhadaTerm(term: string, lang: Language): string {
  return AVAKHADA_TRANSLATIONS[term]?.[lang] || term;
}

// Auspicious Elements localized for 12 Signs
export function getLocalizedAuspiciousElements(lagnaSign: string, lang: Language) {
  const map: Record<string, Record<Language, { luckyColors: string; unluckyColors: string; luckyGemstones: string; unluckyGemstones: string }>> = {
    Aries: {
      en: {
        luckyColors: "Red, Saffron, Yellow, Golden & White.",
        unluckyColors: "Black, Dark Blue & Dull Grey.",
        luckyGemstones: "Red Coral (Moonga), Yellow Sapphire (Pukhraj) & Ruby (Manikya).",
        unluckyGemstones: "Blue Sapphire (Neelam) & Diamond (Hira).",
      },
      ne: {
        luckyColors: "रातो, केसरी, पहेँलो, सुनौलो र सेतो।",
        unluckyColors: "कालो, गाढा नीलो र फुस्रो।",
        luckyGemstones: "रातो मुङ्गा, पोखराज र माणिक्य।",
        unluckyGemstones: "नीलम र हिरा।",
      },
      hi: {
        luckyColors: "लाल, केसरी, पीला, सुनहरा और सफेद।",
        unluckyColors: "काला, गहरा नीला और स्लेटी।",
        luckyGemstones: "लाल मूंगा, पुखराज और माणिक्य।",
        unluckyGemstones: "नीलम और हीरा।",
      },
    },
    Taurus: {
      en: {
        luckyColors: "White, Off-White, Pink, Light Blue & Green.",
        unluckyColors: "Red, Crimson & Dark Yellow.",
        luckyGemstones: "Diamond (Hira), White Sapphire & Emerald (Panna).",
        unluckyGemstones: "Ruby (Manikya) & Red Coral (Moonga).",
      },
      ne: {
        luckyColors: "सेतो, गुलाबी, हलुका नीलो र हरियो।",
        unluckyColors: "रातो र गाढा पहेँलो।",
        luckyGemstones: "हिरा, सेतो पुखराज र पन्ना।",
        unluckyGemstones: "माणिक्य र रातो मुङ्गा।",
      },
      hi: {
        luckyColors: "सफेद, गुलाबी, हल्का नीला और हरा।",
        unluckyColors: "लाल और गहरा पीला।",
        luckyGemstones: "हीरा, सफेद पुखराज और पन्ना।",
        unluckyGemstones: "माणिक्य और लाल मूंगा।",
      },
    },
    Gemini: {
      en: {
        luckyColors: "Light Green, Emerald, Yellow, White & Sky Blue.",
        unluckyColors: "Deep Red, Scarlet & Dark Orange.",
        luckyGemstones: "Emerald (Panna), Diamond (Hira) & Blue Sapphire (Neelam).",
        unluckyGemstones: "Red Coral (Moonga) & Ruby (Manikya).",
      },
      ne: {
        luckyColors: "हलुका हरियो, पहेँलो, सेतो र आकाशी नीलो।",
        unluckyColors: "गाढा रातो र सुन्तला।",
        luckyGemstones: "पन्ना, हिरा र नीलम।",
        unluckyGemstones: "रातो मुङ्गा र माणिक्य।",
      },
      hi: {
        luckyColors: "हल्का हरा, पीला, सफेद और आकाशी नीला।",
        unluckyColors: "गहरा लाल और नारंगी।",
        luckyGemstones: "पन्ना, हीरा और नीलम।",
        unluckyGemstones: "लाल मूंगा और माणिक्य।",
      },
    },
    Cancer: {
      en: {
        luckyColors: "White, Silver, Cream, Sea Green & Soft Yellow.",
        unluckyColors: "Black, Dark Charcoal & Deep Grey.",
        luckyGemstones: "Pearl (Moti), Red Coral (Moonga) & Yellow Sapphire (Pukhraj).",
        unluckyGemstones: "Blue Sapphire (Neelam) & Diamond (Hira).",
      },
      ne: {
        luckyColors: "सेतो, चाँदी, क्रिम र हल्का पहेँलो।",
        unluckyColors: "कालो र गाढा फुस्रो।",
        luckyGemstones: "मोती, रातो मुङ्गा र पोखराज।",
        unluckyGemstones: "नीलम र हिरा।",
      },
      hi: {
        luckyColors: "सफेद, चांदी, क्रीम और हल्का पीला।",
        unluckyColors: "काला और गहरा स्लेटी।",
        luckyGemstones: "मोती, लाल मूंगा और पुखराज।",
        unluckyGemstones: "नीलम और हीरा।",
      },
    },
    Leo: {
      en: {
        luckyColors: "Gold, Orange, Saffron, Bright Red & Light Yellow.",
        unluckyColors: "Black, Navy Blue & Dark Grey.",
        luckyGemstones: "Ruby (Manikya), Red Coral (Moonga) & Yellow Sapphire (Pukhraj).",
        unluckyGemstones: "Diamond (Hira) & Blue Sapphire (Neelam).",
      },
      ne: {
        luckyColors: "सुनौलो, सुन्तला, केसरी र चम्किलो रातो।",
        unluckyColors: "कालो र गाढा नीलो।",
        luckyGemstones: "माणिक्य, रातो मुङ्गा र पोखराज।",
        unluckyGemstones: "हिरा र नीलम।",
      },
      hi: {
        luckyColors: "सुनहरा, नारंगी, केसरी और चमकदार लाल।",
        unluckyColors: "काला और गहरा नीला।",
        luckyGemstones: "माणिक्य, लाल मूंगा और पुखराज।",
        unluckyGemstones: "हीरा और नीलम।",
      },
    },
    Virgo: {
      en: {
        luckyColors: "Green, Olive, White, Light Yellow & Sky Blue.",
        unluckyColors: "Fiery Red & Deep Scarlet.",
        luckyGemstones: "Emerald (Panna), Diamond (Hira) & White Sapphire.",
        unluckyGemstones: "Red Coral (Moonga) & Ruby (Manikya).",
      },
      ne: {
        luckyColors: "हरियो, सेतो, हल्का पहेँलो र आकाशी नीलो।",
        unluckyColors: "गाढा रातो।",
        luckyGemstones: "पन्ना, हिरा र सेतो पोखराज।",
        unluckyGemstones: "रातो मुङ्गा र माणिक्य।",
      },
      hi: {
        luckyColors: "हरा, सफेद, हल्का पीला और आकाशी नीला।",
        unluckyColors: "गहरा लाल।",
        luckyGemstones: "पन्ना, हीरा और सफेद पुखराज।",
        unluckyGemstones: "लाल मूंगा और माणिक्य।",
      },
    },
    Libra: {
      en: {
        luckyColors: "White, Pastel Pink, Sky Blue, Royal Blue & Turquoise.",
        unluckyColors: "Deep Yellow, Ochre & Crimson.",
        luckyGemstones: "Diamond (Hira), Opal & Blue Sapphire (Neelam).",
        unluckyGemstones: "Ruby (Manikya) & Yellow Sapphire (Pukhraj).",
      },
      ne: {
        luckyColors: "सेतो, गुलाबी, आकाशी नीलो र रोयल नीलो।",
        unluckyColors: "गाढा पहेँलो र रातो।",
        luckyGemstones: "हिरा, ओपल र नीलम।",
        unluckyGemstones: "माणिक्य र पोखराज।",
      },
      hi: {
        luckyColors: "सफेद, गुलाबी, आकाशी नीला और रॉयल नीला।",
        unluckyColors: "गहरा पीला और लाल।",
        luckyGemstones: "हीरा, ओपल और नीलम।",
        unluckyGemstones: "माणिक्य और पुखराज।",
      },
    },
    Scorpio: {
      en: {
        luckyColors: "Dark Red, Maroon, Saffron, Yellow & Orange.",
        unluckyColors: "Black, Deep Navy & Dark Green.",
        luckyGemstones: "Red Coral (Moonga), Yellow Sapphire (Pukhraj) & Pearl (Moti).",
        unluckyGemstones: "Diamond (Hira) & Emerald (Panna).",
      },
      ne: {
        luckyColors: "गाढा रातो, मरुन्, केसरी, पहेँलो र सुन्तला।",
        unluckyColors: "कालो र गाढा नीलो।",
        luckyGemstones: "रातो मुङ्गा, पोखराज र मोती।",
        unluckyGemstones: "हिरा र पन्ना।",
      },
      hi: {
        luckyColors: "गहरा लाल, मैरून, केसरी, पीला और नारंगी।",
        unluckyColors: "काला और गहरा नीला।",
        luckyGemstones: "लाल मूंगा, पुखराज और मोती।",
        unluckyGemstones: "हीरा और पन्ना।",
      },
    },
    Sagittarius: {
      en: {
        luckyColors: "Yellow, Golden, Saffron, Light Orange & White.",
        unluckyColors: "Black, Dark Blue & Charcoal.",
        luckyGemstones: "Yellow Sapphire (Pukhraj), Ruby (Manikya) & Red Coral (Moonga).",
        unluckyGemstones: "Diamond (Hira) & Blue Sapphire (Neelam).",
      },
      ne: {
        luckyColors: "पहेँलो, सुनौलो, केसरी र सेतो।",
        unluckyColors: "कालो र गाढा नीलो।",
        luckyGemstones: "पोखराज, माणिक्य र रातो मुङ्गा।",
        unluckyGemstones: "हिरा र नीलम।",
      },
      hi: {
        luckyColors: "पीला, सुनहरा, केसरी और सफेद।",
        unluckyColors: "काला और गहरा नीला।",
        luckyGemstones: "पुखराज, माणिक्य और लाल मूंगा।",
        unluckyGemstones: "हीरा और नीलम।",
      },
    },
    Capricorn: {
      en: {
        luckyColors: "Royal Blue, Navy Blue, Black, Dark Green & Grey.",
        unluckyColors: "Bright Red, Scarlet & Crimson.",
        luckyGemstones: "Blue Sapphire (Neelam), Diamond (Hira) & Emerald (Panna).",
        unluckyGemstones: "Ruby (Manikya) & Red Coral (Moonga).",
      },
      ne: {
        luckyColors: "रोयल नीलो, कालो, गाढा हरियो र फुस्रो।",
        unluckyColors: "चम्किलो रातो।",
        luckyGemstones: "नीलम, हिरा र पन्ना।",
        unluckyGemstones: "माणिक्य र रातो मुङ्गा।",
      },
      hi: {
        luckyColors: "रॉयल नीला, काला, गहरा हरा और स्लेटी।",
        unluckyColors: "चमकदार लाल।",
        luckyGemstones: "नीलम, हीरा और पन्ना।",
        unluckyGemstones: "माणिक्य और लाल मूंगा।",
      },
    },
    Aquarius: {
      en: {
        luckyColors: "Electric Blue, Cyan, Black, Dark Blue & White.",
        unluckyColors: "Bright Red, Crimson & Deep Yellow.",
        luckyGemstones: "Blue Sapphire (Neelam), Emerald (Panna) & Diamond (Hira).",
        unluckyGemstones: "Ruby (Manikya) & Red Coral (Moonga).",
      },
      ne: {
        luckyColors: "इलेक्ट्रिक नीलो, आकाशी, कालो र सेतो।",
        unluckyColors: "चम्किलो रातो र गाढा पहेँलो।",
        luckyGemstones: "नीलम, पन्ना र हिरा।",
        unluckyGemstones: "माणिक्य र रातो मुङ्गा।",
      },
      hi: {
        luckyColors: "इलेक्ट्रिक नीला, आकाशी, काला और सफेद।",
        unluckyColors: "चमकदार लाल और गहरा पीला।",
        luckyGemstones: "नीलम, पन्ना और हीरा।",
        unluckyGemstones: "माणिक्य और लाल मूंगा।",
      },
    },
    Pisces: {
      en: {
        luckyColors: "Yellow, Golden, Cream, White & Light Pink.",
        unluckyColors: "Black, Dark Blue & Charcoal.",
        luckyGemstones: "Yellow Sapphire (Pukhraj), Pearl (Moti) & Red Coral (Moonga).",
        unluckyGemstones: "Diamond (Hira) & Blue Sapphire (Neelam).",
      },
      ne: {
        luckyColors: "पहेँलो, सुनौलो, क्रिम, सेतो र गुलाबी।",
        unluckyColors: "कालो र गाढा नीलो।",
        luckyGemstones: "पोखराज, मोती र रातो मुङ्गा।",
        unluckyGemstones: "हिरा र नीलम।",
      },
      hi: {
        luckyColors: "पीला, सुनहरा, क्रीम, सफेद और गुलाबी।",
        unluckyColors: "काला और गहरा नीला।",
        luckyGemstones: "पुखराज, मोती और लाल मूंगा।",
        unluckyGemstones: "हीरा और नीलम।",
      },
    },
  };

  const signEntry = map[lagnaSign] || map.Cancer;
  return signEntry[lang] || signEntry.en;
}

// ── dignity and avastha ────────────────────────────────────────────────

export const DIGNITY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  exalted: { en: "Exalted", ne: "उच्च", hi: "उच्च" },
  debilitated: { en: "Debilitated", ne: "नीच", hi: "नीच" },
  moolatrikona: { en: "Moolatrikona", ne: "मूलत्रिकोण", hi: "मूलत्रिकोण" },
  own: { en: "Own sign", ne: "स्वगृही", hi: "स्वगृही" },
  friend: { en: "Friendly", ne: "मित्र", hi: "मित्र" },
  neutral: { en: "Neutral", ne: "सम", hi: "सम" },
  enemy: { en: "Enemy", ne: "शत्रु", hi: "शत्रु" },
};

/** Baladi avastha — the graha's age within its sign. */
export const AVASTHA_TRANSLATIONS: Record<string, Record<Language, string>> = {
  Bala: { en: "Bala (infant)", ne: "बाल", hi: "बाल" },
  Kumara: { en: "Kumara (child)", ne: "कुमार", hi: "कुमार" },
  Yuva: { en: "Yuva (youth)", ne: "युवा", hi: "युवा" },
  Vriddha: { en: "Vriddha (old)", ne: "वृद्ध", hi: "वृद्ध" },
  Mrita: { en: "Mrita (dead)", ne: "मृत", hi: "मृत" },
};

export function getDignity(value: string | null | undefined, lang: Language): string {
  if (!value) return "";
  return DIGNITY_TRANSLATIONS[value]?.[lang] ?? value;
}

export function getAvastha(value: string | null | undefined, lang: Language): string {
  if (!value) return "";
  return AVASTHA_TRANSLATIONS[value]?.[lang] ?? value;
}

// ── the naming syllable ────────────────────────────────────────────────
//
// The engine sends a romanised syllable ("Li"), and romanisation is lossy:
// Purva Phalguni's second pada is टा and Swati's fourth is ता, both written
// "Ta". So the Devanagari is looked up by nakshatra and pada — the same
// coordinates the engine used — rather than by translating the string.

const NAKSHATRA_ORDER = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
  "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
  "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const NAME_SYLLABLE_DEV: string[][] = [
  ["चु", "चे", "चो", "ला"], ["ली", "लू", "ले", "लो"], ["अ", "इ", "उ", "ए"],
  ["ओ", "वा", "वी", "वू"], ["वे", "वो", "का", "की"], ["कु", "घ", "ङ", "छ"],
  ["के", "को", "हा", "ही"], ["हु", "हे", "हो", "डा"], ["डी", "डू", "डे", "डो"],
  ["मा", "मी", "मू", "मे"], ["मो", "टा", "टी", "टू"], ["टे", "टो", "पा", "पी"],
  ["पू", "ष", "ण", "ठ"], ["पे", "पो", "रा", "री"], ["रु", "रे", "रो", "ता"],
  ["ती", "तू", "ते", "तो"], ["ना", "नी", "नू", "ने"], ["नो", "या", "यी", "यू"],
  ["ये", "यो", "भा", "भी"], ["भू", "धा", "फा", "ढा"], ["भे", "भो", "जा", "जी"],
  ["जु", "जे", "जो", "घा"], ["गा", "गी", "गु", "गे"], ["गो", "सा", "सी", "सू"],
  ["से", "सो", "दा", "दी"], ["दू", "थ", "झ", "ञ"], ["दे", "दो", "च", "ची"],
];

/** The naming syllable in the reader's script: Devanagari for ne/hi, the
 *  engine's own romanisation for English. `charan` is 1-based. */
export function getNameSyllable(
  romanised: string,
  nakshatra: string | null | undefined,
  charan: number | null | undefined,
  lang: Language,
): string {
  if (lang === "en") return romanised;
  const i = NAKSHATRA_ORDER.indexOf(canonicalNakshatra(nakshatra));
  const pada = (charan ?? 0) - 1;
  if (i < 0 || pada < 0 || pada > 3) return romanised;
  return NAME_SYLLABLE_DEV[i][pada] ?? romanised;
}
