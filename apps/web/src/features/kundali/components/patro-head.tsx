"use client";

import { useTranslation } from "@/lib/i18n/language-context";
import {
  AD_MONTH_DEV,
  AYANA_DEV,
  CHARAN_DEV,
  KARANA_DEV,
  MASA_DEV,
  PAKSHA_DEV,
  RITU_DEV,
  SAMVATSARA_DEV,
  TITHI_DEV,
  VARA_DEV,
  YOGA_DEV,
  bareDev,
  dev,
  ishtaKaal,
  isSanskrit,
} from "@/lib/i18n/patro-sanskrit";
import { toLocalizedDigit } from "@/lib/i18n/vedic-translations";
import {
  AVAKHADA_TRANSLATIONS,
  getNakshatraName,
  getSignName,
} from "@/lib/i18n/vedic-translations";
import type { BirthDetailsIn, Chart } from "@/features/kundali/types";

/**
 * The head of a hand-written जन्मपत्रिका: the invocation, the mangala
 * shlokas, and the sankalpa paragraph with this chart's values written into
 * the blanks — laid out exactly as the two family patros from Parbat lay it
 * out (sample_kundali/). Nepali and Hindi render the Sanskrit; English
 * renders a translation of the same document.
 *
 * Everything printed here is a value the engine computed. The two blanks a
 * patro leaves for the guru's pen — gotra and the parents' names — stay
 * dotted blanks, because inventing them would be worse than leaving them.
 */
export function PatroHead({ chart, birth }: { chart: Chart; birth: BirthDetailsIn }) {
  const { language } = useTranslation();
  return (
    <section
      aria-label="Janma patrika"
      className="overflow-hidden rounded-lg border-4 border-double border-red-800/70 bg-[#f7efdc] px-6 py-8 text-[#1a3a1a] shadow-sm sm:px-10 dark:border-red-900/80"
    >
      {isSanskrit(language) ? (
        <SanskritPatro chart={chart} birth={birth} />
      ) : (
        <EnglishPatro chart={chart} birth={birth} />
      )}
    </section>
  );
}

