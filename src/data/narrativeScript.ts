import {
  ActId,
  CreatureId,
  DialogueCondition,
  DialogueTree,
  EndingId,
  InventoryItem,
  InventoryItemId,
  JournalNote,
  PacifyEncounterConfig,
  QuestObjective,
  SaveDataV2,
} from '../types/game';

export const ITEMS: Record<InventoryItemId, InventoryItem> = {
  cloche_felee: {
    id: 'cloche_felee',
    name: 'Cloche fêlée',
    shortName: 'Cloche',
    description:
      'La cloche en laiton de Maren. Sa fêlure lui donne une résonance douce qui révèle les échos et apaise la faune.',
    category: 'tool',
    usableInWorld: true,
    usableInPacify: true,
  },
  baies_eglantier: {
    id: 'baies_eglantier',
    name: "Baies d'églantier",
    shortName: 'Baies',
    description:
      "Baies sauvages cueillies sous le givre. Restaure +25 Calme et +35 Endurance, ou réchauffe un voyageur transi.",
    category: 'consumable',
    usableInWorld: true,
    usableInPacify: true,
  },
  tisane_pin: {
    id: 'tisane_pin',
    name: 'Tisane de pin',
    shortName: 'Tisane',
    description:
      "Thermos d'aiguilles de mélèze encore fumant. Restaure +35 Calme instantanément.",
    category: 'consumable',
    usableInWorld: true,
    usableInPacify: true,
  },
  corde_alpiniste: {
    id: 'corde_alpiniste',
    name: "Corde d'alpiniste",
    shortName: 'Corde',
    description:
      'Confiée par Soren. Ses nœuds réguliers stabilisent le rythme lors des rencontres d’altitude.',
    category: 'tool',
    usableInWorld: false,
    usableInPacify: true,
  },
  cristal_echo: {
    id: 'cristal_echo',
    name: "Cristal d'écho",
    shortName: 'Cristal',
    description:
      "Un quartz vibrant recueilli sur la Crête du Vent. Amplifie fortement les harmoniques d'apaisement.",
    category: 'relic',
    usableInWorld: false,
    usableInPacify: true,
  },
  page_carnet_liee: {
    id: 'page_carnet_liee',
    name: 'Accord du Monolithe',
    shortName: 'Accord',
    description:
      'Schéma acoustique tracé par Léo. Permet d’accorder le Monolithe Résonant avec précision.',
    category: 'relic',
    usableInWorld: false,
    usableInPacify: true,
  },
};

export const JOURNAL_NOTES: JournalNote[] = [
  {
    id: 'note_1',
    act: 1,
    title: 'Note I — Le chant désaccordé',
    altitudeLabel: 'Acte I • 1 280 m',
    excerpt: 'Le Monolithe s’est figé dans le givre...',
    fullText:
      '« Maren m’avait prévenu : lorsque la glace serre le Monolithe du Col, toute la montagne vibre faux. Je pars avec mon carnet pour tenter de le réaccorder avant la nuit. » — Léo',
  },
  {
    id: 'note_2',
    act: 2,
    title: 'Note II — Les pierres qui guident',
    altitudeLabel: 'Acte II • 1 740 m',
    excerpt: 'Trois cairns renversés dans la brume...',
    fullText:
      '« La tempête acoustique a couché les vieux cairns de la forêt. Chaque tas de pierres relevé brise le brouillard et ouvre un passage oublié entre les sapins. » — Léo',
  },
  {
    id: 'note_3',
    act: 2,
    title: 'Note III — Ne pas forcer le pas',
    altitudeLabel: 'Acte II • 1 740 m',
    excerpt: 'Les bêtes ne sont pas hostiles, elles ont peur...',
    fullText:
      '« Le lynx et le cerf n’attaquent pas par méchanceté : le grondement du col affole leurs oreilles. Une cloche douce ou une respiration calme suffit à apaiser leur cœur. » — Léo',
  },
  {
    id: 'note_4',
    act: 3,
    title: 'Note IV — Lire les rafales',
    altitudeLabel: 'Acte III • 2 210 m',
    excerpt: 'Sur la crête, le vent prévient avant de frapper...',
    fullText:
      '« L’air siffle une seconde avant chaque bourrasque. Les gros blocs de granit coupent le souffle du vide, et un pas rapide permet de franchir les passerelles exposées. » — Léo',
  },
  {
    id: 'note_5',
    act: 3,
    title: 'Note V — Les trois accords',
    altitudeLabel: 'Acte III • 2 210 m',
    excerpt: 'Résonance, Souffle et Esquive...',
    fullText:
      '« Le Monolithe répond à trois gestes : la cadence de la cloche, l’ampleur du souffle calme, et la souplesse face aux cristaux de vent. Soren a dû entendre l’écho d’en bas. » — Léo',
  },
  {
    id: 'note_6',
    act: 4,
    title: 'Note VI — Au seuil du Col',
    altitudeLabel: 'Acte IV • 2 680 m',
    excerpt: 'Si quelqu’un lit ces lignes, je suis près du sanctuaire...',
    fullText:
      '« Mes doigts sont trop engourdis pour tenir la cadence seul. Si quelqu’un monte avec la cloche de Maren, qu’il unisse ses pas aux animaux de la montagne. » — Léo',
  },
];

