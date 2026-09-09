export type Language = "en" | "ne" | "hi";

export interface TranslationCatalog {
  // Navigation & Branding
  brandName: string;
  vedicAstrology: string;
  home: string;
  freeKundali: string;
  vedicReading: string;
  talkToAstrologer: string;
  selectLanguage: string;

  // Hero & Form
  heroTagline: string;
  heroTitle: string;
  heroSub: string;
  birthDetails: string;
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  calculateKundali: string;
  calculating: string;

  // Features
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;

  // Reading Page
  readingHeader: string;
  seekerName: string;
  tabChart: string;
  tabPlanets: string;
  tabDasha: string;
  tabVargas: string;
  tabAnalysis: string;
  tabAskAI: string;
  lagnaAscendant: string;
  moonSign: string;
  nakshatra: string;
  currentDasha: string;
  openLiveVoice: string;
  backToReport: string;

  // Live Voice Workspace
  liveWorkspaceTitle: string;
  listeningState: string;
  thinkingState: string;
  speakingState: string;
  pausedState: string;
  askPlaceholder: string;
  sendQuery: string;
  interrupt: string;
  transcript: string;
  kundaliChart: string;
  exitVoice: string;
  mute: string;
  unmute: string;

  // Reading Page Widgets & Controls
  kundaliChartsTitle: string;
  kundaliChartsSub: string;
  d1LagnaChartTitle: string;
  d9NavamshaChartTitle: string;
  ascendantLabel: string;
  houseLabel: string;
  lordLabel: string;
  tapHouseHelper: string;
  avakhadaTitle: string;
  moonSignLabel: string;
  nakshatraLabel: string;
  nakshatraPadaLabel: string;
  nameSyllableLabel: string;
  ganaLabel: string;
  nadiLabel: string;
  yoniLabel: string;
  varnaElementLabel: string;
  auspiciousTitle: string;
  luckyColors: string;
  unluckyColors: string;
  luckyGemstones: string;
  unluckyGemstones: string;
  planetaryPositionsTitle: string;
  compactLabel: string;
  fullDetailsLabel: string;
  thPlanet: string;
  thSign: string;
  thHouse: string;
  thDegree: string;
  activeDashaTitle: string;
  narrativeAudioTitle: string;
  narrativeAudioSub: string;
  telemetryTitle: string;
  activeScriptLabel: string;
  catOverview: string;
  catPersonality: string;
  catCareer: string;
  catMarriage: string;
  catDasha: string;
  catRemedies: string;
  astrologicalFootnotes: string;
  bottomCtaQuestion: string;
  bottomCtaBtn: string;
  selectVoice: string;
  astrologerVoice: string;
  downloadPdf: string;
  shareReading: string;
  downloadAudio: string;
  shareAudio: string;
  pdfGenerating: string;

  // Live Workspace Extra UI Translations
  realtimeResponse: string;
  listeningToVoice: string;
  askAnyQuestionOrb: string;
  messagesCount: string;
  viewTranscript: string;
  closeChartDrawer: string;
  closeTranscriptDrawer: string;
  d1SiderealBirthChart: string;
  activeTimeLords: string;
  consultSuggestedTopics: string;
  groundedInChart: string;
  suggestedFollowups: string;
  realtimeListening: string;
  analyzingSpeech: string;
  astrologerSpeaking: string;
  voiceReadyPaused: string;
  micHardwareStatus: string;
  micVu: string;
  debugLabel: string;
  deskView: string;
  voiceView: string;
  tapToInterrupt: string;
  tapToStartVoice: string;
  realtimeAudioEngine: string;
  vedicVoiceEngine: string;
  sendNow: string;
  exitLabel: string;
  closePanel: string;
  connectingToDesk: string;
  calculatingEphemeris: string;
  mahadashaLabel: string;
  antardashaLabel: string;
  noActiveDasha: string;
  dashaOverviewTitle: string;
  dashaOverviewWhatIs: string;
  dashaOverviewWhatIsDesc: string;
  dashaOverviewYourCurrent: string;
  dashaOverviewMainPeriod: string;
  dashaOverviewSubPeriod: string;
  dashaOverviewDuration: string;
  dashaOverviewToLabel: string;
  dashaOverviewNoPeriod: string;
  dashaOverviewYears: string;
  vimshottariLabel: string;
  askAnythingHint: string;
  consultReconnecting: string;
  callStartVoice: string;
  callStartVideo: string;
  callRinging: string;
  callIncoming: string;
  callConnecting: string;
  callLive: string;
  callAnswer: string;
  callDecline: string;
  callMute: string;
  callCamera: string;
  callEnd: string;
  callNoRelay: string;
  callNoMic: string;
  consultPerMinute: string;
  consultElapsed: string;
  consultCost: string;
  consultBalance: string;
  consultLeft: string;
  consultLowBalance: string;
  consultTitle: string;
  consultNone: string;
  consultNoneNote: string;
  consultStart: string;
  consultEnd: string;
  consultAccept: string;
  consultDecline: string;
  consultCancel: string;
  consultSend: string;
  consultPlaceholder: string;
  consultShareChart: string;
  consultWaiting: string;
  consultEnded: string;
  consultTopUp: string;
  consultGrants: string;
  consultRevoke: string;
  consultShared: string;
  practBecome: string;
  practApplicationStatus: string;
  practDesk: string;
  practRates: string;
  practRatesNote: string;
  practSetRate: string;
  practRequests: string;
  practLive: string;
  practOffline: string;
  practNoRates: string;
  practPendingNote: string;
  practSubmitted: string;
  practIntroVideo: string;
  practIntroVideoNote: string;
  practStatus: string;
  applyWho: string;
  applyReach: string;
  applyExpertise: string;
  applyNext: string;
  practCountry: string;
  practYearsSuffix: string;
  practPhoneNote: string;
  practPhoneInvalid: string;
  practCityPlaceholder: string;
  practNamePlaceholder: string;
  practReviewLink: string;
  practVerified: string;
  practUnverified: string;
  practPriced: string;
  practYourProfile: string;
  practBio: string;
  practBioPlaceholder: string;
  practSpecialities: string;
  practSaveProfile: string;
  practSaved: string;
  practUnlist: string;
  practComingSoon: string;
  soonNote: string;
  practRegister: string;
  practPhoto: string;
  practPhotoNote: string;
  practPractice: string;
  practBothNote: string;
  practYears: string;
  practPhone: string;
  practCity: string;
  practTraditions: string;
  practHeadline: string;
  practHeadlinePlaceholder: string;
  practSearch: string;
  practUnavailable: string;
  practNoneYet: string;
  practNoneYetNote: string;
  practApplyTitle: string;
  practApplyLead: string;
  practApplySubmit: string;
  practApplyPending: string;
  practApplyApproved: string;
  practApplyRejected: string;
  practReviewQueue: string;
  practApprove: string;
  practReject: string;
  profFollow: string;
  profFollowing: string;
  profMessage: string;
  profBook: string;
  profAbout: string;
  profRates: string;
  profReviews: string;
  profNoReviews: string;
  profNoReviewsNote: string;
  profUnrated: string;
  profConsultations: string;
  profFollowers: string;
  profReply: string;
  profReplyPlaceholder: string;
  profNotFound: string;
  profSpeaks: string;
  bookTitle: string;
  bookMedium: string;
  bookWhen: string;
  bookNow: string;
  bookLater: string;
  bookDate: string;
  bookTime: string;
  bookNote: string;
  bookConfirm: string;
  bookPast: string;
  bookUnpriced: string;
  chatTab: string;
  chatNoMessages: string;
  chatScheduled: string;
  reviewTitle: string;
  reviewNote: string;
  reviewPlaceholder: string;
  reviewSubmit: string;
  reviewThanks: string;
  voiceFellBack: string;
  notifSavedToVault: string;
  notifConversationUpdated: string;
  notifMarkAllRead: string;
  notifSeeAll: string;
  notifTitle: string;
  notifAllCaughtUp: string;
  ascendantPlacementLabel: string;
  masterAstrologer: string;
  birthTimeNote: string;
  gender: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  selectDate: string;
  selectTime: string;

  // Dashboard
  dashGreeting: string;
  dashSubtitle: string;
  dashStatCharts: string;
  dashStatMember: string;
  dashActions: string;
  dashNewKundali: string;
  dashNewKundaliBody: string;
  dashReading: string;
  dashReadingBody: string;
  dashLive: string;
  dashLiveBody: string;
  dashMilan: string;
  dashMilanBody: string;
  dashConsult: string;
  dashConsultBody: string;
  dashSoon: string;
  dashSaved: string;
  dashSavedCount: string;
  dashEmptyTitle: string;
  dashEmptyBody: string;
  dashOpen: string;
  dashOpening: string;
  chooseTitle: string;
  chooseReadingNote: string;
  chooseLiveNote: string;
  chooseEmpty: string;
  dashDelete: string;
  dashConfirmDelete: string;
  dashCancel: string;
  dashNotRecalculable: string;
  dashLoadFailed: string;
  dashSignedInAs: string;
  dashSignOut: string;
  dashSignIn: string;
  dashNavHome: string;
  dashNavNew: string;
  dashNavReading: string;
  dashNavLive: string;
  dashNavMilan: string;
  dashNavLibrary: string;
  dashNavRecent: string;
  dashHelp: string;
  dashSettings: string;
  acctProfile: string;
  acctSettings: string;
  acctYourAccount: string;
  acctName: string;
  acctNameNote: string;
  acctEmail: string;
  acctEmailNote: string;
  acctJoined: string;
  acctRole: string;
  acctSave: string;
  acctSaved: string;
  acctActivity: string;
  acctPassword: string;
  acctCurrentPassword: string;
  acctNewPassword: string;
  acctPasswordNote: string;
  acctPasswordChanged: string;
  acctChangePassword: string;
  acctLanguage: string;
  acctLanguageNote: string;
  acctPrivacy: string;
  acctPrivacyNote: string;
  acctPrivacyLink: string;
  acctDanger: string;
  acctDangerNote: string;
  dashCollapse: string;
  dashClose: string;
  dashMenu: string;
  dashQuickLabel: string;
  dashQuickPlaceholder: string;
  dashQuickCta: string;
  dashEyebrow: string;
  dashNavLanguage: string;
  dashNavJyotish: string;
  dashOnlineCount: string;
  dashConversations: string;
  dashSearch: string;
  dashClear: string;
  dashNotifications: string;
  dashNoNotifications: string;
  dashProfile: string;
  dashReadingAction: string;
  dashAsk: string;
  dashMatches: string;
  dashNoMatches: string;
  dashJyotish: string;
  dashPreview: string;
  dashJyotishSoon: string;
  dashAll: string;
  dashNoAstrologers: string;
  dashVerified: string;
  dashYears: string;
  dashReadingsCount: string;
  dashMinutes: string;
  dashOffline: string;
  dashBackAt: string;
  dashChat: string;
  dashBook: string;
  dashNotify: string;
  dashBookLater: string;
  milanEyebrow: string;
  milanTitle: string;
  milanSub: string;
  milanBride: string;
  milanGroom: string;
  milanChoose: string;
  milanChange: string;
  milanSearch: string;
  milanNoCharts: string;
  milanMatch: string;
  milanMatching: string;
  milanPickBoth: string;
  milanSameChart: string;
  milanNeedTwo: string;
  milanNewMatch: string;
  milanKootaByKoota: string;
  milanBarNote: string;
  milanManglik: string;
  milanIsManglik: string;
  milanNotManglik: string;
  milanCancelled: string;
  milanCompatible: string;
  milanCaution: string;
  milanGood: string;
  milanFair: string;
  milanPoor: string;
  milanNeedTwoTitle: string;
  milanWhatWeCheck: string;
  milanGuna: string;
  milanManglikNote: string;
  milanAnalysisTitle: string;
  milanAnalysisNote: string;
  milanAnalysing: string;
  milanAnalysingNote: string;
  milanAnalysisFailed: string;
  milanRetry: string;
  playbackSpeed: string;
  readingCalculated: string;
  readingCalculatedNote: string;
  readingBack: string;
  milanStrengths: string;
  milanConcerns: string;
  milanDoshas: string;
  milanRemedies: string;
  milanBasis: string;
  milanAffects: string;
  milanTiming: string;
  milanSeverityNone: string;
  milanSeverityMild: string;
  milanSeverityModerate: string;
  milanSeveritySerious: string;
  dashToday: string;
  dashVara: string;
  dashTithi: string;
  dashYoga: string;
  dashKarana: string;
  dashPada: string;
  dashRising: string;
  dashDasha: string;
  dashMahadasha: string;
  dashAntardasha: string;
  dashUpcoming: string;
  dashGlance: string;
  dashLagna: string;
  dashGana: string;
  dashNadi: string;
  dashYoni: string;
  dashTatva: string;
  dashVarna: string;
}