/** A value the guru would write by hand — inked darker than the printed text. */
function Fill({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 font-bold text-[#26221b] underline decoration-dotted decoration-red-800/40 underline-offset-4">
      {children}
    </span>
  );
}

function Blank() {
  return <span className="mx-1 tracking-widest text-red-900/50">………</span>;
}

const SHLOKAS = [
  "स जयति सिन्दूरवदनो देवो यत्पादपङ्कजस्मरणम् । वासरमणिरिव तमसां राशिं नाशयति विघ्नानाम् ॥ १ ॥",
  "विहाय पीयूषरसं मुनीश्वराः ममांघ्रिराजीवपदं पिबन्ति किम् । इति स्वपादाम्बुजपानकौतुकी स गोपबालः श्रियमाप्नोतु ॥ २ ॥",
  "सूर्यो यच्छतु भूपतां द्विजपतिः प्रीतिं परां तन्वतां माङ्गल्यं विदधातु भूमितनयो बुद्धिं विधत्तां बुधः । गौरं गौरवमातनोतु च गुरुः शुक्रः सशुक्रार्थदः । शौरिर्वैरिविनाशनं वितनुयाद्रोगक्षयं सैंहिकः ॥ ३ ॥",
  "यं ब्रह्मवेदान्तविदो वदन्ति परं प्रधानं पुरुषं तथान्ये । विश्वोद्गतेः कारणमीश्वरं वा तस्मै नमो विघ्नविनाशनाय ॥ ४ ॥",
  "ब्रह्मा करोतु दीर्घायुः विष्णुः कुर्याच्च संपदम् । हरो रक्षतु गात्राणि यस्यैषा जन्मपत्रिका ॥ ५ ॥",
];

function SanskritPatro({ chart, birth }: { chart: Chart; birth: BirthDetailsIn }) {
  const { language } = useTranslation();
  const p = chart.panchang;
  const a = chart.avakhada;
  const n = (x: number | string) => toLocalizedDigit(x, language);
  const sign = (s: string) => getSignName(s, language);

  const birthDate = new Date(`${birth.date}T${birth.time}`);
  const ishta = ishtaKaal(birth.date, birth.time, p.sunrise);
  const moonNavamsa = chart.vargas
    .find((v) => v.code === "D9")
    ?.placements.find((pl) => pl.planet === "Moon")?.sign;
  const bhukta = chart.dasha.bhukta_ghati ?? 0;
  const bhabhoga = chart.dasha.bhabhoga_ghati ?? 0;
  const gp = (g: number) => ({ ghati: Math.floor(g), pala: Math.round((g % 1) * 60) });
  const bh = gp(bhukta);
  const bb = gp(bhabhoga);
  const yoniNe = AVAKHADA_TRANSLATIONS[a.yoni]?.ne;
  const varnaNe = AVAKHADA_TRANSLATIONS[a.varna]?.ne;
  const ganaNe = AVAKHADA_TRANSLATIONS[a.gana]?.ne;
  const nadiNe = AVAKHADA_TRANSLATIONS[a.nadi]?.ne;

  return (
    <div className="space-y-5 font-serif leading-8 [text-wrap:pretty]">
      <header className="space-y-3 text-center">
        <p className="text-2xl font-bold tracking-wide text-red-800">
          ॥ श्रीगणेशाय नमः ॥
        </p>
        <p className="text-sm text-red-800/90">
          श्रीमन्मङ्गलमूर्त्तये नमः ॥ सर्वारम्भे प्रत्यूहनिवारणाय
          मङ्गलमाचरणीयमिति शिष्टाचारान्मङ्गलानि लिख्यन्ते ॥
        </p>
      </header>

      <div className="space-y-2 text-center text-[13px] leading-7 text-red-900/85">
        {SHLOKAS.map((s) => (
          <p key={s.slice(-8)}>{s}</p>
        ))}
        <p className="pt-1 font-semibold tracking-wide text-red-800">
          अथाग्रे पद्धतिः ।
        </p>
      </div>

      <p className="text-[15px] leading-9">
        श्रीशालिवाहनीय शकः <Fill>{n(p.shaka_samvat)}</Fill>{" "}
        श्रीवीरविक्रमादित्यसम्वत् <Fill>{n(p.vikram_samvat)}</Fill> ईसवीयसन्{" "}
        <Fill>{n(birthDate.getFullYear())}</Fill> अत्रास्मिन् वर्षे{" "}
        <Fill>{dev(SAMVATSARA_DEV, p.samvatsara)}</Fill> नामसम्वत्सरे श्रीसूर्ये{" "}
        <Fill>{dev(AYANA_DEV, p.ayana)}</Fill> अयने{" "}
        <Fill>{dev(RITU_DEV, p.ritu)}</Fill> ऋतौ{" "}
        <Fill>{dev(MASA_DEV, p.masa)}</Fill> मासे{" "}
        <Fill>{dev(PAKSHA_DEV, p.paksha)}</Fill> पक्षे{" "}
        <Fill>{dev(VARA_DEV, p.vara)}</Fill> वासरे{" "}
        <Fill>{dev(TITHI_DEV, p.tithi_name)}</Fill> तिथौ{" "}
        <Fill>{getNakshatraName(p.nakshatra, language)}</Fill> नक्षत्रे तस्मिन्
        जन्म । तस्य नक्षत्रस्य जन्मसमये भुक्तघटिकानि{" "}
        <Fill>
          {n(bh.ghati)}।{n(bh.pala)}
        </Fill>{" "}
        पलानि तस्य भभोग{" "}
        <Fill>{n(bb.ghati)}</Fill> घटिकानि <Fill>{n(bb.pala)}</Fill> पलानि{" "}
        <Fill>{dev(YOGA_DEV, p.yoga)}</Fill> योगे{" "}
        <Fill>{dev(KARANA_DEV, p.karana)}</Fill> करणे जन्मेति पञ्चाङ्गम् ॥
      </p>

      <p className="text-[15px] leading-9">
        अथ सौरमानेन <Fill>{dev(MASA_DEV, p.masa)}</Fill> मासे, तदनुसार{" "}
        <Fill>{n(birthDate.getFullYear())}</Fill> ईसवीयमास{" "}
        <Fill>{AD_MONTH_DEV[birthDate.getMonth()]}</Fill>{" "}
        <Fill>{n(birthDate.getDate())}</Fill> तारिका । अत्र{" "}
        <Fill>{dev(VARA_DEV, p.vara)}</Fill> वासरे श्रीसूर्योदयादिष्ट{" "}
        {ishta && (
          <>
            <Fill>{n(ishta.ghati)}</Fill> घटिकासु <Fill>{n(ishta.pala)}</Fill>{" "}
            पलासु{" "}
          </>
        )}
        दि० <Fill>{n(birth.time.replace(":", "।"))}</Fill> बजे जन्मसमये{" "}
        <Fill>{sign(chart.lagna_sign)}</Fill> लग्नोदये{" "}
        {moonNavamsa && (
          <>
            <Fill>{sign(moonNavamsa)}</Fill> नवमांशे{" "}
          </>
        )}
        <Fill>{sign(p.moon_sign)}</Fill> राशिगते चान्द्रमसि, एवं विधे
        पञ्चाङ्गशुद्धे शुभपुण्यदिने शुभग्रहनिरीक्षितलग्ने कल्याणवत्यां
        शुभमुहूर्तबेलायां श्रीमद्ब्रह्मणो धारणात्मकशक्तिभूगोलैकदेशे भारतवर्षे
        भरतखण्डे जम्बूद्वीपे आर्यावर्तान्तर्गत हिमवत्याः दक्षिणपार्श्वे{" "}
        <Fill>{birth.place_label}</Fill> स्थाने निवसतः
        श्रीमत्स्वेष्टदेवचरणाऽऽराधनावाप्तसकलमनोरथस्य <Blank /> गोत्रोत्पन्नस्य
        श्रीमतः पिता <Blank /> तस्य पाणिगृहीता पत्नी श्रीमती <Blank />{" "}
        नाम्नीदेव्याः सुवर्णमयकुक्षौ रत्नमजीजनत् ।
      </p>

      <p className="text-[15px] leading-9">
        अस्य होराशास्त्रप्रमाणेन{" "}
        <Fill>{getNakshatraName(p.nakshatra, language)}</Fill> नक्षत्रस्य{" "}
        <Fill>{CHARAN_DEV[(a.charan ?? 1) - 1] ?? n(a.charan)}</Fill> चरणत्वेन{" "}
        <Fill>{a.name_syllable}</Fill> काराक्षरस्य{" "}
        {yoniNe && (
          <>
            <Fill>{bareDev(yoniNe)}</Fill> योनिः{" "}
          </>
        )}
        {nadiNe && (
          <>
            <Fill>{bareDev(nadiNe)}</Fill> नाडी{" "}
          </>
        )}
        {ganaNe && (
          <>
            <Fill>{bareDev(ganaNe)}</Fill> गणः{" "}
          </>
        )}
        {varnaNe && (
          <>
            <Fill>{bareDev(varnaNe)}</Fill> वर्णात्मक{" "}
          </>
        )}
        श्री <Fill>{birth.name}</Fill> इति चिरञ्जीवशुभनाम प्रतिष्ठितम् । स च
        देवद्विजाशीर्वादैर्दीर्घमायुर्भूयात् ॥
      </p>
    </div>
  );
}

function EnglishPatro({ chart, birth }: { chart: Chart; birth: BirthDetailsIn }) {
  const p = chart.panchang;
  const a = chart.avakhada;
  const birthDate = new Date(`${birth.date}T${birth.time}`);
  const ishta = ishtaKaal(birth.date, birth.time, p.sunrise);
  const moonNavamsa = chart.vargas
    .find((v) => v.code === "D9")
    ?.placements.find((pl) => pl.planet === "Moon")?.sign;
  const bhukta = chart.dasha.bhukta_ghati ?? 0;
  const bhabhoga = chart.dasha.bhabhoga_ghati ?? 0;

  return (
    <div className="space-y-5 font-serif leading-8">
      <header className="space-y-2 text-center">
        <p className="text-2xl font-bold tracking-wide text-red-800">
          ॥ Obeisance to Śrī Gaṇeśa ॥
        </p>
        <p className="text-sm italic text-red-900/85">
          May Brahmā grant long life, may Viṣṇu grant prosperity, and may Hara
          guard the limbs of the one whose birth-scroll this is. Herewith the
          record proceeds.
        </p>
      </header>

      <p className="text-[15px]">
        In the Śālivāhana Śaka year <Fill>{p.shaka_samvat}</Fill>, the Vikram
        Samvat <Fill>{p.vikram_samvat}</Fill>, the year of the Christian era{" "}
        <Fill>{birthDate.getFullYear()}</Fill>, in the samvatsara named{" "}
        <Fill>{p.samvatsara}</Fill> — the Sun being in its{" "}
        <Fill>{p.ayana === "Uttarayana" ? "northern" : "southern"}</Fill> course,
        in the season of <Fill>{p.ritu}</Fill>, in the month of{" "}
        <Fill>{p.masa}</Fill>, in the <Fill>{p.paksha}</Fill> fortnight, on{" "}
        <Fill>{p.vara}</Fill>, on the tithi <Fill>{p.tithi_name}</Fill>, under
        the nakshatra <Fill>{p.nakshatra}</Fill> — the birth took place. Of
        that nakshatra, <Fill>{bhukta.toFixed(2)}</Fill> ghati had elapsed of
        its full span of <Fill>{bhabhoga.toFixed(2)}</Fill> ghati; the yoga was{" "}
        <Fill>{p.yoga}</Fill> and the karana <Fill>{p.karana}</Fill>. Such is
        the panchanga of the birth.
      </p>

      <p className="text-[15px]">
        By the solar reckoning, in the month of <Fill>{p.masa}</Fill> —{" "}
        <Fill>
          {birthDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Fill>{" "}
        of the Christian era — at{" "}
        {ishta && (
          <>
            <Fill>
              {ishta.ghati} ghati {ishta.pala} pala
            </Fill>{" "}
            after sunrise,{" "}
          </>
        )}
        <Fill>{birth.time}</Fill> by the clock, with{" "}
        <Fill>{chart.lagna_sign}</Fill> rising
        {moonNavamsa && (
          <>
            , the Moon in the <Fill>{moonNavamsa}</Fill> navamsa
          </>
        )}{" "}
        and in the sign <Fill>{p.moon_sign}</Fill> — at the place{" "}
        <Fill>{birth.place_label}</Fill>, on the southern side of the
        Himalaya, of the gotra <Blank />, to the father <Blank /> and his wedded
        wife <Blank />, this child was born as a jewel.
      </p>

      <p className="text-[15px]">
        By the authority of the horā-śāstra: born in the{" "}
        <Fill>{ordinal(a.charan ?? 1)}</Fill> quarter of{" "}
        <Fill>{p.nakshatra}</Fill>, the naming syllable is{" "}
        <Fill>{a.name_syllable}</Fill>; the yoni <Fill>{a.yoni}</Fill>, the
        nadi <Fill>{a.nadi}</Fill>, the gana <Fill>{a.gana}</Fill>, the varna{" "}
        <Fill>{a.varna}</Fill>. By this the auspicious name{" "}
        <Fill>{birth.name}</Fill> is established — and may the blessings of
        gods and the twice-born grant long life. ॥
      </p>
    </div>
  );
}

function ordinal(x: number): string {
  return ["first", "second", "third", "fourth"][x - 1] ?? String(x);
}
