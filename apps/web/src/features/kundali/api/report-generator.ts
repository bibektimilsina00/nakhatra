import type { Chart, BirthDetailsIn } from "@/features/kundali/types";
import { formatDateFor } from "@/lib/utils/date-converter";
import type { ReportSection } from "@/features/report/types";

export function generateDynamicAstrologyReport(
  chart: Chart,
  birth: BirthDetailsIn,
  language: "en" | "ne" | "hi" = "en"
): ReportSection[] {
  const lagna = chart.lagna_sign;
  const lagnaDeg = chart.lagna_degree.toFixed(2);
  const moonSign = chart.avakhada?.sign || chart.panchang?.moon_sign || "Libra";
  const nakshatra = chart.avakhada?.nakshatra || chart.panchang?.nakshatra || "Vishakha";
  const pada = chart.avakhada?.charan || 2;
  const gana = chart.avakhada?.gana || "Deva";
  const nadi = chart.avakhada?.nadi || "Madhya";
  const tatva = chart.avakhada?.tatva || "Fire";

  const isNe = language === "ne";
  const isHi = language === "hi";

  const planetsSummary = chart.planets
    .map((p) => `${p.name} in ${p.sign} (House ${p.house}${p.retrograde ? ", ℞ Retrograde" : ""}${p.combust ? ", Combust" : ""})`)
    .join("; ");

  const d10th = chart.houses.find((h) => h.number === 10);
  const d7th = chart.houses.find((h) => h.number === 7);
  const d12th = chart.houses.find((h) => h.number === 12);
  const d6th = chart.houses.find((h) => h.number === 6);
  const dashaPeriod = chart.dasha?.periods?.[0];
  const antardashaPeriod = chart.dasha?.periods?.[1];

  const currentDashaName = dashaPeriod ? `${dashaPeriod.lord} Mahadasha` : "Active Dasha";
  const currentAntardashaName = antardashaPeriod ? `${antardashaPeriod.lord} Antardasha` : "";

  // 1. Personality & Intellect
  const personality: ReportSection = {
    id: "personality",
    icon: "🌟",
    title: isNe ? "व्यक्तित्व र बुद्धि" : isHi ? " व्यक्तित्व एवं बुद्धि" : "Personality & Intellect",
    subtitle: isNe ? "मुख्य पहिचान, मानसिकता र व्यवहार" : isHi ? "मूल पहचान, मानसिकता और व्यवहार" : "Core identity, mindset, and behavioral tendencies",
    summary: isNe
      ? `${lagna} लग्न, ${tatva} तत्व र ${nakshatra} नक्षत्रको चन्द्र प्रभावद्वारा संचालित मानसिक स्थिति।`
      : isHi
      ? `${lagna} लग्न, ${tatva} तत्व और ${nakshatra} नक्षत्र के चंद्र प्रभाव से संचालित मानसिक स्थिति।`
      : `Distinctive ${lagna} Ascendant mindset driven by ${tatva} elemental focus and ${nakshatra} Nakshatra lunar qualities.`,
    content: isNe
      ? [
          `तपाइँको जन्मकुण्डलीमा ${lagna} लग्न ${lagnaDeg}° मा उदित छ, जसले तपाइँको जीवनप्रतिको दृष्टिकोणलाई निष्ठा, उद्देश्य र दृढ नैतिक सिद्धान्तका साथ आकार दिन्छ।`,
          `तपाइँको चन्द्रमा ${moonSign} राशि र ${nakshatra} नक्षत्र (चरण ${pada}) मा स्थित छ, जसले सामाजिक र व्यावसायिक क्षेत्रमा उच्च तीक्ष्ण बुद्धि, अन्तर्ज्ञान र भावनात्मक गम्भीरता प्रदान गर्दछ।`,
          `${gana} गण र ${nadi} नाडीसँग सम्बन्धित भएकाले, तपाइँको स्वभावले उच्च बौद्धिकता र नैतिक जिम्मेवारीलाई सन्तुलनमा राख्छ, जसले दबाबमा पनि शान्त नेतृत्व लिन सहयोग पुर्याउँछ।`
        ]
      : isHi
      ? [
          `आपकी जन्मकुंडली में ${lagna} लग्न ${lagnaDeg}° पर उदित है, जो आपके जीवन के दृष्टिकोण को सत्यनिष्ठा, उद्देश्य और मजबूत नैतिक सिद्धांतों के साथ आकार देता है।`,
          `आपका चंद्रमा ${moonSign} राशि और ${nakshatra} नक्षत्र (चरण ${pada}) में स्थित है, जो सामाजिक और व्यावसायिक क्षेत्रों में उच्च तीक्ष्ण बुद्धि, अंतर्ज्ञान और भावनात्मक गहराई प्रदान करता है।`,
          `${gana} गण और ${nadi} नाड़ी से संबंधित होने के कारण, आपका स्वभाव उच्च बुद्धिमत्ता और नैतिक जिम्मेदारी को संतुलित करता है, जिससे आप दबाव में भी शांत नेतृत्व प्रदान करते हैं।`
        ]
      : [
          `Your birth chart features a ${lagna} Ascendant rising at ${lagnaDeg}°, shaping your fundamental approach to life with integrity, purpose, and strong personal principles.`,
          `Your Moon is placed in ${moonSign} under ${nakshatra} Nakshatra (Pada ${pada}), granting high mental acuity, intuitive perception, and emotional depth in social and professional environments.`,
          `Belonging to the ${gana} Gana and ${nadi} Nadi, your temperament balances high intellect with moral responsibility, allowing you to project calm authority under pressure.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `${lagna} लग्न (${lagnaDeg}°)`,
            explanation: `मुख्य जीवन ऊर्जा, व्यक्तिगत दृष्टिकोण र शारीरिक स्वास्थ निर्धारण गर्दछ।`
          },
          {
            placement: `चन्द्रमा ${moonSign} मा (${nakshatra} चरण ${pada})`,
            explanation: `आन्तरिक भावनात्मक प्रक्रिया र मानसिक बानीहरू निर्धारण गर्दछ।`
          },
          {
            placement: `${gana} गण · ${tatva} तत्व`,
            explanation: `सामाजिक सम्बन्ध र नैतिक सीमाहरूलाई आकार दिन्छ।`
          }
        ]
      : isHi
      ? [
          {
            placement: `${lagna} लग्न (${lagnaDeg}°)`,
            explanation: `मूल जीवन ऊर्जा, व्यक्तिगत दृष्टिकोण और शारीरिक स्वास्थ्य निर्धारित करता है।`
          },
          {
            placement: `चंद्रमा ${moonSign} में (${nakshatra} चरण ${pada})`,
            explanation: `आंतरिक भावनात्मक प्रक्रिया और मानसिक आदतों को निर्धारित करता है।`
          },
          {
            placement: `${gana} गण · ${tatva} तत्व`,
            explanation: `सामाजिक संबंधों और नैतिक सीमाओं को आकार देता है।`
          }
        ]
      : [
          {
            placement: `${lagna} Ascendant (${lagnaDeg}°)`,
            explanation: `Establishes core vitality, personal orientation, and physical demeanor.`
          },
          {
            placement: `Moon in ${moonSign} (${nakshatra} Pada ${pada})`,
            explanation: `Determines internal emotional processing, mental habits, and subconscious drives.`
          },
          {
            placement: `${gana} Gana · ${tatva} Tatva`,
            explanation: `Shapes social interactions, ethical boundaries, and elemental motivation.`
          }
        ]
  };

  // 2. Strengths & Growth Areas
  const strengths: ReportSection = {
    id: "strengths-weaknesses",
    icon: "⚖️",
    title: isNe ? "सबल पक्ष र सुधारका क्षेत्रहरू" : isHi ? "शक्तियां एवं सुधार के क्षेत्र" : "Strengths & Growth Areas",
    subtitle: isNe ? "जन्मजात प्रतिभा र ध्यान दिनुपर्ने पक्षहरू" : isHi ? "जन्मजात प्रतिभाएं और सावधान रहने योग्य पहलू" : "Innate talents and potential pitfalls to guard against",
    summary: isNe
      ? "गहिरो ध्यान र कार्यगत अनुशासनको क्षमता, जसलाई कहिलेकाहीँ मानसिक अति-सोचले प्रभावित पार्न सक्छ।"
      : isHi
      ? "गहरी एकाग्रता और कार्य अनुशासन की क्षमता, जो कभी-कभी अत्यधिक सोच से प्रभावित हो सकती है।"
      : "Extraordinary capacity for deep focus and executive discipline balanced against periodic mental overthinking.",
    content: isNe
      ? [
          `💪 मुख्य सबल पक्ष: अद्भुत धैर्य, रणनीतिक दूरदर्शिता, वार्तामा उच्च इमानदारी, र जटिल प्राविधिक वा वित्तीय प्रणालीमा निपुणता।`,
          `⚠️ सुधारका क्षेत्र: भाव ${d6th?.number || 6} (${d6th?.sign || "६ औं भाव"}) मा सक्रिय ऊर्जा भएकाले, सानातिना असफलताहरूको अत्यधिक विश्लेषण वा कार्यस्थलको तनावबाट बच्नुहोस्।`,
          `संरचित दिनचर्या र महत्त्वपूर्ण निर्णयहरूको समयमा भावनात्मक सन्तुलन कायम राख्नाले तपाइँको नेतृत्व क्षमतालाई बढाउँछ।`
        ]
      : isHi
      ? [
          `💪 मुख्य शक्तियां: अद्भुत धैर्य, रणनीतिक दूरदर्शिता, बातचीत में उच्च ईमानदारी, और जटिल तकनीकी या वित्तीय प्रणालियों में महारत।`,
          `⚠️ सुधार के क्षेत्र: भाव ${d6th?.number || 6} (${d6th?.sign || "6वें भाव"}) में सक्रिय ऊर्जा होने से, छोटी असफलताओं का अत्यधिक विश्लेषण करने से बचें।`,
          `संरचित दिनचर्या और महत्वपूर्ण निर्णयों के दौरान भावनात्मक संतुलन बनाए रखने से आपकी नेतृत्व क्षमता में वृद्धि होगी।`
        ]
      : [
          `💪 Key Strengths: Remarkable perseverance, strategic foresight, high integrity in negotiations, and natural aptitude for mastering complex technical or financial systems.`,
          `⚠️ Growth Areas: With active energy in house ${d6th?.number || 6} (${d6th?.sign || "6th house"}), beware of over-analysing minor setbacks or absorbing unnecessary workplace friction.`,
          `Cultivating structured routines and emotional detachment during high-stakes decisions will amplify your personal leadership effectiveness.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `प्रथम भावको स्वामी (${lagna} स्वामी ${chart.houses.find((h) => h.number === 1)?.lord || "लगनेश"})`,
            explanation: `मुख्य इच्छाशक्ति, सहनशीलता र आत्मबल प्रदान गर्दछ।`
          },
          {
            placement: `ग्रह स्थिति: ${planetsSummary.slice(0, 70)}...`,
            explanation: `केन्द्र र त्रिकोण भावमा ग्रहहरूको ऊर्जा वितरण।`
          }
        ]
      : isHi
      ? [
          {
            placement: `प्रथम भाव का स्वामी (${lagna} स्वामी ${chart.houses.find((h) => h.number === 1)?.lord || "लग्नेश"})`,
            explanation: `मूल इच्छाशक्ति, सहनशीलता और आत्मबल प्रदान करता है।`
          },
          {
            placement: `ग्रह स्थिति: ${planetsSummary.slice(0, 70)}...`,
            explanation: `केंद्र और त्रिकोण भावों में ग्रहों की ऊर्जा वितरण।`
          }
        ]
      : [
          {
            placement: `Ruler of House 1 (${lagna} Lord ${chart.houses.find((h) => h.number === 1)?.lord})`,
            explanation: `Provides core willpower, resilience, and personal endurance.`
          },
          {
            placement: `Planetary Placements: ${planetsSummary.slice(0, 70)}...`,
            explanation: `Distribution of planetary energies across Kendras and Trikonas.`
          }
        ]
  };

  // 3. Career & Financial Outlook
  const career: ReportSection = {
    id: "career-finance",
    icon: "💼",
    title: isNe ? "करियर र वित्तीय दृष्टिकोण" : isHi ? "करियर एवं वित्तीय दृष्टिकोण" : "Career & Financial Outlook",
    subtitle: isNe ? "धन सम्भावना, पेशागत क्षेत्र र करियरका उपलब्धिहरू" : isHi ? "धन संभावना, पेशेवर क्षेत्र और करियर के मील के पत्थर" : "Wealth potential, domain alignment, and career milestones",
    summary: isNe
      ? `${d10th?.sign || "१० औं भाव"} को नेतृत्व, रणनीतिक व्यवस्थापन वा स्वतन्त्र परामर्शमा केन्द्रित उच्च करियर सम्भावना।`
      : isHi
      ? `${d10th?.sign || "10वें भाव"} के नेतृत्व, रणनीतिक प्रबंधन या स्वतंत्र परामर्श पर केंद्रित उच्च करियर संभावना।`
      : `Prominent career trajectory aligned with ${d10th?.sign || "10th House"} leadership, strategic management, or independent consulting.`,
    content: isNe
      ? [
          `तपाइँको दशम (कर्म) भाव ${d10th?.sign || "१० औं राशि"} मा छ, जसको स्वामी ${d10th?.lord || "दशमेश"} हो। यो स्थितिले प्रशासनिक अधिकार, प्रविधि, वित्त वा विश्लेषणात्मक परामर्शमा सफलता दिन्छ।`,
          `तपाइँ कठोर सूक्ष्म-व्यवस्थापनको सट्टा रणनीतिक निर्णयहरूमा स्वतन्त्रता पाउँदा उत्कृष्ट प्रदर्शन गर्नुहुन्छ।`,
          `मुख्य दशा परिवर्तनको समयमा, विशेष गरी ${currentDashaName} को अन्तर्गत महत्त्वपूर्ण आर्थिक वृद्धि र सम्पत्ति सञ्चय हुनेछ।`
        ]
      : isHi
      ? [
          `आपका दशम (कर्म) भाव ${d10th?.sign || "10वीं राशि"} में है, जिसके स्वामी ${d10th?.lord || "दशमेश"} हैं। यह स्थिति प्रशासनिक अधिकार, प्रौद्योगिकी, वित्त या विश्लेषणात्मक परामर्श में सफलता देती है।`,
          `आप कठोर सूक्ष्म-प्रबंधन के बजाय रणनीतिक निर्णयों में स्वतंत्रता मिलने पर सर्वश्रेष्ठ प्रदर्शन करते हैं।`,
          `मुख्य दशा परिवर्तनों के दौरान, विशेष रूप से ${currentDashaName} के तहत महत्वपूर्ण वित्तीय वृद्धि और संपत्ति संचय होगा।`
        ]
      : [
          `Your 10th house of career falls in ${d10th?.sign || "10th Sign"}, ruled by ${d10th?.lord || "10th Lord"}. This configuration favors executive authority, technological innovation, finance, or analytical consulting.`,
          `You perform at your highest potential when granted creative autonomy over strategic decisions rather than rigid micromanagement.`,
          `Significant financial expansion and asset accumulation are highlighted during key Dasha transitions, particularly under ${currentDashaName}.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `१० औं भाव ${d10th?.sign || "१० औं भाव"} (स्वामी: ${d10th?.lord})`,
            explanation: `पेशेवर प्रतिष्ठा, सामाजिक सम्मान र करियरको महत्वाकांक्षा निर्देशित गर्दछ।`
          },
          {
            placement: `११ औं भाव ${chart.houses.find((h) => h.number === 11)?.sign} (स्वामी: ${chart.houses.find((h) => h.number === 11)?.lord})`,
            explanation: `आम्दानीको लाभ, व्यावसायिक सञ्जाल र नियमित धन प्रवाहलाई असर गर्छ।`
          }
        ]
      : isHi
      ? [
          {
            placement: `10वां भाव ${d10th?.sign || "10वां भाव"} (स्वामी: ${d10th?.lord})`,
            explanation: `पेशेवर प्रतिष्ठा, सामाजिक सम्मान और करियर की महत्वाकांक्षा निर्देशित करता है।`
          },
          {
            placement: `11वां भाव ${chart.houses.find((h) => h.number === 11)?.sign} (स्वामी: ${chart.houses.find((h) => h.number === 11)?.lord})`,
            explanation: `आय के लाभ, पेशेवर नेटवर्क और नियमित धन प्रवाह को प्रभावित करता है।`
          }
        ]
      : [
          {
            placement: `10th House in ${d10th?.sign || "10th House"} (Lord: ${d10th?.lord})`,
            explanation: `Directly governs professional status, public reputation, and executive ambition.`
          },
          {
            placement: `11th House in ${chart.houses.find((h) => h.number === 11)?.sign} (Lord: ${chart.houses.find((h) => h.number === 11)?.lord})`,
            explanation: `Influences income gains, professional networks, and recurring revenue streams.`
          }
        ]
  };

  // 4. Love & Marriage
  const marriage: ReportSection = {
    id: "love-marriage",
    icon: "❤️",
    title: isNe ? "प्रेम र विवाह" : isHi ? "प्रेम एवं विवाह" : "Love & Marriage",
    subtitle: isNe ? "सम्बन्धको स्थिति, जीवनसाथीको लक्षण र समय" : isHi ? "संबंधों की स्थिति, जीवनसाथी के लक्षण एवं समय" : "Relationship dynamics, partner traits, and timing",
    summary: isNe
      ? `${d7th?.sign || "७ औं भाव"} को प्रभाव अन्तर्गत बौद्धिक साझेदारी र साझा जीवन मूल्यहरू।`
      : isHi
      ? `${d7th?.sign || "7वें भाव"} के प्रभाव के तहत बौद्धिक साझेदारी और साझा जीवन मूल्य।`
      : `Intellectual partnership and shared life values under ${d7th?.sign || "7th House"} relationship influence.`,
    content: isNe
      ? [
          `तपाइँको सप्तम (विवाह) भाव ${d7th?.sign || "७ औं राशि"} मा अवस्थित छ, जसको स्वामी ${d7th?.lord || "सप्तमेश"} हो।`,
          `तपाइँको आदर्श जीवनसाथी सुझबुझ भएको, सफल र भावनात्मक रूपमा सन्तुलित हुनेछ, जसलाई व्यावसायिक वा सामाजिक क्षेत्रमार्फत भेट्न सकिन्छ।`,
          `सम्बन्धमा मधुरता खुला संवाद, आपसी सम्मान र साझा दीर्घकालीन लक्ष्यहरूमा आधारित हुँदा मौलाउँछ।`
        ]
      : isHi
      ? [
          `आपका सप्तम (विवाह) भाव ${d7th?.sign || "7वीं राशि"} में स्थित है, जिसके स्वामी ${d7th?.lord || "सप्तमेश"} हैं।`,
          `आपका आदर्श जीवनसाथी समझदार, सफल और भावनात्मक रूप से संतुलित होगा, जिससे पेशेवर या सामाजिक क्षेत्र के माध्यम से मुलाकात हो सकती है।`,
          `संबंधों में मधुरता खुले संवाद, आपसी सम्मान और साझा दीर्घकालिक लक्ष्यों पर आधारित होने पर फलती-फूलती है।`
        ]
      : [
          `Your 7th house of marriage and partnership is located in ${d7th?.sign || "7th Sign"}, ruled by ${d7th?.lord || "7th Lord"}.`,
          `Your ideal life partner is communicative, accomplished, and emotionally balanced, met through professional networks, educational settings, or shared interests.`,
          `Relationship harmony flourishes when grounded in open communication, mutual respect, and shared long-term goals.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `७ औं भाव ${d7th?.sign || "७ औं भाव"} (स्वामी: ${d7th?.lord})`,
            explanation: `जीवनसाथीको गुण, वैवाहिक सम्बन्ध र दिगोपन निर्धारण गर्दछ।`
          },
          {
            placement: `शुक्र ${chart.planets.find((p) => p.name === "Venus")?.sign || "राशि"} मा (भाव ${chart.planets.find((p) => p.name === "Venus")?.house || 1})`,
            explanation: `रोमान्टिक सद्भाव, स्नेह र व्यक्तिगत वैवाहिक सन्तुष्टिको प्रतीक हो।`
          }
        ]
      : isHi
      ? [
          {
            placement: `7वां भाव ${d7th?.sign || "7वां भाव"} (स्वामी: ${d7th?.lord})`,
            explanation: `जीवनसाथी के गुण, वैवाहिक संबंध और स्थायित्व निर्धारित करता है।`
          },
          {
            placement: `शुक्र ${chart.planets.find((p) => p.name === "Venus")?.sign || "राशि"} में (भाव ${chart.planets.find((p) => p.name === "Venus")?.house || 1})`,
            explanation: `रोमांटिक सद्भाव, स्नेह और व्यक्तिगत वैवाहिक संतुष्टि का प्रतीक है।`
          }
        ]
      : [
          {
            placement: `7th House in ${d7th?.sign || "7th House"} (Lord: ${d7th?.lord})`,
            explanation: `Shapes partner character traits, marital bond, and relationship longevity.`
          },
          {
            placement: `Venus in ${chart.planets.find((p) => p.name === "Venus")?.sign || "Sign"} (House ${chart.planets.find((p) => p.name === "Venus")?.house || 1})`,
            explanation: `Signifies romantic harmony, affection, and personal marital satisfaction.`
          }
        ]
  };

  // 5. Foreign Travel & Spirituality
  const travel: ReportSection = {
    id: "travel-spirituality",
    icon: "✈️",
    title: isNe ? "विदेश यात्रा र अध्यात्म" : isHi ? "विदेश यात्रा एवं अध्यात्म" : "Foreign Travel & Spirituality",
    subtitle: isNe ? "विदेशी अवसर र आन्तरिक अध्यात्म" : isHi ? "विदेशी अवसर और आंतरिक अध्यात्म" : "Overseas opportunities and inner awakening",
    summary: isNe
      ? `${d12th?.sign || "१२ औं भाव"} मा सक्रिय स्थितिले वैदेशिक सम्बन्ध, अन्तर्राष्ट्रिय प्रगति र आध्यात्मिक ज्ञान दर्साउँछ।`
      : isHi
      ? `${d12th?.sign || "12वें भाव"} में सक्रिय स्थिति विदेशी संबंधों, अंतर्राष्ट्रीय प्रगति और आध्यात्मिक ज्ञान को दर्शाती है।`
      : `Active 12th house in ${d12th?.sign || "12th House"} indicating foreign connections, international growth, and spiritual wisdom.`,
    content: isNe
      ? [
          `तपाइँको १२ औं भाव ${d12th?.sign || "१२ औं राशि"} मा भएकाले, विदेश भ्रमण, अन्तर्राष्ट्रिय व्यापार वा दूरगामी स्थानान्तरणले तपाइँको भाग्यमा महत्त्वपूर्ण भूमिका खेल्छ।`,
          `आध्यात्मिक रूपमा, तपाइँ परम्परागत कर्मकाण्डभन्दा ध्यान, आत्मचिन्तन र दर्शनतर्फ स्वाभाविक रूपमा आकर्षित हुनुहुन्छ।`
        ]
      : isHi
      ? [
          `आपका 12वां भाव ${d12th?.sign || "12वीं राशि"} में होने से, विदेश यात्रा, अंतर्राष्ट्रीय व्यापार या दूरगामी स्थानांतरण आपके भाग्य में महत्वपूर्ण भूमिका निभाता है।`,
          `आध्यात्मिक रूप से, आप पारंपरिक कर्मकांड के बजाय ध्यान, आत्मचिंतन और दर्शन की ओर स्वाभाविक रूप से आकर्षित होते हैं।`
        ]
      : [
          `With your 12th house in ${d12th?.sign || "12th Sign"}, overseas travel, international business, or long-distance relocation plays a meaningful role in your destiny.`,
          `Spiritually, you naturally lean toward introspective practices, meditation, and philosophy over ritualistic routine.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `१२ औं भाव ${d12th?.sign || "१२ औं भाव"} (स्वामी: ${d12th?.lord})`,
            explanation: `अन्तर्राष्ट्रिय सम्बन्ध, वैदेशिक निवास र आध्यात्मिक मोक्ष निर्देशित गर्दछ।`
          }
        ]
      : isHi
      ? [
          {
            placement: `12वां भाव ${d12th?.sign || "12वां भाव"} (स्वामी: ${d12th?.lord})`,
            explanation: `अंतर्राष्ट्रीय मामलों, विदेशी निवास और आध्यात्मिक मोक्ष को निर्देशित करता है।`
          }
        ]
      : [
          {
            placement: `12th House in ${d12th?.sign || "12th House"} (Lord: ${d12th?.lord})`,
            explanation: `Governs international affairs, foreign residence, and spiritual liberation (Moksha).`
          }
        ]
  };

  // 6. Current Dasha & Important Periods
  const dasha: ReportSection = {
    id: "current-dasha",
    icon: "🕐",
    title: isNe ? "वर्तमान दशा र महत्त्वपूर्ण अवधिहरू" : isHi ? "वर्तमान दशा एवं महत्वपूर्ण अवधियां" : "Current Dasha & Important Periods",
    subtitle: isNe ? "विंशोत्तरी काल पुरुष जसले तपाइँको वर्तमान अध्याय निर्धारण गर्दैछन्" : isHi ? "विंशोत्तरी समय स्वामी जो आपके वर्तमान अध्याय को आकार दे रहे हैं" : "Vimshottari time lords shaping your current chapter",
    summary: isNe
      ? `${currentDashaName}${currentAntardashaName ? ` ➔ ${currentAntardashaName}` : ""} को यात्रामा।`
      : isHi
      ? `${currentDashaName}${currentAntardashaName ? ` ➔ ${currentAntardashaName}` : ""} की यात्रा में।`
      : `Navigating ${currentDashaName}${currentAntardashaName ? ` ➔ ${currentAntardashaName}` : ""}.`,
    content: isNe
      ? [
          `तपाइँ हाल **${currentDashaName}** ${currentAntardashaName ? `र **${currentAntardashaName}**` : ""} को प्रभावमा हुनुहुन्छ, जसले तपाइँको ध्यान रणनीतिक प्रगति र जीवनको आधारभूत विकासतर्फ निर्देशित गर्दछ।`,
          `यो अवधिले अनुशासित कार्य, प्रमुख व्यावसायिक कौशलको विस्तार र दीर्घकालीन प्रतिबद्धताहरूलाई सुदृढ बनाउन मद्दत गर्दछ।`
        ]
      : isHi
      ? [
          `आप वर्तमान में **${currentDashaName}** ${currentAntardashaName ? `और **${currentAntardashaName}**` : ""} के प्रभाव में हैं, जो आपके ध्यान को रणनीतिक प्रगति और जीवन के बुनियादी विकास की ओर निर्देशित करता है।`,
          `यह अवधि अनुशासित कार्य निष्पादन, प्रमुख पेशेवर कौशलों के विस्तार और दीर्घकालिक प्रतिबद्धताओं को मजबूत करने के लिए अनुकूल है।`
        ]
      : [
          `You are currently experiencing **${currentDashaName}** ${currentAntardashaName ? `with **${currentAntardashaName}**` : ""}, directing focus toward strategic growth and foundational life progress.`,
          `This period favors disciplined execution, expanding key professional skills, and solidifying long-term personal commitments.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `${currentDashaName} (${formatDateFor(dashaPeriod?.start?.slice(0, 10) || "", "ne")} देखि ${formatDateFor(dashaPeriod?.end?.slice(0, 10) || "", "ne")})`,
            explanation: `तपाइँको ${nakshatra} चन्द्र नक्षत्रबाट गणना गरिएको मुख्य विंशोत्तरी महादशा समयरेखा।`
          }
        ]
      : isHi
      ? [
          {
            placement: `${currentDashaName} (${formatDateFor(dashaPeriod?.start?.slice(0, 10) || "", "hi")} से ${formatDateFor(dashaPeriod?.end?.slice(0, 10) || "", "hi")})`,
            explanation: `आपके ${nakshatra} चंद्र नक्षत्र से परिकलित मुख्य विंशोत्तरी महादशा समयरेखा।`
          }
        ]
      : [
          {
            placement: `${currentDashaName} (${dashaPeriod?.start?.slice(0, 10) || ""} to ${dashaPeriod?.end?.slice(0, 10) || ""})`,
            explanation: `Primary Vimshottari Mahadasha timeline calculated from your ${nakshatra} Moon Nakshatra.`
          }
        ]
  };

  // 7. Remedial Measures
  const remedies: ReportSection = {
    id: "remedies",
    icon: "🪔",
    title: isNe ? "ज्योतिषीय उपाय तथा आध्यात्मिक मार्गदर्शन" : isHi ? "ज्योतिषीय उपाय एवं आध्यात्मिक मार्गदर्शन" : "Remedial Measures & Spiritual Guidance",
    subtitle: isNe ? "ग्रहहरूको ऊर्जा सन्तुलन गर्न विशेष वैदिक उपायहरू" : isHi ? "ग्रहों की ऊर्जा को संतुलित करने के लिए विशेष वैदिक उपाय" : "Custom Vedic remedies to balance planetary energies",
    summary: isNe
      ? `${lagna} लग्न र ${moonSign} चन्द्र राशिका लागि विशेष वैदिक उपायहरू।`
      : isHi
      ? `${lagna} लग्न और ${moonSign} चंद्र राशि के लिए विशेष वैदिक उपाय।`
      : `Tailored Vedic remedies for ${lagna} Ascendant and ${moonSign} Moon placement.`,
    content: isNe
      ? [
          `🪔 **दैनिक साधना**: बिहानको सूर्यलाई जल चढाउनुहोस् र मानसिक शान्तिका लागि गायत्री मन्त्र वा विष्णु सहस्रनाम पाठ गर्नुहोस्।`,
          `💎 **शुभ रङ्ग र ध्यान**: पहेँलो/सुनौलो र गाढा नीलो रङ्गले ${lagna} लग्नका लागि एकाग्रता र रक्षा प्रदान गर्दछ।`,
          `🤝 **दान तथा सेवा**: शनिबार शैक्षिक क्षेत्रमा सहयोग वा जनावरहरूलाई भोजन गराउनाले ग्रहहरूको शुभ फल प्राप्त हुन्छ।`
        ]
      : isHi
      ? [
          `🪔 **दैनिक साधना**: सुबह के सूर्य को अर्घ्य दें और मानसिक शांति के लिए गायत्री मंत्र या विष्णु सहस्रनाम का पाठ करें।`,
          `💎 **शुभ रंग एवं ध्यान**: पीला/सुनहरा और गहरा नीला रंग ${lagna} लग्न के लिए एकाग्रता और सुरक्षा प्रदान करता है।`,
          `🤝 **दान एवं सेवा**: शनिवार को शैक्षणिक कार्यों में सहयोग या पशुओं को भोजन कराने से ग्रहों की कृपा प्राप्त होती है।`
        ]
      : [
          `🪔 **Daily Practices**: Offer water to the morning sun and recite the Gayatri Mantra or Vishnu Sahasranama for mental clarity and peace.`,
          `💎 **Auspicious Color & Focus**: Yellow/Gold and Deep Blue bring enhanced focus and protection for ${lagna} Ascendant.`,
          `🤝 **Charity & Service**: Supporting educational causes or feeding animals on Saturdays brings divine planetary grace.`
        ],
    reasoning: isNe
      ? [
          {
            placement: `लग्न स्वामी: ${chart.houses.find((h) => h.number === 1)?.lord || "लगनेश"}`,
            explanation: `मुख्य जीवन शक्ति, प्रतिरोधक क्षमता र जीवनको सफलतालाई बलियो बनाउँछ।`
          }
        ]
      : isHi
      ? [
          {
            placement: `लग्न स्वामी: ${chart.houses.find((h) => h.number === 1)?.lord || "लग्नेश"}`,
            explanation: `मूल जीवन शक्ति, प्रतिरोधक क्षमता और जीवन की सफलता को मजबूत करता है।`
          }
        ]
      : [
          {
            placement: `Ascendant Ruler: ${chart.houses.find((h) => h.number === 1)?.lord || "Lagna Lord"}`,
            explanation: `Strengthens core vitality, immunity, and overall life success.`
          }
        ]
  };

  return [personality, strengths, career, marriage, travel, dasha, remedies];
}