export const PACIFY_ENCOUNTERS: Record<CreatureId, PacifyEncounterConfig> = {
  lynx_boreal: {
    creatureId: 'lynx_boreal',
    name: 'Lynx Boréal',
    subtitle: 'Ses oreilles frémissent sous l’écho glacé',
    portrait: 'lynx',
    targetCalm: 10,
    accentColor: '#F59E0B',
    availableModes: ['resonance', 'souffle', 'esquive'],
    defaultMode: 'resonance',
    introLine: 'Le lynx plaque ses oreilles et gronde face au bruit du col.',
    successNodeId: 'lynx_pacified',
  },
  cerf_brumes: {
    creatureId: 'cerf_brumes',
    name: 'Cerf des Brumes',
    subtitle: 'Ses bois vibrent dans le brouillard épais',
    portrait: 'cerf',
    targetCalm: 10,
    accentColor: '#38BDF8',
    availableModes: ['souffle', 'resonance', 'esquive'],
    defaultMode: 'souffle',
    introLine: 'Le cerf hésite entre la fuite et la charge dans la brume.',
    successNodeId: 'cerf_pacified',
  },
  gypaete_cimes: {
    creatureId: 'gypaete_cimes',
    name: 'Gypaète des Cimes',
    subtitle: 'Porté par les rafales de 2 200 mètres',
    portrait: 'gypaete',
    targetCalm: 11,
    accentColor: '#C084FC',
    availableModes: ['esquive', 'resonance', 'souffle'],
    defaultMode: 'esquive',
    introLine: 'Le grand rapace tournoie dans les courants d’altitude.',
    successNodeId: 'gypaete_pacified',
  },
  monolithe_resonant: {
    creatureId: 'monolithe_resonant',
    name: 'Monolithe Résonant',
    subtitle: 'Le cœur de pierre du Col Silencieux',
    portrait: 'monolith',
    targetCalm: 12,
    accentColor: '#FDE68A',
    availableModes: ['resonance', 'souffle', 'esquive'],
    defaultMode: 'resonance',
    introLine:
      'Le cristal du col pulse de manière irrégulière. Accordez votre cloche et votre souffle !',
    successNodeId: 'monolith_awakened',
  },
};

export function evaluateDialogueCondition(
  cond: DialogueCondition | undefined,
  save: SaveDataV2
): boolean {
  if (!cond) return true;
  if (cond.flag && !save.storyFlags[cond.flag]) return false;
  if (cond.notFlag && save.storyFlags[cond.notFlag]) return false;
  if (
    cond.hasItem &&
    !save.inventory.some((e) => e.id === cond.hasItem && e.quantity > 0)
  ) {
    return false;
  }
  if (cond.minNotes !== undefined && save.collectedNotes.length < cond.minNotes) {
    return false;
  }
  if (
    cond.minCairns !== undefined &&
    save.rebuiltCairns.length < cond.minCairns
  ) {
    return false;
  }
  if (
    cond.pacifiedCreature &&
    !save.pacifiedCreatures.includes(cond.pacifiedCreature)
  ) {
    return false;
  }
  return true;
}

