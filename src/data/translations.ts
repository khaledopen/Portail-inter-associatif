export type LanguageCode = 'fr' | 'en' | 'ar' | 'es' | 'pt' | 'uk';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
  speechLang: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', nativeName: 'Français', flag: '🇫🇷', speechLang: 'fr-FR', dir: 'ltr' },
  { code: 'en', label: 'Anglais', nativeName: 'English', flag: '🇬🇧', speechLang: 'en-GB', dir: 'ltr' },
  { code: 'ar', label: 'Arabe', nativeName: 'العربية', flag: '🇸🇦', speechLang: 'ar-SA', dir: 'rtl' },
  { code: 'es', label: 'Espagnol', nativeName: 'Español', flag: '🇪🇸', speechLang: 'es-ES', dir: 'ltr' },
  { code: 'pt', label: 'Portugais', nativeName: 'Português', flag: '🇵🇹', speechLang: 'pt-PT', dir: 'ltr' },
  { code: 'uk', label: 'Ukrainien', nativeName: 'Українська', flag: '🇺🇦', speechLang: 'uk-UA', dir: 'ltr' },
];

export interface TranslationDictionary {
  portalTitle: string;
  portalSubtitle: string;
  navHome: string;
  navDirectory: string;
  navQuickFlow: string;
  navUserSpace: string;
  navProSpace: string;
  navAdminSpace: string;
  navSignup: string;
  comfortMode: string;
  comfortModeActive: string;
  listenPage: string;
  stopListening: string;
  emergencyBtn: string;
  helpNearMeBtn: string;
  forSomeoneElse: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  quickJourneyCta: string;
  themesSectionTitle: string;
  themesSectionSub: string;
  howItWorksTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  nearMeSectionTitle: string;
  nearMeSectionSub: string;
  seeAssociation: string;
  slotThisWeek: string;
  categoryTitles: {
    papiers: { title: string; falc: string; desc: string };
    logement: { title: string; falc: string; desc: string };
    sante: { title: string; falc: string; desc: string };
    travail: { title: string; falc: string; desc: string };
    famille: { title: string; falc: string; desc: string };
    droits: { title: string; falc: string; desc: string };
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  fr: {
    portalTitle: "Portail Inter-Associatif",
    portalSubtitle: "Orléans Métropole & Département du Loiret",
    navHome: "Accueil",
    navDirectory: "Annuaire & Carte",
    navQuickFlow: "Parcours 4 écrans",
    navUserSpace: "Mon Espace Usager",
    navProSpace: "Espace Associations",
    navAdminSpace: "Observatoire État",
    navSignup: "Inscrire mon association",
    comfortMode: "Mode Confort (+30%)",
    comfortModeActive: "Mode Confort activé",
    listenPage: "Écouter la page",
    stopListening: "Arrêter la lecture",
    emergencyBtn: "Urgence Sociale (115)",
    helpNearMeBtn: "Me faire aider près de chez moi",
    forSomeoneElse: "Je prends rendez-vous pour quelqu'un d'autre",
    heroTitle: "De quelle aide avez-vous besoin ?",
    heroSubtitle: "Trouvez facilement la bonne association près de chez vous, préparez vos papiers sans stress et prenez rendez-vous en quelques clics.",
    searchPlaceholder: "De quelle aide avez-vous besoin ? (ex : titre de séjour, logement, dossier MDPH, colis alimentaire...)",
    searchButton: "Rechercher",
    quickJourneyCta: "Parcours guidé « Zéro Difficulté » en 4 étapes simples",
    themesSectionTitle: "Choisissez votre besoin en 1 clic",
    themesSectionSub: "Cliquez sur une grande carte ci-dessous. Chaque rubrique vous indique les associations compétentes et la liste exacte des papiers à apporter.",
    howItWorksTitle: "Comment ça marche ?",
    step1Title: "1. Je choisis mon besoin",
    step1Desc: "Je clique sur l'image qui correspond à ma situation (papiers, logement, santé, emploi, famille).",
    step2Title: "2. Je trouve une association",
    step2Desc: "Le portail m'indique la structure la plus proche avec l'arrêt de Tram ou de Bus TAO.",
    step3Title: "3. Je prends rendez-vous",
    step3Desc: "Je choisis mon jour et mon heure. Je reçois un SMS avec l'adresse et les documents à apporter.",
    nearMeSectionTitle: "Trouver de l'aide près de chez moi",
    nearMeSectionSub: "Vous n'avez pas d'ordinateur ou souhaitez être accompagné par une personne ? Rendez-vous gratuitement dans un point d'accueil numérique à Orléans et dans le Loiret.",
    seeAssociation: "Voir cette association",
    slotThisWeek: "Créneau cette semaine",
    categoryTitles: {
      papiers: {
        title: "Mes Papiers & Séjour",
        falc: "« J'ai besoin d'aide pour mon titre de séjour, ma nationalité ou mes papiers d'identité »",
        desc: "Titre de séjour (1re demande ou renouvellement), naturalisation, regroupement familial, perte de papiers, aide juridictionnelle et ANEF."
      },
      logement: {
        title: "Mon Logement & Énergie",
        falc: "« J'ai besoin d'aide pour trouver un logement, payer mon loyer ou mes factures »",
        desc: "Demande de logement social, APL / CAF, impayés de loyer, prévention expulsion, chèque énergie, hébergement d'urgence (115) et ADIL."
      },
      sante: {
        title: "Santé & Handicap",
        falc: "« J'ai besoin d'aide pour mon dossier handicap (MDPH) ou pour me soigner »",
        desc: "Dossier MDPH (AAH, PCH, carte mobilité), ouverture de droits CPAM, mutuelle solidaire (CSS) et soutien psychologique."
      },
      travail: {
        title: "Travail & Formation",
        falc: "« J'ai besoin d'aide pour chercher un emploi, faire mon CV ou apprendre le français »",
        desc: "Inscription France Travail, rédaction de CV, cours de français (FLE / alphabétisation), reconnaissance de diplômes et insertion."
      },
      famille: {
        title: "Famille & Budget",
        falc: "« J'ai besoin d'aide alimentaire, d'aide pour mes enfants ou pour mon budget »",
        desc: "Aide alimentaire (colis, épiceries solidaires), soutien scolaire, garde d'enfants, microcrédit social et dossier de surendettement."
      },
      droits: {
        title: "Mes Droits & Mes Démarches",
        falc: "« Je veux suivre mes rendez-vous, voir mes documents ou être aidé sur internet »",
        desc: "Suivi de mes rendez-vous, mon coffre-fort de documents, mes messages avec les associations et lieux d'aide numérique gratuits."
      }
    }
  },
  en: {
    portalTitle: "Inter-Associative Portal",
    portalSubtitle: "Orléans Metropolis & Loiret Department",
    navHome: "Home",
    navDirectory: "Directory & Map",
    navQuickFlow: "4-Step Booking",
    navUserSpace: "My User Space",
    navProSpace: "Associations Space",
    navAdminSpace: "State Observatory",
    navSignup: "Register my association",
    comfortMode: "Comfort Mode (+30%)",
    comfortModeActive: "Comfort Mode On",
    listenPage: "Listen to page",
    stopListening: "Stop reading",
    emergencyBtn: "Emergency (115)",
    helpNearMeBtn: "Get help in person near me",
    forSomeoneElse: "I am booking for someone else",
    heroTitle: "What kind of help do you need?",
    heroSubtitle: "Easily find the right local association near you, check required documents and book an appointment online.",
    searchPlaceholder: "What help do you need? (e.g., residence permit, housing, disability, food aid...)",
    searchButton: "Search",
    quickJourneyCta: "Start Easy 4-Step Guided Booking",
    themesSectionTitle: "Choose your need in 1 click",
    themesSectionSub: "Click on a card below to find specialized associations and the exact list of documents to bring.",
    howItWorksTitle: "How does it work?",
    step1Title: "1. I choose my need",
    step1Desc: "I select the topic matching my situation (residence papers, housing, health, job, family).",
    step2Title: "2. I find an association",
    step2Desc: "The portal shows the nearest organization with TAO Tram and Bus stops.",
    step3Title: "3. I book an appointment",
    step3Desc: "I pick a day and time, and receive an SMS with the address and checklist of documents.",
    nearMeSectionTitle: "Find in-person help near me",
    nearMeSectionSub: "Need help using a computer or phone? Visit a free digital assistance center (France Services) in Orléans and Loiret.",
    seeAssociation: "View this association",
    slotThisWeek: "Available this week",
    categoryTitles: {
      papiers: {
        title: "ID Papers & Residence Permit",
        falc: "“I need help with my residence permit, nationality or identity documents”",
        desc: "Residence permit (1st application or renewal), naturalization, family reunification, lost documents, free legal aid and ANEF."
      },
      logement: {
        title: "Housing & Energy",
        falc: "“I need help finding housing, paying my rent or energy bills”",
        desc: "Social housing application, APL / CAF housing benefit, unpaid rent, eviction prevention, energy voucher and 115 emergency shelter."
      },
      sante: {
        title: "Health & Disability",
        falc: "“I need help with my disability file (MDPH) or health insurance”",
        desc: "MDPH disability file (AAH, mobility card), CPAM health insurance registration, CSS solidarity health cover and psychological support."
      },
      travail: {
        title: "Work & Training",
        falc: "“I need help finding a job, writing my CV or learning French”",
        desc: "France Travail registration, CV writing, French classes (FLE / literacy), diploma recognition and local job integration."
      },
      famille: {
        title: "Family & Budget",
        falc: "“I need food assistance, support for my children or budget advice”",
        desc: "Food aid packages, solidarity grocery stores, school tutoring, childcare, social microcredit and debt relief."
      },
      droits: {
        title: "My Rights & Procedures",
        falc: "“I want to check my appointments, my document vault or digital help centers”",
        desc: "Track appointments, secure document storage vault, messages with associations and directory of digital support centers."
      }
    }
  },
  ar: {
    portalTitle: "البوابة المشتركة للجمعيات",
    portalSubtitle: "أورليان متروبول وإقليم لواريت (45)",
    navHome: "الرئيسية",
    navDirectory: "الدليل والخريطة",
    navQuickFlow: "حجز في 4 خطوات",
    navUserSpace: "فضاء المستخدم",
    navProSpace: "فضاء الجمعيات",
    navAdminSpace: "مرصد المحافظة",
    navSignup: "تسجيل جمعيتي",
    comfortMode: "وضع القراءة المريح (+30%)",
    comfortModeActive: "الوضع المريح مفعل",
    listenPage: "الاستماع إلى الصفحة",
    stopListening: "إيقاف القراءة",
    emergencyBtn: "طوارئ اجتماعية (115)",
    helpNearMeBtn: "مساعدة قريبة مني",
    forSomeoneElse: "أحجز موعداً لشخص آخر",
    heroTitle: "ما هي المساعدة التي تحتاجها؟",
    heroSubtitle: "اعثر بسهولة على الجمعية المناسبة بالقرب منك، تعرف على الوثائق المطلوبة واحجز موعداً عبر الإنترنت.",
    searchPlaceholder: "ما هي المساعدة التي تحتاجها؟ (تصريح إقامة، سكن، صحة، مساعدة غذائية...)",
    searchButton: "بحث",
    quickJourneyCta: "مسار الحجز الميسر في 4 خطوات بسيطة",
    themesSectionTitle: "اختر حاجتك بنقرة واحدة",
    themesSectionSub: "انقر على البطاقة المناسبة لعرض الجمعيات المتخصصة وقائمة الوثائق المطلوبة.",
    howItWorksTitle: "كيف يعمل الموقع؟",
    step1Title: "1. أختار حاجتي",
    step1Desc: "أختار الموضوع الذي يناسب وضعي (أوراق الإقامة، السكن، الصحة، العمل، الأسرة).",
    step2Title: "2. أجد جمعية قريبة",
    step2Desc: "يعرض الموقع أقرب جمعية مع محطة الترام أو الحافلة (TAO).",
    step3Title: "3. أحجز موعدي",
    step3Desc: "أختار اليوم والساعة وأتلقى رسالة نصية (SMS) بالعنوان والوثائق المطلوبة.",
    nearMeSectionTitle: "الحصول على مساعدة بالقرب مني",
    nearMeSectionSub: "يمكنك التوجه مجاناً إلى مراكز المساعدة الرقمية في أورليان ولواريت لمساعدتك في الإجراءات.",
    seeAssociation: "عرض هذه الجمعية",
    slotThisWeek: "موعد متاح هذا الأسبوع",
    categoryTitles: {
      papiers: {
        title: "أوراقي وتصريح الإقامة",
        falc: "« أحتاج إلى مساعدة بشأن تصريح الإقامة أو الجنسية أو وثائق الهوية »",
        desc: "تصريح الإقامة (طلب أول أو تجديد)، التجنس، لم الشمل العائلي، فقدان الوثائق، المساعدة القضائية المجانية و ANEF."
      },
      logement: {
        title: "السكن والطاقة",
        falc: "« أحتاج إلى مساعدة للعثور على سكن أو دفع الإيجار أو الفواتير »",
        desc: "طلب سكن اجتماعي، مساعدات السكن CAF/APL، الإيجارات المتأخرة، شيك الطاقة وإيواء الطوارئ 115."
      },
      sante: {
        title: "الصحة والإعاقة",
        falc: "« أحتاج إلى مساعدة في ملف الإعاقة (MDPH) أو التأمين الصحي »",
        desc: "ملف الإعاقة MDPH، فتح حقوق التأمين الصحي CPAM والتأمين التضامني CSS والدعم النفسي."
      },
      travail: {
        title: "العمل والتدريب",
        falc: "« أحتاج إلى مساعدة للبحث عن عمل أو كتابة السيرة الذاتية أو تعلم الفرنسية »",
        desc: "التسجيل في France Travail، إعداد السيرة الذاتية، دروس اللغة الفرنسية (FLE)، ومعادلة الشهادات."
      },
      famille: {
        title: "الأسرة والميزانية",
        falc: "« أحتاج إلى مساعدة غذائية أو دعم لأطفالي أو تنظيم ميزانيتي »",
        desc: "طرود غذائية، متاجر تضامنية، دعم مدرسي، رعاية الأطفال ومعالجة الديون."
      },
      droits: {
        title: "حقوقي وإجراءاتي",
        falc: "« أريد متابعة مواعيدي أو وثائقي المحفوظة أو رسائلي مع الجمعيات »",
        desc: "متابعة المواعيد، خزنة الوثائق الرقمية، الرسائل مع الجمعيات ومراكز المساعدة الرقمية."
      }
    }
  },
  es: {
    portalTitle: "Portal Inter-Asociativo",
    portalSubtitle: "Orléans Metrópoli y Departamento de Loiret",
    navHome: "Inicio",
    navDirectory: "Directorio y Mapa",
    navQuickFlow: "Cita en 4 pasos",
    navUserSpace: "Mi Espacio Usuario",
    navProSpace: "Espacio Asociaciones",
    navAdminSpace: "Observatorio",
    navSignup: "Registrar mi asociación",
    comfortMode: "Modo Confort (+30%)",
    comfortModeActive: "Modo Confort activo",
    listenPage: "Escuchar la página",
    stopListening: "Detener lectura",
    emergencyBtn: "Urgencia Social (115)",
    helpNearMeBtn: "Ayuda presencial cerca de mí",
    forSomeoneElse: "Pido cita para otra persona",
    heroTitle: "¿Qué tipo de ayuda necesita?",
    heroSubtitle: "Encuentre fácilmente la asociación adecuada cerca de su domicilio, prepare sus documentos y pida cita en línea.",
    searchPlaceholder: "¿Qué ayuda necesita? (ej: permiso de residencia, vivienda, salud, ayuda alimentaria...)",
    searchButton: "Buscar",
    quickJourneyCta: "Recorrido guiado en 4 pasos sencillos",
    themesSectionTitle: "Elija su necesidad en 1 clic",
    themesSectionSub: "Haga clic en una tarjeta para ver las asociaciones disponibles y la lista de documentos necesarios.",
    howItWorksTitle: "¿Cómo funciona?",
    step1Title: "1. Elijo mi necesidad",
    step1Desc: "Selecciono el tema que corresponde a mi situación.",
    step2Title: "2. Encuentro una asociación",
    step2Desc: "El portal me muestra la asociación más cercana con parada de Tranvía o Autobús TAO.",
    step3Title: "3. Pido mi cita",
    step3Desc: "Elijo día y hora y recibo un SMS con la dirección y los documentos que debo llevar.",
    nearMeSectionTitle: "Encontrar ayuda cerca de mí",
    nearMeSectionSub: "Acuda gratuitamente a un punto de mediación digital (France Services) en Orléans y Loiret.",
    seeAssociation: "Ver esta asociación",
    slotThisWeek: "Cita esta semana",
    categoryTitles: {
      papiers: {
        title: "Mis Papeles y Residencia",
        falc: "« Necesito ayuda con mi permiso de residencia, nacionalidad o documentos »",
        desc: "Permiso de residencia, nacionalización, reagrupación familiar, asistencia jurídica gratuita y ANEF."
      },
      logement: {
        title: "Mi Vivienda y Energía",
        falc: "« Necesito ayuda para encontrar vivienda o pagar el alquiler y facturas »",
        desc: "Vivienda social, ayudas APL / CAF, prevención de desahucios, bono energético y alojamiento 115."
      },
      sante: {
        title: "Salud y Discapacidad",
        falc: "« Necesito ayuda con mi expediente de discapacidad (MDPH) o atención médica »",
        desc: "Expediente MDPH (AAH, PCH), cobertura médica CPAM / CSS y apoyo psicológico."
      },
      travail: {
        title: "Trabajo y Formación",
        falc: "« Necesito ayuda para buscar empleo, hacer mi CV o aprender francés »",
        desc: "Inscripción en France Travail, redacción de CV, clases de francés (FLE) e inserción laboral."
      },
      famille: {
        title: "Familia y Presupuesto",
        falc: "« Necesito ayuda alimentaria, apoyo escolar o ayuda económica »",
        desc: "Distribución de alimentos, tiendas solidarias, apoyo escolar, guardería y microcrédito."
      },
      droits: {
        title: "Mis Derechos y Trámites",
        falc: "« Quiero ver mis próximas citas, mis documentos o mensajes »",
        desc: "Seguimiento de citas, carpeta segura de documentos, mensajería y puntos de ayuda digital."
      }
    }
  },
  pt: {
    portalTitle: "Portal Interassociativo",
    portalSubtitle: "Orléans Metrópole e Departamento do Loiret",
    navHome: "Início",
    navDirectory: "Diretório e Mapa",
    navQuickFlow: "Marcação em 4 passos",
    navUserSpace: "Espaço Utente",
    navProSpace: "Espaço Associações",
    navAdminSpace: "Observatório",
    navSignup: "Registar a minha associação",
    comfortMode: "Modo Conforto (+30%)",
    comfortModeActive: "Modo Conforto ativo",
    listenPage: "Ouvir a página",
    stopListening: "Parar leitura",
    emergencyBtn: "Urgência Social (115)",
    helpNearMeBtn: "Ajuda presencial perto de mim",
    forSomeoneElse: "Estou a marcar para outra pessoa",
    heroTitle: "De que ajuda precisa?",
    heroSubtitle: "Encontre facilmente a associação certa perto de si, veja os documentos necessários e marque atendimento online.",
    searchPlaceholder: "De que ajuda precisa? (ex: título de residência, habitação, saúde, apoio alimentar...)",
    searchButton: "Pesquisar",
    quickJourneyCta: "Marcação guiada « Zero Dificuldade » em 4 passos",
    themesSectionTitle: "Escolha a sua necessidade em 1 clique",
    themesSectionSub: "Clique num cartão abaixo para ver as associações e a lista exata de documentos a levar.",
    howItWorksTitle: "Como funciona?",
    step1Title: "1. Escolho a minha necessidade",
    step1Desc: "Seleciono o tema correspondente à minha situação.",
    step2Title: "2. Encontro uma associação",
    step2Desc: "O portal indica a estrutura mais próxima com paragem de Elétrico ou Autocarro TAO.",
    step3Title: "3. Marco o meu atendimento",
    step3Desc: "Escolho o dia e a hora e recebo um SMS com a morada e os documentos necessários.",
    nearMeSectionTitle: "Encontrar ajuda perto de mim",
    nearMeSectionSub: "Dirija-se gratuitamente a um ponto de acompanhamento digital em Orléans e no Loiret.",
    seeAssociation: "Ver esta associação",
    slotThisWeek: "Vaga esta semana",
    categoryTitles: {
      papiers: {
        title: "Meus Documentos e Residência",
        falc: "« Preciso de ajuda com o meu título de residência ou documentos »",
        desc: "Título de residência, naturalização, reagrupamento familiar, apoio jurídico gratuito e ANEF."
      },
      logement: {
        title: "Habitação e Energia",
        falc: "« Preciso de ajuda para encontrar casa ou pagar a renda e faturas »",
        desc: "Habitação social, apoio APL / CAF, rendas em atraso, cheque energia e alojamento de emergência 115."
      },
      sante: {
        title: "Saúde e Deficiência",
        falc: "« Preciso de ajuda para o processo de deficiência (MDPH) ou saúde »",
        desc: "Processo MDPH, abertura de direitos CPAM / mútua solidária CSS e apoio psicológico."
      },
      travail: {
        title: "Trabalho e Formação",
        falc: "« Preciso de ajuda para procurar emprego, fazer o CV ou aprender francês »",
        desc: "Inscrição France Travail, elaboração de CV, aulas de francês (FLE) e inserção profissional."
      },
      famille: {
        title: "Família e Orçamento",
        falc: "« Preciso de apoio alimentar, apoio escolar ou ajuda no orçamento »",
        desc: "Cabazes alimentares, mercearias solidárias, apoio escolar, guarda de crianças e microcrédito."
      },
      droits: {
        title: "Meus Direitos e Processos",
        falc: "« Quero acompanhar as minhas marcações, documentos e mensagens »",
        desc: "Próximas marcações, cofre de documentos digitais, mensagens e locais de ajuda digital."
      }
    }
  },
  uk: {
    portalTitle: "Міжасоціативний Портал",
    portalSubtitle: "Орлеан Метрополія та департамент Луаре (45)",
    navHome: "Головна",
    navDirectory: "Каталог і Карта",
    navQuickFlow: "Запис у 4 кроки",
    navUserSpace: "Особистий кабінет",
    navProSpace: "Для асоціацій",
    navAdminSpace: "Обсерваторія",
    navSignup: "Зареєструвати організацію",
    comfortMode: "Комфортний режим (+30%)",
    comfortModeActive: "Комфортний режим увімк.",
    listenPage: "Прослухати сторінку",
    stopListening: "Зупинити озвучення",
    emergencyBtn: "Екстрена допомога (115)",
    helpNearMeBtn: "Допомога поруч зі мною",
    forSomeoneElse: "Я записую іншу людину",
    heroTitle: "Яка допомога вам потрібна?",
    heroSubtitle: "Знайдіть потрібну асоціацію поруч із вами, перевірте перелік документів та запишіться на прийом онлайн.",
    searchPlaceholder: "Яка допомога вам потрібна? (посвідка на проживання, житло, здоров'я, продукти...)",
    searchButton: "Знайти",
    quickJourneyCta: "Простий покроковий запис у 4 кроки",
    themesSectionTitle: "Оберіть вашу потребу в 1 клік",
    themesSectionSub: "Натисніть на картку нижче, щоб побачити профільні асоціації та перелік необхідних документів.",
    howItWorksTitle: "Як це працює?",
    step1Title: "1. Обираю потребу",
    step1Desc: "Обираю категорію, яка відповідає моїй ситуації.",
    step2Title: "2. Знаходжу асоціацію",
    step2Desc: "Портал показує найближчу організацію та зупинку трамвая чи автобуса TAO.",
    step3Title: "3. Записуюсь на прийом",
    step3Desc: "Обираю день і час та отримую SMS з адресою і списком документів.",
    nearMeSectionTitle: "Знайти допомогу поруч зі мною",
    nearMeSectionSub: "Зверніться безкоштовно до пункту цифрової підтримки (France Services) в Орлеані та Луаре.",
    seeAssociation: "Переглянути асоціацію",
    slotThisWeek: "Є місце цього тижня",
    categoryTitles: {
      papiers: {
        title: "Документи та Проживання",
        falc: "« Мені потрібна допомога з посвідкою на проживання або документами »",
        desc: "Посвідка на проживання / тимчасовий захист, возз'єднання сім'ї, безкоштовна правова допомога та ANEF."
      },
      logement: {
        title: "Житло та Енергія",
        falc: "« Мені потрібна допомога з пошуком житла або оплатою рахунків »",
        desc: "Соціальне житло, допомога APL / CAF, енергетичний чек та екстрене розміщення 115."
      },
      sante: {
        title: "Здоров'я та Інвалідність",
        falc: "« Мені потрібна допомога з оформленням інвалідності (MDPH) або лікуванням »",
        desc: "Досьє MDPH, медичне страхування CPAM / CSS та психологічна підтримка."
      },
      travail: {
        title: "Робота та Навчання",
        falc: "« Мені потрібна допомога з пошуком роботи, резюме або вивченням французької »",
        desc: "Реєстрація у France Travail, складання резюме, курси французької мови (FLE) та визнання дипломів."
      },
      famille: {
        title: "Сім'я та Бюджет",
        falc: "« Мені потрібна продуктова допомога, підтримка для дітей або бюджету »",
        desc: "Продуктові набори, соціальні магазини, шкільна допомога та догляд за дітьми."
      },
      droits: {
        title: "Мої Права та Процедури",
        falc: "« Я хочу переглянути свої записи на прийом, документи або повідомлення »",
        desc: "Відстеження записів, захищене сховище документів, повідомлення та центри цифрової допомоги."
      }
    }
  }
};
