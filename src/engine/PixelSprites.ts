import { Direction, PortraitId } from '../types/game';

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  K: '#050814',
  N: '#0B1021',
  S: '#1E293B',
  M: '#334155',
  L: '#64748B',
  B: '#94A3B8',
  W: '#F1F5F9',
  P: '#FFFFFF',
  I: '#BAE6FD',
  C: '#38BDF8',
  G: '#14532D',
  g: '#166534',
  l: '#22C55E',
  T: '#475569',
  t: '#78350F',
  w: '#B45309',
  A: '#F59E0B',
  Y: '#FDE68A',
  R: '#DC2626',
  r: '#F87171',
  V: '#C084FC',
  v: '#E9D5FF',
  D: '#000000',
};

function createCanvasFromGrid(
  grid: string[],
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  for (let y = 0; y < grid.length && y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length && x < width; x++) {
      const ch = row[x];
      const color = PALETTE[ch];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

const TILE_GRASS = [
  'GGGGGGGGGGGGGGGG',
  'GgGGGGgGGGGGGgGG',
  'GGGGGGGGGGGGGGGG',
  'GGGlGGGGGGGGGGGG',
  'GGGGGGGGgGGGlGGG',
  'GGGGGGGGGGGGGGGG',
  'GgGGGGGGGGGgGGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGgGGGGGGGGGGG',
  'GGGGGGGGGlGGGGGG',
  'GGGlGGGGGGGGgGGG',
  'GGGGGGGGGGGGGGGG',
  'GGGGGGgGGGGGGGGG',
  'GGGGGGGGGGGGgGGG',
  'GgGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGG',
];

const TILE_STONE = [
  'SSSSSSSSSSSSSSSS',
  'SMMMSMMMSSSMMMMS',
  'SMLMSMLMSMSMLMMS',
  'SSSSSSSSSSSSSSSS',
  'MMMSSSMMMMSSSMMM',
  'MLMSSSMLLMSSSMMS',
  'SSSSSSSSSSSSSSSS',
  'SMMMMSMMMSMMMMMS',
  'SMLLMSMLMSMLLMLS',
  'SSSSSSSSSSSSSSSS',
  'MMMSSSMMMMSSSMMM',
  'MLMSSSMMMMSSSLMS',
  'SSSSSSSSSSSSSSSS',
  'SMMMSMMMMSSMMMMS',
  'SMLMSMLMMSSMLMMS',
  'SSSSSSSSSSSSSSSS',
];

const TILE_CABIN = [
  'tttttttttttttttt',
  'twwwwwwwwwwwwwwt',
  'twwttttttttttwwt',
  'twwwwwwwwwwwwwwt',
  'twwYYYYwwYYYYwwt',
  'twwYAAYwwYAAYwwt',
  'twwYYYYwwYYYYwwt',
  'twwwwwwwwwwwwwwt',
  'twwttttttttttwwt',
  'twwwwwwAAwwwwwwt',
  'twwwwwwAAwwwwwwt',
  'twwwwwwwwwwwwwwt',
  'SSSSSSSSSSSSSSSS',
  'SMMMSMMMSSSMMMMS',
  'SSSSSSSSSSSSSSSS',
  'BBBBBBBBBBBBBBBB',
];

const TILE_MIST = [
  'BBBBBBBBBBBBBBBB',
  'BWWWWWWBBWWWWWWB',
  'WWWWvWWWWWWvWWWW',
  'WWvWWWWWvWWWWvWW',
  'BBBBWWWWWBBBBWWW',
  'WWWWWBBWWWWWWWWB',
  'BWWWWWWvWWWWvWWW',
  'WWWWvWWWWWWWWWBB',
  'BBBBWWWWWWBBWWWW',
  'WWWWWWvWWWWWWWWW',
  'WWvWWWWWWWvWWBWW',
  'WWWWBBBBWWWWWWWB',
  'BWWWWWWWWWvWWWWW',
  'WWWWvWWWWWWWWBBW',
  'BWWWWWWWWvWWWWWB',
  'BBBBBBBBBBBBBBBB',
];

const TILE_SNOW = [
  'BBBBBBBBBBBBBBBB',
  'BWWBWWWWWWWWWBWB',
  'WWWWWWWWWWWWWWWW',
  'WWWWPWWWWWWWWWWW',
  'WWWWWWWWWWWWBWWW',
  'BWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWBWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWPWWWWW',
  'WWBWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWBWWWWBWWW',
  'WWWWWWWWWWWWWWWW',
  'BBBBBBBBBBBBBBBB',
];

const TILE_PATH = [
  'BWWWWWWMMWWWWWWB',
  'WWWWWWMMMMWWWWWW',
  'WWWWWMMMMMMWWWWW',
  'WWWWMMMLMMMMWWWW',
  'WWWWMMMMMMMMWWWW',
  'WWWMMMMMMMLMMWWW',
  'WWWMMMMMMMMMMWWW',
  'WWMMMMMLMMMMMMWW',
  'WWMMMMMMMMMMMMWW',
  'WWWMMMMMMMMMMWWW',
  'WWWMMMLMMMMMMWWW',
  'WWWWMMMMMMMMWWWW',
  'WWWWMMMMMLMMWWWW',
  'WWWWWMMMMMMWWWWW',
  'WWWWWWMMMMWWWWWW',
  'BWWWWWWMMWWWWWWB',
];

const TILE_ICE = [
  'CCCCCCCCCCCCCCCC',
  'CIIIIIIIIIIIIIIC',
  'CIIPIIIIIIIIIIIC',
  'CIIIPIIIIIIIIIIC',
  'CIIIIPIIIIIIIIIC',
  'CIIIIIIIIIIIIIIC',
  'CIIIIIIIICIIIIIC',
  'CIIIIIIIPIIIIIIC',
  'CIIIIIIPIIIIIIIC',
  'CIIIIIPIIIIIIIIC',
  'CIIIIIIIIIIIIIIC',
  'CIIIIIIIIIIPPIIC',
  'CIIIIIIIIIPIICIC',
  'CIIIIIIIIIIIIIIC',
  'CIIIIIIIIIIIIIIC',
  'CCCCCCCCCCCCCCCC',
];

const TILE_CHASM = [
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKNNKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKNNNKKKK',
  'KKKKKKKKKKKKKKKK',
  'KNNKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKNNKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKNNK',
  'KKKKKKKKKKKKKKKK',
  'KKKNNKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
];

const TILE_BRIDGE = [
  'KKtwwwwwwwwwwtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtTTTTTTTTTTtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtwwwwAAwwwwtKK',
  'KKtTTTTTTTTTTtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtTTTTTTTTTTtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtwwwwAAwwwwtKK',
  'KKtTTTTTTTTTTtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtwwwwwwwwwwtKK',
  'KKtTTTTTTTTTTtKK',
  'KKtwwwwwwwwwwtKK',
];

const TILE_CLIFF = [
  'BBBBBBBBBBBBBBBB',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'SSSSSSSSSSSSSSSS',
  'SMMSSSMMMSSSMMMS',
  'SMSSSMMSSSMSSSMS',
  'SSSSSSSSSSSSSSSS',
  'NNSSNNNSSNNNSSNN',
  'NSSSNSSSNSSSNSSN',
  'NNNNNNNNNNNNNNNN',
  'SSNNSSNNSSNNSSNN',
  'NNNNNNNNNNNNNNNN',
  'KNNNNKNNNNKNNNNK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
];

const SPRITE_PINE = [
  '.......WW.......',
  '......WWWW......',
  '.....WWGGWW.....',
  '.....GGGGGG.....',
  '....WWGGGGWW....',
  '....GGGGGGGG....',
  '...WWGGggGGWW...',
  '...GGGGggGGGG...',
  '..WWGGGggGGGWW..',
  '..GGGGGGGGGGGG..',
  '.WWGGGGggGGGGWW.',
  '.GGGGGGggGGGGGG.',
  '.......tt.......',
  '.......tt.......',
  '......BBBB......',
  '................',
];

const SPRITE_ROCK = [
  '................',
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '...WWLLLLLLWW...',
  '..WWLLMMMMLLWW..',
  '..MMMMMMMMMMMM..',
  '.SMMMMMMMMMMMMS.',
  '.SMMMMSSSMMMMMS.',
  '.SSSSSMMMSSSSSS.',
  '.SSSSSSSSSSSSSS.',
  '..SSSSSSSSSSSS..',
  '..BBBBBBBBBBBB..',
  '................',
  '................',
  '................',
  '................',
];

const SPRITE_SIGN = [
  '................',
  '................',
  '...wwwwwwwwww...',
  '..wWWWWWWWWWWw..',
  '..wTTTTTTTTTTw..',
  '..wWWWWWWWWWWw..',
  '..wttttttttttw..',
  '...wwwwwwwwww...',
  '.......tt.......',
  '.......tt.......',
  '.......tt.......',
  '.......tt.......',
  '......BBBB......',
  '................',
  '................',
  '................',
];

const SPRITE_CAIRN_FALLEN = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....LLLL.......',
  '....LLMMML......',
  '..LLLL..LLLL....',
  '.LLMMML..LMMML..',
  '.SSSSSS..SSSSS..',
  '..BBBBBBBBBBB...',
  '................',
  '................',
  '................',
];

const SPRITE_CAIRN_REBUILT = [
  '................',
  '.......YY.......',
  '......LLLL......',
  '......LMML......',
  '.....LLLLLL.....',
  '....LLMMMMLL....',
  '....SSSSSSSS....',
  '...LLLLLLLLLL...',
  '..LLMMMMMMMMLL..',
  '..SSSSSSSSSSSS..',
  '..BBBBBBBBBBBB..',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const SPRITE_CLIMB_LEDGE = [
  '.....YY..YY.....',
  '....wAAwwAAw....',
  '...SSwwSSwwSS...',
  '..SSSwwSSwwSSS..',
  '..MMMwwMMwwMMM..',
  '..LLLwwLLwwLLL..',
  '..MMMwwMMwwMMM..',
  '..SSSwwSSwwSSS..',
  '..MMMwwMMwwMMM..',
  '..LLLwwLLwwLLL..',
  '..MMMwwMMwwMMM..',
  '..SSSwwSSwwSSS..',
  '...BBBBBBBBBB...',
  '................',
  '................',
  '................',
];

const SPRITE_JOURNAL_PAGE = [
  '................',
  '................',
  '....PPPPPPPP....',
  '....PWWWWWWP....',
  '....PWTTTTWP....',
  '....PWWWWWWP....',
  '....PWTTTTWP....',
  '....PWWWWWWP....',
  '....PWTTTTWP....',
  '....PWWAAAWP....',
  '....PWWWWWWP....',
  '....PPPPPPPP....',
  '......YYYY......',
  '................',
  '................',
  '................',
];

const SPRITE_BERRY_SHRUB = [
  '................',
  '......GGGG......',
  '....GGGGGGGG....',
  '...GGGRRGGGgG...',
  '..GGGGRRGGgRRg..',
  '..GGgGGGGGGrrG..',
  '..GgRRgGGGgGGG..',
  '..GgrrgGGgGGGG..',
  '...GGGGgGGgGG...',
  '....GGGttGGG....',
  '.......tt.......',
  '......BBBB......',
  '................',
  '................',
  '................',
  '................',
];

const SPRITE_CAMPFIRE_0 = [
  '................',
  '.......YY.......',
  '......YYYY......',
  '......AYYA......',
  '.....AAYYAA.....',
  '.....AAYYAA.....',
  '....AAAYYAAA....',
  '....AAAYYAAA....',
  '.....AAAAAA.....',
  '...tttAAAAttt...',
  '..ttwwttttwwtt..',
  '..twwttttttwwt..',
  '...BBBBBBBBBB...',
  '................',
  '................',
  '................',
];

const SPRITE_CAMPFIRE_1 = [
  '.......Y........',
  '......YYY.......',
  '.......YYA......',
  '.....AAYYAA.....',
  '.....AYYYYA.....',
  '....AAAYYAAA....',
  '....AAYYYYAA....',
  '.....AAAAAA.....',
  '.....AAAAAA.....',
  '...tttAAAAttt...',
  '..ttwwttttwwtt..',
  '..twwttttttwwt..',
  '...BBBBBBBBBB...',
  '................',
  '................',
  '................',
];

const SPRITE_SPARKLE_0 = [
  '................',
  '................',
  '.......Y........',
  '.......Y........',
  '......YYY.......',
  '....YYYYYYY.....',
  '..YYPPPPPPPYY...',
  '....YYYYYYY.....',
  '......YYY.......',
  '.......Y........',
  '.......Y........',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const SPRITE_SPARKLE_1 = [
  '................',
  '.......P........',
  '.......Y........',
  '.....Y.Y.Y......',
  '......YYY.......',
  '...Y..YPY..Y....',
  '.PYYYYPPPYYYYP..',
  '...Y..YPY..Y....',
  '......YYY.......',
  '.....Y.Y.Y......',
  '.......Y........',
  '.......P........',
  '................',
  '................',
  '................',
  '................',
];

function makePlayerSprite(dir: Direction, frame: number): string[] {
  const stepLeft = frame === 1 ? 'N' : '.';
  const stepRight = frame === 1 ? '.' : 'N';
  if (dir === 'up') {
    return [
      '......NNNN......',
      '.....NNNNNN.....',
      '....RRRRRRRR....',
      '....NNNNNNNN....',
      '....NNNNNNNN....',
      '.....RRRRRR.....',
      '....SSSSSSSS....',
      '....SSSSSSSS....',
      '...YSSSSSSSS....',
      '..AYSSSSSSSS....',
      '...SSSSSSSSS....',
      '.....SS..SS.....',
      `....${stepLeft}SS..SS${stepRight}....`,
      '.....NN..NN.....',
      '................',
      '................',
    ];
  }
  if (dir === 'left') {
    return [
      '......NNNN......',
      '.....NNNNNN.....',
      '....RRRRRRRR....',
      '....NNPPNNNN....',
      '....NNKKNNNN....',
      '.....RRRRRR.....',
      '....SSSSSSSS....',
      '..YYSSSSSSSS....',
      '.AYYSSSSSSSS....',
      '..AASSSSSSSS....',
      '....SSSSSSSS....',
      '.....SS..SS.....',
      `....${stepLeft}SS..SS${stepRight}....`,
      '.....NN..NN.....',
      '................',
      '................',
    ];
  }
  if (dir === 'right') {
    return [
      '......NNNN......',
      '.....NNNNNN.....',
      '....RRRRRRRR....',
      '....NNNNPPNN....',
      '....NNNNKKNN....',
      '.....RRRRRR.....',
      '....SSSSSSSS....',
      '....SSSSSSSSYY..',
      '....SSSSSSSSYYA.',
      '....SSSSSSSSAA..',
      '....SSSSSSSS....',
      '.....SS..SS.....',
      `....${stepLeft}SS..SS${stepRight}....`,
      '.....NN..NN.....',
      '................',
      '................',
    ];
  }
  return [
    '......NNNN......',
    '.....NNNNNN.....',
    '....RRRRRRRR....',
    '....NPKNNKPN....',
    '....NWWNNWWN....',
    '.....RRRRRR.....',
    '....SSSSSSSS....',
    '....SSSSSSSSYY..',
    '....SSSSSSSSYYA.',
    '....SSSSSSSSAA..',
    '....SSSSSSSS....',
    '.....SS..SS.....',
    `....${stepLeft}SS..SS${stepRight}....`,
    '.....NN..NN.....',
    '................',
    '................',
  ];
}

function makeHumanNpc(scarf: string, coat: string, hair: string): string[] {
  return [
    '........................',
    `.........${hair.repeat(6)}.........`,
    `........${hair.repeat(8)}........`,
    `........${hair}WWWWWW${hair}........`,
    `........WWKWWKWW........`,
    `........WWWWWWWW........`,
    `........${scarf.repeat(8)}........`,
    `.......${coat.repeat(10)}.......`,
    `......${coat.repeat(12)}......`,
    `......${coat.repeat(12)}......`,
    `.......${coat.repeat(10)}.......`,
    `........SSSSSSSS........`,
    `........SS....SS........`,
    `........SS....SS........`,
    `.......NNN....NNN.......`,
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
}

const SPRITE_LYNX = [
  '........................',
  '....KK............KK....',
  '....KAK..........KAK....',
  '....AAA..AAAAAA..AAA....',
  '....AAAAAAAAAAAAAAAA....',
  '.....AAAWWWAAWWWAAA.....',
  '.....AAAKWAAAAWKAAA.....',
  '......AAWWWWWWWWAA......',
  '.......AAAWKKWAAA.......',
  '......AAAAAAAAAAAA......',
  '.....AAWWWWWWWWWWAA.....',
  '....AAAAAAAAAAAAAAAA....',
  '....AAAWWWWWWWWWWAAA....',
  '.....AA..........AA.....',
  '.....AA..........AA.....',
  '....WWW..........WWW....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const SPRITE_CERF = [
  '..BB................BB..',
  '..BB.BB..........BB.BB..',
  '...BBB.BB......BB.BBB...',
  '....BBBB........BBBB....',
  '.....BBBCCCCCCCCBBB.....',
  '.......CCCCCCCCCC.......',
  '......CCCKCCCCKCCC......',
  '......CCCCCCCCCCCC......',
  '.......CCWWWWWWCC.......',
  '......CCCCCCCCCCCC......',
  '.....CCPPPPPPPPPPCC.....',
  '.....CCCCCCCCCCCCCC.....',
  '......CCCCCCCCCCCC......',
  '......CC........CC......',
  '......CC........CC......',
  '.....NNN........NNN.....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const SPRITE_GYPAETE = [
  '........................',
  '..MMMMMM........MMMMMM..',
  '.MMVVVVMM......MMVVVVMM.',
  '.MVVVVVVMM....MMVVVVVVM.',
  '..MVVVVVVMWWWWMMVVVVVVM.',
  '...MMVVVVWWKKWWVVVVVMM..',
  '....MMVVVWWAAWWVVVVMM...',
  '.....MMVVWWWWWWVVVMM....',
  '......MMVVVVVVVVVMM.....',
  '.......MMVVVVVVVMM......',
  '........MMVVVVVMM.......',
  '.........MMVVVMM........',
  '..........AA.AA.........',
  '.........YY...YY........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const SPRITE_MONOLITH = [
  '...........CC...........',
  '..........CCCC..........',
  '.........CCPPCC.........',
  '........CCPPPPCC........',
  '........CCYYYYCC........',
  '.......CCCYAAYCCC.......',
  '.......CCCYAAYCCC.......',
  '.......CCCYYYYCCC.......',
  '......CCCCPPPPCCCC......',
  '......CCCCPPPPCCCC......',
  '......CCCCCCCCCCCC......',
  '......SSSSSSSSSSSS......',
  '.....SSSSMMMMMMSSSS.....',
  '....SSSSMMMMMMMMSSSS....',
  '....BBBBBBBBBBBBBBBB....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

function buildPortrait(
  bg: string,
  accent: string,
  eyeStyle: 'calm' | 'fierce' | 'wide' | 'crystal'
): string[] {
  const rows: string[] = [];
  for (let y = 0; y < 32; y++) {
    let row = '';
    for (let x = 0; x < 32; x++) {
      if (y < 4 || y > 27 || x < 4 || x > 27) {
        row += 'D';
      } else if (y === 4 || y === 27 || x === 4 || x === 27) {
        row += accent;
      } else if (y >= 11 && y <= 14 && (x === 10 || x === 11 || x === 20 || x === 21)) {
        if (eyeStyle === 'crystal') {
          row += y === 12 || y === 13 ? 'P' : accent;
        } else if (eyeStyle === 'fierce' && y === 11) {
          row += bg;
        } else {
          row += y === 12 ? 'P' : 'D';
        }
      } else if (y >= 18 && y <= 20 && x >= 12 && x <= 19) {
        row += eyeStyle === 'wide' ? 'D' : accent;
      } else if (y >= 22 && y <= 26 && x >= 7 && x <= 24) {
        row += accent;
      } else {
        row += bg;
      }
    }
    rows.push(row);
  }
  return rows;
}

export interface SpriteBank {
  tiles: Record<string, HTMLCanvasElement>;
  player: Record<Direction, HTMLCanvasElement[]>;
  objects: Record<string, HTMLCanvasElement>;
  animated: {
    campfire: HTMLCanvasElement[];
    item_sparkle: HTMLCanvasElement[];
  };
  npcs: Record<string, HTMLCanvasElement>;
  portraits: Record<PortraitId, HTMLCanvasElement>;
}

let cachedBank: SpriteBank | null = null;

export function getSpriteBank(): SpriteBank {
  if (cachedBank) return cachedBank;

  cachedBank = {
    tiles: {
      grass: createCanvasFromGrid(TILE_GRASS, 16, 16),
      stone: createCanvasFromGrid(TILE_STONE, 16, 16),
      cabin: createCanvasFromGrid(TILE_CABIN, 16, 16),
      mist: createCanvasFromGrid(TILE_MIST, 16, 16),
      snow: createCanvasFromGrid(TILE_SNOW, 16, 16),
      path: createCanvasFromGrid(TILE_PATH, 16, 16),
      ice: createCanvasFromGrid(TILE_ICE, 16, 16),
      chasm: createCanvasFromGrid(TILE_CHASM, 16, 16),
      bridge: createCanvasFromGrid(TILE_BRIDGE, 16, 16),
      cliff: createCanvasFromGrid(TILE_CLIFF, 16, 16),
      tree: createCanvasFromGrid(SPRITE_PINE, 16, 16),
      rock: createCanvasFromGrid(SPRITE_ROCK, 16, 16),
    },
    player: {
      up: [
        createCanvasFromGrid(makePlayerSprite('up', 0), 16, 16),
        createCanvasFromGrid(makePlayerSprite('up', 1), 16, 16),
      ],
      down: [
        createCanvasFromGrid(makePlayerSprite('down', 0), 16, 16),
        createCanvasFromGrid(makePlayerSprite('down', 1), 16, 16),
      ],
      left: [
        createCanvasFromGrid(makePlayerSprite('left', 0), 16, 16),
        createCanvasFromGrid(makePlayerSprite('left', 1), 16, 16),
      ],
      right: [
        createCanvasFromGrid(makePlayerSprite('right', 0), 16, 16),
        createCanvasFromGrid(makePlayerSprite('right', 1), 16, 16),
      ],
    },
    objects: {
      sign_post: createCanvasFromGrid(SPRITE_SIGN, 16, 16),
      cairn_fallen: createCanvasFromGrid(SPRITE_CAIRN_FALLEN, 16, 16),
      cairn_rebuilt: createCanvasFromGrid(SPRITE_CAIRN_REBUILT, 16, 16),
      climb_ledge: createCanvasFromGrid(SPRITE_CLIMB_LEDGE, 16, 16),
      journal_page: createCanvasFromGrid(SPRITE_JOURNAL_PAGE, 16, 16),
      berry_shrub: createCanvasFromGrid(SPRITE_BERRY_SHRUB, 16, 16),
    },
    animated: {
      campfire: [
        createCanvasFromGrid(SPRITE_CAMPFIRE_0, 16, 16),
        createCanvasFromGrid(SPRITE_CAMPFIRE_1, 16, 16),
      ],
      item_sparkle: [
        createCanvasFromGrid(SPRITE_SPARKLE_0, 16, 16),
        createCanvasFromGrid(SPRITE_SPARKLE_1, 16, 16),
      ],
    },
    npcs: {
      npc_maren: createCanvasFromGrid(makeHumanNpc('R', 'S', 'B'), 24, 24),
      npc_soren: createCanvasFromGrid(makeHumanNpc('C', 'T', 'w'), 24, 24),
      npc_leo: createCanvasFromGrid(makeHumanNpc('A', 'M', 't'), 24, 24),
      creature_lynx: createCanvasFromGrid(SPRITE_LYNX, 24, 24),
      creature_cerf: createCanvasFromGrid(SPRITE_CERF, 24, 24),
      creature_gypaete: createCanvasFromGrid(SPRITE_GYPAETE, 24, 24),
      monolith_shrine: createCanvasFromGrid(SPRITE_MONOLITH, 24, 24),
    },
    portraits: {
      player: createCanvasFromGrid(buildPortrait('W', 'R', 'calm'), 32, 32),
      narrator: createCanvasFromGrid(buildPortrait('S', 'Y', 'crystal'), 32, 32),
      maren: createCanvasFromGrid(buildPortrait('W', 'R', 'calm'), 32, 32),
      soren: createCanvasFromGrid(buildPortrait('W', 'C', 'wide'), 32, 32),
      leo: createCanvasFromGrid(buildPortrait('W', 'A', 'calm'), 32, 32),
      lynx: createCanvasFromGrid(buildPortrait('A', 'Y', 'fierce'), 32, 32),
      cerf: createCanvasFromGrid(buildPortrait('C', 'I', 'wide'), 32, 32),
      gypaete: createCanvasFromGrid(buildPortrait('V', 'Y', 'fierce'), 32, 32),
      monolith: createCanvasFromGrid(buildPortrait('N', 'C', 'crystal'), 32, 32),
    },
  };

  return cachedBank;
}