export function getCurrentObjective(save: SaveDataV2): QuestObjective {
  if (!save.storyFlags.met_maren) {
    return {
      id: 'obj_maren',
      act: 1,
      title: 'Parler à Maren au Refuge du Bas',
      detail: 'Écoutez la gardienne blessée devant le chalet (Acte I).',
    };
  }
  if (save.actId === 1) {
    return {
      id: 'obj_climb_1',
      act: 1,
      title: 'Gravir la Paroi de la Lisière',
      detail: 'Rejoignez la paroi au nord avec la Cloche fêlée.',
    };
  }
  if (save.actId === 2) {
    return {
      id: 'obj_cairns',
      act: 2,
      title: `Rebâtir les cairns (${save.rebuiltCairns.length}/3) & gravir`,
      detail:
        'Dégagez la brume en relevant les cairns et apaisez la faune des bois.',
    };
  }
  if (save.actId === 3) {
    return {
      id: 'obj_ridge',
      act: 3,
      title: 'Traverser la Crête du Vent',
      detail:
        'Abritez-vous des rafales derrière les rochers et retrouvez Soren.',
    };
  }
  if (!save.storyFlags.met_leo) {
    return {
      id: 'obj_leo',
      act: 4,
      title: 'Retrouver Léo au Col Silencieux',
      detail: 'Cherchez l’apprenti près de l’abri en pierre (Acte IV).',
    };
  }
  return {
    id: 'obj_monolith',
    act: 4,
    title: 'Réaccorder le Monolithe Résonant',
    detail: 'Faites vibrer la cloche au sanctuaire nord pour apaiser le col.',
  };
}

export function computeEndingId(save: SaveDataV2): EndingId {
  const trailCreatures: CreatureId[] = [
    'lynx_boreal',
    'cerf_brumes',
    'gypaete_cimes',
  ];
  const allTrailPacified = trailCreatures.every((c) =>
    save.pacifiedCreatures.includes(c)
  );

  if (allTrailPacified && save.collectedNotes.length >= 4) {
    return 'harmony';
  }

  const pacifiedTrailCount = trailCreatures.filter((c) =>
    save.pacifiedCreatures.includes(c)
  ).length;
  if (pacifiedTrailCount >= 1 || save.collectedNotes.length >= 2) {
    return 'echo';
  }

  return 'silence';
}

