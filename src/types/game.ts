export type ActId = 1 | 2 | 3 | 4;

export type Direction = 'up' | 'down' | 'left' | 'right';

export type FootstepTerrain = 'grass' | 'stone' | 'snow';

export type TileType =
  | 'grass'
  | 'snow'
  | 'path'
  | 'stone'
  | 'ice'
  | 'bridge'
  | 'tree'
  | 'rock'
  | 'cliff'
  | 'chasm'
  | 'cabin'
  | 'mist';

export type GameScreenMode =
  | 'title'
  | 'explore'
  | 'dialogue'
  | 'pacify'
  | 'carnet'
  | 'ending';

export type PortraitId =
  | 'player'
  | 'narrator'
  | 'maren'
  | 'soren'
  | 'leo'
  | 'lynx'
  | 'cerf'
  | 'gypaete'
  | 'monolith';

export type VoiceProfileId =
  | 'narrator'
  | 'maren'
  | 'soren'
  | 'leo'
  | 'lynx'
  | 'cerf'
  | 'gypaete'
  | 'monolith'
  | 'campfire';

export type StoryFlags = Record<string, boolean>;

export type InventoryItemId =
  | 'cloche_felee'
  | 'baies_eglantier'
  | 'tisane_pin'
  | 'corde_alpiniste'
  | 'cristal_echo'
  | 'page_carnet_liee';

export type InventoryCategory = 'tool' | 'consumable' | 'relic';

export interface InventoryItem {
  id: InventoryItemId;
  name: string;
  shortName: string;
  description: string;
  category: InventoryCategory;
  usableInWorld: boolean;
  usableInPacify: boolean;
}

export interface InventoryEntry {
  id: InventoryItemId;
  quantity: number;
}

export interface QuestObjective {
  id: string;
  act: ActId;
  title: string;
  detail: string;
}

export interface JournalNote {
  id: string;
  act: ActId;
  title: string;
  altitudeLabel: string;
  excerpt: string;
  fullText: string;
}

export type CreatureId =
  | 'lynx_boreal'
  | 'cerf_brumes'
  | 'gypaete_cimes'
  | 'monolithe_resonant';

export type InteractableKind =
  | 'npc'
  | 'examine'
  | 'campfire'
  | 'cairn'
  | 'climb'
  | 'pickup'
  | 'creature'
  | 'monolith';

export type PromptBadgeKind = '!' | '?' | 'bell' | 'hand' | 'climb';

export type PacifyActionType = 'resonance' | 'souffle' | 'esquive';

export interface PacifyEncounterConfig {
  creatureId: CreatureId;
  name: string;
  subtitle: string;
  portrait: PortraitId;
  targetCalm: number;
  accentColor: string;
  availableModes: PacifyActionType[];
  defaultMode: PacifyActionType;
  introLine: string;
  successNodeId: string;
}

export interface DialogueCondition {
  flag?: string;
  notFlag?: string;
  hasItem?: InventoryItemId;
  minNotes?: number;
  minCairns?: number;
  pacifiedCreature?: CreatureId;
}

export interface DialogueChoice {
  label: string;
  nextNodeId?: string;
  condition?: DialogueCondition;
  consumeItem?: InventoryItemId;
  grantItem?: InventoryItemId;
  setFlag?: string;
  grantPacify?: CreatureId;
  startPacify?: CreatureId;
  triggerEnding?: boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  portrait: PortraitId;
  voice: VoiceProfileId;
  text: string;
  nextNodeId?: string;
  choices?: DialogueChoice[];
  setFlag?: string;
  grantItem?: InventoryItemId;
  consumeItem?: InventoryItemId;
  grantPacify?: CreatureId;
  startPacify?: CreatureId;
  triggerEnding?: boolean;
}

export type DialogueTree = Record<string, DialogueNode>;

export interface WorldEntity {
  id: string;
  act: ActId;
  kind: InteractableKind;
  label: string;
  verb: string;
  badge: PromptBadgeKind;
  x: number;
  y: number;
  resolvedX?: number;
  resolvedY?: number;
  sprite: string;
  solid: boolean;
  rootNodeId?: string;
  resolvedNodeId?: string;
  itemId?: InventoryItemId;
  noteId?: string;
  creatureId?: CreatureId;
  cairnMistTiles?: Array<{ x: number; y: number }>;
  climbTarget?: {
    act: ActId;
    x: number;
    y: number;
    direction: Direction;
  };
  requiredFlag?: string;
  resolvedFlag?: string;
}

export interface ActTransition {
  x: number;
  y: number;
  width: number;
  height: number;
  targetAct: ActId;
  targetX: number;
  targetY: number;
  targetDirection: Direction;
  requiredFlag?: string;
  blockedText?: string;
}

export interface ZoneDefinition {
  id: ActId;
  slug: string;
  name: string;
  shortName: string;
  altitudeMeters: number;
  width: number;
  height: number;
  tiles: TileType[][];
  transitions: ActTransition[];
  skyTint: string;
  hasWindGusts: boolean;
  fogDensity: number;
}

export interface PlayerState {
  actId: ActId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: Direction;
  isMoving: boolean;
  animFrame: number;
  animTimer: number;
  footstepTimer: number;
  stamina: number;
  staminaCooldown: number;
  dashTimer: number;
  dashDirX: number;
  dashDirY: number;
  calm: number;
}

export type EndingId = 'harmony' | 'echo' | 'silence';

export interface SaveDataV2 {
  version: 2;
  actId: ActId;
  playerX: number;
  playerY: number;
  direction: Direction;
  calm: number;
  stamina: number;
  storyFlags: StoryFlags;
  rebuiltCairns: string[];
  collectedNotes: string[];
  pacifiedCreatures: CreatureId[];
  collectedPickups: string[];
  inventory: InventoryEntry[];
  savedAt: number;
  saveCount: number;
}
