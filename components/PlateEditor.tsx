
import React from 'react';
import { PlateData, BeamConfig, LevelConfig, BEAM_PROFILES, CantileverArmConfig, IPE_COLUMN_PROFILES, IPE_ARM_PROFILES, MobileChassisConfig } from '../types';
import { Plus, Trash2, RotateCcw, X, ClipboardList, Ruler, Box, HardHat, Info, Hash, Settings, Package, Layers, Construction, TrainFront, Zap } from 'lucide-react';
import { calculateMaxBayLoad, calculateTotalHeight, getLevelRowCount, getUniqueRackHeights } from '../utils';

interface Props {
  data: PlateData;
  onChange: (data: PlateData) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export const PlateEditor: React.FC<Props> = ({ data, onChange, onDuplicate, onRemove }) => {

  const updateField = <K extends keyof PlateData>(field: K, value: PlateData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateShelfField = (field: keyof PlateData, value: string) => {
    let newData = { ...data, [field]: value };

    // Automatyczne obliczanie obciążenia ramy: Poziomy * Obciążenie poziomu
    if (field === 'shelfLevelsCount' || field === 'shelfMaxLevelLoad') {
      const currentLevels = field === 'shelfLevelsCount' ? value : data.shelfLevelsCount;
      const currentLoad = field === 'shelfMaxLevelLoad' ? value : data.shelfMaxLevelLoad;
      
      const levels = parseFloat(currentLevels.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
      const load = parseFloat(currentLoad.replace(/,/g, '.').replace(/[^0-9.]/g, ''));

      if (!isNaN(levels) && !isNaN(load) && levels > 0 && load > 0) {
        newData.shelfMaxFrameLoad = `${levels * load}kg`;
      }
    }
    onChange(newData);
  };

  // Generic Level Handlers
  const addLevelGeneric = (levelsField: 'subsequentLevels' | 'subsequentLevels2' | 'subsequentLevels3' | 'subsequentLevels4') => {
    const currentLevels = data[levelsField] || [];
    const lastLevel = currentLevels[currentLevels.length - 1];
    const nextStart = lastLevel ? (lastLevel.levelEnd || lastLevel.levelStart) + 1 : 1;
    const newLevel: LevelConfig = {
      id: Math.random().toString(36).substr(2, 9),
      levelStart: nextStart,
      height: 1250
    };
    updateField(levelsField, [...currentLevels, newLevel]);
  };

  const removeLevelGeneric = (levelsField: 'subsequentLevels' | 'subsequentLevels2' | 'subsequentLevels3' | 'subsequentLevels4', id: string) => {
    const currentLevels = data[levelsField] || [];
    updateField(levelsField, currentLevels.filter(l => l.id !== id));
  };

  const updateLevelGeneric = (levelsField: 'subsequentLevels' | 'subsequentLevels2' | 'subsequentLevels3' | 'subsequentLevels4', id: string, field: keyof LevelConfig, value: string | number) => {
    const currentLevels = data[levelsField] || [];
    const updated = currentLevels.map(l => l.id === id ? { ...l, [field]: value } : l);
    updateField(levelsField, updated);
  };

  // Add/Remove entire configurations (Fixed to prevent race conditions)
  const addConfig3 = () => {
    onChange({
      ...data,
      firstLevelHeight3: data.firstLevelHeight,
      subsequentLevels3: []
    });
  };
  
  const removeConfig3 = () => {
    const updates: Partial<PlateData> = {
      firstLevelHeight3: undefined,
      subsequentLevels3: undefined
    };
    // Also remove 4 if 3 is removed to keep order
    if (data.firstLevelHeight4 !== undefined) {
      updates.firstLevelHeight4 = undefined;
      updates.subsequentLevels4 = undefined;
    }
    onChange({ ...data, ...updates });
  };

  const addConfig4 = () => {
    onChange({
      ...data,
      firstLevelHeight4: data.firstLevelHeight,
      subsequentLevels4: []
    });
  };
  
  const removeConfig4 = () => {
    onChange({
      ...data,
      firstLevelHeight4: undefined,
      subsequentLevels4: undefined
    });
  };

  const addBeam = () => {
    const newBeam: BeamConfig = {
      id: Math.random().toString(36).substr(2, 9),
      levelLabel: 'A',
      length: 2700,
      profileType: "E0485/15",
      profileWidth: 125,
      loadCount: 3,
      loadWeight: 400
    };
    updateField('beams', [...data.beams, newBeam]);
  };

  const removeBeam = (id: string) => {
    updateField('beams', data.beams.filter(b => b.id !== id));
  };

  const updateBeam = (id: string, field: keyof BeamConfig, value: string | number) => {
    let updatedBeams = data.beams.map(b => b.id === id ? { ...b, [field]: value } : b);
    
    if (field === 'profileType') {
      const selectedProfile = BEAM_PROFILES.find(p => p.type === value);
      if (selectedProfile) {
        updatedBeams = updatedBeams.map(b => b.id === id ? { ...b, profileWidth: selectedProfile.h } : b);
      }
    }
    
    updateField('beams', updatedBeams);
  };

  // Mobile Chassis Configuration Handlers
  const addChassisConfig = () => {
    const newConfig: MobileChassisConfig = {
      id: Math.random().toString(36).substr(2, 9),
      length: 2700,
      loadCount: 3,
      loadWeight: 1000
    };
    const currentConfigs = data.mobileChassisConfigs || [];
    updateField('mobileChassisConfigs', [...currentConfigs, newConfig]);
  };

  const removeChassisConfig = (id: string) => {
    const currentConfigs = data.mobileChassisConfigs || [];
    updateField('mobileChassisConfigs', currentConfigs.filter(c => c.id !== id));
  };

  const updateChassisConfig = (id: string, field: keyof MobileChassisConfig, value: number) => {
    const currentConfigs = data.mobileChassisConfigs || [];
    updateField('mobileChassisConfigs', currentConfigs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Cantilever specific handlers
  const addCantileverArm = () => {
    const newArm: CantileverArmConfig = {
      id: Math.random().toString(36).substr(2, 9),
      profile: "IPE 100",
      length: 1200,
      maxLoad: 600
    };
    updateField('cantileverArms', [...data.cantileverArms, newArm]);
  };

  const removeCantileverArm = (id: string) => {
    updateField('cantileverArms', data.cantileverArms.filter(a => a.id !== id));
  };

  const updateCantileverArm = (id: string, field: keyof CantileverArmConfig, value: string | number) => {
    updateField('cantileverArms', data.cantileverArms.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // Gravity Frame Handlers
  const addGravityFrame = () => {
    const newFrame: any = {
      id: Math.random().toString(36).substr(2, 9),
      multiplier: 1,
      style: 'std',
      type: '18P',
      depth: 1100,
      height: 5750
    };
    updateField('gravityFrames', [...(data.gravityFrames || []), newFrame]);
  };

  const removeGravityFrame = (id: string) => {
    updateField('gravityFrames', (data.gravityFrames || []).filter(f => f.id !== id));
  };

  const updateGravityFrame = (id: string, field: string, value: string | number) => {
    updateField('gravityFrames', (data.gravityFrames || []).map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const calculatedBayLoad = calculateMaxBayLoad(data);
  // calculatedTotalHeight is only for fallback visual now, we use unique heights string mainly
  const uniqueHeightsString = getUniqueRackHeights(data);

  // Configuration Mapping
  const configs = [
    { label: 'Konf. 1 (A)', short: 'A', id: 1, hField: 'firstLevelHeight' as const, levelsField: 'subsequentLevels' as const, removable: false },
    { label: 'Konf. 2 (B)', short: 'B', id: 2, hField: 'firstLevelHeight2' as const, levelsField: 'subsequentLevels2' as const, removable: true },
    { label: 'Konf. 3 (C)', short: 'C', id: 3, hField: 'firstLevelHeight3' as const, levelsField: 'subsequentLevels3' as const, removable: true },
    { label: 'Konf. 4 (D)', short: 'D', id: 4, hField: 'firstLevelHeight4' as const, levelsField: 'subsequentLevels4' as const, removable: true },
  ];

  return (
    <div className="space-y-5 pb-8 font-mono">
      {/* Header Actions */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-md">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">PARAMETRY KONFIGURACJI</h2>
            <p className="text-[10px] text-slate-500 font-medium">ID: <span className="text-blue-600">{data.id}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onDuplicate} 
            className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
          >
            DUPLIKUJ
          </button>
          <button 
            onClick={onRemove} 
            className="flex items-center gap-1.5 text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all border border-red-100"
          >
            <Trash2 size={12} /> USUŃ
          </button>
        </div>
      </div>

      {/* Type Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Rodzaj Regału</h3>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
          <button 
            onClick={() => updateField('type', 'pallet')}
            className={`flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-1 rounded-lg border-2 transition-all font-bold text-xs ${data.type === 'pallet' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
          >
            <Layers size={16} /> REGAŁ PALETOWY
          </button>
          <button 
            onClick={() => updateField('type', 'mobile')}
            className={`flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-1 rounded-lg border-2 transition-all font-bold text-xs ${data.type === 'mobile' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
          >
            <TrainFront size={16} /> REGAŁ MOBILNY
          </button>
          <button 
            onClick={() => updateField('type', 'gravity')}
            className={`flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-1 rounded-lg border-2 transition-all font-bold text-xs ${data.type === 'gravity' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
          >
            <Zap size={16} /> GRAWITACYJNY
          </button>
          <button 
            onClick={() => updateField('type', 'cantilever')}
            className={`flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-1 rounded-lg border-2 transition-all font-bold text-xs ${data.type === 'cantilever' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
          >
            <Construction size={16} /> WSPORNIKOWY
          </button>
          <button 
            onClick={() => updateField('type', 'shelf')}
            className={`flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-1 rounded-lg border-2 transition-all font-bold text-xs ${data.type === 'shelf' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
          >
            <Package size={16} /> PÓŁKOWY
          </button>
        </div>
      </div>

      {/* Basic Data Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
          <Hash size={16} className="text-slate-400" />
          <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Dane Podstawowe</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Klient / Nazwa Instalacji</label>
            <input 
              type="text"
              value={data.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              className="input-field w-full"
              placeholder="NAZWA KLIENTA"
            />
          </div>
          <div>
            <label className="label">Ilość Tabliczek</label>
            <input 
              type="number" 
              min="1"
              value={data.quantity}
              onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
              className="input-field w-full font-bold text-blue-600"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          <div>
            <label className="label">Rok Instalacji</label>
            <input 
              type="number"
              value={data.installationYear}
              onChange={(e) => updateField('installationYear', parseInt(e.target.value))}
              className="input-field w-full"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          <div>
            <label className="label">Nr Projektu</label>
            <input 
              type="text"
              value={data.projectNumber}
              onChange={(e) => updateField('projectNumber', e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="label">Numer SAP</label>
            <div className="relative group flex items-center">
              <span className="absolute left-3 text-[12px] text-slate-400 select-none pointer-events-none font-bold">46120</span>
              <input 
                type="text"
                maxLength={5}
                value={data.sapNumberSuffix}
                onChange={(e) => updateField('sapNumberSuffix', e.target.value)}
                className="input-field w-full tracking-widest font-bold text-right pr-3"
                placeholder="XXXXX"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Print Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Ustawienia Wydruku</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Margines górny (mm)</label>
            <div className="relative">
              <input 
                type="number" 
                value={data.topMargin}
                onChange={(e) => updateField('topMargin', parseInt(e.target.value) || 0)}
                className="input-field w-full pr-10"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">mm</span>
            </div>
          </div>
          <div>
            <label className="label">Odstęp między tabliczkami (mm)</label>
            <div className="relative">
              <input 
                type="number" 
                value={data.plateSpacing}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateField('plateSpacing', isNaN(val) ? 0 : val);
                }}
                className="input-field w-full pr-10"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">mm</span>
            </div>
          </div>
        </div>
      </div>

      {(data.type === 'pallet' || data.type === 'mobile') && (
        <>
          {/* Mobile Chassis Configuration */}
          {data.type === 'mobile' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
                <div className="bg-indigo-900 px-4 py-2 border-b border-indigo-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrainFront size={16} className="text-indigo-300" />
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Specyfikacja Podwozia Mobilnego</h3>
                  </div>
                   <button onClick={addChassisConfig} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 shadow-sm border border-indigo-500">
                    <Plus size={12} /> DODAJ PODWOZIE
                  </button>
                </div>
                <div className="p-4 space-y-4">
                   <div>
                      <label className="label">Wysokość Podwozia (Wpływa na H regału)</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateField('mobileChassisHeight', 215)}
                          className={`px-3 py-1.5 text-xs font-bold rounded border ${data.mobileChassisHeight === 215 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}
                        >
                          215mm
                        </button>
                         <button 
                          onClick={() => updateField('mobileChassisHeight', 250)}
                          className={`px-3 py-1.5 text-xs font-bold rounded border ${data.mobileChassisHeight === 250 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}
                        >
                          250mm
                        </button>
                        <div className="relative flex-1">
                          <input 
                            type="number"
                            value={data.mobileChassisHeight}
                            onChange={(e) => updateField('mobileChassisHeight', parseInt(e.target.value))}
                            className="input-field w-full pr-8"
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          />
                           <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                        </div>
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="label mb-0">Konfiguracje Obciążenia Podwozia</label>
                     {(data.mobileChassisConfigs || []).map((config) => (
                       <div key={config.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 relative group">
                          <button onClick={() => removeChassisConfig(config.id)} className="absolute top-1 right-1 text-slate-300 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={12} />
                          </button>
                          <div>
                            <label className="label text-[9px] text-indigo-400">Długość (L)</label>
                            <input 
                              type="number" 
                              value={config.length} 
                              onChange={(e) => updateChassisConfig(config.id, 'length', parseInt(e.target.value))} 
                              className="input-field w-full"
                              onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] text-indigo-400">Ilość Palet</label>
                            <input 
                              type="number" 
                              value={config.loadCount} 
                              onChange={(e) => updateChassisConfig(config.id, 'loadCount', parseInt(e.target.value))} 
                              className="input-field w-full"
                              onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] text-indigo-400">Waga Palety</label>
                            <input 
                              type="number" 
                              value={config.loadWeight} 
                              onChange={(e) => updateChassisConfig(config.id, 'loadWeight', parseInt(e.target.value))} 
                              className="input-field w-full"
                              onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                            />
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          )}

          {/* Levels Configuration (1-4) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 no-print">
            {configs.map((config) => {
              // Only render if active. 
              // Config 1 always active.
              // Config 2 active if firstLevelHeight2 !== undefined (or user adds it).
              const isActive = config.id === 1 || data[config.hField] !== undefined;
              if (!isActive) return null;

              return (
                <div key={config.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className={`${config.id === 1 ? 'bg-slate-100' : 'bg-slate-50'} px-4 py-2 border-b border-slate-200 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Ruler size={16} className={config.id === 1 ? "text-slate-600" : "text-slate-400"} />
                      <h3 className={`text-[11px] font-bold ${config.id === 1 ? "text-slate-800" : "text-slate-500"} uppercase tracking-wider`}>
                        {config.label}
                      </h3>
                    </div>
                    {config.id === 1 ? (
                       <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">GŁÓWNA</span>
                    ) : (
                       <button 
                          onClick={() => config.id === 2 ? updateField('firstLevelHeight2', undefined) : config.id === 3 ? removeConfig3() : removeConfig4()} 
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        >
                          <X size={14} />
                       </button>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="label">Wysokość 1. poziomu ({config.short})</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={data[config.hField] ?? ''}
                          onChange={(e) => updateField(config.hField, e.target.value ? parseInt(e.target.value) : (config.id === 1 ? 0 : undefined))}
                          className="input-field w-full pr-10"
                          placeholder={config.id === 1 ? "" : "BRAK"}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                      </div>
                      {data.type === 'mobile' && config.id === 1 && (
                        <p className="text-[10px] text-indigo-500 font-bold mt-1 text-right">
                           + wys. podwozia {data.mobileChassisHeight}mm
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="label mb-0">Kolejne poziomy ({config.short}_ - {config.short}_)</label>
                        <button onClick={() => addLevelGeneric(config.levelsField)} className="text-[9px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                          <Plus size={10} /> DODAJ ZAKRES
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(data[config.levelsField] || []).map((lvl) => (
                          <div key={lvl.id} className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                               <span className="text-xs font-bold text-slate-400">{config.short}</span>
                               <input 
                                type="number"
                                value={lvl.levelStart}
                                onChange={(e) => updateLevelGeneric(config.levelsField, lvl.id, 'levelStart', parseInt(e.target.value) || 0)}
                                className="input-field w-14 text-center py-1 text-xs"
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              />
                              <span className="text-slate-300">-</span>
                              <span className="text-xs font-bold text-slate-400">{config.short}</span>
                              <input 
                                type="number"
                                value={lvl.levelEnd || ''}
                                onChange={(e) => updateLevelGeneric(config.levelsField, lvl.id, 'levelEnd', e.target.value ? parseInt(e.target.value) : undefined)}
                                className="input-field w-14 text-center py-1 text-xs"
                                placeholder="..."
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              />
                              <div className="flex-1 text-right">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">Suma: {getLevelRowCount(lvl) * lvl.height} mm</span>
                              </div>
                              <button onClick={() => removeLevelGeneric(config.levelsField, lvl.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="relative">
                              <input 
                                type="number"
                                value={lvl.height}
                                onChange={(e) => updateLevelGeneric(config.levelsField, lvl.id, 'height', parseInt(e.target.value))}
                                className="input-field w-full pr-10 text-[11px] py-1.5"
                                placeholder="Wysokość poziomu"
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                              />
                              <span className="absolute right-3 top-2 text-[9px] text-slate-400 font-bold">mm/poz.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add Config Buttons */}
            {data.firstLevelHeight2 === undefined && (
               <button onClick={() => updateField('firstLevelHeight2', 600)} className="h-[100px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-all bg-slate-50/50 hover:bg-white">
                  <Plus size={24} />
                  <span className="text-xs font-bold mt-2">DODAJ KONFIGURACJĘ 2</span>
               </button>
            )}
            {data.firstLevelHeight2 !== undefined && data.firstLevelHeight3 === undefined && (
               <button onClick={addConfig3} className="h-[100px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-all bg-slate-50/50 hover:bg-white">
                  <Plus size={24} />
                  <span className="text-xs font-bold mt-2">DODAJ KONFIGURACJĘ 3</span>
               </button>
            )}
            {data.firstLevelHeight3 !== undefined && data.firstLevelHeight4 === undefined && (
               <button onClick={addConfig4} className="h-[100px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-all bg-slate-50/50 hover:bg-white">
                  <Plus size={24} />
                  <span className="text-xs font-bold mt-2">DODAJ KONFIGURACJĘ 4</span>
               </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Konfiguracja Trawersów</h3>
              </div>
              <button onClick={addBeam} className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 shadow-sm">
                <Plus size={12} /> DODAJ
              </button>
            </div>
            <div className="p-4 space-y-3">
              {data.beams.map((beam) => (
                <div key={beam.id} className="relative group bg-slate-50 border border-slate-200 rounded-lg p-3.5 hover:border-slate-400 transition-all">
                  <button onClick={() => removeBeam(beam.id)} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="label">Poziomy (np. A1-A2)</label>
                      <input type="text" value={beam.levelLabel} onChange={(e) => updateBeam(beam.id, 'levelLabel', e.target.value)} className="input-field w-full font-bold text-slate-700" />
                    </div>
                    <div>
                      <label className="label">Długość L [mm]</label>
                      <input 
                        type="number" 
                        value={beam.length} 
                        onChange={(e) => updateBeam(beam.id, 'length', parseInt(e.target.value))} 
                        className="input-field w-full"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Profil Trawersu</label>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 mr-1 whitespace-nowrap">AUF'B'</span>
                        <input type="text" list="profile-list" value={beam.profileType} onChange={(e) => updateBeam(beam.id, 'profileType', e.target.value)} className="input-field w-full text-[12px] flex-1" placeholder="TYP" />
                        <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden h-[34px]">
                           <span className="px-1.5 text-slate-300 text-xs">(</span>
                           <input 
                            type="number" 
                            value={beam.profileWidth} 
                            onChange={(e) => updateBeam(beam.id, 'profileWidth', parseInt(e.target.value))} 
                            className="w-10 text-center text-[12px] font-bold border-none outline-none focus:ring-0"
                            onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                           />
                           <span className="px-1 text-slate-400 text-[10px] font-bold">x50</span>
                           <span className="px-1.5 text-slate-300 text-xs">)</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="label">Ilość palet</label>
                      <input 
                        type="number" 
                        value={beam.loadCount} 
                        onChange={e => updateBeam(beam.id, 'loadCount', parseInt(e.target.value))} 
                        className="input-field w-full"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                      />
                    </div>
                    <div>
                      <label className="label">Waga palety (kg)</label>
                      <input 
                        type="number" 
                        value={beam.loadWeight} 
                        onChange={e => updateBeam(beam.id, 'loadWeight', parseInt(e.target.value))} 
                        className="input-field w-full"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                       <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 flex justify-between items-center shadow-inner">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Qmax</span>
                          <span className="text-base font-bold text-slate-100">{beam.loadCount * beam.loadWeight} <span className="text-[10px] text-slate-500">kg</span></span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Specyfikacja Ramy</h3>
              </div>
              {!data.frameType2 && (
                <button onClick={() => onChange({ ...data, frameType2: data.frameType, frameDepth2: data.frameDepth, frameHeight2: data.frameHeight + 500 })} className="text-[10px] font-bold text-blue-400 flex items-center gap-1 hover:underline">
                  <Plus size={12} /> DODAJ RAMĘ
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase min-w-[50px]">Rama 1</div>
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">STD'B'</span>
                  <div className="relative flex-1 max-w-[90px]">
                    <input type="text" value={data.frameType} onChange={(e) => updateField('frameType', e.target.value)} className="input-field w-full text-center font-bold px-1 py-1.5" />
                  </div>
                  <span className="text-slate-300 text-lg">'</span>
                  <div className="relative flex-1 max-w-[110px]">
                    <input 
                        type="number" 
                        value={data.frameDepth} 
                        onChange={(e) => updateField('frameDepth', parseInt(e.target.value))} 
                        className="input-field w-full text-center pr-7 px-1 py-1.5"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                    />
                    <span className="absolute right-2 top-2 text-[8px] text-slate-400 font-bold">mm</span>
                  </div>
                  <span className="text-slate-300 text-lg">'</span>
                  <div className="relative flex-1 max-w-[130px]">
                    <input 
                        type="number" 
                        value={data.frameHeight} 
                        onChange={(e) => updateField('frameHeight', parseInt(e.target.value))} 
                        className="input-field w-full text-center pr-7 px-1 py-1.5"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                    />
                    <span className="absolute right-2 top-2 text-[8px] text-slate-400 font-bold">mm</span>
                  </div>
                </div>
              </div>
              {data.frameType2 !== undefined && (
                <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase min-w-[50px]">Rama 2</div>
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">STD'B'</span>
                    <input type="text" value={data.frameType2 || ''} onChange={(e) => updateField('frameType2', e.target.value)} className="input-field w-full text-center font-bold px-1 py-1.5" />
                    <span className="text-slate-300 text-lg">'</span>
                    <input 
                        type="number" 
                        value={data.frameDepth2 || 0} 
                        onChange={(e) => updateField('frameDepth2', parseInt(e.target.value))} 
                        className="input-field w-full text-center px-1 py-1.5"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                    />
                    <span className="text-slate-300 text-lg">'</span>
                    <input 
                        type="number" 
                        value={data.frameHeight2 || 0} 
                        onChange={(e) => updateField('frameHeight2', parseInt(e.target.value))} 
                        className="input-field w-full text-center px-1 py-1.5"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                    />
                  </div>
                  <button onClick={() => onChange({ ...data, frameType2: undefined, frameDepth2: undefined, frameHeight2: undefined })} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {data.type === 'cantilever' && (
        <>
          {/* Cantilever Column Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
              <HardHat size={16} className="text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Specyfikacja Słupa</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Wysokość Regału</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={data.cantileverHeight}
                    onChange={(e) => updateField('cantileverHeight', parseInt(e.target.value))}
                    className="input-field w-full pr-10"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                </div>
              </div>
              <div>
                <label className="label">Profil Słupa / Stopy</label>
                <input 
                  type="text" 
                  list="ipe-column-profiles"
                  value={data.cantileverColumnProfile} 
                  onChange={(e) => updateField('cantileverColumnProfile', e.target.value)} 
                  className="input-field w-full"
                  placeholder="np. IPE 200"
                />
              </div>
              <div>
                <label className="label">Obciążenie strony słupa</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={data.cantileverColumnLoad}
                    onChange={(e) => updateField('cantileverColumnLoad', parseInt(e.target.value))}
                    className="input-field w-full pr-10"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cantilever Arms Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Konfiguracja Ramion</h3>
              </div>
              <button onClick={addCantileverArm} className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 shadow-sm">
                <Plus size={12} /> DODAJ RAMIĘ
              </button>
            </div>
            <div className="p-4 space-y-3">
              {data.cantileverArms.map((arm) => (
                <div key={arm.id} className="relative group bg-slate-50 border border-slate-200 rounded-lg p-3.5 hover:border-slate-400 transition-all">
                  <button onClick={() => removeCantileverArm(arm.id)} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                     <div>
                      <label className="label">Profil Ramienia</label>
                      <input 
                        type="text" 
                        list="ipe-arm-profiles"
                        value={arm.profile} 
                        onChange={(e) => updateCantileverArm(arm.id, 'profile', e.target.value)} 
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="label">Długość Ramienia</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={arm.length}
                          onChange={(e) => updateCantileverArm(arm.id, 'length', parseInt(e.target.value))}
                          className="input-field w-full pr-10"
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Max. Obciążenie</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={arm.maxLoad}
                          onChange={(e) => updateCantileverArm(arm.id, 'maxLoad', parseInt(e.target.value))}
                          className="input-field w-full pr-10 font-bold text-slate-700"
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {data.type === 'shelf' && (
        /* Shelf Specific Editor */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
            <Package size={16} className="text-slate-400" />
            <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Specyfikacja Regału Półkowego</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Półka</label>
              <input 
                type="text" 
                value={data.shelfDimensions} 
                onChange={(e) => updateField('shelfDimensions', e.target.value)} 
                className="input-field w-full" 
                placeholder="np. 1800 x 1050" 
              />
            </div>
            <div>
              <label className="label">Wypełnienie</label>
              <input 
                type="text" 
                value={data.shelfFilling} 
                onChange={(e) => updateField('shelfFilling', e.target.value)} 
                className="input-field w-full" 
                placeholder="np. Panele stalowe" 
              />
            </div>
            <div>
              <label className="label">Rama</label>
              <input 
                type="text" 
                value={data.shelfFrameDimensions} 
                onChange={(e) => updateField('shelfFrameDimensions', e.target.value)} 
                className="input-field w-full" 
                placeholder="np. 4300 x 1050" 
              />
            </div>
            <div>
              <label className="label">Ilość poziomów</label>
              <input 
                type="text" 
                value={data.shelfLevelsCount} 
                onChange={(e) => updateShelfField('shelfLevelsCount', e.target.value)} 
                className="input-field w-full" 
                placeholder="np. 8 lub 7 / 10" 
              />
            </div>
            <div>
              <label className="label">Max obciążenie poziomu</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={data.shelfMaxLevelLoad.replace(/[^0-9.,]/g, '')}
                  onChange={(e) => updateShelfField('shelfMaxLevelLoad', e.target.value ? `${e.target.value}kg` : '')} 
                  className="input-field w-full pr-8" 
                  placeholder="np. 360"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">kg</span>
              </div>
            </div>
            <div>
              <label className="label">Max obciążenie ramy</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={data.shelfMaxFrameLoad.replace(/[^0-9.,]/g, '')}
                  onChange={(e) => updateShelfField('shelfMaxFrameLoad', e.target.value ? `${e.target.value}kg` : '')} 
                  className="input-field w-full pr-8" 
                  placeholder="np. 2880"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Common Final Data Section */}
      <div className="bg-white rounded-xl p-5 text-slate-800 border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-md">
            <Info size={18} />
          </div>
          <h3 className="text-base font-bold uppercase tracking-tight">Dane Końcowe</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {(data.type === 'pallet' || data.type === 'mobile') && (
              <>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Ilość poziomów (do Qp)</label>
                  <input 
                    type="number" 
                    value={data.highestLevelIndex} 
                    onChange={(e) => updateField('highestLevelIndex', parseInt(e.target.value))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold text-sm"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qp (Obciążenie Pola)</label>
                      <button onClick={() => updateField('maxBayLoadOverride', undefined)} className="text-slate-400 hover:text-blue-500"><RotateCcw size={10} /></button>
                    </div>
                    <input 
                        type="number" 
                        value={data.maxBayLoadOverride ?? calculatedBayLoad} 
                        onChange={(e) => updateField('maxBayLoadOverride', parseInt(e.target.value))} 
                        className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-base font-bold`}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">H (Wysokość Regału)</label>
                      <button onClick={() => updateField('totalHeightOverride', undefined)} className="text-slate-400 hover:text-blue-500"><RotateCcw size={10} /></button>
                    </div>
                     <input 
                        type="text" 
                        value={data.totalHeightOverride !== undefined ? data.totalHeightOverride : ""}
                        placeholder={`${uniqueHeightsString} mm`} 
                        onChange={(e) => updateField('totalHeightOverride', e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
              </>
            )}
            {data.type === 'shelf' && (
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Obliczenia automatyczne nie są wymagane dla tego typu tabliczki.</p>
               </div>
            )}
             {data.type === 'cantilever' && (
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Wszystkie dane dla regału wspornikowego są wprowadzane ręcznie.</p>
               </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-center">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Następny przegląd</label>
            <input 
              type="month"
              value={data.nextInspectionDate}
              onChange={(e) => updateField('nextInspectionDate', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-slate-400 outline-none transition-all uppercase"
            />
          </div>
        </div>
      </div>

      {data.type === 'gravity' && (
        <>
          {/* Gravity Rack Frame Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Specyfikacja Ram Grawitacyjnych</h3>
              </div>
              <button onClick={addGravityFrame} className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 shadow-sm">
                <Plus size={12} /> DODAJ RAMĘ
              </button>
            </div>
            <div className="p-4 space-y-3">
              {(data.gravityFrames || []).map((frame) => (
                <div key={frame.id} className="relative group bg-slate-50 border border-slate-200 rounded-lg p-3.5 hover:border-slate-400 transition-all">
                  <button onClick={() => removeGravityFrame(frame.id)} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex flex-wrap items-end gap-3 pr-8">
                    <div className="w-16">
                      <label className="label">Ilość</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={frame.multiplier} onChange={(e) => updateGravityFrame(frame.id, 'multiplier', parseInt(e.target.value))} className="input-field w-full text-center" />
                        <span className="text-xs font-bold text-slate-400">x</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Styl</label>
                      <select 
                        value={frame.style} 
                        onChange={(e) => updateGravityFrame(frame.id, 'style', e.target.value)}
                        className="input-field h-[38px] text-[11px]"
                      >
                        <option value="std">STD'B'</option>
                        <option value="stl">STL'B'</option>
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="label">Typ</label>
                      <input type="text" value={frame.type} onChange={(e) => updateGravityFrame(frame.id, 'type', e.target.value)} className="input-field w-full" />
                    </div>
                    {frame.style === 'std' && (
                      <div className="w-24">
                        <label className="label">Głęb. [mm]</label>
                        <input type="number" value={frame.depth} onChange={(e) => updateGravityFrame(frame.id, 'depth', parseInt(e.target.value))} className="input-field w-full" />
                      </div>
                    )}
                    <div className="w-24">
                      <label className="label">Wys. [mm]</label>
                      <input type="number" value={frame.height} onChange={(e) => updateGravityFrame(frame.id, 'height', parseInt(e.target.value))} className="input-field w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gravity Rack Beam Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Konfiguracja Trawersów</h3>
              </div>
              <button onClick={addBeam} className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded transition-colors flex items-center gap-1 shadow-sm">
                <Plus size={12} /> DODAJ
              </button>
            </div>
            <div className="p-4 space-y-3">
              {data.beams.map((beam) => (
                <div key={beam.id} className="relative group bg-slate-50 border border-slate-200 rounded-lg p-3.5 hover:border-slate-400 transition-all">
                  <button onClick={() => removeBeam(beam.id)} className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Długość L [mm]</label>
                      <input 
                        type="number" 
                        value={beam.length} 
                        onChange={(e) => updateBeam(beam.id, 'length', parseInt(e.target.value))} 
                        className="input-field w-full"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                      />
                    </div>
                    <div>
                      <label className="label">Oznaczenie / Profil Trawersu</label>
                      <input 
                        type="text" 
                        value={beam.profileType} 
                        onChange={(e) => updateBeam(beam.id, 'profileType', e.target.value)} 
                        className="input-field w-full" 
                        placeholder="np. L120X80X8'2700 B&N" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pallet and Channel Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">Opis Palety i Regału</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Głębokość palety (D_pal)</label>
                <div className="relative">
                  <input type="number" value={data.gravityPalletDepth} onChange={(e) => updateField('gravityPalletDepth', parseInt(e.target.value))} className="input-field w-full pr-8" />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                </div>
              </div>
              <div>
                <label className="label">Szerokość palety (B_pal)</label>
                <div className="relative">
                  <input type="number" value={data.gravityPalletWidth} onChange={(e) => updateField('gravityPalletWidth', parseInt(e.target.value))} className="input-field w-full pr-8" />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                </div>
              </div>
              <div>
                <label className="label">Wysokość palety (H_pal)</label>
                <div className="relative">
                  <input type="number" value={data.gravityPalletHeight} onChange={(e) => updateField('gravityPalletHeight', parseInt(e.target.value))} className="input-field w-full pr-8" />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">mm</span>
                </div>
              </div>
              <div>
                <label className="label">Ciężar palety (Q_pal)</label>
                <div className="relative">
                  <input type="text" value={data.gravityPalletWeight} onChange={(e) => updateField('gravityPalletWeight', e.target.value)} className="input-field w-full pr-8" placeholder="np. 500 - 1000" />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">kg</span>
                </div>
              </div>
              <div>
                <label className="label">Liczba poziomów (N_poz)</label>
                <input type="number" value={data.gravityLevelsCount} onChange={(e) => updateField('gravityLevelsCount', parseInt(e.target.value))} className="input-field w-full" />
              </div>
              <div>
                <label className="label">Liczba palet na kanał (N_pal)</label>
                <input type="number" value={data.gravityPalletsPerChannel} onChange={(e) => updateField('gravityPalletsPerChannel', parseInt(e.target.value))} className="input-field w-full" />
              </div>
            </div>
          </div>
        </>
      )}

      <datalist id="profile-list">
        {BEAM_PROFILES.map(p => (
          <option key={p.type} value={p.type}>{p.type} (H={p.h})</option>
        ))}
      </datalist>

      <datalist id="ipe-column-profiles">
        {IPE_COLUMN_PROFILES.map(p => (
           <option key={p} value={p}>{p}</option>
        ))}
      </datalist>

      <datalist id="ipe-arm-profiles">
        {IPE_ARM_PROFILES.map(p => (
           <option key={p} value={p}>{p}</option>
        ))}
      </datalist>

      <style>{`
        .label {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.35rem;
        }
        .input-field {
          display: block;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 0.4rem;
          padding: 0.45rem 0.6rem;
          font-size: 0.85rem;
          color: #1e293b;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
          font-family: 'JetBrains Mono', monospace;
        }
        .input-field:focus {
          border-color: #64748b;
          box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.1);
          background: #fdfdfd;
        }
        .input-field::placeholder {
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};
