
import React, { useState } from 'react';
import { PlateData } from '../types';
import { X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (updates: Partial<PlateData>) => void;
  currentTemplate: PlateData;
}

export const GlobalEditorModal: React.FC<Props> = ({ isOpen, onClose, onApply, currentTemplate }) => {
  const [updates, setUpdates] = useState<Partial<PlateData>>({
    customerName: currentTemplate.customerName,
    installationYear: currentTemplate.installationYear,
    projectNumber: currentTemplate.projectNumber,
    sapNumberSuffix: currentTemplate.sapNumberSuffix,
    nextInspectionDate: currentTemplate.nextInspectionDate,
    topMargin: currentTemplate.topMargin,
    plateSpacing: currentTemplate.plateSpacing
  });

  if (!isOpen) return null;

  const handleChange = (field: keyof PlateData, value: any) => {
    setUpdates(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Save size={20} /> Edycja Masowa Projektów
          </h3>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Wprowadzone tutaj dane zostaną zastosowane do <b>wszystkich</b> aktualnie utworzonych tabliczek.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nazwa Klienta</label>
              <input 
                type="text"
                value={updates.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rok Instalacji</label>
                <input 
                  type="number"
                  value={updates.installationYear}
                  onChange={(e) => handleChange('installationYear', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numer Projektu</label>
                <input 
                  type="text"
                  value={updates.projectNumber}
                  onChange={(e) => handleChange('projectNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numer SAP</label>
              <div className="relative group flex items-center">
                <span className="absolute left-3 text-sm font-mono text-slate-400 select-none pointer-events-none font-bold">46120</span>
                <input 
                  type="text"
                  maxLength={5}
                  value={updates.sapNumberSuffix}
                  onChange={(e) => handleChange('sapNumberSuffix', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest font-bold text-right pr-3"
                  placeholder="XXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data kolejnego przeglądu</label>
              <input 
                type="month"
                value={updates.nextInspectionDate}
                onChange={(e) => handleChange('nextInspectionDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Margines górny (mm)</label>
                <input 
                  type="number"
                  value={updates.topMargin}
                  onChange={(e) => handleChange('topMargin', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Odstęp (mm)</label>
                <input 
                  type="number"
                  value={updates.plateSpacing}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleChange('plateSpacing', isNaN(val) ? 0 : val);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button 
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Zastosuj do wszystkich
          </button>
        </div>
      </div>
    </div>
  );
};