export const translations: Record<Language, TranslationCatalog> = {
  en: {
    brandName: "Nakhatra",
    vedicAstrology: "Vedic Astrology",
    home: "Home",
    freeKundali: "Free Kundali",
    vedicReading: "Vedic Reading",
    talkToAstrologer: "Talk to AI Astrologer",
    selectLanguage: "Language",

    heroTagline: "Precision Sidereal Ephemeris & Live AI Guidance",
    heroTitle: "Your kundali, calculated to the degree",
    heroSub: "Swiss Ephemeris computes every position. The AI astrologer reads what is actually there \u2014 it cannot invent a placement, a dasha, or a date.",
    birthDetails: "Enter Birth Details",
    fullName: "Full Name",
    birthDate: "Date of Birth",
    birthTime: "Time of Birth",
    birthPlace: "Place of Birth",
    calculateKundali: "Generate Birth Chart & Reading",
    calculating: "Calculating Ephemeris Coordinates...",

    feature1Title: "High Precision Sidereal Engine",
    feature1Desc: "Calculated using Swiss Ephemeris algorithm for exact degrees, houses, and divisional varga charts.",
    feature2Title: "Vimshottari Dasha Timeline",
    feature2Desc: "Track your active Mahadasha and Antardasha periods for precise timing of life events.",
    feature3Title: "Live Conversational Voice AI",
    feature3Desc: "Speak naturally to your AI Jyotish Acharya in English, Nepali, or Hindi with real-time audio synthesis.",

    readingHeader: "Full Vedic Kundali & Astrological Reading",
    seekerName: "Seeker Profile",
    tabChart: "D1 Kundali Chart",
    tabPlanets: "Planetary Placements",
    tabDasha: "Vimshottari Dasha",
    tabVargas: "Divisional Charts (Vargas)",
    tabAnalysis: "Detailed Analysis",
    tabAskAI: "Talk to Astrologer",
    lagnaAscendant: "Lagna Ascendant",
    moonSign: "Moon Sign (Rashi)",
    nakshatra: "Nakshatra",
    currentDasha: "Current Dasha Timeline",
    openLiveVoice: "Start Live Voice Consultation",
    backToReport: "Back to Full Report",

    liveWorkspaceTitle: "Live Astrologer Voice Consultation",
    listeningState: "Listening... Speak Now",
    thinkingState: "Analyzing Chart & Transcribing...",
    speakingState: "Master Astrologer Responding...",
    pausedState: "Voice Session Paused",
    askPlaceholder: "Ask your astrologer anything... (Type question & press Enter)",
    sendQuery: "Send Query",
    interrupt: "Interrupt",
    transcript: "Transcript",
    kundaliChart: "Kundali Chart",
    exitVoice: "Exit Voice",
    mute: "Mute",
    unmute: "Unmute",

    kundaliChartsTitle: "Kundali Charts",
    kundaliChartsSub: "D1 Lagna & D9 Navamsha Charts",
    d1LagnaChartTitle: "D1 · Lagna Chart (Main Birth Chart)",
    d9NavamshaChartTitle: "D9 · Navamsha Chart (Dharma & Destiny)",
    ascendantLabel: "Ascendant",
    houseLabel: "House",
    lordLabel: "Lord",
    tapHouseHelper: "💡 Tap any house in D1 or D9 to inspect its sign, ruling lord, and occupant planets.",
    avakhadaTitle: "Avakhada Chakra (Birth Attributes)",
    moonSignLabel: "Moon Sign (Rashi):",
    nakshatraLabel: "Nakshatra:",
    nakshatraPadaLabel: "Nakshatra Pada:",
    nameSyllableLabel: "Name Syllable:",
    ganaLabel: "Gana:",
    nadiLabel: "Nadi:",
    yoniLabel: "Yoni (Animal):",
    varnaElementLabel: "Varna / Element:",
    auspiciousTitle: "Auspicious & Inauspicious Elements",
    luckyColors: "✓ Lucky Colors (Shubha Ranga):",
    unluckyColors: "✗ Unlucky Colors (Ashubha Ranga):",
    luckyGemstones: "✓ Lucky Gemstones (Shubha Ratna):",
    unluckyGemstones: "✗ Unlucky Gemstones (Ashubha Ratna):",
    planetaryPositionsTitle: "Planetary Positions & Longitudes",
    compactLabel: "Compact",
    fullDetailsLabel: "Full Details",
    thPlanet: "Planet",
    thSign: "Sign",
    thHouse: "House",
    thDegree: "Degree (D°M'S\")",
    activeDashaTitle: "Active Dasha Systems & Predictions",
    narrativeAudioTitle: "Narrative Audio Reading",
    narrativeAudioSub: "Astrologer Voice: Acharya Dev (HD MP3 Stream Engine)",
    telemetryTitle: "Audio Telemetry & Live Script Reader",
    activeScriptLabel: "Active Spoken Teleprompter Script:",
    catOverview: "Overview",
    catPersonality: "Personality",
    catCareer: "Career & Wealth",
    catMarriage: "Love & Marriage",
    catDasha: "Current Dasha",
    catRemedies: "Remedies",
    astrologicalFootnotes: "Astrological Grounding Footnotes:",
    bottomCtaQuestion: "Have a specific question about your career or relationship timing?",
    bottomCtaBtn: "🔴 Talk to Live AI Astrologer",
    selectVoice: "Select Voice",
    astrologerVoice: "Astrologer Voice Persona",
    downloadPdf: "Download PDF Report",
    shareReading: "Share Reading Page",
    downloadAudio: "Download Audio",
    shareAudio: "Share Audio",
    pdfGenerating: "Generating complete PDF report...",

    realtimeResponse: "Realtime Response",
    listeningToVoice: "Listening to your voice...",
    askAnyQuestionOrb: "Ask any question or tap the cosmic orb to speak with your Master Astrologer.",
    messagesCount: "Messages",
    viewTranscript: "Transcript →",
    closeChartDrawer: "Close Chart",
    closeTranscriptDrawer: "Close Transcript",
    d1SiderealBirthChart: "D1 Sidereal Birth Chart",
    activeTimeLords: "Active Time Lords (Dasha)",
    consultSuggestedTopics: "Consult Suggested Topics",
    groundedInChart: "Grounded in Chart",
    suggestedFollowups: "Suggested Follow-ups",
    realtimeListening: "Realtime Listening...",
    analyzingSpeech: "Analyzing Speech...",
    astrologerSpeaking: "Astrologer Speaking...",
    voiceReadyPaused: "Voice Ready / Paused",
    micHardwareStatus: "Mic Hardware Status",
    micVu: "Mic VU",
    debugLabel: "Debug",
    deskView: "Desk",
    voiceView: "Voice",
    tapToInterrupt: "Tap to Interrupt",
    tapToStartVoice: "Tap to Start Realtime Voice",
    realtimeAudioEngine: "Realtime Audio Engine",
    vedicVoiceEngine: "Vedic Voice Engine",
    sendNow: "Send Now",
    exitLabel: "Exit",
    closePanel: "Close Panel",
    connectingToDesk: "Connecting to Live Astrologer Desk...",
    calculatingEphemeris: "Calculating Swiss Ephemeris chart coordinates",
    mahadashaLabel: "Mahadasha",
    antardashaLabel: "Antardasha",
    noActiveDasha: "No active dasha for today",
    dashaOverviewTitle: "Your Dasha — Life's Current Chapter",
    dashaOverviewWhatIs: "What is Dasha?",
    dashaOverviewWhatIsDesc: "In Vedic astrology, your life is divided into planetary periods called Dashas. Each planet rules a chapter of your life, influencing your health, career, relationships, and luck. Think of it as a cosmic season — just like seasons change, your Dasha shifts the theme of your life.",
    dashaOverviewYourCurrent: "Your Current Period",
    dashaOverviewMainPeriod: "Main Period (Mahadasha)",
    dashaOverviewSubPeriod: "Sub-Period (Antardasha)",
    dashaOverviewDuration: "Duration",
    dashaOverviewToLabel: "to",
    dashaOverviewNoPeriod: "No active sub-period",
    dashaOverviewYears: "years",
    vimshottariLabel: "Vimshottari",
    askAnythingHint: "Ask anything about your chart — career, marriage, timing, or remedies. Every answer is read from the placements on the left.",
    consultReconnecting: "Reconnecting — updates may be slower than usual.",
    callStartVoice: "Start voice call",
    callStartVideo: "Start video call",
    callRinging: "Ringing…",
    callIncoming: "Incoming call",
    callConnecting: "Connecting…",
    callLive: "Connected",
    callAnswer: "Answer",
    callDecline: "Decline",
    callMute: "Mute",
    callCamera: "Camera",
    callEnd: "End call",
    callNoRelay: "No relay server is configured, so this call may not connect on some mobile networks.",
    callNoMic: "Could not reach your microphone or camera. Check the browser's permission for this site.",
    consultPerMinute: "minute",
    consultElapsed: "Elapsed",
    consultCost: "Cost so far",
    consultBalance: "Wallet",
    consultLeft: "left",
    consultLowBalance: "Your balance is running low. Top up to keep the session going, or it will end shortly.",
    consultTitle: "Consultations",
    consultNone: "No consultations yet",
    consultNoneNote: "Ask a verified astrologer or pandit a question, and it appears here.",
    consultStart: "Start session",
    consultEnd: "End session",
    consultAccept: "Accept",
    consultDecline: "Decline",
    consultCancel: "Cancel",
    consultSend: "Send",
    consultPlaceholder: "Write a message…",
    consultShareChart: "Share this chart with them",
    consultWaiting: "Waiting for the astrologer to accept.",
    consultEnded: "This session has ended.",
    consultTopUp: "Top up",
    consultGrants: "Shared charts",
    consultRevoke: "Revoke",
    consultShared: "Shared",
    practBecome: "Become an astrologer",
    practApplicationStatus: "Your application",
    practDesk: "Astrologer desk",
    practRates: "Your rates",
    practRatesNote: "What you charge per minute. A medium with no price is not offered.",
    practSetRate: "Save",
    practRequests: "Requests",
    practLive: "Listed",
    practOffline: "Not listed",
    practNoRates: "Set a price before anyone can consult you.",
    practPendingNote: "Usually within a day or two. We will tell you either way, and you can keep using Nakhatra as normal meanwhile.",
    practSubmitted: "What you submitted",
    practIntroVideo: "Intro video link",
    practIntroVideoNote: "A YouTube or Vimeo link, if you have one.",
    practStatus: "Your listing",
    applyWho: "Who you are",
    applyReach: "How people reach you",
    applyExpertise: "What you practise",
    applyNext: "What happens next",
    practCountry: "Country",
    practYearsSuffix: "years",
    practPhoneNote: "So a seeker can call you back if a session drops.",
    practPhoneInvalid: "Enter a phone number of 7 to 15 digits.",
    practCityPlaceholder: "Search your city",
    practNamePlaceholder: "As it should appear on your profile",
    practReviewLink: "Review applications",
    practVerified: "Verified",
    practUnverified: "Awaiting review",
    practPriced: "Priced",
    practYourProfile: "Your profile",
    practBio: "About you",
    practBioPlaceholder: "How you read a chart, and what people come to you for.",
    practSpecialities: "What you are asked about",
    practSaveProfile: "Save and go live",
    practSaved: "Saved",
    practUnlist: "Take me off the directory",
    practComingSoon: "Coming soon",
    soonNote: "Consulting a real jyotish is not open yet. The AI astrologer, your charts and Milan all work as normal meanwhile — we will say so here the day this opens.",
    practRegister: "Register as a jyotish",
    practPhoto: "Profile photo",
    practPhotoNote: "A clear photo of your face. JPG, PNG or WebP, up to 4MB.",
    practPractice: "What you practise",
    practBothNote: "Choose both if you do both.",
    practYears: "Years practising",
    practPhone: "Phone",
    practCity: "City",
    practTraditions: "Traditions",
    practHeadline: "One line about you",
    practHeadlinePlaceholder: "KP paddhati · career and marriage",
    practSearch: "Search astrologers and pandits",
    practUnavailable: "The directory is unavailable right now.",
    practNoneYet: "No verified practitioners yet",
    practNoneYetNote: "Astrologers and pandits appear here once they have applied and been verified. Nobody is listed before review.",
    practApplyTitle: "Practise on Nakhatra",
    practApplyLead: "A few details and a photo — that is all. A person reads every profile before it goes live, so nobody is listed unchecked.",
    practApplySubmit: "Submit application",
    practApplyPending: "Your application is with a reviewer.",
    practApplyApproved: "Approved — your profile is ready to publish.",
    practApplyRejected: "This application was not approved.",
    practReviewQueue: "Applications",
    practApprove: "Approve",
    practReject: "Reject",
    profFollow: "Follow",
    profFollowing: "Following",
    profMessage: "Message",
    profBook: "Book",
    profAbout: "About",
    profRates: "Rates",
    profReviews: "Reviews",
    profNoReviews: "No reviews yet",
    profNoReviewsNote: "Ratings appear here after a consultation ends. Nothing is shown before that.",
    profUnrated: "Not yet rated",
    profConsultations: "Consultations",
    profFollowers: "Followers",
    profReply: "Reply",
    profReplyPlaceholder: "Reply to this review",
    profNotFound: "This profile is not available.",
    profSpeaks: "Speaks",
    bookTitle: "Book a consultation",
    bookMedium: "How you want to talk",
    bookWhen: "When",
    bookNow: "Start now",
    bookLater: "Pick a time",
    bookDate: "Date",
    bookTime: "Time",
    bookNote: "Anything they should know first",
    bookConfirm: "Send request",
    bookPast: "That time has already passed.",
    bookUnpriced: "They have not priced this yet.",
    chatTab: "Messages",
    chatNoMessages: "No messages yet",
    chatScheduled: "Scheduled",
    reviewTitle: "How was it?",
    reviewNote: "Only people who paid for a consultation can rate it.",
    reviewPlaceholder: "What went well, what did not",
    reviewSubmit: "Leave review",
    reviewThanks: "Thank you — your review is posted.",
    voiceFellBack: "Live voice could not continue, so the astrologer is back to listening turn by turn. You can keep talking or type.",
    notifSavedToVault: "saved to your vault",
    notifConversationUpdated: "conversation updated",
    notifMarkAllRead: "Mark all as read",
    notifSeeAll: "See all notifications",
    notifTitle: "Notifications",
    notifAllCaughtUp: "You're all caught up.",
    ascendantPlacementLabel: "Ascendant Placement:",
    masterAstrologer: "Master Astrologer",
    birthTimeNote: "Birth time sets the ascendant, and the ascendant sets every house in your Kundali.",
    gender: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    selectDate: "Select Date of Birth",
    selectTime: "Select Time of Birth",

    dashGreeting: "Namaste, {name}",
    dashSubtitle: "Your charts, your readings, and everything the platform can do with them.",
    dashStatCharts: "Saved charts",
    dashStatMember: "With us since",
    dashActions: "What would you like to do?",
    dashNewKundali: "Cast a new kundali",
    dashNewKundaliBody: "Name, date, time and place — the chart comes back in about a second.",
    dashReading: "Read the analysis",
    dashReadingBody: "Seven written sections, each citing the placements it rests on.",
    dashLive: "Talk to the astrologer",
    dashLiveBody: "Ask out loud and hear the answer, hands free.",
    dashMilan: "Match two charts",
    dashMilanBody: "Ashtakoota milan across all eight kutas, with the reasoning shown.",
    dashConsult: "Consult a human jyotish",
    dashConsultBody: "A verified astrologer, arriving already holding your chart.",
    dashSoon: "Soon",
    dashSaved: "Your kundalis",
    dashSavedCount: "{n} saved",
    dashEmptyTitle: "No charts saved yet",
    dashEmptyBody: "Cast your first kundali and it will be waiting here next time you sign in.",
    dashOpen: "Open reading",
    dashOpening: "Recalculating…",
    chooseTitle: "Whose kundali?",
    chooseReadingNote: "Pick the chart you want the reading for.",
    chooseLiveNote: "Pick the chart you want to talk about.",
    chooseEmpty: "You have no saved kundalis yet.",
    dashDelete: "Delete",
    dashConfirmDelete: "Delete this chart?",
    dashCancel: "Keep it",
    dashNotRecalculable: "Saved before time zones were stored by name — this one cannot be recalculated safely.",
    dashLoadFailed: "Could not open that chart. Please try again.",
    dashSignedInAs: "Signed in as",
    dashSignOut: "Sign out",
    dashSignIn: "Sign in",
    dashNavHome: "Home",
    dashNavNew: "New kundali",
    dashNavReading: "Reading",
    dashNavLive: "Live astrologer",
    dashNavMilan: "Kundali Milan",
    dashNavLibrary: "Library",
    dashNavRecent: "Recent",
    dashHelp: "Help",
    dashSettings: "Settings",
    acctProfile: "Profile",
    acctSettings: "Settings",
    acctYourAccount: "Your account",
    acctName: "Display name",
    acctNameNote: "What the app calls you, and what a jyotish sees.",
    acctEmail: "Email",
    acctEmailNote: "Your sign-in address. Changing it is not possible from here.",
    acctJoined: "Joined",
    acctRole: "Account type",
    acctSave: "Save changes",
    acctSaved: "Saved.",
    acctActivity: "Your library",
    acctPassword: "Password",
    acctCurrentPassword: "Current password",
    acctNewPassword: "New password",
    acctPasswordNote: "At least 8 characters. Signed in with Google? You have no password to change.",
    acctPasswordChanged: "Password changed.",
    acctChangePassword: "Change password",
    acctLanguage: "Language",
    acctLanguageNote: "Used for readings, the AI astrologer and the app itself.",
    acctPrivacy: "Your birth data",
    acctPrivacyNote: "Birth details are never written to logs, error reports or analytics. A jyotish sees a chart only when you share it, and you can take that back.",
    acctPrivacyLink: "Read the privacy policy",
    acctDanger: "Signing out",
    acctDangerNote: "Signs you out on this device only. Your charts stay saved.",
    dashCollapse: "Collapse sidebar",
    dashClose: "Close",
    dashMenu: "Menu",
    dashQuickLabel: "Whose chart are we casting?",
    dashQuickPlaceholder: "Whose chart are we casting?",
    dashQuickCta: "Cast kundali",
    dashEyebrow: "Your sky",
    dashNavLanguage: "Language",
    dashNavJyotish: "Talk to a jyotish",
    dashOnlineCount: "{n} online",
    dashConversations: "Conversations",
    dashSearch: "Search charts, readings, astrologers…",
    dashClear: "Clear search",
    dashNotifications: "Notifications",
    dashNoNotifications: "You’re all caught up.",
    dashProfile: "Your profile",
    dashReadingAction: "Reading",
    dashAsk: "Ask",
    dashMatches: "{n} matching",
    dashNoMatches: "No chart matches “{q}”.",
    dashJyotish: "Talk to a jyotish",
    dashPreview: "Preview",
    dashJyotishSoon: "Consultations open soon",
    dashAll: "All",
    dashNoAstrologers: "No astrologer matches that filter.",
    dashVerified: "Verified",
    dashYears: "yrs",
    dashReadingsCount: "readings",
    dashMinutes: "minutes",
    dashOffline: "Offline",
    dashBackAt: "Back at",
    dashChat: "Chat",
    dashBook: "Book",
    dashNotify: "Notify me",
    dashBookLater: "Book later",
    milanEyebrow: "Ashtakoota",
    milanTitle: "Kundali Milan",
    milanSub: "All eight kutas for the full 36 gunas, Manglik dosha checked on both sides with cancellation rules applied — and the score broken down koota by koota rather than handed over as one number.",
    milanBride: "Bride",
    milanGroom: "Groom",
    milanChoose: "Choose a chart",
    milanChange: "Change",
    milanSearch: "Search your charts…",
    milanNoCharts: "No chart matches that.",
    milanMatch: "Match these charts",
    milanMatching: "Matching…",
    milanPickBoth: "Choose a chart on both sides.",
    milanSameChart: "Pick two different charts.",
    milanNeedTwo: "You have {n} so far. Cast another and it becomes selectable here.",
    milanNewMatch: "New match",
    milanKootaByKoota: "Koota by koota",
    milanBarNote: "Bar length = what it is worth",
    milanManglik: "Manglik dosha",
    milanIsManglik: "Manglik",
    milanNotManglik: "Not Manglik",
    milanCancelled: "Cancelled",
    milanCompatible: "Compatible",
    milanCaution: "Caution",
    milanGood: "Good match",
    milanFair: "Workable",
    milanPoor: "Read the reasoning",
    milanNeedTwoTitle: "Milan needs two charts",
    milanWhatWeCheck: "What the match checks",
    milanGuna: "guna",
    milanManglikNote: "Manglik dosha is checked on both charts, and the classical cancellation rules are applied — present on both sides cancels, rather than flagging one chart and alarming the couple.",
    milanAnalysisTitle: "The astrologer's reading",
    milanAnalysisNote: "The scores above are computed from both charts. This reading interprets them — it is guidance, not a verdict on the marriage.",
    milanAnalysing: "Reading both charts…",
    milanAnalysingNote: "Going through all eight kootas, the Manglik position and both full charts. This takes a moment.",
    milanAnalysisFailed: "The reading could not be completed. The match above is unaffected.",
    milanRetry: "Try again",
    playbackSpeed: "Playback speed",
    readingCalculated: "This is the calculated reading",
    readingCalculatedNote: "The astrologer couldn't be reached, so this was generated from your chart by the rule engine. Every placement below is still accurate.",
    readingBack: "Back",
    milanStrengths: "What matches",
    milanConcerns: "What needs work",
    milanDoshas: "Doshas",
    milanRemedies: "Remedies",
    milanBasis: "Based on",
    milanAffects: "Bears on",
    milanTiming: "When",
    milanSeverityNone: "not present",
    milanSeverityMild: "mild",
    milanSeverityModerate: "moderate",
    milanSeveritySerious: "serious",
    dashToday: "Today's sky",
    dashVara: "Weekday",
    dashTithi: "Tithi",
    dashYoga: "Yoga",
    dashKarana: "Karana",
    dashPada: "Pada",
    dashRising: "rising",
    dashDasha: "Running dasha",
    dashMahadasha: "Mahadasha",
    dashAntardasha: "Antardasha",
    dashUpcoming: "Next periods",
    dashGlance: "Chart at a glance",
    dashLagna: "Lagna",
    dashGana: "Gana",
    dashNadi: "Nadi",
    dashYoni: "Yoni",
    dashTatva: "Tatva",
    dashVarna: "Varna",
  },

  ne: {
    brandName: "Nakhatra",
    vedicAstrology: "वैदिक ज्योतिष",
    home: "गृह पृष्ठ",
    freeKundali: "निःशुल्क कुण्डली",
    vedicReading: "वैदिक राशिफल",
    talkToAstrologer: "एआई ज्योतिषी परामर्श",
    selectLanguage: "भाषा",

    heroTagline: "सटीक वैदिक कुण्डली र प्रत्यक्ष एआई ज्योतिषी परामर्श",
    heroTitle: "तपाईंको कुण्डली, अंशसम्म सटीक",
    heroSub: "स्विस इफेमेरिसले हरेक ग्रहस्थिति गणना गर्छ। एआई ज्योतिषीले त्यहाँ भएकै कुरा पढ्छ — कुनै ग्रह, दशा वा मिति आफैं बनाउँदैन।",
    birthDetails: "जन्म विवरण प्रविष्ट गर्नुहोस्",
    fullName: "पूरा नाम",
    birthDate: "जन्म मिति",
    birthTime: "जन्म समय",
    birthPlace: "जन्म स्थान",
    calculateKundali: "जन्मकुण्डली र राशिफल तयार गर्नुहोस्",
    calculating: "खगोलीय ग्रह स्थिति गणना गर्दै...",

    feature1Title: "सटीक खगोलीय गणितीय गणना",
    feature1Desc: "सटीक डिग्री, भाव र वर्ग कुण्डलीका लागि स्वीस एफेमेरिस सिद्धान्तबाट गणना गरिएको।",
    feature2Title: "विंशोत्तरी दशा र समयरेखा",
    feature2Desc: "सटीक समय र घटनाको लागि तपाइँको सक्रिय महादशा र अन्तरदशा अवधिको विश्लेषण गर्नुहोस्।",
    feature3Title: "प्रत्यक्ष भ्वाइस एआई ज्योतिषी",
    feature3Desc: "तपाइँको एआई ज्योतिषीसँग अङ्ग्रेजी, नेपाली वा हिन्दीमा सहजरूपमा प्रत्यक्ष कुराकानी गर्नुहोस्।",

    readingHeader: "सम्पूर्ण वैदिक कुण्डली तथा ज्योतिषीय विश्लेषण",
    seekerName: "जातक विवरण",
    tabChart: "डी१ लग्न कुण्डली",
    tabPlanets: "ग्रह स्थिति र डिग्री",
    tabDasha: "विंशोत्तरी महादशा",
    tabVargas: "वर्ग कुण्डली (डी९ नवांश)",
    tabAnalysis: "विस्तृत जीवन विश्लेषण",
    tabAskAI: "ज्योतिषी परामर्श",
    lagnaAscendant: "लग्न राशि",
    moonSign: "चन्द्र राशि (राशि)",
    nakshatra: "जन्म नक्षत्र",
    currentDasha: "वर्तमान दशा समयरेखा",
    openLiveVoice: "प्रत्यक्ष भ्वाइस परामर्श सुरु गर्नुहोस्",
    backToReport: "रिपोर्टमा फर्कनुहोस्",

    liveWorkspaceTitle: "प्रत्यक्ष भ्वाइस ज्योतिषी परामर्श",
    listeningState: "सुन्दैछ... बोल्नुहोस्",
    thinkingState: "कुण्डली र आवाज विश्लेषण गर्दै...",
    speakingState: "मास्टर ज्योतिषी बोल्दै हुनुहुन्छ...",
    pausedState: "भ्वाइस सेसन रोकियो",
    askPlaceholder: "आफ्नो ज्योतिषीलाई केही पनि सोध्नुहोस्... (प्रश्न लेखेर इन्टर थिच्नुहोस्)",
    sendQuery: "प्रश्न पठाउनुहोस्",
    interrupt: "रोक्नुहोस्",
    transcript: "इतिहास",
    kundaliChart: "जन्मकुण्डली",
    exitVoice: "बाहिरिनुहोस्",
    mute: "मौन",
    unmute: "आवाज खोल्नुहोस्",

    kundaliChartsTitle: "कुण्डली चक्र",
    kundaliChartsSub: "डी१ लग्न र डी९ नवांश कुण्डली",
    d1LagnaChartTitle: "डी१ · लग्न कुण्डली (मुख्य जन्म कुण्डली)",
    d9NavamshaChartTitle: "डी९ · नवांश कुण्डली (धर्म र भाग्य)",
    ascendantLabel: "लग्न",
    houseLabel: "भाव",
    lordLabel: "स्वामी",
    tapHouseHelper: "💡 D1 वा D9 को कुनै पनि भाव थिचेर त्यसको राशि, स्वामी र ग्रहहरू हेर्नुहोस्।",
    avakhadaTitle: "अवकहडा चक्र (जन्म तत्व)",
    moonSignLabel: "चन्द्र राशि:",
    nakshatraLabel: "जन्म नक्षत्र:",
    nakshatraPadaLabel: "नक्षत्र चरण:",
    nameSyllableLabel: "नाम अक्षर:",
    ganaLabel: "गण:",
    nadiLabel: "नाडी:",
    yoniLabel: "योनि (जनावर):",
    varnaElementLabel: "वर्ण / तत्व:",
    auspiciousTitle: "शुभ तथा अशुभ तत्वहरू",
    luckyColors: "✓ शुभ रङ्गहरू (शुभ रङ्ग):",
    unluckyColors: "✗ अशुभ रङ्गहरू (अशुभ रङ्ग):",
    luckyGemstones: "✓ शुभ रत्नहरू (शुभ रत्न):",
    unluckyGemstones: "✗ अशुभ रत्नहरू (अशुभ रत्न):",
    planetaryPositionsTitle: "ग्रह स्थिति तथा डिग्री अंश",
    compactLabel: "संक्षिप्त",
    fullDetailsLabel: "पूरा विवरण",
    thPlanet: "ग्रह",
    thSign: "राशि",
    thHouse: "भाव",
    thDegree: "अंश (D°M'S\")",
    activeDashaTitle: "सक्रिय दशा प्रणाली र फलकथन",
    narrativeAudioTitle: "श्रव्य (अडियो) कुण्डली वाचन",
    narrativeAudioSub: "ज्योतिषी आवाज: आचार्य देव (HD अडियो स्ट्रिम)",
    telemetryTitle: "अडियो वाचन तथा प्रत्यक्ष पाठ",
    activeScriptLabel: "सक्रिय वाचन पाठ:",
    catOverview: "अवलोकन",
    catPersonality: "व्यक्तित्व",
    catCareer: "करियर र धन",
    catMarriage: "प्रेम र विवाह",
    catDasha: "वर्तमान दशा",
    catRemedies: "उपायहरू",
    astrologicalFootnotes: "ज्योतिषीय खगोलीय आधार:",
    bottomCtaQuestion: "के तपाइँको करियर वा सम्बन्धको बारेमा विशेष प्रश्न छ?",
    bottomCtaBtn: "🔴 प्रत्यक्ष एआई ज्योतिषीसँग कुरा गर्नुहोस्",
    selectVoice: "स्वर छान्नुहोस्",
    astrologerVoice: "ज्योतिषी स्वर",
    downloadPdf: "पीडीएफ रिपोर्ट डाउनलोड",
    shareReading: "कुण्डली सेयर गर्नुहोस्",
    downloadAudio: "अडियो डाउनलोड",
    shareAudio: "अडियो सेयर",
    pdfGenerating: "सम्पूर्ण कुण्डली पीडीएफ तयार हुँदैछ...",

    realtimeResponse: "प्रत्यक्ष उत्तर",
    listeningToVoice: "तपाईंको आवाज सुन्दैछ...",
    askAnyQuestionOrb: "मास्टर ज्योतिषीसँग बोल्न कुनै पनि प्रश्न सोध्नुहोस् वा ब्रह्माण्ड चक्र थिच्नुहोस्।",
    messagesCount: "सन्देशहरू",
    viewTranscript: "इतिहास →",
    closeChartDrawer: "कुण्डली बन्द गर्नुहोस्",
    closeTranscriptDrawer: "इतिहास बन्द गर्नुहोस्",
    d1SiderealBirthChart: "डी१ निरयण जन्म कुण्डली",
    activeTimeLords: "सक्रिय दशा (काल स्वामी)",
    consultSuggestedTopics: "सुझाइएका परामर्श विषयहरू",
    groundedInChart: "कुण्डलीमा आधारित",
    suggestedFollowups: "सुझाइएका प्रश्नहरू",
    realtimeListening: "प्रत्यक्ष सुन्दैछ...",
    analyzingSpeech: "आवाज र कुण्डली विश्लेषण गर्दै...",
    astrologerSpeaking: "ज्योतिषी बोल्दै हुनुहुन्छ...",
    voiceReadyPaused: "आवाज तयार / रोकिएको",
    micHardwareStatus: "माइक्रोफोन स्थिति",
    micVu: "माइक सङ्केत",
    debugLabel: "डिबग",
    deskView: "डेस्क",
    voiceView: "आवाज",
    tapToInterrupt: "रोक्न थिच्नुहोस्",
    tapToStartVoice: "प्रत्यक्ष कुराकानी सुरु गर्न थिच्नुहोस्",
    realtimeAudioEngine: "प्रत्यक्ष अडियो इन्जिन",
    vedicVoiceEngine: "वैदिक भ्वाइस इन्जिन",
    sendNow: "अहिले पठाउनुहोस्",
    exitLabel: "बाहिरिनुहोस्",
    closePanel: "प्यानल बन्द गर्नुहोस्",
    connectingToDesk: "प्रत्यक्ष एआई ज्योतिषी कक्षमा जोडिँदैछ...",
    calculatingEphemeris: "स्वीस एफेमेरिस कुण्डली गणना हुँदैछ",
    mahadashaLabel: "महादशा",
    antardashaLabel: "अन्तरदशा",
    noActiveDasha: "आजका लागि कुनै सक्रिय दशा छैन",
    dashaOverviewTitle: "तपाईंको दशा — जीवनको हालको अध्याय",
    dashaOverviewWhatIs: "दशा भनेको के हो?",
    dashaOverviewWhatIsDesc: "वैदिक ज्योतिषमा, तपाईंको जीवन ग्रहीय अवधिहरूमा विभाजित हुन्छ जसलाई दशा भनिन्छ। प्रत्येक ग्रहले तपाईंको जीवनको एक अध्याय चलाउँछ, तपाईंको स्वास्थ्य, क्यारियर, सम्बन्ध र भाग्यलाई प्रभावित गर्छ। यसलाई ऋतु जस्तै सोच्नुहोस् — जसरी ऋतु बदलिन्छ, तपाईंको दशाले तपाईंको जीवनको विषय बदल्छ।",
    dashaOverviewYourCurrent: "तपाईंको हालको अवधि",
    dashaOverviewMainPeriod: "मुख्य अवधि (महादशा)",
    dashaOverviewSubPeriod: "उप-अवधि (अन्तर्दशा)",
    dashaOverviewDuration: "अवधि",
    dashaOverviewToLabel: "देखि",
    dashaOverviewNoPeriod: "कुनै सक्रिय उप-अवधि छैन",
    dashaOverviewYears: "वर्ष",
    vimshottariLabel: "विंशोत्तरी",
    askAnythingHint: "आफ्नो कुण्डलीबारे जे पनि सोध्नुहोस् — करियर, विवाह, समय वा उपाय। हरेक उत्तर बायाँका ग्रह स्थितिबाट नै आउँछ।",
    consultReconnecting: "पुनः जडान हुँदै — अपडेट अलि ढिलो आउन सक्छ।",
    callStartVoice: "भ्वाइस कल सुरु",
    callStartVideo: "भिडियो कल सुरु",
    callRinging: "घण्टी बज्दै…",
    callIncoming: "आउँदै गरेको कल",
    callConnecting: "जोडिँदै…",
    callLive: "जोडियो",
    callAnswer: "उठाउनुहोस्",
    callDecline: "अस्वीकार",
    callMute: "मौन",
    callCamera: "क्यामेरा",
    callEnd: "कल समाप्त",
    callNoRelay: "रिले सर्भर सेट गरिएको छैन, त्यसैले केही मोबाइल नेटवर्कमा यो कल नजोडिन सक्छ।",
    callNoMic: "माइक वा क्यामेरामा पहुँच भएन। यो साइटको लागि ब्राउजरको अनुमति हेर्नुहोस्।",
    consultPerMinute: "मिनेट",
    consultElapsed: "बितेको समय",
    consultCost: "अहिलेसम्मको खर्च",
    consultBalance: "वालेट",
    consultLeft: "बाँकी",
    consultLowBalance: "तपाईंको ब्यालेन्स सकिँदै छ। सेसन जारी राख्न रकम थप्नुहोस्, नत्र छिट्टै बन्द हुनेछ।",
    consultTitle: "परामर्शहरू",
    consultNone: "अहिलेसम्म कुनै परामर्श छैन",
    consultNoneNote: "प्रमाणित ज्योतिषी वा पण्डितलाई प्रश्न सोध्नुहोस्, त्यसपछि यहाँ देखिनेछ।",
    consultStart: "सेसन सुरु गर्नुहोस्",
    consultEnd: "सेसन अन्त्य गर्नुहोस्",
    consultAccept: "स्वीकार",
    consultDecline: "अस्वीकार",
    consultCancel: "रद्द",
    consultSend: "पठाउनुहोस्",
    consultPlaceholder: "सन्देश लेख्नुहोस्…",
    consultShareChart: "यो कुण्डली उहाँसँग साझा गर्नुहोस्",
    consultWaiting: "ज्योतिषीले स्वीकार गर्ने पर्खाइमा।",
    consultEnded: "यो सेसन सकियो।",
    consultTopUp: "रकम थप्नुहोस्",
    consultGrants: "साझा गरिएका कुण्डली",
    consultRevoke: "फिर्ता लिनुहोस्",
    consultShared: "साझा गरिएको",
    practBecome: "ज्योतिषी बन्नुहोस्",
    practApplicationStatus: "तपाईंको आवेदन",
    practDesk: "ज्योतिषी डेस्क",
    practRates: "तपाईंका दरहरू",
    practRatesNote: "प्रति मिनेट तपाईंले लिने शुल्क। मूल्य नराखिएको माध्यम देखाइँदैन।",
    practSetRate: "सुरक्षित गर्नुहोस्",
    practRequests: "अनुरोधहरू",
    practLive: "सूचीबद्ध",
    practOffline: "सूचीबद्ध छैन",
    practNoRates: "कसैले परामर्श लिनुअघि मूल्य राख्नुहोस्।",
    practPendingNote: "सामान्यतया एक-दुई दिनभित्र। जे भए पनि हामी जानकारी दिनेछौं, र त्यसबीच नखत्र सामान्य रूपमै चलाउन सक्नुहुन्छ।",
    practSubmitted: "तपाईंले पठाउनुभएको",
    practIntroVideo: "परिचय भिडियोको लिङ्क",
    practIntroVideoNote: "छ भने युट्युब वा भिमियोको लिङ्क।",
    practStatus: "तपाईंको सूची",
    applyWho: "तपाईं को हुनुहुन्छ",
    applyReach: "मानिसहरूले कसरी सम्पर्क गर्ने",
    applyExpertise: "तपाईं के गर्नुहुन्छ",
    applyNext: "अब के हुन्छ",
    practCountry: "देश",
    practYearsSuffix: "वर्ष",
    practPhoneNote: "कल छुटेमा सेवाग्राहीले फेरि फोन गर्न सकून् भनेर।",
    practPhoneInvalid: "७ देखि १५ अङ्कको फोन नम्बर लेख्नुहोस्।",
    practCityPlaceholder: "आफ्नो सहर खोज्नुहोस्",
    practNamePlaceholder: "प्रोफाइलमा देखिनुपर्ने नाम",
    practReviewLink: "आवेदन हेर्नुहोस्",
    practVerified: "प्रमाणित",
    practUnverified: "जाँच पर्खाइमा",
    practPriced: "मूल्य राखिएको",
    practYourProfile: "तपाईंको प्रोफाइल",
    practBio: "तपाईंको बारेमा",
    practBioPlaceholder: "तपाईं कुण्डली कसरी हेर्नुहुन्छ, र मानिसहरू केका लागि आउँछन्।",
    practSpecialities: "तपाईंलाई केबारे सोधिन्छ",
    practSaveProfile: "सुरक्षित गरी सूचीबद्ध हुनुहोस्",
    practSaved: "सुरक्षित भयो",
    practUnlist: "मलाई निर्देशिकाबाट हटाउनुहोस्",
    practComingSoon: "चाँडै आउँदै",
    soonNote: "वास्तविक ज्योतिषीसँग परामर्श अझै खुलेको छैन। यसबीच एआई ज्योतिषी, तपाईंका कुण्डली र मिलन सामान्य रूपमै चल्छन् — खुलेको दिन यहीँ जानकारी दिनेछौं।",
    practRegister: "ज्योतिषीको रूपमा दर्ता",
    practPhoto: "प्रोफाइल फोटो",
    practPhotoNote: "अनुहार स्पष्ट देखिने फोटो। JPG, PNG वा WebP, ४MB सम्म।",
    practPractice: "तपाईं के गर्नुहुन्छ",
    practBothNote: "दुवै गर्नुहुन्छ भने दुवै छान्नुहोस्।",
    practYears: "कति वर्षदेखि",
    practPhone: "फोन",
    practCity: "सहर",
    practTraditions: "परम्परा",
    practHeadline: "आफ्नो बारेमा एक हरफ",
    practHeadlinePlaceholder: "केपी पद्धति · करियर र विवाह",
    practSearch: "ज्योतिषी र पण्डित खोज्नुहोस्",
    practUnavailable: "अहिले निर्देशिका उपलब्ध छैन।",
    practNoneYet: "अहिलेसम्म कुनै प्रमाणित ज्योतिषी छैनन्",
    practNoneYetNote: "आवेदन दिई प्रमाणित भएपछि मात्र ज्योतिषी र पण्डितहरू यहाँ देखिन्छन्। जाँच नभई कोही सूचीबद्ध हुँदैन।",
    practApplyTitle: "नखत्रमा सेवा दिनुहोस्",
    practApplyLead: "केही विवरण र एउटा फोटो — त्यति भए पुग्छ। सार्वजनिक हुनुअघि हरेक प्रोफाइल मानिसले हेर्छ, त्यसैले कोही जाँच नभई सूचीबद्ध हुँदैन।",
    practApplySubmit: "आवेदन पठाउनुहोस्",
    practApplyPending: "तपाईंको आवेदन जाँचमा छ।",
    practApplyApproved: "स्वीकृत — तपाईंको प्रोफाइल प्रकाशन गर्न तयार छ।",
    practApplyRejected: "यो आवेदन स्वीकृत भएन।",
    practReviewQueue: "आवेदनहरू",
    practApprove: "स्वीकृत",
    practReject: "अस्वीकृत",
    profFollow: "फलो गर्नुहोस्",
    profFollowing: "फलो गरिएको",
    profMessage: "सन्देश",
    profBook: "बुक गर्नुहोस्",
    profAbout: "परिचय",
    profRates: "शुल्क",
    profReviews: "समीक्षा",
    profNoReviews: "अहिलेसम्म समीक्षा छैन",
    profNoReviewsNote: "परामर्श सकिएपछि मात्र मूल्याङ्कन यहाँ देखिन्छ। त्योभन्दा अघि केही देखाइँदैन।",
    profUnrated: "अझै मूल्याङ्कन भएको छैन",
    profConsultations: "परामर्श",
    profFollowers: "फलोअर",
    profReply: "जवाफ",
    profReplyPlaceholder: "यो समीक्षाको जवाफ दिनुहोस्",
    profNotFound: "यो प्रोफाइल उपलब्ध छैन।",
    profSpeaks: "भाषा",
    bookTitle: "परामर्श बुक गर्नुहोस्",
    bookMedium: "कसरी कुरा गर्ने",
    bookWhen: "कहिले",
    bookNow: "अहिले सुरु गर्नुहोस्",
    bookLater: "समय छान्नुहोस्",
    bookDate: "मिति",
    bookTime: "समय",
    bookNote: "उहाँले पहिले थाहा पाउनुपर्ने कुरा",
    bookConfirm: "अनुरोध पठाउनुहोस्",
    bookPast: "त्यो समय बितिसक्यो।",
    bookUnpriced: "उहाँले यसको शुल्क तोक्नुभएको छैन।",
    chatTab: "सन्देशहरू",
    chatNoMessages: "अहिलेसम्म सन्देश छैन",
    chatScheduled: "तय भएको",
    reviewTitle: "कस्तो रह्यो?",
    reviewNote: "परामर्शको शुल्क तिर्नेले मात्र मूल्याङ्कन गर्न सक्नुहुन्छ।",
    reviewPlaceholder: "के राम्रो भयो, के भएन",
    reviewSubmit: "समीक्षा पठाउनुहोस्",
    reviewThanks: "धन्यवाद — तपाईंको समीक्षा पोस्ट भयो।",
    voiceFellBack: "प्रत्यक्ष आवाज जारी रहन सकेन, त्यसैले ज्योतिषी पालैपालो सुन्ने ढाँचामा फर्किए। तपाईं बोल्न वा लेख्न सक्नुहुन्छ।",
    notifSavedToVault: "तपाईंको संग्रहमा सुरक्षित",
    notifConversationUpdated: "कुराकानी अद्यावधिक भयो",
    notifMarkAllRead: "सबै पढिएको जनाउनुहोस्",
    notifSeeAll: "सबै सूचना हेर्नुहोस्",
    notifTitle: "सूचनाहरू",
    notifAllCaughtUp: "सबै हेरिसक्नुभयो।",
    ascendantPlacementLabel: "लग्न स्थिति:",
    masterAstrologer: "मास्टर ज्योतिषी",
    birthTimeNote: "जन्म समयले लग्न तय गर्छ, र लग्नले तपाईंको कुण्डलीका सबै भाव तय गर्छ।",
    gender: "लिङ्ग",
    genderMale: "पुरुष",
    genderFemale: "महिला",
    genderOther: "अन्य",
    selectDate: "जन्म मिति छान्नुहोस्",
    selectTime: "जन्म समय छान्नुहोस्",

    dashGreeting: "नमस्ते, {name}",
    dashSubtitle: "तपाईंका कुण्डली, तपाईंका राशिफल, र तिनमा प्लेटफर्मले गर्न सक्ने सबै कुरा।",
    dashStatCharts: "सुरक्षित कुण्डली",
    dashStatMember: "हामीसँग",
    dashActions: "तपाईं के गर्न चाहनुहुन्छ?",
    dashNewKundali: "नयाँ कुण्डली बनाउनुहोस्",
    dashNewKundaliBody: "नाम, मिति, समय र स्थान — कुण्डली करिब एक सेकेन्डमा आउँछ।",
    dashReading: "विश्लेषण पढ्नुहोस्",
    dashReadingBody: "सात लिखित खण्ड, हरेकले आफू अडेको ग्रहस्थिति उद्धृत गर्दै।",
    dashLive: "ज्योतिषीसँग कुरा गर्नुहोस्",
    dashLiveBody: "बोलेर सोध्नुहोस् र जवाफ सुन्नुहोस् — हात नचलाई।",
    dashMilan: "दुई कुण्डली मिलाउनुहोस्",
    dashMilanBody: "आठै कूटको अष्टकूट मिलान, तर्कसहित देखाइएको।",
    dashConsult: "मानिस ज्योतिषीसँग परामर्श",
    dashConsultBody: "प्रमाणित ज्योतिषी, तपाईंको कुण्डली लिएरै आउने।",
    dashSoon: "छिट्टै",
    dashSaved: "तपाईंका कुण्डलीहरू",
    dashSavedCount: "{n} सुरक्षित",
    dashEmptyTitle: "अहिलेसम्म कुनै कुण्डली सुरक्षित छैन",
    dashEmptyBody: "पहिलो कुण्डली बनाउनुहोस् — अर्को पटक साइन इन गर्दा यहीँ भेटिनेछ।",
    dashOpen: "राशिफल खोल्नुहोस्",
    dashOpening: "पुनः गणना हुँदै…",
    chooseTitle: "कसको कुण्डली?",
    chooseReadingNote: "कुन कुण्डलीको फलादेश चाहनुहुन्छ, छान्नुहोस्।",
    chooseLiveNote: "कुन कुण्डलीबारे कुरा गर्ने, छान्नुहोस्।",
    chooseEmpty: "तपाईंसँग सुरक्षित कुण्डली छैन।",
    dashDelete: "मेट्नुहोस्",
    dashConfirmDelete: "यो कुण्डली मेट्ने?",
    dashCancel: "रहन दिनुहोस्",
    dashNotRecalculable: "समय-क्षेत्र नामबाट राख्न थाल्नुअघि सुरक्षित गरिएको — यसलाई सुरक्षित रूपमा पुनः गणना गर्न मिल्दैन।",
    dashLoadFailed: "त्यो कुण्डली खोल्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    dashSignedInAs: "साइन इन:",
    dashSignOut: "साइन आउट",
    dashSignIn: "साइन इन",
    dashNavHome: "गृह",
    dashNavNew: "नयाँ कुण्डली",
    dashNavReading: "राशिफल",
    dashNavLive: "प्रत्यक्ष ज्योतिषी",
    dashNavMilan: "कुण्डली मिलान",
    dashNavLibrary: "सङ्ग्रह",
    dashNavRecent: "हालका",
    dashHelp: "सहयोग",
    dashSettings: "सेटिङ",
    acctProfile: "प्रोफाइल",
    acctSettings: "सेटिङ",
    acctYourAccount: "तपाईंको खाता",
    acctName: "देखिने नाम",
    acctNameNote: "एपले तपाईंलाई बोलाउने नाम, र ज्योतिषीले देख्ने नाम।",
    acctEmail: "इमेल",
    acctEmailNote: "तपाईंको साइन-इन ठेगाना। यहाँबाट बदल्न मिल्दैन।",
    acctJoined: "सुरु गरेको",
    acctRole: "खाताको प्रकार",
    acctSave: "परिवर्तन सुरक्षित गर्नुहोस्",
    acctSaved: "सुरक्षित भयो।",
    acctActivity: "तपाईंको संग्रह",
    acctPassword: "पासवर्ड",
    acctCurrentPassword: "हालको पासवर्ड",
    acctNewPassword: "नयाँ पासवर्ड",
    acctPasswordNote: "कम्तीमा ८ अक्षर। गुगलबाट साइन इन गर्नुभएको हो भने बदल्नुपर्ने पासवर्ड छैन।",
    acctPasswordChanged: "पासवर्ड बदलियो।",
    acctChangePassword: "पासवर्ड बदल्नुहोस्",
    acctLanguage: "भाषा",
    acctLanguageNote: "फलादेश, एआई ज्योतिषी र एप — सबैमा यही भाषा।",
    acctPrivacy: "तपाईंको जन्म विवरण",
    acctPrivacyNote: "जन्म विवरण लग, त्रुटि रिपोर्ट वा एनालिटिक्समा कहिल्यै लेखिँदैन। तपाईंले नदिएसम्म ज्योतिषीले कुण्डली देख्दैनन्, र दिएको फिर्ता लिन सकिन्छ।",
    acctPrivacyLink: "गोपनीयता नीति पढ्नुहोस्",
    acctDanger: "साइन आउट",
    acctDangerNote: "यो यन्त्रबाट मात्र साइन आउट हुन्छ। तपाईंका कुण्डली सुरक्षित रहन्छन्।",
    dashCollapse: "साइडबार खुम्च्याउनुहोस्",
    dashClose: "बन्द गर्नुहोस्",
    dashMenu: "मेनु",
    dashQuickLabel: "कसको कुण्डली बनाउने?",
    dashQuickPlaceholder: "कसको कुण्डली बनाउने?",
    dashQuickCta: "कुण्डली बनाउनुहोस्",
    dashEyebrow: "तपाईंको आकाश",
    dashNavLanguage: "भाषा",
    dashNavJyotish: "ज्योतिषीसँग कुरा",
    dashOnlineCount: "{n} अनलाइन",
    dashConversations: "कुराकानीहरू",
    dashSearch: "कुण्डली, राशिफल, ज्योतिषी खोज्नुहोस्…",
    dashClear: "खोज हटाउनुहोस्",
    dashNotifications: "सूचनाहरू",
    dashNoNotifications: "सबै हेरिसक्नुभयो।",
    dashProfile: "तपाईंको प्रोफाइल",
    dashReadingAction: "राशिफल",
    dashAsk: "सोध्नुहोस्",
    dashMatches: "{n} मिल्यो",
    dashNoMatches: "“{q}” सँग मिल्ने कुण्डली भेटिएन।",
    dashJyotish: "ज्योतिषीसँग कुरा गर्नुहोस्",
    dashPreview: "झलक",
    dashJyotishSoon: "परामर्श छिट्टै सुरु हुँदै",
    dashAll: "सबै",
    dashNoAstrologers: "त्यो फिल्टरसँग मिल्ने ज्योतिषी छैन।",
    dashVerified: "प्रमाणित",
    dashYears: "वर्ष",
    dashReadingsCount: "पठन",
    dashMinutes: "मिनेट",
    dashOffline: "अफलाइन",
    dashBackAt: "फर्कने",
    dashChat: "च्याट",
    dashBook: "बुक",
    dashNotify: "जानकारी दिनुहोस्",
    dashBookLater: "पछि बुक",
    milanEyebrow: "अष्टकूट",
    milanTitle: "कुण्डली मिलान",
    milanSub: "पूरा ३६ गुणका लागि आठै कूट, दुवैतर्फ मंगल दोष जाँचिएको र कटौतीका नियम लागू गरिएको — अनि अंक एउटै संख्यामा थमाउनुको सट्टा कूट-कूट गरी खोलिएको।",
    milanBride: "दुलही",
    milanGroom: "दुलहा",
    milanChoose: "कुण्डली छान्नुहोस्",
    milanChange: "बदल्नुहोस्",
    milanSearch: "आफ्ना कुण्डली खोज्नुहोस्…",
    milanNoCharts: "मिल्ने कुण्डली छैन।",
    milanMatch: "यी कुण्डली मिलाउनुहोस्",
    milanMatching: "मिलाउँदै…",
    milanPickBoth: "दुवैतर्फ कुण्डली छान्नुहोस्।",
    milanSameChart: "फरक-फरक दुई कुण्डली छान्नुहोस्।",
    milanNeedTwo: "अहिलेसम्म {n} वटा छन्। अर्को बनाउनुहोस्, यहीँ छान्न मिल्नेछ।",
    milanNewMatch: "नयाँ मिलान",
    milanKootaByKoota: "कूट अनुसार",
    milanBarNote: "पट्टीको लम्बाइ = त्यसको भार",
    milanManglik: "मंगल दोष",
    milanIsManglik: "मंगली",
    milanNotManglik: "मंगली होइन",
    milanCancelled: "कटेको",
    milanCompatible: "मिल्ने",
    milanCaution: "सावधानी",
    milanGood: "राम्रो मिलान",
    milanFair: "चल्न सक्ने",
    milanPoor: "तर्क पढ्नुहोस्",
    milanNeedTwoTitle: "मिलानका लागि दुई कुण्डली चाहिन्छ",
    milanWhatWeCheck: "मिलानले के-के जाँच्छ",
    milanGuna: "गुण",
    milanManglikNote: "दुवै कुण्डलीमा मंगल दोष जाँचिन्छ, र शास्त्रीय कटौती नियम लागू हुन्छ — दुवैतर्फ भएमा कटिन्छ, एउटा कुण्डली मात्र देखाएर जोडीलाई तर्साउनुको सट्टा।",
    milanAnalysisTitle: "ज्योतिषीको विश्लेषण",
    milanAnalysisNote: "माथिका अंक दुवै कुण्डलीबाट गणना गरिएका हुन्। यो विश्लेषणले तिनको अर्थ खोल्छ — यो मार्गदर्शन हो, विवाहको अन्तिम निर्णय होइन।",
    milanAnalysing: "दुवै कुण्डली हेर्दै…",
    milanAnalysingNote: "आठै कूट, मंगल स्थिति र दुवै पूर्ण कुण्डली हेरिँदैछ। केही समय लाग्छ।",
    milanAnalysisFailed: "विश्लेषण पूरा हुन सकेन। माथिको मिलान भने ठीकै छ।",
    milanRetry: "फेरि प्रयास गर्नुहोस्",
    playbackSpeed: "प्ले गर्ने गति",
    readingCalculated: "यो गणना गरिएको विश्लेषण हो",
    readingCalculatedNote: "ज्योतिषीसँग सम्पर्क हुन सकेन, त्यसैले यो तपाईंको कुण्डलीबाट नियम इन्जिनले बनाएको हो। तलका सबै स्थिति भने सही छन्।",
    readingBack: "पछाडि",
    milanStrengths: "के मिल्छ",
    milanConcerns: "केमा काम गर्नुपर्छ",
    milanDoshas: "दोष",
    milanRemedies: "उपाय",
    milanBasis: "आधार",
    milanAffects: "असर",
    milanTiming: "कहिले",
    milanSeverityNone: "छैन",
    milanSeverityMild: "सामान्य",
    milanSeverityModerate: "मध्यम",
    milanSeveritySerious: "गम्भीर",
    dashToday: "आजको आकाश",
    dashVara: "वार",
    dashTithi: "तिथि",
    dashYoga: "योग",
    dashKarana: "करण",
    dashPada: "पाद",
    dashRising: "लग्न",
    dashDasha: "चलिरहेको दशा",
    dashMahadasha: "महादशा",
    dashAntardasha: "अन्तर्दशा",
    dashUpcoming: "आगामी अवधि",
    dashGlance: "कुण्डली एक नजरमा",
    dashLagna: "लग्न",
    dashGana: "गण",
    dashNadi: "नाडी",
    dashYoni: "योनि",
    dashTatva: "तत्त्व",
    dashVarna: "वर्ण",
  },

  hi: {
    brandName: "Nakhatra",
    vedicAstrology: "वैदिक ज्योतिष",
    home: "मुख्य पृष्ठ",
    freeKundali: "निःशुल्क कुंडली",
    vedicReading: "वैदिक फलकथन",
    talkToAstrologer: "एआई ज्योतिषी परामर्श",
    selectLanguage: "भाषा",

    heroTagline: "सटीक वैदिक कुंडली एवं लाइव एआई ज्योतिषी मार्गदर्शन",
    heroTitle: "आपकी कुंडली, अंश तक सटीक",
    heroSub: "स्विस इफेमेरिस हर ग्रह स्थिति की गणना करता है। एआई ज्योतिषी वही पढ़ता है जो वास्तव में है — वह कोई ग्रह, दशा या तिथि स्वयं नहीं गढ़ता।",
    birthDetails: "जन्म विवरण दर्ज करें",
    fullName: "पूरा नाम",
    birthDate: "जन्म तिथि",
    birthTime: "जन्म समय",
    birthPlace: "जन्म स्थान",
    calculateKundali: "जन्मकुंडली और भविष्यफल तैयार करें",
    calculating: "खगोलीय ग्रह स्थितियों की गणना हो रही है...",

    feature1Title: "सटीक खगोलीय गणितीय गणना",
    feature1Desc: "सटीक डिग्री, भाव और वर्ग कुंडली के लिए स्विस एफेमेरिस सिद्धांत से गणना की गई।",
    feature2Title: "विंशोत्तरी दशा और समयरेखा",
    feature2Desc: "सटीक समय और जीवन घटनाओं के लिए अपनी सक्रिय महादशा और अंतर्दशा अवधि को ट्रैक करें।",
    feature3Title: "लाइव बातचीत एआई ज्योतिषी",
    feature3Desc: "अपने एआई ज्योतिषी से अंग्रेजी, नेपाली या हिंदी में स्वाभाविक रूप से बातचीत करें।",

    readingHeader: "संपूर्ण वैदिक कुंडली एवं ज्योतिषीय विश्लेषण",
    seekerName: "जातक विवरण",
    tabChart: "डी१ लग्न कुंडली",
    tabPlanets: "ग्रह स्थिति और डिग्री",
    tabDasha: "विंशोत्तरी महादशा",
    tabVargas: "वर्ग कुंडली (डी९ नवांश)",
    tabAnalysis: "विस्तृत जीवन विश्लेषण",
    tabAskAI: "ज्योतिषी परामर्श",
    lagnaAscendant: "लग्न राशि",
    moonSign: "चंद्र राशि (राशि)",
    nakshatra: "जन्म नक्षत्र",
    currentDasha: "वर्तमान दशा समयरेखा",
    openLiveVoice: "लाइव ऑडियो परामर्श शुरू करें",
    backToReport: "मुख्य रिपोर्ट पर लौटें",

    liveWorkspaceTitle: "लाइव ऑडियो ज्योतिषी परामर्श",
    listeningState: "सुन रहा है... बोलिए",
    thinkingState: "कुंडली और वाणी का विश्लेषण हो रहा है...",
    speakingState: "मास्टर ज्योतिषी मार्गदर्शन दे रहे हैं...",
    pausedState: "ऑडियो सत्र रोका गया",
    askPlaceholder: "अपने ज्योतिषी से कुछ भी पूछें... (प्रश्न लिखकर एंटर दबाएं)",
    sendQuery: "प्रश्न भेजें",
    interrupt: "रोकें",
    transcript: "इतिहास",
    kundaliChart: "जन्मकुंडली",
    exitVoice: "बाहर निकलें",
    mute: "मौन",
    unmute: "आवाज़ खोलें",

    kundaliChartsTitle: "कुंडली चक्र",
    kundaliChartsSub: "डी१ लग्न और डी९ नवांश कुंडली",
    d1LagnaChartTitle: "डी१ · लग्न कुंडली (मुख्य जन्म कुंडली)",
    d9NavamshaChartTitle: "डी९ · नवांश कुंडली (धर्म और भाग्य)",
    ascendantLabel: "लग्न",
    houseLabel: "भाव",
    lordLabel: "स्वामी",
    tapHouseHelper: "💡 D1 या D9 के किसी भी भाव को दबाकर उसकी राशि, स्वामी और ग्रह देखें।",
    avakhadaTitle: "अवकहड़ा चक्र (जन्म तत्व)",
    moonSignLabel: "चंद्र राशि:",
    nakshatraLabel: "जन्म नक्षत्र:",
    nakshatraPadaLabel: "नक्षत्र चरण:",
    nameSyllableLabel: "नाम अक्षर:",
    ganaLabel: "गण:",
    nadiLabel: "नाड़ी:",
    yoniLabel: "योनि (पशु):",
    varnaElementLabel: "वर्ण / तत्व:",
    auspiciousTitle: "शुभ एवं अशुभ तत्व",
    luckyColors: "✓ शुभ रंग (शुभ रंग):",
    unluckyColors: "✗ अशुभ रंग (अशुभ रंग):",
    luckyGemstones: "✓ शुभ रत्न (शुभ रत्न):",
    unluckyGemstones: "✗ अशुभ रत्न (अशुभ रत्न):",
    planetaryPositionsTitle: "ग्रह स्थिति एवं अंश (डिग्री)",
    compactLabel: "संक्षिप्त",
    fullDetailsLabel: "पूरा विवरण",
    thPlanet: "ग्रह",
    thSign: "राशि",
    thHouse: "भाव",
    thDegree: "अंश (D°M'S\")",
    activeDashaTitle: "सक्रिय दशा प्रणाली एवं भविष्यवाणी",
    narrativeAudioTitle: "श्रव्य (ऑडियो) कुंडली वाचन",
    narrativeAudioSub: "ज्योतिषी वाणी: आचार्य देव (HD ऑडियो स्ट्रीम)",
    telemetryTitle: "ऑडियो वाचन एवं लाइव पाठ",
    activeScriptLabel: "सक्रिय वाचन पाठ:",
    catOverview: "अवलोकन",
    catPersonality: "व्यक्तित्व",
    catCareer: "करियर एवं धन",
    catMarriage: "प्रेम एवं विवाह",
    catDasha: "वर्तमान दशा",
    catRemedies: "उपाय",
    astrologicalFootnotes: "ज्योतिषीय खगोलीय आधार:",
    bottomCtaQuestion: "क्या आपके पास अपने करियर या रिश्ते के बारे में कोई विशेष प्रश्न है?",
    bottomCtaBtn: "🔴 लाइव एआई ज्योतिषी से बात करें",
    selectVoice: "आवाज चुनें",
    astrologerVoice: "ज्योतिषी आवाज",
    downloadPdf: "पीडीएफ डाउनलोड",
    shareReading: "कुंडली शेयर करें",
    downloadAudio: "ऑडियो डाउनलोड",
    shareAudio: "ऑडियो शेयर",
    pdfGenerating: "संपूर्ण कुंडली पीडीएफ तैयार हो रही है...",

    realtimeResponse: "लाइव उत्तर",
    listeningToVoice: "आपकी आवाज़ सुन रहा है...",
    askAnyQuestionOrb: "मास्टर ज्योतिषी से बात करने के लिए कोई भी प्रश्न पूछें या ब्रह्मांड चक्र दबाएं।",
    messagesCount: "संदेश",
    viewTranscript: "इतिहास →",
    closeChartDrawer: "कुंडली बंद करें",
    closeTranscriptDrawer: "इतिहास बंद करें",
    d1SiderealBirthChart: "डी१ निरयण जन्म कुंडली",
    activeTimeLords: "सक्रिय दशा (काल स्वामी)",
    consultSuggestedTopics: "सुझाए गए परामर्श विषय",
    groundedInChart: "कुंडली पर आधारित",
    suggestedFollowups: "सुझाए गए प्रश्न",
    realtimeListening: "लाइव सुन रहा है...",
    analyzingSpeech: "वाणी एवं कुंडली का विश्लेषण हो रहा है...",
    astrologerSpeaking: "ज्योतिषी मार्गदर्शन दे रहे हैं...",
    voiceReadyPaused: "आवाज़ तैयार / रुकी हुई",
    micHardwareStatus: "माइक हार्डवेयर स्थिति",
    micVu: "माइक संकेत",
    debugLabel: "डिबग",
    deskView: "डेस्क",
    voiceView: "आवाज़",
    tapToInterrupt: "रोकने के लिए दबाएं",
    tapToStartVoice: "लाइव बातचीत शुरू करने के लिए दबाएं",
    realtimeAudioEngine: "लाइव ऑडियो इंजन",
    vedicVoiceEngine: "वैदिक वॉइस इंजन",
    sendNow: "अभी भेजें",
    exitLabel: "बाहर निकलें",
    closePanel: "पैनल बंद करें",
    connectingToDesk: "लाइव एआई ज्योतिषी कक्ष से जुड़ रहा है...",
    calculatingEphemeris: "स्विस एफेमेरिस कुंडली गणना हो रही है",
    mahadashaLabel: "महादशा",
    antardashaLabel: "अंतर्दशा",
    noActiveDasha: "आज के लिए कोई सक्रिय दशा नहीं",
    dashaOverviewTitle: "आपकी दशा — जीवन का वर्तमान अध्याय",
    dashaOverviewWhatIs: "दशा क्या है?",
    dashaOverviewWhatIsDesc: "वैदिक ज्योतिष में, आपका जीवन ग्रहीय अवधियों में विभाजित होता है जिन्हें दशा कहते हैं। प्रत्येक ग्रह आपके जीवन के एक अध्याय को संचालित करता है, आपके स्वास्थ्य, करियर, रिश्तों और भाग्य को प्रभावित करता है। इसे ऋतु की तरह सोचें — जैसे ऋतुएँ बदलती हैं, आपकी दशा आपके जीवन का विषय बदल देती है।",
    dashaOverviewYourCurrent: "आपकी वर्तमान अवधि",
    dashaOverviewMainPeriod: "मुख्य अवधि (महादशा)",
    dashaOverviewSubPeriod: "उप-अवधि (अंतर्दशा)",
    dashaOverviewDuration: "अवधि",
    dashaOverviewToLabel: "से",
    dashaOverviewNoPeriod: "कोई सक्रिय उप-अवधि नहीं",
    dashaOverviewYears: "वर्ष",
    vimshottariLabel: "विंशोत्तरी",
    askAnythingHint: "अपनी कुंडली के बारे में कुछ भी पूछें — करियर, विवाह, समय या उपाय। हर उत्तर बाईं ओर की ग्रह स्थितियों से ही आता है।",
    consultReconnecting: "पुनः कनेक्ट हो रहा है — अपडेट थोड़े धीमे आ सकते हैं।",
    callStartVoice: "वॉइस कॉल शुरू",
    callStartVideo: "वीडियो कॉल शुरू",
    callRinging: "घंटी बज रही है…",
    callIncoming: "आती हुई कॉल",
    callConnecting: "जुड़ रहा है…",
    callLive: "जुड़ गया",
    callAnswer: "उठाएँ",
    callDecline: "अस्वीकार",
    callMute: "म्यूट",
    callCamera: "कैमरा",
    callEnd: "कॉल समाप्त",
    callNoRelay: "कोई रिले सर्वर सेट नहीं है, इसलिए कुछ मोबाइल नेटवर्क पर यह कॉल नहीं जुड़ सकती।",
    callNoMic: "माइक या कैमरे तक पहुँच नहीं हुई। इस साइट के लिए ब्राउज़र की अनुमति जाँचें।",
    consultPerMinute: "मिनट",
    consultElapsed: "बीता समय",
    consultCost: "अब तक का खर्च",
    consultBalance: "वॉलेट",
    consultLeft: "शेष",
    consultLowBalance: "आपका बैलेंस कम हो रहा है। सत्र जारी रखने के लिए राशि जोड़ें, अन्यथा यह जल्द ही समाप्त हो जाएगा।",
    consultTitle: "परामर्श",
    consultNone: "अभी तक कोई परामर्श नहीं",
    consultNoneNote: "किसी सत्यापित ज्योतिषी या पंडित से प्रश्न पूछें, फिर वह यहाँ दिखेगा।",
    consultStart: "सत्र शुरू करें",
    consultEnd: "सत्र समाप्त करें",
    consultAccept: "स्वीकार",
    consultDecline: "अस्वीकार",
    consultCancel: "रद्द",
    consultSend: "भेजें",
    consultPlaceholder: "संदेश लिखें…",
    consultShareChart: "यह कुंडली उनके साथ साझा करें",
    consultWaiting: "ज्योतिषी के स्वीकार करने की प्रतीक्षा।",
    consultEnded: "यह सत्र समाप्त हो गया।",
    consultTopUp: "राशि जोड़ें",
    consultGrants: "साझा कुंडलियाँ",
    consultRevoke: "वापस लें",
    consultShared: "साझा",
    practBecome: "ज्योतिषी बनें",
    practApplicationStatus: "आपका आवेदन",
    practDesk: "ज्योतिषी डेस्क",
    practRates: "आपकी दरें",
    practRatesNote: "प्रति मिनट आपका शुल्क। बिना मूल्य वाला माध्यम नहीं दिखाया जाता।",
    practSetRate: "सहेजें",
    practRequests: "अनुरोध",
    practLive: "सूचीबद्ध",
    practOffline: "सूचीबद्ध नहीं",
    practNoRates: "परामर्श से पहले एक मूल्य निर्धारित करें।",
    practPendingNote: "आमतौर पर एक-दो दिन में। परिणाम चाहे जो हो, हम बताएँगे, और तब तक आप नखत्र सामान्य रूप से चला सकते हैं।",
    practSubmitted: "आपने जो भेजा",
    practIntroVideo: "परिचय वीडियो लिंक",
    practIntroVideoNote: "यदि हो तो YouTube या Vimeo लिंक।",
    practStatus: "आपकी लिस्टिंग",
    applyWho: "आप कौन हैं",
    applyReach: "लोग आप तक कैसे पहुँचें",
    applyExpertise: "आप क्या करते हैं",
    applyNext: "आगे क्या होगा",
    practCountry: "देश",
    practYearsSuffix: "वर्ष",
    practPhoneNote: "कॉल कटने पर ग्राहक आपको वापस फ़ोन कर सके।",
    practPhoneInvalid: "7 से 15 अंकों का फ़ोन नंबर लिखें।",
    practCityPlaceholder: "अपना शहर खोजें",
    practNamePlaceholder: "जैसा प्रोफ़ाइल पर दिखे",
    practReviewLink: "आवेदन देखें",
    practVerified: "सत्यापित",
    practUnverified: "जाँच प्रतीक्षा में",
    practPriced: "मूल्य निर्धारित",
    practYourProfile: "आपकी प्रोफ़ाइल",
    practBio: "आपके बारे में",
    practBioPlaceholder: "आप कुंडली कैसे देखते हैं, और लोग किसलिए आते हैं।",
    practSpecialities: "आपसे किस बारे में पूछा जाता है",
    practSaveProfile: "सहेजें और सूचीबद्ध हों",
    practSaved: "सहेजा गया",
    practUnlist: "मुझे निर्देशिका से हटाएँ",
    practComingSoon: "जल्द आ रहा है",
    soonNote: "असली ज्योतिषी से परामर्श अभी शुरू नहीं हुआ है। तब तक AI ज्योतिषी, आपकी कुंडलियाँ और मिलन सामान्य रूप से चलते रहेंगे — खुलने के दिन यहीं बता देंगे।",
    practRegister: "ज्योतिषी के रूप में पंजीकरण",
    practPhoto: "प्रोफ़ाइल फ़ोटो",
    practPhotoNote: "चेहरा साफ़ दिखने वाली फ़ोटो। JPG, PNG या WebP, 4MB तक।",
    practPractice: "आप क्या करते हैं",
    practBothNote: "दोनों करते हैं तो दोनों चुनें।",
    practYears: "कितने वर्षों से",
    practPhone: "फ़ोन",
    practCity: "शहर",
    practTraditions: "परंपरा",
    practHeadline: "अपने बारे में एक पंक्ति",
    practHeadlinePlaceholder: "केपी पद्धति · करियर और विवाह",
    practSearch: "ज्योतिषी और पंडित खोजें",
    practUnavailable: "अभी निर्देशिका उपलब्ध नहीं है।",
    practNoneYet: "अभी तक कोई सत्यापित ज्योतिषी नहीं",
    practNoneYetNote: "आवेदन और सत्यापन के बाद ही ज्योतिषी और पंडित यहाँ दिखते हैं। जाँच से पहले कोई सूचीबद्ध नहीं होता।",
    dashVerified: "सत्यापित",
    dashYears: "वर्ष",
    practApplyTitle: "नखत्र पर सेवा दें",
    practApplyLead: "कुछ विवरण और एक फ़ोटो — बस इतना ही। सार्वजनिक होने से पहले हर प्रोफ़ाइल एक व्यक्ति देखता है, इसलिए कोई बिना जाँच सूचीबद्ध नहीं होता।",
    practApplySubmit: "आवेदन भेजें",
    practApplyPending: "आपका आवेदन समीक्षा में है।",
    practApplyApproved: "स्वीकृत — आपकी प्रोफ़ाइल प्रकाशित करने के लिए तैयार है।",
    practApplyRejected: "यह आवेदन स्वीकृत नहीं हुआ।",
    practReviewQueue: "आवेदन",
    practApprove: "स्वीकृत करें",
    practReject: "अस्वीकार करें",
    profFollow: "फ़ॉलो करें",
    profFollowing: "फ़ॉलो कर रहे हैं",
    profMessage: "संदेश",
    profBook: "बुक करें",
    profAbout: "परिचय",
    profRates: "शुल्क",
    profReviews: "समीक्षाएँ",
    profNoReviews: "अभी तक कोई समीक्षा नहीं",
    profNoReviewsNote: "परामर्श समाप्त होने के बाद ही यहाँ रेटिंग दिखती है। उससे पहले कुछ नहीं।",
    profUnrated: "अभी रेटिंग नहीं",
    profConsultations: "परामर्श",
    profFollowers: "फ़ॉलोअर",
    profReply: "उत्तर",
    profReplyPlaceholder: "इस समीक्षा का उत्तर दें",
    profNotFound: "यह प्रोफ़ाइल उपलब्ध नहीं है।",
    profSpeaks: "भाषाएँ",
    bookTitle: "परामर्श बुक करें",
    bookMedium: "कैसे बात करेंगे",
    bookWhen: "कब",
    bookNow: "अभी शुरू करें",
    bookLater: "समय चुनें",
    bookDate: "तारीख़",
    bookTime: "समय",
    bookNote: "जो उन्हें पहले जानना चाहिए",
    bookConfirm: "अनुरोध भेजें",
    bookPast: "वह समय बीत चुका है।",
    bookUnpriced: "उन्होंने इसका शुल्क तय नहीं किया है।",
    chatTab: "संदेश",
    chatNoMessages: "अभी तक कोई संदेश नहीं",
    chatScheduled: "निर्धारित",
    reviewTitle: "कैसा रहा?",
    reviewNote: "केवल भुगतान करने वाले ही रेटिंग दे सकते हैं।",
    reviewPlaceholder: "क्या अच्छा रहा, क्या नहीं",
    reviewSubmit: "समीक्षा भेजें",
    reviewThanks: "धन्यवाद — आपकी समीक्षा पोस्ट हो गई।",
    voiceFellBack: "लाइव आवाज़ जारी नहीं रह सकी, इसलिए ज्योतिषी बारी-बारी सुनने की विधि पर लौट आए हैं। आप बोल या लिख सकते हैं।",
    notifSavedToVault: "आपके संग्रह में सुरक्षित",
    notifConversationUpdated: "बातचीत अपडेट हुई",
    notifMarkAllRead: "सभी पढ़ा हुआ चिह्नित करें",
    notifSeeAll: "सभी सूचनाएँ देखें",
    notifTitle: "सूचनाएँ",
    notifAllCaughtUp: "आप सब देख चुके हैं।",
    ascendantPlacementLabel: "लग्न स्थिति:",
    masterAstrologer: "मास्टर ज्योतिषी",
    birthTimeNote: "जन्म समय लग्न तय करता है, और लग्न आपकी कुंडली के सभी भाव तय करता है।",
    gender: "लिंग",
    genderMale: "पुरुष",
    genderFemale: "महिला",
    genderOther: "अन्य",
    selectDate: "जन्म तिथि चुनें",
    selectTime: "जन्म समय चुनें",

    dashGreeting: "नमस्ते, {name}",
    dashSubtitle: "आपकी कुंडलियाँ, आपकी रीडिंग, और उन पर प्लेटफ़ॉर्म जो कुछ कर सकता है।",
    dashStatCharts: "सहेजी गई कुंडलियाँ",
    dashStatMember: "हमारे साथ",
    dashActions: "आप क्या करना चाहेंगे?",
    dashNewKundali: "नई कुंडली बनाएँ",
    dashNewKundaliBody: "नाम, तिथि, समय और स्थान — कुंडली लगभग एक सेकंड में आ जाती है।",
    dashReading: "विश्लेषण पढ़ें",
    dashReadingBody: "सात लिखित खंड, हर एक अपनी आधार ग्रहस्थिति के साथ।",
    dashLive: "ज्योतिषी से बात करें",
    dashLiveBody: "बोलकर पूछें और उत्तर सुनें — बिना हाथ लगाए।",
    dashMilan: "दो कुंडलियाँ मिलाएँ",
    dashMilanBody: "आठों कूटों का अष्टकूट मिलान, तर्क सहित।",
    dashConsult: "मानव ज्योतिषी से परामर्श",
    dashConsultBody: "प्रमाणित ज्योतिषी, जो आपकी कुंडली लेकर ही आते हैं।",
    dashSoon: "जल्द",
    dashSaved: "आपकी कुंडलियाँ",
    dashSavedCount: "{n} सहेजी गईं",
    dashEmptyTitle: "अभी तक कोई कुंडली सहेजी नहीं गई",
    dashEmptyBody: "अपनी पहली कुंडली बनाएँ — अगली बार साइन इन करने पर वह यहीं मिलेगी।",
    dashOpen: "रीडिंग खोलें",
    dashOpening: "पुनः गणना हो रही है…",
    chooseTitle: "किसकी कुंडली?",
    chooseReadingNote: "किस कुंडली का फलादेश चाहिए, चुनें।",
    chooseLiveNote: "किस कुंडली पर बात करनी है, चुनें।",
    chooseEmpty: "आपके पास कोई सहेजी हुई कुंडली नहीं है।",
    dashDelete: "हटाएँ",
    dashConfirmDelete: "यह कुंडली हटाएँ?",
    dashCancel: "रहने दें",
    dashNotRecalculable: "समय-क्षेत्र नाम से सहेजे जाने से पहले की है — इसे सुरक्षित रूप से पुनः गणना नहीं किया जा सकता।",
    dashLoadFailed: "वह कुंडली नहीं खुल सकी। कृपया फिर प्रयास करें।",
    dashSignedInAs: "साइन इन:",
    dashSignOut: "साइन आउट",
    dashSignIn: "साइन इन",
    dashNavHome: "होम",
    dashNavNew: "नई कुंडली",
    dashNavReading: "रीडिंग",
    dashNavLive: "लाइव ज्योतिषी",
    dashNavMilan: "कुंडली मिलान",
    dashNavLibrary: "संग्रह",
    dashNavRecent: "हाल के",
    dashHelp: "सहायता",
    dashSettings: "सेटिंग्स",
    acctProfile: "प्रोफ़ाइल",
    acctSettings: "सेटिंग",
    acctYourAccount: "आपका खाता",
    acctName: "प्रदर्शित नाम",
    acctNameNote: "ऐप आपको इसी नाम से बुलाता है, और ज्योतिषी यही देखते हैं।",
    acctEmail: "ईमेल",
    acctEmailNote: "आपका साइन-इन पता। यहाँ से बदला नहीं जा सकता।",
    acctJoined: "शामिल हुए",
    acctRole: "खाते का प्रकार",
    acctSave: "बदलाव सहेजें",
    acctSaved: "सहेज लिया।",
    acctActivity: "आपकी लाइब्रेरी",
    acctPassword: "पासवर्ड",
    acctCurrentPassword: "मौजूदा पासवर्ड",
    acctNewPassword: "नया पासवर्ड",
    acctPasswordNote: "कम से कम 8 अक्षर। Google से साइन इन किया है तो बदलने के लिए पासवर्ड नहीं है।",
    acctPasswordChanged: "पासवर्ड बदल गया।",
    acctChangePassword: "पासवर्ड बदलें",
    acctLanguage: "भाषा",
    acctLanguageNote: "फलादेश, AI ज्योतिषी और ऐप — सब इसी भाषा में।",
    acctPrivacy: "आपका जन्म विवरण",
    acctPrivacyNote: "जन्म विवरण कभी लॉग, त्रुटि रिपोर्ट या एनालिटिक्स में नहीं जाता। जब तक आप साझा न करें ज्योतिषी कुंडली नहीं देखते, और साझा करना वापस भी लिया जा सकता है।",
    acctPrivacyLink: "गोपनीयता नीति पढ़ें",
    acctDanger: "साइन आउट",
    acctDangerNote: "केवल इस डिवाइस से साइन आउट होगा। आपकी कुंडलियाँ सुरक्षित रहेंगी।",
    dashCollapse: "साइडबार छोटा करें",
    dashClose: "बंद करें",
    dashMenu: "मेन्यू",
    dashQuickLabel: "किसकी कुंडली बनानी है?",
    dashQuickPlaceholder: "किसकी कुंडली बनानी है?",
    dashQuickCta: "कुंडली बनाएँ",
    dashEyebrow: "आपका आकाश",
    dashNavLanguage: "भाषा",
    dashNavJyotish: "ज्योतिषी से बात",
    dashOnlineCount: "{n} ऑनलाइन",
    dashConversations: "बातचीत",
    dashSearch: "कुंडली, रीडिंग, ज्योतिषी खोजें…",
    dashClear: "खोज हटाएँ",
    dashNotifications: "सूचनाएँ",
    dashNoNotifications: "सब कुछ देख लिया।",
    dashProfile: "आपकी प्रोफ़ाइल",
    dashReadingAction: "रीडिंग",
    dashAsk: "पूछें",
    dashMatches: "{n} मिले",
    dashNoMatches: "“{q}” से मेल खाती कोई कुंडली नहीं।",
    dashJyotish: "ज्योतिषी से बात करें",
    dashPreview: "झलक",
    dashJyotishSoon: "परामर्श जल्द शुरू",
    dashAll: "सभी",
    dashNoAstrologers: "उस फ़िल्टर से मेल खाता कोई ज्योतिषी नहीं।",
    dashReadingsCount: "रीडिंग",
    dashMinutes: "मिनट",
    dashOffline: "ऑफ़लाइन",
    dashBackAt: "वापसी",
    dashChat: "चैट",
    dashBook: "बुक",
    dashNotify: "सूचित करें",
    dashBookLater: "बाद में बुक",
    milanEyebrow: "अष्टकूट",
    milanTitle: "कुंडली मिलान",
    milanSub: "पूरे 36 गुणों के लिए आठों कूट, दोनों ओर मांगलिक दोष की जाँच और कटौती के नियम लागू — और अंक एक संख्या में थमाने के बजाय कूट-दर-कूट खोलकर।",
    milanBride: "वधू",
    milanGroom: "वर",
    milanChoose: "कुंडली चुनें",
    milanChange: "बदलें",
    milanSearch: "अपनी कुंडलियाँ खोजें…",
    milanNoCharts: "कोई मेल खाती कुंडली नहीं।",
    milanMatch: "इन कुंडलियों का मिलान करें",
    milanMatching: "मिलान हो रहा है…",
    milanPickBoth: "दोनों ओर कुंडली चुनें।",
    milanSameChart: "दो अलग कुंडलियाँ चुनें।",
    milanNeedTwo: "अभी {n} हैं। एक और बनाएँ, वह यहीं चुनी जा सकेगी।",
    milanNewMatch: "नया मिलान",
    milanKootaByKoota: "कूट दर कूट",
    milanBarNote: "पट्टी की लंबाई = उसका महत्त्व",
    milanManglik: "मांगलिक दोष",
    milanIsManglik: "मांगलिक",
    milanNotManglik: "मांगलिक नहीं",
    milanCancelled: "कट गया",
    milanCompatible: "अनुकूल",
    milanCaution: "सावधानी",
    milanGood: "अच्छा मिलान",
    milanFair: "चल सकता है",
    milanPoor: "तर्क पढ़ें",
    milanNeedTwoTitle: "मिलान के लिए दो कुंडलियाँ चाहिए",
    milanWhatWeCheck: "मिलान क्या जाँचता है",
    milanGuna: "गुण",
    milanManglikNote: "दोनों कुंडलियों में मांगलिक दोष जाँचा जाता है, और शास्त्रीय कटौती नियम लागू होते हैं — दोनों ओर होने पर कट जाता है, एक ही कुंडली दिखाकर दंपति को डराने के बजाय।",
    milanAnalysisTitle: "ज्योतिषी का विश्लेषण",
    milanAnalysisNote: "ऊपर के अंक दोनों कुंडलियों से गणना किए गए हैं। यह विश्लेषण उनका अर्थ खोलता है — यह मार्गदर्शन है, विवाह पर अंतिम निर्णय नहीं।",
    milanAnalysing: "दोनों कुंडलियाँ पढ़ी जा रही हैं…",
    milanAnalysingNote: "आठों कूट, मांगलिक स्थिति और दोनों पूर्ण कुंडलियाँ देखी जा रही हैं। इसमें कुछ समय लगता है।",
    milanAnalysisFailed: "विश्लेषण पूरा नहीं हो सका। ऊपर का मिलान अप्रभावित है।",
    milanRetry: "फिर कोशिश करें",
    playbackSpeed: "चलाने की गति",
    readingCalculated: "यह गणना किया हुआ विश्लेषण है",
    readingCalculatedNote: "ज्योतिषी से संपर्क नहीं हो सका, इसलिए यह आपकी कुंडली से नियम इंजन ने बनाया है। नीचे की सभी स्थितियाँ फिर भी सही हैं।",
    readingBack: "पीछे",
    milanStrengths: "क्या मिलता है",
    milanConcerns: "किस पर काम चाहिए",
    milanDoshas: "दोष",
    milanRemedies: "उपाय",
    milanBasis: "आधार",
    milanAffects: "प्रभाव",
    milanTiming: "कब",
    milanSeverityNone: "नहीं है",
    milanSeverityMild: "हल्का",
    milanSeverityModerate: "मध्यम",
    milanSeveritySerious: "गंभीर",
    dashToday: "आज का आकाश",
    dashVara: "वार",
    dashTithi: "तिथि",
    dashYoga: "योग",
    dashKarana: "करण",
    dashPada: "पाद",
    dashRising: "लग्न",
    dashDasha: "चल रही दशा",
    dashMahadasha: "महादशा",
    dashAntardasha: "अंतर्दशा",
    dashUpcoming: "आगामी अवधि",
    dashGlance: "कुंडली एक नज़र में",
    dashLagna: "लग्न",
    dashGana: "गण",
    dashNadi: "नाड़ी",
    dashYoni: "योनि",
    dashTatva: "तत्त्व",
    dashVarna: "वर्ण",
  },
};

