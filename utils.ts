
import { BeamConfig, PlateData, LevelConfig } from './types';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  TextRun, 
  BorderStyle, 
  AlignmentType,
  VerticalAlign,
  HeightRule,
  ShadingType
} from 'docx';

// Helper to format level label from config
export const getLevelLabel = (lvl: LevelConfig, prefix: string): string => {
  if (lvl.levelEnd && lvl.levelEnd > lvl.levelStart) {
    return `${prefix}${lvl.levelStart} - ${prefix}${lvl.levelEnd}`;
  }
  return `${prefix}${lvl.levelStart}`;
};

// Helper to count levels in a config row
export const getLevelRowCount = (lvl: LevelConfig): number => {
  if (lvl.levelEnd && lvl.levelEnd > lvl.levelStart) {
    return lvl.levelEnd - lvl.levelStart + 1;
  }
  return 1;
};

// Calculates Qmax for a single beam row
export const calculateQmax = (count: number, weight: number) => count * weight;

// Calculates Total Bay Load based on the logic: (Max Qmax) * (highestLevelIndex + 1)
export const calculateMaxBayLoad = (data: PlateData): number => {
  if (data.maxBayLoadOverride) return data.maxBayLoadOverride;

  let maxQmax = 0;
  data.beams.forEach(b => {
    const q = calculateQmax(b.loadCount, b.loadWeight);
    if (q > maxQmax) maxQmax = q;
  });

  return maxQmax * (data.highestLevelIndex + 1);
};

export const calculateSingleConfigHeight = (first: number | undefined, levels: LevelConfig[] | undefined): number => {
  if (first === undefined || first === null) return 0;
  let sum = first;
  if (levels) {
    levels.forEach(lvl => {
      const count = getLevelRowCount(lvl);
      sum += count * lvl.height;
    });
  }
  return sum;
};

// Returns raw number for layout calculations (returns the max of all configs)
export const calculateTotalHeight = (data: PlateData): number => {
  if (data.totalHeightOverride) {
    // Try to parse number for calculation purposes, or return a safe default if it's text
    const parsed = parseInt(data.totalHeightOverride);
    return isNaN(parsed) ? data.frameHeight : parsed;
  }

  const h1 = calculateSingleConfigHeight(data.firstLevelHeight, data.subsequentLevels);
  const h2 = calculateSingleConfigHeight(data.firstLevelHeight2, data.subsequentLevels2);
  const h3 = calculateSingleConfigHeight(data.firstLevelHeight3, data.subsequentLevels3);
  const h4 = calculateSingleConfigHeight(data.firstLevelHeight4, data.subsequentLevels4);

  let calculatedMax = Math.max(h1, h2, h3, h4);
  
  // If no levels are defined, fallback to frame logic as safety
  if (calculatedMax === 0) {
     calculatedMax = data.frameHeight - 150;
  }

  // Add mobile chassis height to total height calculation
  if (data.type === 'mobile' && data.mobileChassisHeight) {
    calculatedMax += data.mobileChassisHeight;
  }

  return calculatedMax;
};

// Returns formatted string like "5600 / 7200"
export const getUniqueRackHeights = (data: PlateData): string => {
  if (data.totalHeightOverride) return data.totalHeightOverride.toString();

  const heights: number[] = [];
  
  // Config 1
  heights.push(calculateSingleConfigHeight(data.firstLevelHeight, data.subsequentLevels));
  
  // Config 2
  if (data.firstLevelHeight2 !== undefined) {
    heights.push(calculateSingleConfigHeight(data.firstLevelHeight2, data.subsequentLevels2));
  }
  // Config 3
  if (data.firstLevelHeight3 !== undefined) {
    heights.push(calculateSingleConfigHeight(data.firstLevelHeight3, data.subsequentLevels3));
  }
  // Config 4
  if (data.firstLevelHeight4 !== undefined) {
    heights.push(calculateSingleConfigHeight(data.firstLevelHeight4, data.subsequentLevels4));
  }

  // Add mobile chassis height to all calculated heights
  const chassis = (data.type === 'mobile' && data.mobileChassisHeight) ? data.mobileChassisHeight : 0;
  const finalHeights = heights.map(h => h + chassis);

  // Filter out 0 (inactive/empty) and deduplicate
  const unique = [...new Set(finalHeights.filter(h => h > chassis || (chassis === 0 && h > 0)))];
  
  if (unique.length === 0) {
     // Fallback
     return `${data.frameHeight - 150 + chassis}`;
  }

  return unique.sort((a, b) => a - b).join(' / ');
};


