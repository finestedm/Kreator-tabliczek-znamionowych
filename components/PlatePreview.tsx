
import React from 'react';
import { PlateData, LevelConfig } from '../types';
import { calculateQmax, calculateMaxBayLoad, formatMonthYear, calculateTotalHeight, getLevelLabel, getUniqueRackHeights } from '../utils';

interface Props {
  data: PlateData;
}

const ShelfPlate: React.FC<Props> = ({ data }) => {
  const rowClass = "flex border-b border-black last:border-b-0 min-h-[5.5mm] items-center";
  const labelColClass = "w-1/2 border-r border-black px-1.5 py-0.5 text-[8.5px] font-bold text-gray-900 uppercase leading-tight";
  const valueColClass = "w-1/2 px-1.5 py-0.5 text-[10px] font-bold text-black text-right leading-tight";
  const valueColClassLarge = "w-1/2 px-1.5 py-0.5 text-[11px] font-bold text-black text-right leading-tight"; // Slightly larger for Project/SAP
  const formattedDate = formatMonthYear(data.nextInspectionDate);

  return (
    <div 
      className="bg-white border-2 border-black font-technical box-border overflow-hidden flex flex-col plate-container"
      style={{ 
        width: '62mm', 
        height: '88mm', 
        pageBreakInside: 'avoid',
        breakInside: 'avoid-page',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }}
    >
      <div className="bg-white text-black text-center pt-5 pb-1 px-1 shrink-0 overflow-hidden border-b-2 border-black">
        <div className="text-[7px] font-bold uppercase tracking-widest text-gray-700">Regał Półkowy</div>
        <div className="text-[10px] font-bold uppercase truncate">{data.customerName || "Brak Nazwy"}</div>
      </div>

      <div className="flex flex-col flex-1">
        <div className={rowClass}>
          <div className={labelColClass}>Rok instalacji</div>
          <div className={valueColClass}>{data.installationYear}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Nr Projektu</div>
          <div className={valueColClassLarge}>{data.projectNumber}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>SAP</div>
          <div className={valueColClassLarge}>46120{data.sapNumberSuffix}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Półka</div>
          <div className={valueColClass}>{data.shelfDimensions}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Wypełnienie</div>
          <div className={valueColClass}>{data.shelfFilling}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Rama</div>
          <div className={valueColClass}>{data.shelfFrameDimensions}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Ilość poziomów</div>
          <div className={valueColClass}>{data.shelfLevelsCount}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Max obciążenie poziomu</div>
          <div className={valueColClass}>{data.shelfMaxLevelLoad}</div>
        </div>
        <div className={rowClass}>
          <div className={labelColClass}>Max obciążenie ramy</div>
          <div className={valueColClass}>{data.shelfMaxFrameLoad}</div>
        </div>
        <div className={`${rowClass} bg-gray-50 flex-1 items-start py-1`}>
          <div className={labelColClass}>Dostawca</div>
          <div className="w-1/2 px-1.5 text-[6.5px] leading-[1.1] text-right font-bold text-black flex flex-col gap-0.5">
            <div>Jungheinrich Polska Sp. Z o.o.</div>
            <div>ul. Świerkowa 3 Bronisze, 05-850 Ożarów Mazowiecki</div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-black bg-white p-1 shrink-0">
        <div className="text-[7px] font-bold uppercase text-gray-700 mb-0.5 leading-none">Następny przegląd techniczny</div>
        <div className="text-sm font-bold text-black text-center leading-none">{formattedDate}</div>
      </div>
    </div>
  );
};

