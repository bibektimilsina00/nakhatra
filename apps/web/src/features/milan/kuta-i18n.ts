import type { Language } from "@/lib/i18n/translations";

/**
 * The ashtakuta in the reader's script.
 *
 * The engine sends each koota's key and the two Sanskrit terms it compared;
 * the sentence is built here rather than shipped from the server, so a Nepali
 * reader gets "वर्ण — क्षत्रिय / क्षत्रिय" instead of an English clause. The
 * terms themselves are Sanskrit in every language: transliterated for English
 * readers, in Devanagari otherwise.
 */

type Tri = Record<Language, string>;

export const KUTA_NAMES: Record<string, Tri> = {
  varna: { en: "Varna", ne: "वर्ण", hi: "वर्ण" },
  vashya: { en: "Vashya", ne: "वश्य", hi: "वश्य" },
  tara: { en: "Tara", ne: "तारा", hi: "तारा" },
  yoni: { en: "Yoni", ne: "योनि", hi: "योनि" },
  graha_maitri: { en: "Graha Maitri", ne: "ग्रह मैत्री", hi: "ग्रह मैत्री" },
  gana: { en: "Gana", ne: "गण", hi: "गण" },
  bhakoot: { en: "Bhakoot", ne: "भकूट", hi: "भकूट" },
  nadi: { en: "Nadi", ne: "नाडी", hi: "नाड़ी" },
};

/** What each koota is actually weighing, in one line. */
export const KUTA_MEANING: Record<string, Tri> = {
  varna: {
    en: "Temperament and shared values",
    ne: "स्वभाव र साझा मूल्यमान्यता",
    hi: "स्वभाव और साझा मूल्य",
  },
  vashya: {
    en: "Mutual influence and give-and-take",
    ne: "पारस्परिक प्रभाव र सामञ्जस्य",
    hi: "पारस्परिक प्रभाव और सामंजस्य",
  },
  tara: {
    en: "Fortune and wellbeing together",
    ne: "भाग्य र आपसी कुशल",
    hi: "भाग्य और आपसी कुशल",
  },
  yoni: {
    en: "Physical and intimate compatibility",
    ne: "शारीरिक तथा दाम्पत्य अनुकूलता",
    hi: "शारीरिक तथा दांपत्य अनुकूलता",
  },
  graha_maitri: {
    en: "Friendship of the two Moon lords",
    ne: "दुवैका चन्द्र स्वामीबीचको मैत्री",
    hi: "दोनों के चंद्र स्वामियों की मैत्री",
  },
  gana: {
    en: "Nature — gentle, human, or fierce",
    ne: "प्रकृति — देव, मनुष्य वा राक्षस",
    hi: "प्रकृति — देव, मनुष्य या राक्षस",
  },
  bhakoot: {
    en: "Prosperity and the household's rhythm",
    ne: "समृद्धि र गृहस्थीको लय",
    hi: "समृद्धि और गृहस्थी की लय",
  },
  nadi: {
    en: "Health, vitality and progeny",
    ne: "स्वास्थ्य, ओज र सन्तान",
    hi: "स्वास्थ्य, ओज और संतान",
  },
};

/** Every Sanskrit term the eight kootas can name. */
const TERMS: Record<string, Tri> = {
  // varna
  Brahmin: { en: "Brahmin", ne: "ब्राह्मण", hi: "ब्राह्मण" },
  Kshatriya: { en: "Kshatriya", ne: "क्षत्रिय", hi: "क्षत्रिय" },
  Vaishya: { en: "Vaishya", ne: "वैश्य", hi: "वैश्य" },
  Shudra: { en: "Shudra", ne: "शूद्र", hi: "शूद्र" },
  // vashya
  Manav: { en: "Manav", ne: "मानव", hi: "मानव" },
  Chatushpada: { en: "Chatushpada", ne: "चतुष्पद", hi: "चतुष्पद" },
  Jalachara: { en: "Jalachara", ne: "जलचर", hi: "जलचर" },
  Vanchara: { en: "Vanchara", ne: "वनचर", hi: "वनचर" },
  Keeta: { en: "Keeta", ne: "कीट", hi: "कीट" },
  // shorter spellings, in case the engine's ever change back
  Jalachar: { en: "Jalachar", ne: "जलचर", hi: "जलचर" },
  Vanachar: { en: "Vanachar", ne: "वनचर", hi: "वनचर" },
  Keet: { en: "Keet", ne: "कीट", hi: "कीट" },
  // gana
  Deva: { en: "Deva", ne: "देव", hi: "देव" },
  Manushya: { en: "Manushya", ne: "मनुष्य", hi: "मनुष्य" },
  Rakshasa: { en: "Rakshasa", ne: "राक्षस", hi: "राक्षस" },
  // nadi
  Adi: { en: "Adi", ne: "आदि", hi: "आदि" },
  Madhya: { en: "Madhya", ne: "मध्य", hi: "मध्य" },
  Antya: { en: "Antya", ne: "अन्त्य", hi: "अन्त्य" },
  // yoni (the fourteen animals)
  Horse: { en: "Horse", ne: "अश्व", hi: "अश्व" },
  Elephant: { en: "Elephant", ne: "गज", hi: "गज" },
  Sheep: { en: "Sheep", ne: "मेष", hi: "मेष" },
  Serpent: { en: "Serpent", ne: "सर्प", hi: "सर्प" },
  Dog: { en: "Dog", ne: "श्वान", hi: "श्वान" },
  Cat: { en: "Cat", ne: "मार्जार", hi: "मार्जार" },
  Rat: { en: "Rat", ne: "मूषक", hi: "मूषक" },
  Cow: { en: "Cow", ne: "गौ", hi: "गौ" },
  Buffalo: { en: "Buffalo", ne: "महिष", hi: "महिष" },
  Tiger: { en: "Tiger", ne: "व्याघ्र", hi: "व्याघ्र" },
  Deer: { en: "Deer", ne: "मृग", hi: "मृग" },
  Monkey: { en: "Monkey", ne: "वानर", hi: "वानर" },
  Mongoose: { en: "Mongoose", ne: "नकुल", hi: "नकुल" },
  Lion: { en: "Lion", ne: "सिंह", hi: "सिंह" },
};