export const formatPrice = (val: number) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Format "YYYY-MM" to "MonthName YYYY" in Polish
export const formatMonthYear = (isoMonth: string): string => {
  if (!isoMonth) return "";
  try {
    const [year, month] = isoMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const formatted = date.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch (e) {
    return isoMonth;
  }
};

// --- HEIGHT CALCULATION FOR PRINTING ---

export const calculateVisualHeight = (data: PlateData): number => {
  if (data.type === 'shelf') return 88; // Fixed height for shelf plates

  // Reduced constants in mm to match compact visual style and fit 4 on A4
  const HEADER_HEIGHT = 11; // Matches h-[11mm] in PalletPlate
  const FOOTER_HEIGHT = 10; // Matches h-[10mm] in PalletPlate
  const TITLE_BAR_HEIGHT = 3.5;
  const BASE_MARGINS = 1; // Minimal margins

  if (data.type === 'cantilever') {
    // Header is approx 14mm now in CantileverPlate
    const CANTILEVER_HEADER = 14; 
    const ROW_HEIGHT = 5.5; // Height, Profile, Load rows
    const ARM_ROW_HEIGHT = 5.5; 
    const SECTION_HEADER_HEIGHT = 4.0;
    const CANTILEVER_FOOTER = 10; // 9mm + margin

    // Header + Height Row + Column Row + Load Row + Section Header + Arms * height + Footer
    const total = 
      CANTILEVER_HEADER + 
      (3 * ROW_HEIGHT) + 
      SECTION_HEADER_HEIGHT +
      (data.cantileverArms.length * ARM_ROW_HEIGHT) +
      CANTILEVER_FOOTER + 
      BASE_MARGINS;
      
    return total;
  }

  if (data.type === 'gravity') {
    const GRAVITY_HEADER = 14;
    const ROW_HEIGHT = 5.5;
    const SECTION_HEADER_HEIGHT = 4.0;
    const GRAVITY_FOOTER = 10;
    
    // Header + Frame Row + Section Header + Beams * height + Section Header + Pallet Row + Section Header + Rack Row + Footer
    const total = 
      GRAVITY_HEADER + 
      ROW_HEIGHT + // Frame Row
      SECTION_HEADER_HEIGHT + // Beams Section
      (data.beams.length * ROW_HEIGHT) +
      SECTION_HEADER_HEIGHT + // Pallet Section
      ROW_HEIGHT + // Pallet Row
      SECTION_HEADER_HEIGHT + // Rack Section
      ROW_HEIGHT + // Rack Row
      GRAVITY_FOOTER +
      BASE_MARGINS;

    return total;
  }
  
  // PALLET & MOBILE LOGIC
  const BEAM_HEADER_HEIGHT = 3.0;
  const FRAME_ROW_HEIGHT = 5.0;
  const LOAD_ROW_HEIGHT = 5.0;
  const RACK_HEIGHT_ROW = 5.0;
  
  // Dynamic contents approximate heights
  const LEVEL_ROW_HEIGHT = 5.0; 
  const BEAM_ROW_HEIGHT = 5.5; 
  const ROW_1_HEIGHT = 5.0; 

  // Calculate rows (max of all configs)
  const l1 = data.subsequentLevels.length;
  const l2 = data.subsequentLevels2 ? data.subsequentLevels2.length : 0;
  const l3 = data.subsequentLevels3 ? data.subsequentLevels3.length : 0;
  const l4 = data.subsequentLevels4 ? data.subsequentLevels4.length : 0;
  const levelsCount = Math.max(l1, l2, l3, l4);
  
  let beamsCount = data.beams.length;
  if (data.type === 'mobile') {
     // Add count of chassis configs
     beamsCount += (data.mobileChassisConfigs?.length || 0); 
  }

  const totalHeight = 
    HEADER_HEIGHT +
    ROW_1_HEIGHT +
    (levelsCount * LEVEL_ROW_HEIGHT) +
    TITLE_BAR_HEIGHT +
    BEAM_HEADER_HEIGHT +
    (beamsCount * BEAM_ROW_HEIGHT) +
    FRAME_ROW_HEIGHT +
    LOAD_ROW_HEIGHT +
    RACK_HEIGHT_ROW +
    FOOTER_HEIGHT + 
    BASE_MARGINS;

  return totalHeight;
};

// --- DOCX GENERATION ---

// Styles helpers (Half-points: 20 = 10pt)
const boldText = (text: string | number, size: number = 20, color: string = "000000") => new TextRun({ 
  text: String(text), 
  bold: true, 
  size: size, 
  font: "Arial", 
  color: color 
});
const normalText = (text: string | number, size: number = 20, color: string = "000000") => new TextRun({ text: String(text), size: size, font: "Arial", color: color });
const unitText = (text: string, size: number = 16) => new TextRun({ text: ` ${text}`, size: size, font: "Arial", color: "444444", bold: true });

const symbolText = (text: string, size: number = 18, color: string = "000000") => {
  const parts = text.split('_');
  if (parts.length === 1) return [boldText(text, size, color)];
  return [
    boldText(parts[0], size, color),
    new TextRun({ text: parts[1], size: Math.round(size * 0.75), color, bold: true, font: "Arial", subScript: true })
  ];
};

// Border Style Constant
const THICK_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" }; // 4 = 1/2 pt in docx terms, visually looks like 2px
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 2, color: "000000" };