export const DIALOGUE_TREE: DialogueTree = {
  // === ACTE I : MAREN & PIERRES ===
  maren_intro: {
    id: 'maren_intro',
    speaker: 'Maren',
    portrait: 'maren',
    voice: 'maren',
    text: 'Doucement, marcheur... Ma cheville a lâché juste avant la tombée du soir. Là-haut, le Monolithe Résonant s’est pris dans le givre et hurle faux.',
    nextNodeId: 'maren_bell_gift',
  },
  maren_bell_gift: {
    id: 'maren_bell_gift',
    speaker: 'Maren',
    portrait: 'maren',
    voice: 'maren',
    text: 'Mon apprenti Léo est monté seul vers le Col Silencieux pour le réaccorder. Prends ma Cloche fêlée : fais-la tinter pour repérer les pages de son carnet et apaiser les bêtes.',
    grantItem: 'cloche_felee',
    setFlag: 'met_maren',
    choices: [
      {
        label: 'Je retrouverai Léo au sommet',
        nextNodeId: 'maren_advice',
      },
      {
        label: 'Que faut-il surveiller en chemin ?',
        nextNodeId: 'maren_tips',
      },
    ],
  },
  maren_advice: {
    id: 'maren_advice',
    speaker: 'Maren',
    portrait: 'maren',
    voice: 'maren',
    text: 'Merci... La paroi nord mène à la Forêt des Cairns. Cueille quelques baies d’églantier avant de grimper, et repose-toi aux feux de camp.',
  },
  maren_tips: {
    id: 'maren_tips',
    speaker: 'Maren',
    portrait: 'maren',
    voice: 'maren',
    text: 'Dans la forêt, rebâtis les cairns tombés pour dissiper la brume. Plus haut, sur la crête, abrite-toi derrière les rochers quand le vent annonce une rafale !',
  },
  maren_after: {
    id: 'maren_after',
    speaker: 'Maren',
    portrait: 'maren',
    voice: 'maren',
    text: 'La paroi au nord est dégagée. Fais sonner la Cloche fêlée dès que tu cherches un indice.',
    choices: [
      {
        label: 'Partager des nouvelles du carnet',
        condition: { minNotes: 1 },
        nextNodeId: 'maren_notes_react',
      },
      {
        label: 'À bientôt, Maren',
      },
    ],
  },
  maren_notes_react: {
    id: 'maren_notes_react',
    speaker: 'Maren',
    portrait: 'maren',
    voice: 'maren',
    text: 'Tu as déjà retrouvé des pages de Léo ! Son écriture tremble un peu, mais son cœur est solide. Continue vers le col !',
  },

  lore_bergers: {
    id: 'lore_bergers',
    speaker: 'Stèle des Bergers',
    portrait: 'narrator',
    voice: 'narrator',
    text: '« Ici passe l’ancien sentier d’estive. Celui qui écoute le vent avant de courir garde ses forces pour les cimes. »',
  },
  lore_borne_act1: {
    id: 'lore_borne_act1',
    speaker: 'Borne du Sentier',
    portrait: 'narrator',
    voice: 'narrator',
    text: '« Refuge du Bas : 1 280 m — Col Silencieux : 2 680 m. Astuce : utilisez le Pas Rapide (Esquive) pour franchir les passages venteux. »',
  },

  // === ACTE II : LYNX BORÉAL & CERF DES BRUMES ===
  lynx_intro: {
    id: 'lynx_intro',
    speaker: 'Lynx Boréal',
    portrait: 'lynx',
    voice: 'lynx',
    text: '*Grrr-mrr...* Le grand félin bat de la queue nerveusement. Chaque note stridente venue du sommet fait trembler ses moustaches.',
    choices: [
      {
        label: 'Apaiser le Lynx (Rencontre)',
        startPacify: 'lynx_boreal',
      },
      {
        label: 'Citer les notes de Léo',
        condition: { minNotes: 2 },
        nextNodeId: 'lynx_note_calm',
      },
      {
        label: 'Se glisser hors de sa vue',
        nextNodeId: 'lynx_bypass',
      },
    ],
  },
  lynx_note_calm: {
    id: 'lynx_note_calm',
    speaker: 'Lynx Boréal',
    portrait: 'lynx',
    voice: 'lynx',
    text: 'Vous fredonnez doucement l’accord décrit dans le carnet de Léo. Le Lynx cligne lentement des yeux... puis s’efface dans la neige avec respect.',
    grantPacify: 'lynx_boreal',
    setFlag: 'resolved_lynx_boreal',
  },
  lynx_pacified: {
    id: 'lynx_pacified',
    speaker: 'Lynx Boréal',
    portrait: 'lynx',
    voice: 'lynx',
    text: '*Prrr...* La respiration du félin s’accorde au battement de votre cloche. Il libère le sentier et s’installe sur le côté pour veiller.',
    grantPacify: 'lynx_boreal',
    setFlag: 'resolved_lynx_boreal',
  },
  lynx_bypass: {
    id: 'lynx_bypass',
    speaker: 'Narrateur',
    portrait: 'narrator',
    voice: 'narrator',
    text: 'Vous profitez d’un instant où le lynx scrute la cime des sapins pour vous faufiler au-delà de son rocher.',
    setFlag: 'resolved_lynx_boreal',
  },
  lynx_after: {
    id: 'lynx_after',
    speaker: 'Lynx Boréal',
    portrait: 'lynx',
    voice: 'lynx',
    text: 'Le grand félin observe votre montée d’un regard paisible.',
  },

  cerf_intro: {
    id: 'cerf_intro',
    speaker: 'Cerf des Brumes',
    portrait: 'cerf',
    voice: 'cerf',
    text: 'Ses bois semblent accrocher des lambeaux de brouillard. Il bloque l’escalier menant vers la crête, effrayé par les échos.',
    choices: [
      {
        label: 'Apaiser le Cerf (Rencontre)',
        startPacify: 'cerf_brumes',
      },
      {
        label: 'Montrer que les cairns sont debout',
        condition: { minCairns: 2 },
        nextNodeId: 'cerf_cairns_calm',
      },
      {
        label: 'Contourner dans le brouillard',
        nextNodeId: 'cerf_bypass',
      },
    ],
  },
  cerf_cairns_calm: {
    id: 'cerf_cairns_calm',
    speaker: 'Cerf des Brumes',
    portrait: 'cerf',
    voice: 'cerf',
    text: 'En sentant le brouillard dissipé par vos cairns, le Cerf abaisse majestueusement ses bois et vous salue avant de libérer le passage.',
    grantPacify: 'cerf_brumes',
    setFlag: 'resolved_cerf_brumes',
  },
  cerf_pacified: {
    id: 'cerf_pacified',
    speaker: 'Cerf des Brumes',
    portrait: 'cerf',
    voice: 'cerf',
    text: 'Un souffle calme enveloppe la clairière. Le Cerf des Brumes s’incline doucement et s’écarte du passage vers la crête.',
    grantPacify: 'cerf_brumes',
    setFlag: 'resolved_cerf_brumes',
  },
  cerf_bypass: {
    id: 'cerf_bypass',
    speaker: 'Narrateur',
    portrait: 'narrator',
    voice: 'narrator',
    text: 'Sans bruit, vous longez la paroi rocheuse pour laisser le cerf seul dans sa brume.',
    setFlag: 'resolved_cerf_brumes',
  },
  cerf_after: {
    id: 'cerf_after',
    speaker: 'Cerf des Brumes',
    portrait: 'cerf',
    voice: 'cerf',
    text: 'Le Cerf veille calmement au pied de l’escalier de pierre.',
  },

  // === ACTE III : SOREN & GYPAÈTE ===
  soren_intro: {
    id: 'soren_intro',
    speaker: 'Soren',
    portrait: 'soren',
    voice: 'soren',
    text: '*Brrr...* Salut, l’alpiniste ! Je suis Soren. Je suivais le vol du Gypaète quand ces rafales ont bloqué la passerelle. Mes doigts sont gelés...',
    setFlag: 'met_soren',
    choices: [
      {
        label: "Offrir des Baies d'églantier",
        condition: { hasItem: 'baies_eglantier' },
        consumeItem: 'baies_eglantier',
        grantItem: 'corde_alpiniste',
        setFlag: 'helped_soren',
        nextNodeId: 'soren_gifted',
      },
      {
        label: 'Demander des infos sur Léo',
        nextNodeId: 'soren_leo_info',
      },
      {
        label: 'Courage, je trace la voie',
      },
    ],
  },
  soren_gifted: {
    id: 'soren_gifted',
    speaker: 'Soren',
    portrait: 'soren',
    voice: 'soren',
    text: 'Des baies d’églantier ? C’est un festin royal à 2 200 mètres ! Tiens, prends ma Corde d’alpiniste : ses nœuds t’aideront à garder le rythme face aux créatures et au Monolithe.',
  },
  soren_leo_info: {
    id: 'soren_leo_info',
    speaker: 'Soren',
    portrait: 'soren',
    voice: 'soren',
    text: 'Léo est passé ici hier soir, carnet en main. Il m’a crié de rester à l’abri des rochers pendant les bourrasques et d’utiliser le Pas Rapide entre deux abris !',
  },
  soren_after: {
    id: 'soren_after',
    speaker: 'Soren',
    portrait: 'soren',
    voice: 'soren',
    text: 'Observe bien les stries blanches dans l’air avant chaque rafale. Le Gypaète attend juste au nord du pont.',
    choices: [
      {
        label: "Offrir des Baies d'églantier",
        condition: { hasItem: 'baies_eglantier', notFlag: 'helped_soren' },
        consumeItem: 'baies_eglantier',
        grantItem: 'corde_alpiniste',
        setFlag: 'helped_soren',
        nextNodeId: 'soren_gifted',
      },
      {
        label: 'Bonne garde, Soren',
      },
    ],
  },

  gypaete_intro: {
    id: 'gypaete_intro',
    speaker: 'Gypaète des Cimes',
    portrait: 'gypaete',
    voice: 'gypaete',
    text: 'Ses immenses ailes fendent le vent au-dessus de la corde menant au sanctuaire. Le vent semble répondre à chacun de ses battements.',
    choices: [
      {
        label: 'Apaiser le Gypaète (Rencontre)',
        startPacify: 'gypaete_cimes',
      },
      {
        label: 'Fendre la brise (Esquive)',
        nextNodeId: 'gypaete_bypass',
      },
    ],
  },
  gypaete_pacified: {
    id: 'gypaete_pacified',
    speaker: 'Gypaète des Cimes',
    portrait: 'gypaete',
    voice: 'gypaete',
    text: 'Le rapace pousse un cri clair et posé, replie ses ailes sur le promontoire voisin et laisse la corde d’ascension libre.',
    grantPacify: 'gypaete_cimes',
    setFlag: 'resolved_gypaete_cimes',
  },
  gypaete_bypass: {
    id: 'gypaete_bypass',
    speaker: 'Narrateur',
    portrait: 'narrator',
    voice: 'narrator',
    text: 'Dans un éclair d’agilité, vous passez sous son ombre et attrapez le piton menant au Col Silencieux.',
    setFlag: 'resolved_gypaete_cimes',
  },
  gypaete_after: {
    id: 'gypaete_after',
    speaker: 'Gypaète des Cimes',
    portrait: 'gypaete',
    voice: 'gypaete',
    text: 'Le grand rapace plane paisiblement près des cimes.',
  },

  // === ACTE IV : LÉO & MONOLITHE RÉSONANT ===
  leo_intro: {
    id: 'leo_intro',
    speaker: 'Léo',
    portrait: 'leo',
    voice: 'leo',
    text: 'Maren t’a envoyé ?! Tu tiens sa Cloche fêlée ! Je n’arrivais plus à calmer le Monolithe seul... Le givre étouffe ses harmoniques.',
    setFlag: 'met_leo',
    choices: [
      {
        label: 'Je rapporte tes pages du carnet',
        condition: { minNotes: 3 },
        grantItem: 'page_carnet_liee',
        nextNodeId: 'leo_give_accord',
      },
      {
        label: 'Nous allons le réaccorder ensemble',
        grantItem: 'page_carnet_liee',
        nextNodeId: 'leo_ready',
      },
    ],
  },
  leo_give_accord: {
    id: 'leo_give_accord',
    speaker: 'Léo',
    portrait: 'leo',
    voice: 'leo',
    text: 'Tu as retrouvé mon carnet ! Prends ce dernier feuillet : l’Accord du Monolithe. Approche-toi du sanctuaire au nord et fais vibrer ta cloche.',
  },
  leo_ready: {
    id: 'leo_ready',
    speaker: 'Léo',
    portrait: 'leo',
    voice: 'leo',
    text: 'Prends ce feuillet d’accord que j’ai noté. Le Monolithe t’attend juste au nord. Courage !',
  },
  leo_after: {
    id: 'leo_after',
    speaker: 'Léo',
    portrait: 'leo',
    voice: 'leo',
    text: 'Le Monolithe Résonant brille au centre de la terrasse glacée. Dès que tu es prêt, accorde-le !',
  },

  monolith_intro: {
    id: 'monolith_intro',
    speaker: 'Monolithe Résonant',
    portrait: 'monolith',
    voice: 'monolith',
    text: 'À 2 680 mètres, le pilier de quartz vibre d’un bourdonnement sourd. Des cristaux de givre enserrent sa base.',
    choices: [
      {
        label: 'Réaccorder le Monolithe (Rencontre)',
        startPacify: 'monolithe_resonant',
      },
      {
        label: 'Contempler l’horizon',
      },
    ],
  },
  monolith_awakened: {
    id: 'monolith_awakened',
    speaker: 'Monolithe Résonant',
    portrait: 'monolith',
    voice: 'monolith',
    text: 'La glace cède en un accord pur et chaleureux. La note se propage de crête en vallée comme une promesse d’aube.',
    grantPacify: 'monolithe_resonant',
    setFlag: 'monolith_awakened',
    triggerEnding: true,
  },
};

