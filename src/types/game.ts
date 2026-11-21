export type ZoneId = 'forest' | 'bridge' | 'summit';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type TileType =
  | 'snow'
  | 'path'
  | 'tree'
  | 'rock'
  | 'ice'
  | 'chasm'
  | 'bridge'
  | 'cliff';

export type GameScreenMode =
  | 'title'
  | 'explore'
  | 'dialogue'
  | 'pacify'
  | 'inventory'
  | 'ending';

export type PortraitId =
  | 'player'
  | 'ibex'
  | 'cablecar'
  | 'spirit'
  | 'lantern'
  | 'narrator';

export type VoiceProfileId =
  | 'narrator'
  | 'ibex'
  | 'cablecar'
  | 'spirit'
  | 'lantern'
  | 'campfire';

export type ItemId = 'compass' | 'thermos' | 'flute';

export interface InventoryItem {
  id: ItemId;
  name: string;
  shortName: string;
  description: string;
  icon: 'compass' | 'thermos' | 'flute';
}

export type NpcId =
  | 'barnabe'
  | 'cabine4'
  | 'echo_brouillard'
  | 'lanterne_col';

export type PacifyMode =
  | 'dodge_wind'
  | 'resonance_hold'
  | 'catch_notes'
  | 'lantern_harmony';

export interface PacifyChallengeConfig {
  id: NpcId;
  title: string;
  subtitle: string;
  mode: PacifyMode;
  durationSeconds: number;
  instruction: string;
  accentColor: string;
  successNodeId: string;
}

export interface DialogueChoice {
  label: string;
  nextNodeId?: string;
  requiredItem?: ItemId;
  consumeItem?: boolean;
  grantBefriend?: NpcId;
  startPacify?: NpcId;
  setFlag?: string;
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
  grantBefriend?: NpcId;
  startPacify?: NpcId;
  triggerEnding?: boolean;
}

export type DialogueTree = Record<string, DialogueNode>;

export interface NpcEntity {
  id: NpcId;
  name: string;
  zoneId: ZoneId;
  x: number;
  y: number;
  resolvedX: number;
  resolvedY: number;
  sprite: 'npc_ibex' | 'npc_cablecar' | 'npc_spirit' | 'lantern_shrine';
  blocksPath: boolean;
  rootNodeId: string;
  befriendedNodeId: string;
  bypassedNodeId: string;
  pacifyConfig: PacifyChallengeConfig;
}

export interface WorldObject {
  id: string;
  zoneId: ZoneId;
  x: number;
  y: number;
  type: 'campfire' | 'item' | 'sign';
  itemId?: ItemId;
  label: string;
  sprite: 'campfire' | 'item_sparkle' | 'sign_post';
  solid: boolean;
  signNodeId?: string;
}

export interface ZoneTransition {
  x: number;
  y: number;
  width: number;
  height: number;
  targetZone: ZoneId;
  targetX: number;
  targetY: number;
  targetDirection: Direction;
}

export interface ZoneMap {
  id: ZoneId;
  name: string;
  shortName: string;
  altitudeMeters: number;
  width: number;
  height: number;
  tiles: TileType[][];
  transitions: ZoneTransition[];
  skyTint: string;
}

export interface PlayerState {
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  animFrame: number;
  animTimer: number;
}

export interface SaveData {
  version: 1;
  zoneId: ZoneId;
  x: number;
  y: number;
  direction: Direction;
  inventory: ItemId[];
  collectedItems: string[];
  befriendedIds: NpcId[];
  flags: Record<string, boolean>;
  savedAt: number;
  saveCount: number;
}