/** Graha names reuse the app's own table, but the Moon lords arrive here as
 *  plain English planet names, so they get the same treatment. */
const PLANETS: Record<string, Tri> = {
  Sun: { en: "Sun", ne: "सूर्य", hi: "सूर्य" },
  Moon: { en: "Moon", ne: "चन्द्र", hi: "चंद्र" },
  Mars: { en: "Mars", ne: "मङ्गल", hi: "मंगल" },
  Mercury: { en: "Mercury", ne: "बुध", hi: "बुध" },
  Jupiter: { en: "Jupiter", ne: "बृहस्पति", hi: "बृहस्पति" },
  Venus: { en: "Venus", ne: "शुक्र", hi: "शुक्र" },
  Saturn: { en: "Saturn", ne: "शनि", hi: "शनि" },
};

export function kutaTerm(value: string, lang: Language): string {
  if (!value) return "";
  return TERMS[value]?.[lang] ?? PLANETS[value]?.[lang] ?? value;
}

export function kutaName(key: string, fallback: string, lang: Language): string {
  return KUTA_NAMES[key]?.[lang] ?? fallback;
}

export const VERDICTS: Record<string, { label: Tri; blurb: Tri }> = {
  uttam: {
    label: { en: "Excellent", ne: "उत्तम", hi: "उत्तम" },
    blurb: {
      en: "A strong classical match — the eight kootas agree on most counts.",
      ne: "शास्त्रअनुसार बलियो मिलान — आठै कूट प्रायः अनुकूल छन्।",
      hi: "शास्त्र के अनुसार सशक्त मिलान — आठों कूट प्रायः अनुकूल हैं।",
    },
  },
  madhyam: {
    label: { en: "Workable", ne: "मध्यम", hi: "मध्यम" },
    blurb: {
      en: "An acceptable match. Read the kootas that scored nothing — those are the real questions.",
      ne: "स्वीकार्य मिलान। शून्य अंक आएका कूटहरू हेर्नुहोस् — साँचो प्रश्न त्यहीँ छ।",
      hi: "स्वीकार्य मिलान। शून्य अंक वाले कूट देखें — असली प्रश्न वहीं है।",
    },
  },
  varjya: {
    label: { en: "Weak", ne: "अल्प", hi: "अल्प" },
    blurb: {
      en: "The kootas fall short. This asks for a guru's reading, not a number alone.",
      ne: "कूटहरू कमजोर छन्। यसका लागि अंक होइन, गुरुको विचार चाहिन्छ।",
      hi: "कूट कमजोर हैं। इसके लिए अंक नहीं, गुरु का विचार चाहिए।",
    },
  },
};

/** The Mangal finding, in the reader's language. The engine also sends an
 *  English sentence; this renders the same fact from its key. */
export const MANGLIK_REASONS: Record<string, Tri> = {
  both_manglik: {
    en: "Both partners are Manglik, so the dosha cancels itself out.",
    ne: "दुवै जना मंगली भएकाले मंगल दोष आपसमै निवारण हुन्छ।",
    hi: "दोनों मांगलिक होने से मंगल दोष परस्पर निवृत्त हो जाता है।",
  },
  neither: {
    en: "Neither partner is Manglik.",
    ne: "दुवै जना मंगली होइनन्।",
    hi: "दोनों में से कोई मांगलिक नहीं है।",
  },
  one_sided: {
    en: "One partner is Manglik while the other is not — worth taking to a guru.",
    ne: "एक जना मंगली छन्, अर्को छैनन् — यसबारे गुरुसँग परामर्श गर्नु उपयुक्त हुन्छ।",
    hi: "एक मांगलिक है, दूसरा नहीं — इस विषय पर गुरु से परामर्श उचित है।",
  },
};
