import {
  DialogueTree,
  InventoryItem,
  ItemId,
  NpcId,
  SaveData,
  ZoneId,
} from '../types/game';

export const ITEMS: Record<ItemId, InventoryItem> = {
  compass: {
    id: 'compass',
    name: 'Boussole Égarée',
    shortName: 'Boussole',
    description:
      'Une vieille boussole en laiton. Son aiguille hésite entre le Nord et la fondue.',
    icon: 'compass',
  },
  thermos: {
    id: 'thermos',
    name: 'Thermos de Tisane Alpine',
    shortName: 'Tisane',
    description:
      'Encore tiède ! Sent le génépi, le thym sauvage et les bonnes décisions.',
    icon: 'thermos',
  },
  flute: {
    id: 'flute',
    name: 'Flûte en Bois Sculpté',
    shortName: 'Flûte',
    description:
      'Taillée dans du mélèze. Elle ne joue que des notes un peu mélancoliques.',
    icon: 'flute',
  },
};

export const DIALOGUE_TREE: DialogueTree = {
  // === PANNEAUX ===
  sign_forest_1: {
    id: 'sign_forest_1',
    speaker: 'Panneau en Mélèze',
    portrait: 'narrator',
    voice: 'narrator',
    text: '« Col des Brumes : 1 220 m de dénivelé. Pensez à vos moufles, à votre lanterne... et à écouter les bouquetins philosophes. »',
  },
  sign_summit_1: {
    id: 'sign_summit_1',
    speaker: 'Panneau du Refuge',
    portrait: 'narrator',
    voice: 'narrator',
    text: '« Refuge du Col — 2 640 m. Silence respecté, étoiles garanties. La vieille Lanterne veille juste au nord. »',
  },

  // === BARNABÉ (Ibex existentiel) ===
  barnabe_intro: {
    id: 'barnabe_intro',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: '*Bêêê...* Pardon, petit marcheur. Si un bouquetin médite au milieu du sentier enneigé... est-il vraiment un obstacle, ou juste une question à cornes ?',
    choices: [
      {
        label: 'Écouter son dilemme',
        nextNodeId: 'barnabe_listen',
      },
      {
        label: 'Offrir la Boussole Égarée',
        requiredItem: 'compass',
        consumeItem: true,
        nextNodeId: 'barnabe_gift_compass',
      },
      {
        label: 'Apaiser par la présence',
        startPacify: 'barnabe',
      },
      {
        label: 'Contourner prudemment',
        nextNodeId: 'barnabe_bypass',
      },
    ],
  },
  barnabe_listen: {
    id: 'barnabe_listen',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: "Depuis ce matin, j'ai perdu le sens du Nord... et un peu le sens de la vie. Mes sabots gèlent pendant que mon esprit divague dans la poudreuse.",
    choices: [
      {
        label: 'Apaiser ses doutes (Flamme)',
        startPacify: 'barnabe',
      },
      {
        label: 'Offrir la Boussole Égarée',
        requiredItem: 'compass',
        consumeItem: true,
        nextNodeId: 'barnabe_gift_compass',
      },
      {
        label: 'Continuer sans insister',
        nextNodeId: 'barnabe_bypass',
      },
    ],
  },
  barnabe_gift_compass: {
    id: 'barnabe_gift_compass',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: 'Oh ! Une vraie boussole en laiton ! Regarde comme l’aiguille frétille... Vers le haut, ou peut-être vers une raclette céleste. Tu as sauvé ma soirée !',
    grantBefriend: 'barnabe',
    nextNodeId: 'barnabe_joined',
  },
  barnabe_pacify_win: {
    id: 'barnabe_pacify_win',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: "Ton calme a dissipé le blizzard dans ma tête. Finalement, le sens du sentier... c'est simplement d'avancer avec de bons amis.",
    grantBefriend: 'barnabe',
    nextNodeId: 'barnabe_joined',
  },
  barnabe_joined: {
    id: 'barnabe_joined',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: 'Je te laisse la voie libre, compagnon. Qui sait ? On se retrouvera peut-être tout en haut, si mes genoux acceptent le dénivelé.',
  },
  barnabe_bypass: {
    id: 'barnabe_bypass',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: 'Tu es pressé ? Je comprends... Les humains ont toujours un col à gravir. Passe donc, je continue d’interroger ce caillou.',
    setFlag: 'bypassed_barnabe',
  },
  barnabe_after_befriend: {
    id: 'barnabe_after_befriend',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: 'Bonne ascension, petit marcheur ! Garde ta lanterne bien au chaud près du cœur.',
  },
  barnabe_after_bypass: {
    id: 'barnabe_after_bypass',
    speaker: 'Barnabé',
    portrait: 'ibex',
    voice: 'ibex',
    text: 'Ce caillou reste étrangement silencieux. Fais attention sur le Pont de Brume plus haut.',
  },

  // === CABINE N°4 (Télécabine anxieuse) ===
  cabine4_intro: {
    id: 'cabine4_intro',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: '*Ksshh-clong...* N-n’approche pas du vide ! Je suis à la retraite depuis 1998, je n’ai plus les câbles pour ce genre de précipice !',
    choices: [
      {
        label: 'Rassurer la télécabine',
        nextNodeId: 'cabine4_listen',
      },
      {
        label: 'Offrir le Thermos de Tisane',
        requiredItem: 'thermos',
        consumeItem: true,
        nextNodeId: 'cabine4_gift_thermos',
      },
      {
        label: 'Apaiser son vertige',
        startPacify: 'cabine4',
      },
      {
        label: 'Passer discrètement',
        nextNodeId: 'cabine4_bypass',
      },
    ],
  },
  cabine4_listen: {
    id: 'cabine4_listen',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: "Avant, je glissais fièrement au-dessus des sapins. Aujourd’hui, le moindre courant d'air me fait claquer des boulons... Le pont grince tellement !",
    choices: [
      {
        label: 'Stabiliser son cœur (Flamme)',
        startPacify: 'cabine4',
      },
      {
        label: 'Offrir le Thermos de Tisane',
        requiredItem: 'thermos',
        consumeItem: true,
        nextNodeId: 'cabine4_gift_thermos',
      },
      {
        label: 'La laisser souffler',
        nextNodeId: 'cabine4_bypass',
      },
    ],
  },
  cabine4_gift_thermos: {
    id: 'cabine4_gift_thermos',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: '*Glou-clink !* Du génépi bien chaud ?! Ma vieille tôle en frémit de bonheur ! Je ne tremble plus du tout. Traverse le pont en paix, petit voyageur.',
    grantBefriend: 'cabine4',
    nextNodeId: 'cabine4_joined',
  },
  cabine4_pacify_win: {
    id: 'cabine4_pacify_win',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: '*Bip doux...* Comme c’est étrange. Quand je regarde ta petite flamme plutôt que l’abîme, la montagne paraît presque tendre. Merci !',
    grantBefriend: 'cabine4',
    nextNodeId: 'cabine4_joined',
  },
  cabine4_joined: {
    id: 'cabine4_joined',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: 'Je me gare sur le côté pour te laisser passer. Si jamais un câble imaginaire monte jusqu’au refuge, je tenterai le voyage !',
  },
  cabine4_bypass: {
    id: 'cabine4_bypass',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: '*Clong...* File donc sur les planches si tu l’oses. Moi, je vais compter mes rivets en fermant les volets.',
    setFlag: 'bypassed_cabine4',
  },
  cabine4_after_befriend: {
    id: 'cabine4_after_befriend',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: 'Mes boulons n’ont jamais été aussi sereins. Bon courage pour la fin de la montée !',
  },
  cabine4_after_bypass: {
    id: 'cabine4_after_bypass',
    speaker: 'Cabine N°4',
    portrait: 'cablecar',
    voice: 'cablecar',
    text: 'Le vent souffle toujours fort dans le ravin... Fais bien attention où tu poses tes bottes.',
  },

  // === L'ÉCHO DU BROUILLARD (Esprit timide) ===
  spirit_intro: {
    id: 'spirit_intro',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: '...oh. Des pas dans la poudreuse. Chut... Tu viens aussi chercher les petites choses que les randonneurs oublient dans le brouillard ?',
    choices: [
      {
        label: 'Écouter son murmure',
        nextNodeId: 'spirit_listen',
      },
      {
        label: 'Offrir la Flûte en Bois',
        requiredItem: 'flute',
        consumeItem: true,
        nextNodeId: 'spirit_gift_flute',
      },
      {
        label: 'Apaiser en musique',
        startPacify: 'echo_brouillard',
      },
      {
        label: 'Saluer et continuer',
        nextNodeId: 'spirit_bypass',
      },
    ],
  },
  spirit_listen: {
    id: 'spirit_listen',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: 'Je garde les écharpes égarées, les rires étouffés et les mélodies inachevées. Mais la nuit est si silencieuse ici que j’en oublie ma propre voix...',
    choices: [
      {
        label: 'Recueillir ses notes (Flamme)',
        startPacify: 'echo_brouillard',
      },
      {
        label: 'Offrir la Flûte en Bois',
        requiredItem: 'flute',
        consumeItem: true,
        nextNodeId: 'spirit_gift_flute',
      },
      {
        label: 'Monter vers le col',
        nextNodeId: 'spirit_bypass',
      },
    ],
  },
  spirit_gift_flute: {
    id: 'spirit_gift_flute',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: 'Une flûte de mélèze... *Fiiiuu...* Entends-tu comme la brume répond à son chant ? Je n’ai plus peur du silence. Monte vers le refuge, ami.',
    grantBefriend: 'echo_brouillard',
    nextNodeId: 'spirit_joined',
  },
  spirit_pacify_win: {
    id: 'spirit_pacify_win',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: 'Tu as attrapé chaque note dispersée dans le vent... Merci. La brume s’écarte volontiers devant quelqu’un qui sait écouter.',
    grantBefriend: 'echo_brouillard',
    nextNodeId: 'spirit_joined',
  },
  spirit_joined: {
    id: 'spirit_joined',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: 'La Lanterne du Col t’attend tout en haut, à 2 640 mètres. Je soufflerai une brise douce dans ton dos.',
  },
  spirit_bypass: {
    id: 'spirit_bypass',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: '...je comprends. Le sommet appelle. Je me fais tout petit contre le rocher pour te laisser monter.',
    setFlag: 'bypassed_echo_brouillard',
  },
  spirit_after_befriend: {
    id: 'spirit_after_befriend',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: 'La montagne fredonne encore notre chanson. Va réveiller la Lanterne du Col.',
  },
  spirit_after_bypass: {
    id: 'spirit_after_bypass',
    speaker: "L'Écho du Brouillard",
    portrait: 'spirit',
    voice: 'spirit',
    text: '...la brume reste épaisse ce soir. Bonne route jusqu’au refuge.',
  },

  // === LA LANTERNE DU COL (Sanctuaire final) ===
  lantern_intro: {
    id: 'lantern_intro',
    speaker: 'La Lanterne du Col',
    portrait: 'lantern',
    voice: 'lantern',
    text: 'À 2 640 mètres d’altitude, une ancienne lanterne sommeille sous un voile de givre. Son verre reflète les étoiles et demande un cœur paisible.',
    choices: [
      {
        label: 'Accorder sa flamme (Éveiller)',
        startPacify: 'lanterne_col',
      },
      {
        label: 'Observer la nuit en silence',
        nextNodeId: 'lantern_observe',
      },
    ],
  },
  lantern_observe: {
    id: 'lantern_observe',
    speaker: 'Narrateur',
    portrait: 'narrator',
    voice: 'narrator',
    text: 'Tout autour du col, les sommets semblent retenir leur souffle. Lorsque vous serez prêt, il suffira d’approcher votre flamme.',
  },
  lantern_pacify_win: {
    id: 'lantern_pacify_win',
    speaker: 'La Lanterne du Col',
    portrait: 'lantern',
    voice: 'lantern',
    text: 'Une chaleur dorée embrase doucement le col tout entier. La montagne reconnaît votre patience et répond à votre écho.',
    grantBefriend: 'lanterne_col',
    triggerEnding: true,
  },
};

