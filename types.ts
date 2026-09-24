
export type PlateType = 'pallet' | 'shelf' | 'cantilever' | 'mobile' | 'gravity';

export interface BeamConfig {
  id: string;
  levelLabel: string;
  length: number;
  profileType: string;
  profileWidth: number;
  loadCount: number;
  loadWeight: number;
}

export interface LevelConfig {
  id: string;
  levelStart: number;
  levelEnd?: number;
  height: number;
}

export interface CantileverArmConfig {
  id: string;
  profile: string; // e.g. IPE 100
  length: number; // mm
  maxLoad: number; // kg
}

export interface MobileChassisConfig {
  id: string;
  length: number;
  loadCount: number;
  loadWeight: number;
}

export interface GravityFrameConfig {
  id: string;
  multiplier: number; // e.g. 3x
  style: 'std' | 'stl';
  type: string; // e.g. 18P
  depth?: number;
  height: number;
}

export interface PlateData {
  id: string;
  type: PlateType;
  quantity: number;
  
  // Wspólne nagłówki
  customerName: string;
  installationYear: number;
  projectNumber: string; // Zmienione na string dla elastyczności
  sapNumberSuffix: string;
  rackNumber?: string;

  // Dane dla tabliczki regału paletowego (Pallet) oraz mobilnego
  // Konfiguracja 1 (A)
  firstLevelHeight: number;
  subsequentLevels: LevelConfig[];
  
  // Konfiguracja 2 (B)
  firstLevelHeight2?: number; 
  subsequentLevels2?: LevelConfig[];

  // Konfiguracja 3 (C)
  firstLevelHeight3?: number;
  subsequentLevels3?: LevelConfig[];

  // Konfiguracja 4 (D)
  firstLevelHeight4?: number;
  subsequentLevels4?: LevelConfig[];

  beams: BeamConfig[];
  frameType: string;
  frameDepth: number;
  frameHeight: number;
  frameType2?: string;
  frameDepth2?: number;
  frameHeight2?: number;
  maxBayLoadOverride?: number; 
  highestLevelIndex: number;
  totalHeightOverride?: string; // Override text for height if manual needed (Changed to string)

  // Specyficzne dla Regału Mobilnego (Mobile)
  mobileChassisHeight?: number; // 215, 250 or custom
  mobileChassisConfigs?: MobileChassisConfig[]; // Lista konfiguracji podwozi

  // Dane dla tabliczki regału półkowego (Shelf)
  shelfDimensions: string;
  shelfFilling: string;
  shelfFrameDimensions: string;
  shelfLevelsCount: string;
  shelfMaxLevelLoad: string;
  shelfMaxFrameLoad: string;

  // Dane dla regału wspornikowego (Cantilever)
  cantileverHeight: number;
  cantileverColumnProfile: string;
  cantileverColumnLoad: number; // kg per side
  cantileverArms: CantileverArmConfig[];

  // Specyficzne dla Regału Grawitacyjnego (Gravity)
  gravityPalletDepth?: number;
  gravityPalletWidth?: number;
  gravityPalletHeight?: number;
  gravityPalletWeight?: string | number;
  gravityLevelsCount?: number;
  gravityPalletsPerChannel?: number;
  gravityFrames?: GravityFrameConfig[];

  // Stopka
  nextInspectionDate: string;

  // Personalizacja wydruku
  topMargin?: number;
  plateSpacing?: number;
}

export const BEAM_PROFILES = [
  { type: "E0486", h: 60 },
  { type: "E0488", h: 80 },
  { type: "E0480", h: 100 },
  { type: "E0471", h: 110 },
  { type: "E0441", h: 110 },
  { type: "E0472", h: 120 },
  { type: "E0442", h: 120 },
  { type: "E0485/15", h: 125 },
  { type: "E0413", h: 130 },
  { type: "E0443", h: 130 },
  { type: "E0414", h: 140 },
  { type: "E0444", h: 140 },
  { type: "E0445", h: 145 },
  { type: "E0415/15", h: 150 },
  { type: "E0436", h: 160 },
  { type: "E0436/2", h: 160 },
];

export const IPE_COLUMN_PROFILES = [
  "IPE 100", "IPE 120", "IPE 140", "IPE 160", "IPE 180", 
  "IPE 200", "IPE 220", "IPE 240", "IPE 270", "IPE 300", 
  "IPE 330", "IPE 360"
];

export const IPE_ARM_PROFILES = [
  "IPE 80", "IPE 100", "IPE 120", "IPE 140", "IPE 160"
];

export const INITIAL_PLATE: PlateData = {
  id: '1',
  type: 'pallet',
  quantity: 3,
  customerName: 'Polpharma',
  installationYear: new Date().getFullYear(),
  projectNumber: "46225325",
  sapNumberSuffix: '26199',
  
  // Pallet defaults
  firstLevelHeight: 600,
  subsequentLevels: [
    { id: 'l1', levelStart: 1, levelEnd: 4, height: 1250 }
  ],
  subsequentLevels2: [],
  subsequentLevels3: [],
  subsequentLevels4: [],
  
  beams: [
    { id: 'b1', levelLabel: 'A1 - A2', length: 2700, profileType: "E0485/15", profileWidth: 125, loadCount: 3, loadWeight: 400 },
    { id: 'b2', levelLabel: 'A3', length: 1900, profileType: "E0480", profileWidth: 100, loadCount: 2, loadWeight: 400 }
  ],
  frameType: "18P",
  frameDepth: 1100,
  frameHeight: 5750,
  highestLevelIndex: 4,

  // Mobile defaults
  mobileChassisHeight: 215,
  mobileChassisConfigs: [
    { id: 'mc1', length: 2700, loadCount: 3, loadWeight: 1000 }
  ],

  // Shelf defaults
  shelfDimensions: "1800 x 1050",
  shelfFilling: "Panele stalowe",
  shelfFrameDimensions: "4300 x 1050",
  shelfLevelsCount: "8",
  shelfMaxLevelLoad: "360kg",
  shelfMaxFrameLoad: "2880kg",

  // Cantilever defaults
  cantileverHeight: 4500,
  cantileverColumnProfile: "IPE 200",
  cantileverColumnLoad: 2500,
  cantileverArms: [
    { id: 'ca1', profile: "IPE 100", length: 1200, maxLoad: 600 }
  ],

  // Gravity defaults
  gravityPalletDepth: 1200,
  gravityPalletWidth: 800,
  gravityPalletHeight: 1100,
  gravityPalletWeight: '500',
  gravityLevelsCount: 4,
  gravityPalletsPerChannel: 10,
  gravityFrames: [
    { id: 'gf1', multiplier: 3, style: 'std', type: '18P', depth: 1100, height: 5750 },
    { id: 'gf2', multiplier: 2, style: 'stl', type: '18P', height: 5750 }
  ],

  nextInspectionDate: `${new Date().getFullYear() + 1}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  topMargin: 5,
  plateSpacing: 10,
};