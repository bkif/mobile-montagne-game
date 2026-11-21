import { Direction, PortraitId } from '../types/game';

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  K: '#050814', // Deep abyss black-blue
  N: '#0B1021', // Midnight indigo
  S: '#1E293B', // Slate mountain shadow
  M: '#334155', // Mid slate
  L: '#64748B', // Light rock grey-blue
  B: '#94A3B8', // Pale ice-slate
  W: '#F1F5F9', // Snow white
  P: '#FFFFFF', // Pure white highlight
  I: '#BAE6FD', // Frost cyan
  C: '#38BDF8', // Bright ice blue
  G: '#14532D', // Deep pine green
  g: '#166534', // Mid pine green
  T: '#475569', // Timber shadow
  t: '#78350F', // Wood dark brown
  w: '#B45309', // Wood warm brown
  A: '#F59E0B', // Warm amber
  Y: '#FDE68A', // Bright lantern gold
  R: '#DC2626', // Cozy scarf / cablecar red
  r: '#F87171', // Soft coral red
  V: '#C084FC', // Spirit lavender
  v: '#E9D5FF', // Pale mist violet
  D: '#000000', // Pure black
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
  // down
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

// 24x24 NPC Sprites
const SPRITE_IBEX = [
  '.....SSS........SSS.....',
  '....SSSSS......SSSSS....',
  '...SS...SS....SS...SS...',
  '...SS....SSSSSS....SS...',
  '....SS..WWWWWWWW..SS....',
  '........WWWWWWWW........',
  '.......WWKWWWWKWW.......',
  '.......WWWWWWWWWW.......',
  '........WWSSSSWW........',
  '........RRRRRRRR........',
  '.......WWWWWWWWWW.......',
  '......WWWWWWWWWWWW......',
  '......WWBBBBBBBBWW......',
  '......WWWWWWWWWWWW......',
  '.......BBBBBBBBBB.......',
  '.......BB......BB.......',
  '.......BB......BB.......',
  '.......SS......SS.......',
  '......BBBB....BBBB......',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const SPRITE_CABLECAR = [
  '..........MMMM..........',
  '...........MM...........',
  '...........MM...........',
  '..........RRRR..........',
  '....RRRRRRRRRRRRRRRR....',
  '...RRRRRRRRRRRRRRRRRR...',
  '...RRBBBBBBBBBBBBBBRR...',
  '...RRBCCCCCCCCCCCCBRR...',
  '...RRBCKKCCCCKKCCCBRR...',
  '...RRBCKKCCCCKKCCCBRR...',
  '...RRBCCCCCCCCCCCCBRR...',
  '...RRBBBBBBBBBBBBBBRR...',
  '...RRRRRRRRRRRRRRRRRR...',
  '...RRRRAAARRRRAAARRRR...',
  '...RRRRRRRRRRRRRRRRRR...',
  '...RRRRRRBBBBBBBRRRRR...',
  '....RRRRRRRRRRRRRRRR....',
  '.....MMMM......MMMM.....',
  '....BBBBBB....BBBBBB....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const SPRITE_SPIRIT = [
  '........................',
  '..........vvvv..........',
  '........vvPPPPvv........',
  '.......vPPPPPPPPv.......',
  '......vPPVVVVVVPPv......',
  '.....vPPVVVVVVVVPPv.....',
  '.....vPVVKKVVKKVVPv.....',
  '.....vPVVKKVVKKVVPv.....',
  '.....vPPVVVVVVVVPPv.....',
  '......vPPVVVVVVPPv......',
  '......vPPPVVVVPPPv......',
  '.....vPPPPVVVVPPPPv.....',
  '.....vPP.PPPPPP.PPv.....',
  '......v..PPPPPP..v......',
  '.........vPPPPv.........',
  '........v.vPPv.v........',
  '...........vv...........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const SPRITE_LANTERN_SHRINE = [
  '..........WWWW..........',
  '........WWSSSSWW........',
  '.......SSSSSSSSSS.......',
  '......SSSSSSSSSSSS......',
  '........MMAAAAAM........',
  '........MYYYYYYM........',
  '........MYPPPPYM........',
  '........MYPPPPYM........',
  '........MYYYYYYM........',
  '........MMAAAAAM........',
  '.......SSSSSSSSSS.......',
  '........MMMMMMMM........',
  '........SSSSSSSS........',
  '........SSSSSSSS........',
  '.......SSSSSSSSSS.......',
  '......SSSSSSSSSSSS......',
  '.....BBBBBBBBBBBBBB.....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

// 32x32 Dialogue Portraits (high contrast Undertale-style with subtle accent)
const PORTRAIT_IBEX: string[] = [
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDWWDDDDDDDDDDDDDDDDDDWWDDDDD',
  'DDDDWWWWDDDDDDDDDDDDDDDDWWWWDDDD',
  'DDDWWDDWWDDDDDDDDDDDDDDWWDDWWDDD',
  'DDDWWDDDWWDDDDDDDDDDDDWWDDDWWDDD',
  'DDDDWWDDDWWDDWWWWWWDDWWDDDWWDDDD',
  'DDDDDWWDDDWWWWWWWWWWWWDDDWWDDDDD',
  'DDDDDDWWDDWWWWWWWWWWWWDDWWDDDDDD',
  'DDDDDDDWWWWWWWWWWWWWWWWWWDDDDDDD',
  'DDDDDDDDWWWWWWWWWWWWWWWWDDDDDDDD',
  'DDDDDDDWWWWWWWWWWWWWWWWWWDDDDDDD',
  'DDDDDDDWWWDDDDWWWWDDDDWWWDDDDDDD',
  'DDDDDDDWWWDPPDWWWWDPPDWWWDDDDDDD',
  'DDDDDDDWWWDDDDWWWWDDDDWWWDDDDDDD',
  'DDDDDDDDWWWWWWWWWWWWWWWWDDDDDDDD',
  'DDDDDDDDWWWWWWWWWWWWWWWWDDDDDDDD',
  'DDDDDDDDDWWWWWWDDWWWWWWDDDDDDDDD',
  'DDDDDDDDDDWWWWWWWWWWWWDDDDDDDDDD',
  'DDDDDDDDDDWWDDDDDDDDWWDDDDDDDDDD',
  'DDDDDDDDDDDWWWWWWWWWWDDDDDDDDDDD',
  'DDDDDDDDDDDDWWWWWWWWDDDDDDDDDDDD',
  'DDDDDDDDDDDDRRRRRRRRDDDDDDDDDDDD',
  'DDDDDDDDDDDRRRRRRRRRRDDDDDDDDDDD',
  'DDDDDDDDDDWWWWWWWWWWWWDDDDDDDDDD',
  'DDDDDDDDWWWWWWWWWWWWWWWWDDDDDDDD',
  'DDDDDDDWWWWWWWWWWWWWWWWWWDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
];

const PORTRAIT_CABLECAR: string[] = [
  'DDDDDDDDDDDDDDWWWWDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDWWDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDWWDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDRRRRDDDDDDDDDDDDDD',
  'DDDDDDDRRRRRRRRRRRRRRRRRRDDDDDDD',
  'DDDDDDRRRRRRRRRRRRRRRRRRRRDDDDDD',
  'DDDDDRRWWWWWWWWWWWWWWWWWWWRDDDDD',
  'DDDDDRRWWWWWWWWWWWWWWWWWWWRDDDDD',
  'DDDDDRRWCCCCCCCCCCCCCCCCWWRDDDDD',
  'DDDDDRRWCWWCCCCCCCCCCWWCWWRDDDDD',
  'DDDDDRRWCWWCCCCCCCCCCWWCWWRDDDDD',
  'DDDDDRRWCCDDDDCCCCDDDDCCWWRDDDDD',
  'DDDDDRRWCCDDDDCCCCDDDDCCWWRDDDDD',
  'DDDDDRRWCCCCCCCCCCCCCCCCWWRDDDDD',
  'DDDDDRRWCCCCCCCCCCCCCCCCWWRDDDDD',
  'DDDDDRRWWWWWWWWWWWWWWWWWWWRDDDDD',
  'DDDDDRRRRRRRRRRRRRRRRRRRRRRDDDDD',
  'DDDDDRRRRRRRRRWWWWWRRRRRRRRDDDDD',
  'DDDDDRRRRWWWRRRRRRRRWWWRRRRDDDDD',
  'DDDDDRRRRAAARRRRRRRRAAARRRRDDDDD',
  'DDDDDRRRRRRRRRRRRRRRRRRRRRRDDDDD',
  'DDDDDDRRRRRRRRRRRRRRRRRRRRDDDDDD',
  'DDDDDDDRRRRRRRRRRRRRRRRRRDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
];

const PORTRAIT_SPIRIT: string[] = [
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDVVVVVVDDDDDDDDDDDDD',
  'DDDDDDDDDDDVVVPPPPVVVDDDDDDDDDDD',
  'DDDDDDDDDDVVPPPPPPPPVVDDDDDDDDDD',
  'DDDDDDDDDVVPPPPPPPPPPVVDDDDDDDDD',
  'DDDDDDDDVVPPPPPPPPPPPPVDDDDDDDDD',
  'DDDDDDDDVPPPPVVVVVVPPPPVDDDDDDDD',
  'DDDDDDDDVPPPVVDDDDVVPPPVDDDDDDDD',
  'DDDDDDDDVPPPVVDPPDVVPPPVDDDDDDDD',
  'DDDDDDDDVPPPVVDDDDVVPPPVDDDDDDDD',
  'DDDDDDDDVPPPPVVVVVVPPPPVDDDDDDDD',
  'DDDDDDDDVVPPPPPPPPPPPPVDDDDDDDDD',
  'DDDDDDDDDVVPPPPPPPPPPVVDDDDDDDDD',
  'DDDDDDDDDDVVPPWWWWPPVVDDDDDDDDDD',
  'DDDDDDDDDDVVPPPPPPPPVVDDDDDDDDDD',
  'DDDDDDDDDVVVPPPPPPPPVVVDDDDDDDDD',
  'DDDDDDDDVVVPPPPPPPPPPVVVDDDDDDDD',
  'DDDDDDDDVVDDPPPPPPPPDDVVDDDDDDDD',
  'DDDDDDDDDDDDPPPPPPPPDDDDDDDDDDDD',
  'DDDDDDDDDDDDVPPPPPPVDDDDDDDDDDDD',
  'DDDDDDDDDDDDDVPPPPVVDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDVPPVVDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDVVIDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
];

const PORTRAIT_LANTERN: string[] = [
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDWWWWDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDWWWWWWWWDDDDDDDDDDDD',
  'DDDDDDDDDDWWWWWWWWWWWWDDDDDDDDDD',
  'DDDDDDDDDWWWWDDDDDDWWWWDDDDDDDDD',
  'DDDDDDDDDDDDDYYYYYYDDDDDDDDDDDDD',
  'DDDDDDDDDDDDYYPPPPYYDDDDDDDDDDDD',
  'DDDDDDDDDDDYYPPPPPPYYDDDDDDDDDDD',
  'DDDDDDDDDDDYYPPPPPPYYDDDDDDDDDDD',
  'DDDDDDDDDDDYYPPAAAPYYDDDDDDDDDDD',
  'DDDDDDDDDDDYYPAAAAPYYDDDDDDDDDDD',
  'DDDDDDDDDDDYYPAAAAPYYDDDDDDDDDDD',
  'DDDDDDDDDDDYYYYAAYYYYDDDDDDDDDDD',
  'DDDDDDDDDDDDYYYYYYYYDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDAAAAADDDDDDDDDDDDD',
  'DDDDDDDDDDDWWWWWWWWWWDDDDDDDDDDD',
  'DDDDDDDDDDWWWWWWWWWWWWDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDYDDDDDDDDDDDDDDDDDDYDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
];

const PORTRAIT_NARRATOR: string[] = [
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDPDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDPDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDWWWDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDWWPWWDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDWWWWWWWDDDDDDDDDDDDD',
  'DDDDDDDDDDDWWWWPWWWWDDDDDDDDDDDD',
  'DDDDDDDDDDWWWWWWWWWWWDDDDDDDDDDD',
  'DDDDDDDDDWWWWWWWWWWWWWDDDDDDDDDD',
  'DDDDDDDDWWWWWWWWWWWWWWWDDDDDDDDD',
  'DDDDDDDWWSSSSWWWWWWSSSWWDDDDDDDD',
  'DDDDDDWWSSSSSSWWWWSSSSSWWDDDDDDD',
  'DDDDDWWSSSSSSSSWWSSSSSSSWWDDDDDD',
  'DDDDWWSSSSSSSSSSSSSSSSSSSWWDDDDD',
  'DDDWWSSSSSSSSSSSSSSSSSSSSSWWDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDYYYYYDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDYPPPPPYDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDYYYYYDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
];

export interface SpriteBank {
  tiles: Record<string, HTMLCanvasElement>;
  player: Record<Direction, HTMLCanvasElement[]>;
  objects: {
    campfire: HTMLCanvasElement[];
    item_sparkle: HTMLCanvasElement[];
    sign_post: HTMLCanvasElement;
  };
  npcs: Record<string, HTMLCanvasElement>;
  portraits: Record<PortraitId, HTMLCanvasElement>;
}

let cachedBank: SpriteBank | null = null;

export function getSpriteBank(): SpriteBank {
  if (cachedBank) return cachedBank;

  cachedBank = {
    tiles: {
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
      campfire: [
        createCanvasFromGrid(SPRITE_CAMPFIRE_0, 16, 16),
        createCanvasFromGrid(SPRITE_CAMPFIRE_1, 16, 16),
      ],
      item_sparkle: [
        createCanvasFromGrid(SPRITE_SPARKLE_0, 16, 16),
        createCanvasFromGrid(SPRITE_SPARKLE_1, 16, 16),
      ],
      sign_post: createCanvasFromGrid(SPRITE_SIGN, 16, 16),
    },
    npcs: {
      npc_ibex: createCanvasFromGrid(SPRITE_IBEX, 24, 24),
      npc_cablecar: createCanvasFromGrid(SPRITE_CABLECAR, 24, 24),
      npc_spirit: createCanvasFromGrid(SPRITE_SPIRIT, 24, 24),
      lantern_shrine: createCanvasFromGrid(SPRITE_LANTERN_SHRINE, 24, 24),
    },
    portraits: {
      player: createCanvasFromGrid(PORTRAIT_NARRATOR, 32, 32),
      ibex: createCanvasFromGrid(PORTRAIT_IBEX, 32, 32),
      cablecar: createCanvasFromGrid(PORTRAIT_CABLECAR, 32, 32),
      spirit: createCanvasFromGrid(PORTRAIT_SPIRIT, 32, 32),
      lantern: createCanvasFromGrid(PORTRAIT_LANTERN, 32, 32),
      narrator: createCanvasFromGrid(PORTRAIT_NARRATOR, 32, 32),
    },
  };

  return cachedBank;
}