export function buildCampfireDialogue(
  zoneId: ZoneId,
  save: SaveData
): { speaker: string; text: string } {
  const befriended = new Set<NpcId>(save.befriendedIds);
  const trailFriendsCount = (
    ['barnabe', 'cabine4', 'echo_brouillard'] as NpcId[]
  ).filter((id) => befriended.has(id)).length;

  if (zoneId === 'forest') {
    if (befriended.has('barnabe')) {
      return {
        speaker: 'Feu de la Clairière',
        text: "Le feu crépite sous les sapins givrés. Barnabé vous salue d'un clin d'œil philosophique depuis les fourrés. (Lanternes ravivées — Partie sauvegardée.)",
      };
    }
    return {
      speaker: 'Feu de la Clairière',
      text: "La résine brûle doucement et réchauffe vos moufles. L'air sent la neige fraîche et l'aventure. (Lanternes ravivées — Partie sauvegardée.)",
    };
  }

  if (zoneId === 'bridge') {
    if (befriended.has('cabine4') && befriended.has('echo_brouillard')) {
      return {
        speaker: 'Bivouac du Ravin',
        text: "Les braises chantent en harmonie avec le ravin. Une cabine rassurée et un esprit apaisé veillent sur le pont. (Partie sauvegardée.)",
      };
    }
    if (befriended.has('cabine4')) {
      return {
        speaker: 'Bivouac du Ravin',
        text: "Au bord de la brume, Cabine N°4 fredonne doucement près du feu. Le vide semble soudain moins vertigineux. (Partie sauvegardée.)",
      };
    }
    return {
      speaker: 'Bivouac du Ravin',
      text: "Malgré le vent d'altitude, ces braises tiennent bon face au brouillard. Prenez le temps de respirer. (Partie sauvegardée.)",
    };
  }

  if (trailFriendsCount === 3) {
    return {
      speaker: 'Âtre du Refuge',
      text: "À 2 640 mètres, la nuit étoilée s'ouvre devant vous. Chaque rencontre vous a rapproché de cette lumière. (Partie sauvegardée.)",
    };
  }

  return {
    speaker: 'Âtre du Refuge',
    text: "Le silence du col est immense, presque solennel. Le refuge vous offre sa dernière étincelle avant la Lanterne. (Partie sauvegardée.)",
  };
}