const createCell = (
  content: Paragraph[], 
  widthPercent: number, 
  shading: string = "FFFFFF", 
  borders: { top?: any, bottom?: any, left?: any, right?: any } = {},
  verticalMerge?: "restart" | "continue"
) => {
  return new TableCell({
    children: content,
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: shading },
    verticalAlign: VerticalAlign.CENTER,
    verticalMerge: verticalMerge,
    margins: { top: 30, bottom: 30, left: 60, right: 60 }, // Reduced margins
    borders: {
      top: borders.top || THIN_BORDER,
      bottom: borders.bottom || THIN_BORDER,
      left: borders.left || THIN_BORDER,
      right: borders.right || THIN_BORDER,
    }
  });
};

const createPlateTables = (data: PlateData): (Table | Paragraph)[] => {
  const formattedDate = formatMonthYear(data.nextInspectionDate);
  const tables: (Table | Paragraph)[] = [];

  // --- 1. HEADER TABLE ---
  const headerRows: TableRow[] = [];
  headerRows.push(new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({ children: [boldText("ROK INSTALACJI", 14, "444444")], alignment: AlignmentType.LEFT }),
          new Paragraph({ children: [boldText(data.installationYear, 32)], alignment: AlignmentType.LEFT }),
        ],
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders: { 
          top: THICK_BORDER, left: THICK_BORDER, right: THIN_BORDER, bottom: THIN_BORDER 
        },
        margins: { top: 240, bottom: 20, left: 60, right: 60 }
      }),
      new TableCell({
        children: [
          new Paragraph({ 
            children: [
              ...(data.rackNumber ? [boldText(`NR: ${data.rackNumber}  `, 20)] : []),
              boldText(data.customerName.toUpperCase(), 20)
            ], 
            alignment: AlignmentType.RIGHT 
          }),
          new Paragraph({ 
            children: [
              normalText("PROJEKT: ", 14, "444444"),
              boldText(data.projectNumber, 18),
              normalText(`  SAP: 46120${data.sapNumberSuffix}`, 14, "444444")
            ], 
            alignment: AlignmentType.RIGHT 
          }),
        ],
        width: { size: 60, type: WidthType.PERCENTAGE },
        borders: { 
          top: THICK_BORDER, left: THIN_BORDER, right: THICK_BORDER, bottom: THIN_BORDER 
        },
        margins: { top: 240, bottom: 20, left: 60, right: 60 }
      })
    ]
  }));

  tables.push(new Table({
    rows: headerRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  }));


  // --- 2. BODY LOGIC ---
  if (data.type === 'cantilever') {
    // ... Existing Cantilever Logic, but wrapped in a separate table for consistency ...
    const cRows: TableRow[] = [];
    const margins = { top: THIN_BORDER, bottom: THIN_BORDER, left: THICK_BORDER, right: THICK_BORDER };

    // Height
    cRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("WYSOKOŚĆ REGAŁU", 16, "444444")] })], 65, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText(data.cantileverHeight, 22), unitText("mm", 16)], alignment: AlignmentType.CENTER })], 35, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));
    // Profile
    cRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("PROFIL SŁUPA / STOPY", 16, "444444")] })], 65, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText(data.cantileverColumnProfile, 22)], alignment: AlignmentType.CENTER })], 35, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));
    // Load
    cRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("OBCIĄŻENIE 1 STRONY SŁUPA", 16, "444444")] })], 65, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText(data.cantileverColumnLoad, 22), unitText("kg", 16)], alignment: AlignmentType.CENTER })], 35, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));
    // Section Header
    cRows.push(new TableRow({
      children: [createCell([new Paragraph({ children: [boldText("KONFIGURACJA RAMION", 14)], alignment: AlignmentType.CENTER })], 100, "FFFFFF", { ...margins, top: THICK_BORDER, bottom: THICK_BORDER })]
    }));
    // Arms Header
    cRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("PROFIL", 14, "444444")], alignment: AlignmentType.CENTER })], 34, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("DŁUGOŚĆ", 14, "444444")], alignment: AlignmentType.CENTER })], 33, "FFFFFF", { ...margins, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("MAX. OBC.", 14, "444444")], alignment: AlignmentType.CENTER })], 33, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));
    // Arms
    data.cantileverArms.forEach(arm => {
      cRows.push(new TableRow({
        children: [
          createCell([new Paragraph({ children: [boldText(arm.profile, 18)], alignment: AlignmentType.CENTER })], 34, "FFFFFF", { ...margins, right: THIN_BORDER }),
          createCell([new Paragraph({ children: [boldText(arm.length, 18), unitText("mm", 14)], alignment: AlignmentType.CENTER })], 33, "FFFFFF", { ...margins, left: THIN_BORDER, right: THIN_BORDER }),
          createCell([new Paragraph({ children: [boldText(arm.maxLoad, 18), unitText("kg", 14)], alignment: AlignmentType.CENTER })], 33, "FFFFFF", { ...margins, left: THIN_BORDER })
        ]
      }));
    });

    tables.push(new Table({
      rows: cRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

  } else if (data.type === 'gravity') {
    const gRows: TableRow[] = [];
    const margins = { top: THIN_BORDER, bottom: THIN_BORDER, left: THICK_BORDER, right: THICK_BORDER };

    // Frames
    const framesText = (data.gravityFrames || []).map(f => {
      const prefix = f.style === 'stl' ? "STL'B" : "STD'B";
      const guts = f.style === 'stl' 
        ? `'${f.type}'${f.height}`
        : `'${f.type}'${f.depth}'${f.height}`;
      return `${f.multiplier > 1 ? f.multiplier + 'x ' : ''}${prefix}${guts}`;
    }).join(' oraz ');
    
    gRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("TYP RAM", 16, "444444")] })], 40, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText(framesText, 18)], alignment: AlignmentType.CENTER })], 60, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));

    // Beams Header
    gRows.push(new TableRow({
      children: [createCell([new Paragraph({ children: [boldText("KONFIGURACJA TRAWERSÓW", 14)], alignment: AlignmentType.CENTER })], 100, "F2F2F2", { ...margins, top: THICK_BORDER, bottom: THIN_BORDER })]
    }));

    // Beams
    data.beams.forEach((beam, idx) => {
      gRows.push(new TableRow({
        children: [
          createCell([new Paragraph({ children: [boldText("TYPY TRAWERSÓW", 16, "444444")], alignment: AlignmentType.CENTER })], 40, "FFFFFF", { ...margins, right: THIN_BORDER }, idx === 0 ? "restart" : "continue"),
          createCell([new Paragraph({ children: [boldText(`${beam.profileType} L=${beam.length}`, 18)], alignment: AlignmentType.CENTER })], 60, "FFFFFF", { ...margins, left: THIN_BORDER })
        ]
      }));
    });

    // Pallet Header
    gRows.push(new TableRow({
      children: [createCell([new Paragraph({ children: [boldText("OPIS PALETY", 14)], alignment: AlignmentType.CENTER })], 100, "F2F2F2", { ...margins, top: THIN_BORDER, bottom: THIN_BORDER })]
    }));

    // Pallet Info
    gRows.push(new TableRow({
      children: [
        createCell([
          new Paragraph({ children: symbolText("D_PAL", 16, "444444"), alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [boldText(data.gravityPalletDepth || 0, 17), unitText("mm", 12)], alignment: AlignmentType.CENTER })
        ], 25, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([
          new Paragraph({ children: symbolText("B_PAL", 16, "444444"), alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [boldText(data.gravityPalletWidth || 0, 17), unitText("mm", 12)], alignment: AlignmentType.CENTER })
        ], 25, "FFFFFF", { ...margins, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([
          new Paragraph({ children: symbolText("H_PAL", 16, "444444"), alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [boldText(data.gravityPalletHeight || 0, 17), unitText("mm", 12)], alignment: AlignmentType.CENTER })
        ], 25, "FFFFFF", { ...margins, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([
          new Paragraph({ children: symbolText("Q_PAL", 16, "444444"), alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [boldText(data.gravityPalletWeight || 0, 17), unitText("kg", 12)], alignment: AlignmentType.CENTER })
        ], 25, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));

    // Rack Header
    gRows.push(new TableRow({
      children: [createCell([new Paragraph({ children: [boldText("OPIS REGAŁU", 14)], alignment: AlignmentType.CENTER })], 100, "F2F2F2", { ...margins, top: THIN_BORDER, bottom: THIN_BORDER })]
    }));

    // Rack Info
    gRows.push(new TableRow({
      children: [
        createCell([
          new Paragraph({ children: [boldText("LICZBA POZIOMÓW", 14, "444444")] }),
          new Paragraph({ children: [...symbolText("N_POZ", 18, "000000"), boldText(` = ${data.gravityLevelsCount || 0}`, 18, "000000")], alignment: AlignmentType.CENTER })
        ], 50, "FFFFFF", { ...margins, right: THIN_BORDER }),
        createCell([
          new Paragraph({ children: [boldText("PALET NA KANAŁ", 14, "444444")] }),
          new Paragraph({ children: [...symbolText("N_PAL", 18, "000000"), boldText(` = ${data.gravityPalletsPerChannel || 0}`, 18, "000000")], alignment: AlignmentType.CENTER })
        ], 50, "FFFFFF", { ...margins, left: THIN_BORDER })
      ]
    }));

    tables.push(new Table({
      rows: gRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

  } else {
    // --- PALLET / MOBILE / SHELF ---
    
    // 1. CONFIGURATION TABLE (Levels)
    const activeConfigs: { h1: number | undefined, levels: LevelConfig[] | undefined, label: string }[] = [];
    activeConfigs.push({ h1: data.firstLevelHeight, levels: data.subsequentLevels, label: 'A' });
    if (data.firstLevelHeight2 !== undefined) activeConfigs.push({ h1: data.firstLevelHeight2, levels: data.subsequentLevels2, label: 'B' });
    if (data.firstLevelHeight3 !== undefined) activeConfigs.push({ h1: data.firstLevelHeight3, levels: data.subsequentLevels3, label: 'C' });
    if (data.firstLevelHeight4 !== undefined) activeConfigs.push({ h1: data.firstLevelHeight4, levels: data.subsequentLevels4, label: 'D' });

    const configCount = activeConfigs.length;
    let labelWidthPct = 40;
    let valWidthPct = 60; // Total available for values

    if (configCount === 2) { labelWidthPct = 40; valWidthPct = 60; } // 30 each
    else if (configCount === 3) { labelWidthPct = 37; valWidthPct = 63; } // 21 each
    else if (configCount === 4) { labelWidthPct = 36; valWidthPct = 64; } // 16 each

    const perConfigWidth = Math.floor(valWidthPct / configCount);
    // adjust label slightly to absorb rounding
    labelWidthPct = 100 - (perConfigWidth * configCount);

    const configRows: TableRow[] = [];
    const sideBorders = { left: THICK_BORDER, right: THICK_BORDER };

    // Row 1: Max Height
    const row1Cells: TableCell[] = [];
    // Label Cell
    row1Cells.push(createCell(
      [new Paragraph({ children: [boldText("MAX. WYSOKOŚĆ 1. POZIOMU", 16, "444444")], alignment: AlignmentType.LEFT })], 
      labelWidthPct, 
      "FFFFFF", 
      { ...sideBorders, right: THIN_BORDER }
    ));

    activeConfigs.forEach((cfg, idx) => {
      const isLast = idx === configCount - 1;
      const content = [
        configCount > 1 ? boldText("A= ", 18, "000000") : null,
        boldText(cfg.h1 || 0, 22), 
        unitText("mm", 14)
      ].filter(Boolean) as TextRun[];

      if (data.type === 'mobile' && data.mobileChassisHeight && configCount === 1) {
         content.push(normalText(` (+podwozie ${data.mobileChassisHeight})`, 12, "444444"));
      }

      row1Cells.push(createCell(
        [new Paragraph({ children: content, alignment: AlignmentType.CENTER })], 
        perConfigWidth, 
        "FFFFFF",
        { 
          ...sideBorders, 
          left: THIN_BORDER, 
          right: isLast ? THICK_BORDER : THIN_BORDER 
        }
      ));
    });
    configRows.push(new TableRow({ children: row1Cells }));

    // Subsequent Levels Rows
    const maxRows = Math.max(...activeConfigs.map(c => c.levels ? c.levels.length : 0));
    for (let i = 0; i < maxRows; i++) {
        const levelCells: TableCell[] = [];
        // Label
        levelCells.push(createCell(
          [new Paragraph({ children: [boldText(i === 0 ? "KOLEJNE POZIOMY" : "", 16, "444444")], alignment: AlignmentType.LEFT })], 
          labelWidthPct, 
          "FFFFFF", 
          { ...sideBorders, right: THIN_BORDER }
        ));

        activeConfigs.forEach((cfg, idx) => {
           const l = cfg.levels?.[i];
           const isLast = idx === configCount - 1;
           const content = l ? [
             boldText(`${getLevelLabel(l, 'A')}= `, 16, "444444"), 
             boldText(l.height, 22), 
             unitText("mm", 14)
           ] : [];
           
           levelCells.push(createCell(
             [new Paragraph({ children: content, alignment: AlignmentType.CENTER })], 
             perConfigWidth, 
             "FFFFFF", 
             { ...sideBorders, left: THIN_BORDER, right: isLast ? THICK_BORDER : THIN_BORDER }
           ));
        });
        configRows.push(new TableRow({ children: levelCells }));
    }

    tables.push(new Table({ rows: configRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

    // 2. SEPARATOR (Beam Header Title)
    tables.push(new Table({
      rows: [new TableRow({ children: [createCell([new Paragraph({ children: [boldText("MAKSYMALNE OBCIĄŻENIE PARY TRAWERSÓW", 14)], alignment: AlignmentType.CENTER })], 100, "FFFFFF", { top: THICK_BORDER, bottom: THICK_BORDER, left: THICK_BORDER, right: THICK_BORDER })] })],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));

    // 3. BEAMS TABLE (Fixed 15/15/35/35)
    const beamRows: TableRow[] = [];
    const beamCols = [15, 15, 35, 35];
    const beamBorders = { left: THICK_BORDER, right: THICK_BORDER };

    // Header
    beamRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("POZIOM", 14, "444444")], alignment: AlignmentType.CENTER })], beamCols[0], "FFFFFF", { ...beamBorders, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("DŁ. (L)", 14, "444444")], alignment: AlignmentType.CENTER })], beamCols[1], "FFFFFF", { ...beamBorders, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("PROFIL", 14, "444444")], alignment: AlignmentType.CENTER })], beamCols[2], "FFFFFF", { ...beamBorders, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("MAX. OBCIĄŻENIE", 14, "444444")], alignment: AlignmentType.CENTER })], beamCols[3], "FFFFFF", { ...beamBorders, left: THIN_BORDER }),
      ]
    }));

    // Mobile Chassis
    if (data.type === 'mobile' && data.mobileChassisConfigs) {
      data.mobileChassisConfigs.forEach(chassis => {
        const chassisQmax = (chassis.loadCount || 0) * (chassis.loadWeight || 0);
        beamRows.push(new TableRow({
          children: [
            createCell([new Paragraph({ children: [boldText("PODWOZIE", 14)], alignment: AlignmentType.CENTER })], beamCols[0], "E6F3FF", { ...beamBorders, right: THIN_BORDER }),
            createCell([new Paragraph({ children: [boldText(chassis.length || 0, 22), unitText("mm", 16)], alignment: AlignmentType.CENTER })], beamCols[1], "E6F3FF", { ...beamBorders, left: THIN_BORDER, right: THIN_BORDER }),
            createCell([new Paragraph({ children: [boldText("PODWOZIE", 20)], alignment: AlignmentType.CENTER })], beamCols[2], "E6F3FF", { ...beamBorders, left: THIN_BORDER, right: THIN_BORDER }),
            createCell([new Paragraph({ children: [boldText(`Qmax= ${chassisQmax}`, 22), unitText("kg", 16), normalText(` (${chassis.loadCount}x${chassis.loadWeight})`, 12, "444444")], alignment: AlignmentType.CENTER })], beamCols[3], "E6F3FF", { ...beamBorders, left: THIN_BORDER }),
          ]
        }));
      });
    }

    // Beams
    data.beams.forEach(beam => {
      const qMax = calculateQmax(beam.loadCount, beam.loadWeight);
      beamRows.push(new TableRow({
        children: [
          createCell([new Paragraph({ children: [boldText(beam.levelLabel, 18)], alignment: AlignmentType.CENTER })], beamCols[0], "FFFFFF", { ...beamBorders, right: THIN_BORDER }),
          createCell([new Paragraph({ children: [boldText(beam.length, 22), unitText("mm", 16)], alignment: AlignmentType.CENTER })], beamCols[1], "FFFFFF", { ...beamBorders, left: THIN_BORDER, right: THIN_BORDER }),
          createCell([new Paragraph({ children: [boldText(`AUF'B'${beam.profileType}`, 22), normalText(` (${beam.profileWidth}x50)`, 16, "444444")], alignment: AlignmentType.CENTER })], beamCols[2], "FFFFFF", { ...beamBorders, left: THIN_BORDER, right: THIN_BORDER }),
          createCell([new Paragraph({ children: [boldText(`Qmax= ${qMax}`, 22), unitText("kg", 16), normalText(` (${beam.loadCount}x${beam.loadWeight})`, 12, "444444")], alignment: AlignmentType.CENTER })], beamCols[3], "FFFFFF", { ...beamBorders, left: THIN_BORDER }),
        ]
      }));
    });

    tables.push(new Table({ rows: beamRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

    // 4. FRAME INFO (30/70)
    const frameRows: TableRow[] = [];
    const frameText1 = `STD'B'${data.frameType}'${data.frameDepth}'${data.frameHeight}`;
    const frameText2 = data.frameType2 ? ` oraz STD'B'${data.frameType2}'${data.frameDepth2}'${data.frameHeight2}` : '';
    
    frameRows.push(new TableRow({
      children: [
         createCell([new Paragraph({ children: [boldText("RAMA", 16, "444444")], alignment: AlignmentType.CENTER })], 30, "FFFFFF", { top: THICK_BORDER, left: THICK_BORDER, right: THIN_BORDER, bottom: THIN_BORDER }),
         createCell([new Paragraph({ children: [boldText(frameText1 + frameText2, 22)], alignment: AlignmentType.CENTER })], 70, "FFFFFF", { top: THICK_BORDER, left: THIN_BORDER, right: THICK_BORDER, bottom: THIN_BORDER }),
      ]
    }));
    tables.push(new Table({ rows: frameRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

    // 5. TOTALS (60 / 10 / 30)
    const totalRows: TableRow[] = [];
    const totalBayLoad = calculateMaxBayLoad(data);
    const uniqueHeights = getUniqueRackHeights(data);
    const totalBorders = { left: THICK_BORDER, right: THICK_BORDER };

    // Max Bay Load
    totalRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("MAX. OBCIĄŻENIE POLA", 16, "444444")] })], 60, "FFFFFF", { ...totalBorders, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("Qp=", 18, "444444")], alignment: AlignmentType.CENTER })], 10, "FFFFFF", { ...totalBorders, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText(totalBayLoad, 24), unitText("kg", 18)], alignment: AlignmentType.CENTER })], 30, "FFFFFF", { ...totalBorders, left: THIN_BORDER }),
      ]
    }));
    // Height
    totalRows.push(new TableRow({
      children: [
        createCell([new Paragraph({ children: [boldText("WYSOKOŚĆ REGAŁU", 16, "444444")] })], 60, "FFFFFF", { ...totalBorders, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText("H=", 18, "444444")], alignment: AlignmentType.CENTER })], 10, "FFFFFF", { ...totalBorders, left: THIN_BORDER, right: THIN_BORDER }),
        createCell([new Paragraph({ children: [boldText(uniqueHeights, 24), unitText("mm", 18)], alignment: AlignmentType.CENTER })], 30, "FFFFFF", { ...totalBorders, left: THIN_BORDER }),
      ]
    }));
    tables.push(new Table({ rows: totalRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  }

  // --- 3. FOOTER TABLE ---
  const footerRows: TableRow[] = [];
  footerRows.push(new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({ children: [boldText("ADRES DOSTAWCY:", 14, "444444")] }),
          new Paragraph({ children: [normalText("Jungheinrich Polska Sp. Z o.o.", 14)] }),
          new Paragraph({ children: [normalText("ul. Świerkowa 3 Bronisze, 05-850 Ożarów Mazowiecki", 14)] }),
        ],
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: { top: THICK_BORDER, left: THICK_BORDER, right: THIN_BORDER, bottom: THICK_BORDER },
        margins: { top: 60, bottom: 20, left: 60, right: 60 }
      }),
      new TableCell({
        children: [
          new Paragraph({ children: [boldText("NASTĘPNY PRZEGLĄD TECHNICZNY", 14, "555555")], alignment: AlignmentType.LEFT }),
          new Paragraph({ children: [boldText(formattedDate, 32)], alignment: AlignmentType.LEFT }),
        ],
        width: { size: 55, type: WidthType.PERCENTAGE },
        borders: { top: THICK_BORDER, left: THIN_BORDER, right: THICK_BORDER, bottom: THICK_BORDER },
        margins: { top: 60, bottom: 20, left: 60, right: 60 }
      })
    ]
  }));

  tables.push(new Table({
    rows: footerRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  }));

  return [
    new Paragraph({ children: [] }), // Gap
    ...tables,
    new Paragraph({ children: [], pageBreakBefore: true }) // Page break after plate
  ];
};

export const createDocxBlob = async (plates: PlateData[]): Promise<Blob> => {
  const allChildren: (Table | Paragraph)[] = [];
  plates.forEach(plate => {
    const tableNodes = createPlateTables(plate);
    allChildren.push(...tableNodes);
  });
  
  // Use margins from the first plate if available
  const firstPlate = plates[0];
  const topMarginMm = firstPlate?.topMargin ?? 5;
  const topMarginTwips = Math.round(topMarginMm * 56.7); // 1mm = 56.7 twips
  const defaultMargin = Math.round(10 * 56.7); // 10mm default for side/bottom

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: topMarginTwips,
            right: defaultMargin,
            bottom: defaultMargin,
            left: defaultMargin
          }
        }
      },
      children: allChildren
    }]
  });
  return await Packer.toBlob(doc);
};