const CantileverPlate: React.FC<Props> = ({ data }) => {
  const borderOuter = "border-2 border-black";
  const borderInner = "border-b border-black last:border-b-0";
  const borderRight = "border-r border-black";
  const unitClass = "text-[9px] text-gray-600 font-bold ml-0.5 leading-none";
  const labelClass = "text-gray-800 font-bold uppercase tracking-tight";
  const formattedDate = formatMonthYear(data.nextInspectionDate);

  return (
    <div 
      className="bg-white text-black font-technical box-border flex flex-col plate-container"
      style={{ 
        width: '94mm', 
        minHeight: 'auto', 
        height: 'auto',
        margin: '0 auto',
        padding: '0',
        pageBreakInside: 'avoid',
        breakInside: 'avoid-page',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }}
    >
      {/* Header - Adjusted for no overlap */}
      <div className="flex justify-between items-start px-2 pt-5 pb-1 shrink-0 bg-white min-h-[14mm]">
        <div className="flex flex-col justify-center">
           <span className="text-[8px] uppercase text-gray-800 font-bold leading-none mb-0.5">Rok instalacji</span>
           <span className="text-lg font-bold leading-none">{data.installationYear}</span>
        </div>
        <div className="text-right flex flex-col items-end justify-start flex-1 ml-2">
           <div className="flex flex-col items-end leading-none">
              <span className="text-sm font-bold uppercase text-black mb-0.5">{data.customerName}</span>
              {data.rackNumber && (
                <span className="text-xs font-bold text-gray-900">NR: {data.rackNumber}</span>
              )}
           </div>
           <div className="text-[8px] leading-tight mt-1 text-gray-800">
             PROJEKT: <b className="text-[10px] text-black">{data.projectNumber}</b> <span className="ml-1">SAP: <b className="text-[10px] text-black">46120{data.sapNumberSuffix}</b></span>
           </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className={`w-full ${borderOuter} flex flex-col text-sm mx-0.5 mb-0.5 self-center max-w-[98%] bg-white`}>
        
        {/* Rack Height */}
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[65%] px-2 py-0.5 flex items-center ${borderRight}`}>
            <span className={`text-[9px] ${labelClass}`}>Wysokość Regału</span>
          </div>
          <div className={`w-[35%] px-1 py-0.5 text-center flex items-baseline justify-center`}>
            <span className="text-base font-bold leading-none">{data.cantileverHeight}<span className={unitClass}>mm</span></span>
          </div>
        </div>

        {/* Column Profile */}
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[65%] px-2 py-0.5 flex items-center ${borderRight}`}>
            <span className={`text-[9px] ${labelClass}`}>Profil Słupa / Stopy</span>
          </div>
          <div className={`w-[35%] px-1 py-0.5 text-center flex items-baseline justify-center`}>
            <span className="text-base font-bold leading-none">{data.cantileverColumnProfile}</span>
          </div>
        </div>

        {/* Column Load */}
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[65%] px-2 py-0.5 flex items-center ${borderRight}`}>
            <span className={`text-[9px] ${labelClass}`}>Obciążenie 1 strony słupa</span>
          </div>
          <div className={`w-[35%] px-1 py-0.5 text-center flex items-baseline justify-center`}>
            <span className="text-base font-bold leading-none">{data.cantileverColumnLoad}<span className={unitClass}>kg</span></span>
          </div>
        </div>

        {/* Arms Header */}
        <div className={`bg-white text-black text-center py-0.5 text-[8px] uppercase tracking-tighter shrink-0 font-extrabold border-t-2 border-b-2 border-black leading-none`}>
          Konfiguracja Ramion
        </div>
        <div className={`flex border-b border-black shrink-0 bg-white text-[8px] uppercase font-bold text-gray-800`}>
          <div className={`w-[34%] text-center py-0.5 ${borderRight}`}>Profil</div>
          <div className={`w-[33%] text-center py-0.5 ${borderRight}`}>Długość</div>
          <div className={`w-[33%] text-center py-0.5`}>Max. Obc.</div>
        </div>

        {/* Arms Data */}
        <div className="flex flex-col shrink-0">
          {data.cantileverArms.map((arm) => (
            <div key={arm.id} className={`flex border-b border-black last:border-b-0`}>
              <div className={`w-[34%] flex justify-center items-center px-1 py-0.5 text-xs font-bold ${borderRight} leading-none`}>
                 {arm.profile}
              </div>
              <div className={`w-[33%] flex justify-center items-baseline px-1 py-0.5 text-xs font-bold ${borderRight} leading-none`}>
                {arm.length}<span className={unitClass}>mm</span>
              </div>
              <div className={`w-[33%] flex justify-center items-baseline px-1 py-0.5 text-xs font-bold leading-none`}>
                {arm.maxLoad}<span className={unitClass}>kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

       {/* Footer Address and Inspection */}
       <div className={`w-[98%] mx-auto flex border-t-2 border-black h-[9mm] shrink-0 mb-1 bg-white relative z-10 mt-2`}>
        <div className={`w-[50%] pr-1 pt-1 pb-0.5 text-[7px] leading-tight flex flex-col justify-center border-r border-black/10 pl-1`}>
          <div className="font-bold mb-[1px] text-gray-800 uppercase text-[7px]">Adres Dostawcy:</div>
          <div className="font-normal text-black leading-none">
            Jungheinrich Polska Sp. Z o.o.
          </div>
          <div className="font-normal text-black leading-none mt-[1px]">
            ul. Świerkowa 3 Bronisze, 05-850 Ożarów Mazowiecki
          </div>
        </div>
        <div className={`w-[50%] pl-2 py-0.5 flex flex-col justify-center`}>
          <div className="text-[7px] font-bold uppercase tracking-wide text-gray-600">Następny przegląd</div>
          <div className="text-lg font-bold text-black tracking-tight leading-none">{formattedDate}</div>
        </div>
      </div>
    </div>
  );
};


const PalletPlate: React.FC<Props> = ({ data }) => {
  const borderOuter = "border-2 border-black";
  const borderInner = "border-b border-black last:border-b-0";
  const borderRight = "border-r border-black";
  
  const totalBayLoad = calculateMaxBayLoad(data);
  const formattedDate = formatMonthYear(data.nextInspectionDate);
  // Replaced single height calculation with unique heights logic
  const rackHeights = getUniqueRackHeights(data);
  const isMobile = data.type === 'mobile';

  // Determine active configs for columns
  const activeConfigs: { h1: number | undefined, levels: LevelConfig[] | undefined, label: string }[] = [];
  activeConfigs.push({ h1: data.firstLevelHeight, levels: data.subsequentLevels, label: 'A' });
  if (data.firstLevelHeight2 !== undefined) activeConfigs.push({ h1: data.firstLevelHeight2, levels: data.subsequentLevels2, label: 'B' });
  if (data.firstLevelHeight3 !== undefined) activeConfigs.push({ h1: data.firstLevelHeight3, levels: data.subsequentLevels3, label: 'C' });
  if (data.firstLevelHeight4 !== undefined) activeConfigs.push({ h1: data.firstLevelHeight4, levels: data.subsequentLevels4, label: 'D' });

  const configCount = activeConfigs.length;
  
  // Calculate dynamic column widths - OPTIMIZED FOR MORE VALUE SPACE
  // If 1 config: Label 40%, Val 60%
  // If 2 configs: Label 40%, Val 30% each
  // If 3 configs: Label 37%, Val 21% each
  // If 4 configs: Label 36%, Val 16% each
  let labelWidth = '40%';
  let valWidth = '60%';
  if (configCount === 2) {
    labelWidth = '40%';
    valWidth = '30%';
  } else if (configCount === 3) {
    labelWidth = '37%';
    valWidth = '21%';
  } else if (configCount === 4) {
    labelWidth = '36%';
    valWidth = '16%';
  }

  const maxRows = Math.max(...activeConfigs.map(c => c.levels ? c.levels.length : 0));
  const rows = Array.from({ length: maxRows }, (_, i) => i);

  const unitClass = "text-[9px] text-gray-600 font-bold ml-0.5 leading-none";
  const labelClass = "text-gray-800 font-bold uppercase tracking-tight";
  const levelLabelClass = "text-xs font-bold text-gray-900 mr-2";

  return (
    <div 
      className="bg-white text-black font-technical box-border flex flex-col plate-container"
      style={{ 
        width: '190mm', 
        minHeight: '50mm',
        margin: '0 auto',
        padding: '0',
        pageBreakInside: 'avoid',
        breakInside: 'avoid-page',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }}
    >
      {/* Header - Increased height and padding to prevent clipping */}
      <div className="flex justify-between items-end px-3 pt-3.5 pb-0.5 shrink-0 h-[10.5mm]">
        <div className="flex flex-col justify-center">
           <span className="text-[9px] uppercase text-gray-800 font-bold leading-none mb-0.5">Rok instalacji</span>
           <span className="text-xl font-bold leading-none">{data.installationYear}</span>
        </div>
        <div className="text-right flex flex-col items-end justify-center">
           <div className="flex items-baseline gap-4">
              {data.rackNumber && (
                <span className="text-lg font-bold">NR: {data.rackNumber}</span>
              )}
              <span className="text-base font-bold uppercase">{data.customerName}</span>
           </div>
           <div className="text-[9px] leading-tight mt-0.5 text-gray-800">
             PROJEKT: <b className="text-[13px] text-black">{data.projectNumber}</b> <span className="ml-2">SAP: <b className="text-[13px] text-black">46120{data.sapNumberSuffix}</b></span>
           </div>
        </div>
      </div>

      {/* Main Table Content - Dynamic Height */}
      <div className={`w-full ${borderOuter} flex flex-col text-sm mx-0.5 mb-0.5 self-center max-w-[99.5%] bg-white`}>
        {/* Row 1: Max height of 1st level */}
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`px-3 py-0 flex items-center ${borderRight}`} style={{ width: labelWidth }}>
            <span className={`text-[10px] ${labelClass}`}>Max. wysokość 1. poziomu</span>
          </div>
          
          {configCount === 1 ? (
             <div className={`px-2 py-0 text-center flex items-center justify-center bg-white`} style={{ width: valWidth }}>
              <span className={levelLabelClass}>A =</span>
              <span className="text-base font-bold leading-none">{data.firstLevelHeight}<span className={unitClass}>mm</span></span>
              {isMobile && data.mobileChassisHeight && (
                 <span className="text-[9px] text-gray-700 font-bold ml-1 whitespace-nowrap leading-none pt-0.5">(+ podwozie {data.mobileChassisHeight}mm)</span>
              )}
            </div>
          ) : (
            activeConfigs.map((cfg, idx) => (
              <div 
                key={idx} 
                className={`px-1 py-0 text-center flex items-center justify-center bg-white ${idx < configCount - 1 ? 'border-r border-black' : ''}`}
                style={{ width: valWidth }}
              >
                <div className="flex items-center justify-center whitespace-nowrap">
                   <span className="text-[11px] font-bold text-gray-900 mr-1">A=</span>
                   <span className="text-sm font-bold leading-none whitespace-nowrap">{cfg.h1}<span className={unitClass}>mm</span></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic Rows: Subsequent Levels */}
        <div className="flex flex-col shrink-0">
          {configCount === 1 ? (
            data.subsequentLevels.map((level, idx) => ( 
              <div key={level.id} className={`flex border-b border-black last:border-b-0`}>
                <div className={`px-3 py-0 flex items-center ${borderRight}`} style={{ width: labelWidth }}>
                  <span className={`text-[10px] ${labelClass}`}>{idx === 0 ? "Kolejne poziomy" : "\u00A0"}</span>
                </div>
                <div className={`px-2 py-0 text-center flex items-center justify-center`} style={{ width: valWidth }}>
                  <span className={levelLabelClass}>{`${getLevelLabel(level, 'A')} =`}</span>
                  <span className="text-base font-bold leading-none">{level.height}<span className={unitClass}>mm</span></span>
                </div>
              </div>
            ))
          ) : (
             rows.map((rowIdx) => (
                <div key={rowIdx} className={`flex border-b border-black last:border-b-0`}>
                  <div className={`px-3 py-0 flex items-center ${borderRight}`} style={{ width: labelWidth }}>
                    <span className={`text-[10px] ${labelClass}`}>{rowIdx === 0 ? "Kolejne poziomy" : "\u00A0"}</span>
                  </div>
                  {activeConfigs.map((cfg, colIdx) => {
                     const level = cfg.levels?.[rowIdx];
                     return (
                      <div 
                        key={colIdx} 
                        className={`px-1 py-0 text-center flex items-center justify-center ${colIdx < configCount - 1 ? 'border-r border-black' : ''}`}
                        style={{ width: valWidth }}
                      >
                         {level && (
                            <div className="flex items-center justify-center whitespace-nowrap">
                               <span className="text-[11px] font-bold mr-1 text-gray-900">{`${getLevelLabel(level, 'A')} =`}</span>
                               <span className="text-sm font-bold leading-none">{level.height}<span className={unitClass}>mm</span></span>
                            </div>
                         )}
                      </div>
                     );
                  })}
                </div>
             ))
          )}
        </div>

        <div className={`bg-white text-black text-center py-0.5 text-[9px] uppercase tracking-tighter shrink-0 font-extrabold border-t-2 border-b-2 border-black leading-none`}>
          Maksymalne obciążenie pary trawersów
        </div>

        {/* Table Header for Beams - Reduced height */}
        <div className={`flex border-b border-black shrink-0 bg-white text-[9px] uppercase font-bold text-gray-800`}>
          <div className={`w-[15%] text-center py-0 ${borderRight}`}>Poziom</div>
          <div className={`w-[15%] text-center py-0 ${borderRight}`}>Dł. (L)</div>
          <div className={`w-[35%] text-center py-0 ${borderRight}`}>Profil</div>
          <div className={`w-[35%] text-center py-0`}>Max. Obciążenie</div>
        </div>

        {/* Dynamic Rows: Beams */}
        <div className="flex flex-col shrink-0">
          {/* MOBILE RACK CHASSIS ROWS */}
          {isMobile && (data.mobileChassisConfigs || []).map(chassis => (
            <div key={chassis.id} className={`flex border-b border-black last:border-b-0 bg-blue-50/30`}>
              <div className={`w-[15%] flex justify-center items-center px-1 text-[10px] font-bold ${borderRight} leading-none uppercase`}>
                 PODWOZIE
              </div>
              <div className={`w-[15%] flex justify-center items-center px-1 ${borderRight}`}>
                <div className="text-base font-bold leading-none">
                  {chassis.length}<span className={unitClass}>mm</span>
                </div>
              </div>
              <div className={`w-[35%] text-center font-bold flex flex-row justify-center items-center gap-1 ${borderRight} leading-none py-0`}>
                <span className="text-[11px] whitespace-nowrap leading-none uppercase text-gray-800">PODWOZIE</span>
              </div>
              <div className={`w-[35%] flex flex-col justify-center items-center px-1 py-0`}>
                <div className="flex flex-row items-baseline gap-3 leading-none">
                  <div className="flex items-baseline text-base font-bold leading-none">
                    <span className="text-[9px] mr-1 text-gray-600">Qmax=</span>
                    {(chassis.loadCount || 0) * (chassis.loadWeight || 0)}<span className={unitClass}>kg</span>
                  </div>
                  <div className="text-[9px] text-gray-600 leading-none font-semibold">
                    {`${chassis.loadCount}x${chassis.loadWeight}`}<span className={unitClass}>kg</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.beams.map((beam) => { 
            const qMax = calculateQmax(beam.loadCount, beam.loadWeight);
            return (
              <div key={beam.id} className={`flex border-b border-black last:border-b-0`}>
                <div className={`w-[15%] flex justify-center items-center px-1 text-sm font-bold ${borderRight} leading-none`}>
                   {beam.levelLabel}
                </div>
                <div className={`w-[15%] flex justify-center items-center px-1 ${borderRight}`}>
                   <div className="text-base font-bold leading-none">
                     {beam.length}<span className={unitClass}>mm</span>
                   </div>
                </div>
                <div className={`w-[35%] text-center font-bold flex flex-row justify-center items-center gap-1 ${borderRight} leading-none py-0`}>
                  <span className="text-base whitespace-nowrap leading-none">{`AUF'B'${beam.profileType}`}</span>
                  <span className="text-[11px] text-gray-600 whitespace-nowrap leading-none">{`(${beam.profileWidth}x50)`}</span>
                </div>
                <div className={`w-[35%] flex flex-col justify-center items-center px-1 py-0`}>
                  <div className="flex flex-row items-baseline gap-3 leading-none">
                    <div className="flex items-baseline text-base font-bold leading-none">
                      <span className="text-[9px] mr-1 text-gray-600">Qmax=</span>
                      {qMax}<span className={unitClass}>kg</span>
                    </div>
                    <div className="text-[9px] text-gray-600 leading-none font-semibold">
                      {`${beam.loadCount}x${beam.loadWeight}`}<span className={unitClass}>kg</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Frame Info */}
        <div className={`flex border-t-2 border-b border-black shrink-0 bg-white`}>
           <div className={`w-[30%] text-center text-[10px] font-bold uppercase py-0 ${borderRight} flex items-center justify-center`}>
             <span className={labelClass}>Rama</span>
           </div>
           <div className={`w-[70%] text-center text-base font-bold py-0 flex flex-wrap items-center justify-center tracking-tight leading-tight px-1`}>
             {`STD'B'${data.frameType}'${data.frameDepth}'${data.frameHeight}`}
             {data.frameType2 && (
               <span className="text-[10px] mx-1 font-normal text-gray-700 lowercase">oraz</span>
             )}
             {data.frameType2 && (
               <span>{`STD'B'${data.frameType2}'${data.frameDepth2}'${data.frameHeight2}`}</span>
             )}
           </div>
        </div>

        {/* Max Bay Load */}
        <div className={`flex border-b border-black shrink-0 bg-white`}>
           <div className={`w-[60%] px-3 text-[10px] font-bold uppercase py-0 ${borderRight} flex items-center leading-none`}>
             <span className={labelClass}>max. obciążenie pola</span>
           </div>
           <div className={`w-[10%] text-center text-xs font-bold py-0 ${borderRight} flex items-center justify-center text-gray-800 leading-none`}>
             Qp=
           </div>
           <div className={`w-[30%] text-center text-lg font-bold py-0 flex items-baseline justify-center leading-none`}>
             {totalBayLoad}<span className={unitClass}>kg</span>
           </div>
        </div>

        {/* Rack Height */}
        <div className={`flex shrink-0 bg-white`}>
           <div className={`w-[60%] px-3 text-[10px] font-bold uppercase py-0 ${borderRight} flex items-center leading-none`}>
             <span className={labelClass}>Wysokość regału</span>
           </div>
           <div className={`w-[10%] text-center text-xs font-bold py-0 ${borderRight} flex items-center justify-center text-gray-800 leading-none`}>
             H=
           </div>
           <div className={`w-[30%] text-center text-lg font-bold py-0 flex items-baseline justify-center leading-none`}>
             {rackHeights}<span className={unitClass}>mm</span>
           </div>
        </div>
      </div>

      {/* Footer Address and Inspection - Compact one-line address */}
      <div className={`w-[99%] mx-auto flex border-black h-[9.5mm] shrink-0 mb-1 bg-white relative z-10 mt-auto`}>
        <div className={`w-[45%] pr-1 pt-1 pb-0.5 text-[8px] leading-tight flex flex-col justify-center border-r border-black/10 pl-2`}>
          <div className="font-bold mb-0.5 text-gray-800 uppercase text-[8px]">Adres Dostawcy:</div>
          <div className="font-normal text-black leading-none">
            Jungheinrich Polska Sp. Z o.o.
          </div>
          <div className="font-normal text-black leading-none mt-[1px]">
            ul. Świerkowa 3 Bronisze, 05-850 Ożarów Mazowiecki
          </div>
        </div>
        <div className={`w-[55%] pl-3 py-0.5 flex flex-col justify-center`}>
          <div className="text-[9px] font-bold uppercase tracking-wide text-gray-600">Następny przegląd techniczny</div>
          <div className="text-xl font-bold text-black tracking-tight leading-none">{formattedDate}</div>
        </div>
      </div>
    </div>
  );
};

const GravityPlate: React.FC<Props> = ({ data }) => {
  const borderOuter = "border-2 border-black";
  const borderInner = "border-b border-black last:border-b-0";
  const borderRight = "border-r border-black";
  const unitClass = "text-[9px] text-gray-600 font-bold ml-0.5 leading-none";
  const labelClass = "text-gray-800 font-bold uppercase tracking-tight";
  const formattedDate = formatMonthYear(data.nextInspectionDate);

  const renderSymbol = (symbol: string) => {
    const parts = symbol.split('_');
    if (parts.length === 1) return symbol;
    return (
      <span className="inline-flex items-baseline">
        {parts[0]}
        <sub className="text-[0.7em] leading-none ml-[1px]">{parts[1]}</sub>
      </span>
    );
  };

  const framesText = (data.gravityFrames || []).map(f => {
    const prefix = f.style === 'stl' ? "STL'B" : "STD'B";
    const guts = f.style === 'stl' 
      ? `'${f.type}'${f.height}`
      : `'${f.type}'${f.depth}'${f.height}`;
    return `${f.multiplier > 1 ? f.multiplier + 'x ' : ''}${prefix}${guts}`;
  }).join(' oraz ');

  return (
    <div 
      className="bg-white text-black font-technical box-border flex flex-col plate-container"
      style={{ 
        width: '94mm', 
        minHeight: 'auto', 
        height: 'auto',
        margin: '0 auto',
        padding: '0',
        pageBreakInside: 'avoid',
        breakInside: 'avoid-page',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start px-2 pt-5 pb-1 shrink-0 bg-white min-h-[14mm]">
        <div className="flex flex-col justify-center">
           <span className="text-[8px] uppercase text-gray-800 font-bold leading-none mb-0.5">Rok instalacji</span>
           <span className="text-lg font-bold leading-none">{data.installationYear}</span>
        </div>
        <div className="text-right flex flex-col items-end justify-start flex-1 ml-2">
           <div className="flex flex-col items-end leading-none">
              <span className="text-sm font-bold uppercase text-black mb-0.5">{data.customerName}</span>
           </div>
           <div className="text-[8px] leading-tight mt-1 text-gray-800">
             PROJEKT: <b className="text-[10px] text-black">{data.projectNumber}</b> <span className="ml-1">SAP: <b className="text-[10px] text-black">46120{data.sapNumberSuffix}</b></span>
           </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className={`w-full ${borderOuter} flex flex-col text-sm mx-0.5 mb-0.5 self-center max-w-[98%] bg-white`}>
        
        {/* Frame Info */}
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[40%] px-2 py-0.5 flex items-center ${borderRight}`}>
            <span className={`text-[9px] ${labelClass}`}>Typ ram</span>
          </div>
          <div className={`w-[60%] px-1 py-1 text-center flex items-center justify-center font-bold text-[10px] leading-tight`}>
            {framesText}
          </div>
        </div>

        {/* Beams Header */}
        <div className={`bg-gray-50 text-black text-center py-0.5 text-[8px] uppercase tracking-tighter shrink-0 font-extrabold border-b border-black leading-none`}>
          Konfiguracja Trawersów
        </div>
        
        {/* Beams Section */}
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[40%] px-2 py-0.5 flex items-center justify-center ${borderRight}`}>
            <span className={`text-[9px] ${labelClass}`}>Typy trawersów</span>
          </div>
          <div className="w-[60%] flex flex-col">
            {data.beams.map((beam, idx) => (
              <div key={beam.id} className={`w-full px-1 py-0.5 text-center flex items-baseline justify-center ${idx < data.beams.length - 1 ? 'border-b border-black' : ''}`}>
                <span className="text-[11px] font-bold leading-none">{beam.profileType} <span className="text-[9px] text-black">L={beam.length}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Pallet Description Header */}
        <div className={`bg-gray-50 text-black text-center py-0.5 text-[8px] uppercase tracking-tighter shrink-0 font-extrabold border-t border-b border-black leading-none`}>
          Opis Palety
        </div>
        
        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[25%] px-1 py-0.5 flex flex-col items-center ${borderRight}`}>
            <span className="text-[9px] text-black font-bold uppercase">{renderSymbol("D_pal")}</span>
            <span className="text-[13px] font-bold">{data.gravityPalletDepth}<span className={unitClass}>mm</span></span>
          </div>
          <div className={`w-[25%] px-1 py-0.5 flex flex-col items-center ${borderRight}`}>
            <span className="text-[9px] text-black font-bold uppercase">{renderSymbol("B_pal")}</span>
            <span className="text-[13px] font-bold">{data.gravityPalletWidth}<span className={unitClass}>mm</span></span>
          </div>
          <div className={`w-[25%] px-1 py-0.5 flex flex-col items-center ${borderRight}`}>
            <span className="text-[9px] text-black font-bold uppercase">{renderSymbol("H_pal")}</span>
            <span className="text-[13px] font-bold">{data.gravityPalletHeight}<span className={unitClass}>mm</span></span>
          </div>
          <div className={`w-[25%] px-1 py-0.5 flex flex-col items-center`}>
            <span className="text-[9px] text-black font-bold uppercase">{renderSymbol("Q_pal")}</span>
            <span className="text-[13px] font-bold">{data.gravityPalletWeight}<span className={unitClass}>kg</span></span>
          </div>
        </div>

        {/* Rack Description Header */}
        <div className={`bg-gray-50 text-black text-center py-0.5 text-[8px] uppercase tracking-tighter shrink-0 font-extrabold border-t border-b border-black leading-none`}>
          Opis Regału
        </div>

        <div className={`flex ${borderInner} shrink-0 bg-white`}>
          <div className={`w-[50%] px-2 py-1 flex items-center justify-between ${borderRight}`}>
            <span className={`text-[9px] ${labelClass}`}>Liczba poziomów</span>
            <span className="text-base font-bold text-black">{renderSymbol("N_poz")} = {data.gravityLevelsCount}</span>
          </div>
          <div className={`w-[50%] px-2 py-1 flex items-center justify-between`}>
            <span className={`text-[9px] ${labelClass}`}>Palet na kanał</span>
            <span className="text-base font-bold text-black">{renderSymbol("N_pal")} = {data.gravityPalletsPerChannel}</span>
          </div>
        </div>
      </div>

       {/* Footer Address and Inspection */}
       <div className={`w-[98%] mx-auto flex border-t-2 border-black h-[9mm] shrink-0 mb-1 bg-white relative z-10 mt-2`}>
        <div className={`w-[50%] pr-1 pt-1 pb-0.5 text-[7px] leading-tight flex flex-col justify-center border-r border-black/10 pl-1`}>
          <div className="font-bold mb-[1px] text-gray-800 uppercase text-[7px]">Adres Dostawcy:</div>
          <div className="font-normal text-black leading-none">Jungheinrich Polska Sp. Z o.o.</div>
          <div className="font-normal text-black leading-none mt-[1px]">ul. Świerkowa 3 Bronisze, 05-850 Ożarów Mazowiecki</div>
        </div>
        <div className={`w-[50%] pl-2 py-0.5 flex flex-col justify-center`}>
          <div className="text-[7px] font-bold uppercase tracking-wide text-gray-600">Następny przegląd</div>
          <div className="text-lg font-bold text-black tracking-tight leading-none">{formattedDate}</div>
        </div>
      </div>
    </div>
  );
};

export const PlatePreview: React.FC<Props> = ({ data }) => {
  if (data.type === 'shelf') {
    return <ShelfPlate data={data} />;
  }
  if (data.type === 'cantilever') {
    return <CantileverPlate data={data} />;
  }
  if (data.type === 'gravity') {
    return <GravityPlate data={data} />;
  }
  // Handles both 'pallet' and 'mobile'
  return <PalletPlate data={data} />;
};