export function buildCampfireReflection(
  actId: ActId,
  save: SaveDataV2
): { speaker: string; text: string } {
  if (actId === 1) {
    return {
      speaker: 'Feu du Refuge',
      text: save.storyFlags.met_maren
        ? 'Les braises réchauffent la cloche de la vieille gardienne. Calme et endurance restaurés. (Partie sauvegardée.)'
        : 'Le bois crépite doucement devant la cabane. N’oubliez pas de parler à Maren avant de monter. (Partie sauvegardée.)',
    };
  }
  if (actId === 2) {
    return {
      speaker: 'Bivouac des Sapins',
      text: `Au milieu des pins, le feu tient la brume à distance. Cairns rebâtis : ${save.rebuiltCairns.length}/3. Calme et endurance restaurés. (Partie sauvegardée.)`,
    };
  }
  if (actId === 3) {
    return {
      speaker: 'Abri du Vent',
      text: save.storyFlags.helped_soren
        ? 'Soren sourit non loin du brasero. L’air des cimes paraît plus doux ce soir. Calme et endurance restaurés. (Partie sauvegardée.)'
        : 'Le feu danse à l’abri du rocher malgré les bourrasques d’altitude. Calme et endurance restaurés. (Partie sauvegardée.)',
    };
  }
  return {
    speaker: 'Foyer du Col',
    text: `À 2 680 mètres, vous avez déjà recueilli ${save.collectedNotes.length}/6 notes de Léo. Calme et endurance restaurés. (Partie sauvegardée.)`,
  };
}
