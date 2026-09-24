
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlateEditor } from './components/PlateEditor';
import { PlatePreview } from './components/PlatePreview';
import { GlobalEditorModal } from './components/GlobalEditorModal';
import { PlateData, INITIAL_PLATE } from './types';
import { Printer, Plus, FileText, Layout, Layers, Sheet, Download, Upload, FileDown, Settings2, Undo2, Menu, Eye, Edit3, GripVertical, ListOrdered, GripHorizontal } from 'lucide-react';
import { createDocxBlob, calculateVisualHeight } from './utils';

const STORAGE_KEY = 'plateGeneratorData';
const LABELS_PER_PAGE_KEY = 'labelsPerPage';
const MAX_UNDO_STEPS = 50;
const PAGE_HEIGHT_MM = 287; // 297mm (A4) - 10mm padding
const PLATE_GAP_MM = 3; 

const App: React.FC = () => {
  const [plates, setPlates] = useState<PlateData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [{ ...INITIAL_PLATE }];
    } catch (e) {
      console.error("Failed to load persistence", e);
      return [{ ...INITIAL_PLATE }];
    }
  });
  
  const [labelsPerPage, setLabelsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem(LABELS_PER_PAGE_KEY);
    return saved ? parseInt(saved) : 4;
  });

  const [activePlateId, setActivePlateId] = useState<string>(plates[0].id);
  const [viewMode, setViewMode] = useState<'single' | 'sheet'>('sheet'); // Default to sheet to see layout
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('preview'); 
  const [isGlobalEditorOpen, setIsGlobalEditorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(55); 
  const [isResizing, setIsResizing] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [draggedPlateIndex, setDraggedPlateIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const [undoStack, setUndoStack] = useState<PlateData[][]>([]);
  const lastSavedStateRef = useRef<PlateData[]>(plates);
  const saveTimeoutRef = useRef<number | null>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth - 40; 
        const plateWidthPx = 190 * 3.78; 
        const newScale = Math.min(containerWidth / plateWidthPx, 1.2);
        setPreviewScale(newScale);
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (previewContainerRef.current) observer.observe(previewContainerRef.current);
    updateScale();

    return () => observer.disconnect();
  }, [leftPanelWidth, viewMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plates));
  }, [plates]);

  useEffect(() => {
    localStorage.setItem(LABELS_PER_PAGE_KEY, labelsPerPage.toString());
  }, [labelsPerPage]);

  const performUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    const newStack = undoStack.slice(0, -1);
    setUndoStack(newStack);
    lastSavedStateRef.current = previousState;
    setPlates(previousState);
  }, [undoStack]);

  const updatePlatesWithHistory = (newPlates: PlateData[], immediate = false) => {
    const currentState = lastSavedStateRef.current;
    const saveToStack = () => {
      setUndoStack(prev => {
        const next = [...prev, currentState];
        if (next.length > MAX_UNDO_STEPS) return next.slice(1);
        return next;
      });
      lastSavedStateRef.current = newPlates;
    };

    if (immediate) {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
      saveToStack();
    } else {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(saveToStack, 500);
    }
    setPlates(newPlates);
  };

  useEffect(() => {
    if (!plates.find(p => p.id === activePlateId)) {
      setActivePlateId(plates[0]?.id || '');
    }
  }, [plates, activePlateId]);

  const activePlate = plates.find(p => p.id === activePlateId) || plates[0];

  const updateActivePlate = (newData: PlateData) => {
    const newPlates = plates.map(p => p.id === newData.id ? newData : p);
    updatePlatesWithHistory(newPlates);
  };

  const applyGlobalUpdates = (updates: Partial<PlateData>) => {
    const newPlates = plates.map(p => ({ ...p, ...updates }));
    updatePlatesWithHistory(newPlates, true);
  };

  const addNewPlateConfig = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newPlate: PlateData = { ...INITIAL_PLATE, id: newId };
    const newPlates = [...plates, newPlate];
    updatePlatesWithHistory(newPlates, true);
    setActivePlateId(newId);
  };

  const duplicatePlate = (plate: PlateData) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newPlate = { ...plate, id: newId };
    const newPlates = [...plates, newPlate];
    updatePlatesWithHistory(newPlates, true);
    setActivePlateId(newId);
  };

  const removePlate = (id: string) => {
    if (plates.length === 1) return;
    const newPlates = plates.filter(p => p.id !== id);
    updatePlatesWithHistory(newPlates, true);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const dataStr = JSON.stringify(plates, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projekty-tabliczki-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleWordExport = async () => {
    const printQueue: PlateData[] = plates.flatMap(p => Array(p.quantity).fill(p));
    try {
      const blob = await createDocxBlob(printQueue);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tabliczki-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate DOCX", error);
      alert("Błąd podczas generowania pliku Word.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && json.length > 0 && json[0].id) {
          updatePlatesWithHistory(json, true);
          setActivePlateId(json[0].id);
        } else {
          alert("Nieprawidłowy format pliku JSON.");
        }
      } catch (err) {
        alert("Błąd podczas odczytu pliku.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (index: number) => {
    setDraggedPlateIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedPlateIndex === null || draggedPlateIndex === targetIndex) return;
    
    const newPlates = [...plates];
    const [draggedItem] = newPlates.splice(draggedPlateIndex, 1);
    newPlates.splice(targetIndex, 0, draggedItem);
    
    updatePlatesWithHistory(newPlates, true);
    setDraggedPlateIndex(null);
  };

  // --- NEW GENERATE PAGES LOGIC (FLOW LAYOUT) ---
  const generatePages = () => {
    // We do NOT sort by type anymore. We respect the user's order in `plates`.
    // We expand the queue based on quantity.
    
    const pages: { items: any[], pageNumber: number }[] = [];
    let currentPageItems: { plate: PlateData, widthPct: number, originalIndex: number }[] = [];
    let currentY = 0;
    let currentRowHeight = 0;
    let currentLineWidth = 0; // 0 to 100

    // Flatten logic: we want to process plate instances.
    const queue: { plate: PlateData, index: number }[] = [];
    plates.forEach((p, idx) => {
        for(let i=0; i<p.quantity; i++) {
            queue.push({ plate: p, index: idx });
        }
    });

    queue.forEach((item, qIdx) => {
        const p = item.plate;
        const h = calculateVisualHeight(p);
        const gap = p.plateSpacing ?? 3;
        const topMargin = p.topMargin ?? 5;
        const availableHeight = 297 - topMargin - 2; // Allow only 2mm buffer at bottom

        // Determine width and flow
        // Pallet & Mobile = 100% width
        // Shelf = 33% width (approx 3 per row)
        // Cantilever = 50% width (2 per row)
        let widthPct = 100;
        if (p.type === 'shelf') {
          widthPct = 33.33;
        } else if (p.type === 'cantilever' || p.type === 'gravity') {
          widthPct = 50;
        }
        
        // Check if fits on current line (width wise)
        if (currentLineWidth + widthPct > 100.1) {
             // Wrap to new line on SAME page
             currentY += currentRowHeight + gap;
             currentLineWidth = 0;
             currentRowHeight = 0;
        }

        // Determine if this new item (or new row) fits on PAGE height
        let projectedRowHeight = Math.max(currentRowHeight, h);
        let projectedY = currentY + projectedRowHeight;

        if (projectedY > availableHeight) {
            // Page break needed
            pages.push({ items: currentPageItems, pageNumber: pages.length + 1 });
            currentPageItems = [];
            currentY = 0;
            currentRowHeight = 0;
            currentLineWidth = 0;
            projectedY = h;
            projectedRowHeight = h;
        }

        // Add to current page
        currentPageItems.push({ plate: p, widthPct, originalIndex: item.index });
        
        // Update layout cursors
        currentRowHeight = projectedRowHeight;
        currentLineWidth += widthPct;
    });

    if (currentPageItems.length > 0) {
        pages.push({ items: currentPageItems, pageNumber: pages.length + 1 });
    }

    return pages;
  };
  
  const pages = generatePages();

  return (
    <div className={`flex flex-col h-screen bg-gray-50 print:h-auto print:overflow-visible ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      {/* HEADER SECTION */}
      <header className="no-print bg-slate-900 text-white p-2 md:p-3 shadow-lg z-30 shrink-0">
        <div className="w-full px-2 md:px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg lg:2xl:hidden block"
            >
              <Menu size={20} />
            </button>
            <Layout className="w-6 h-6 text-blue-400 hidden sm:block" />
            <h1 className="text-lg md:text-xl font-bold truncate">Generator Tabliczek</h1>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
             <div className="flex items-center gap-1 mr-1 md:mr-2 border-r border-slate-700 pr-2 md:pr-3">
               <button onClick={performUndo} disabled={undoStack.length === 0} className={`p-2 rounded transition-colors ${undoStack.length === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-orange-400 hover:bg-slate-800 hover:text-white'}`}>
                  <Undo2 size={18} />
               </button>
               <button onClick={() => setIsGlobalEditorOpen(true)} className="p-2 rounded text-yellow-400 hover:bg-slate-800 transition-colors" title="Edycja masowa">
                  <Settings2 size={18} />
               </button>
               <button onClick={handleWordExport} className="p-2 rounded text-blue-300 hover:bg-slate-800 transition-colors hidden sm:block">
                  <FileDown size={18} />
               </button>
               <button onClick={handleImportClick} className="p-2 rounded text-emerald-400 hover:bg-slate-800 transition-colors">
                  <Upload size={18} />
               </button>
               <button onClick={handleExport} className="p-2 rounded text-gray-400 hover:bg-slate-800 transition-colors hidden sm:block">
                  <Download size={18} />
               </button>
               <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
             </div>
             <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded font-semibold flex items-center gap-2 transition-colors text-sm shadow-lg whitespace-nowrap">
              <Printer size={18} />
              <span className="hidden sm:inline">Drukuj</span> <span className="text-[10px] opacity-80">({plates.reduce((acc, p) => acc + p.quantity, 0)})</span>
             </button>
          </div>
        </div>
      </header>

      {/* MOBILE TAB SELECTOR */}
      <div className="no-print lg:hidden flex bg-white border-b z-20 shadow-sm shrink-0">
        <button onClick={() => setMobileTab('preview')} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'preview' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500'}`}>
          <Eye size={16} /> Podgląd
        </button>
        <button onClick={() => setMobileTab('editor')} className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'editor' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500'}`}>
          <Edit3 size={16} /> Edycja
        </button>
      </div>

      {/* MAIN APPLICATION VIEW */}
      <main className="no-print flex-1 flex overflow-hidden w-full relative">
        {/* SIDEBAR LIST (Draggable) */}
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full 2xl:translate-x-0'} fixed 2xl:static top-0 left-0 h-full z-40 2xl:z-0 w-72 bg-white border-r overflow-y-auto flex flex-col transition-transform duration-300`}>
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
             <span className="font-bold text-gray-700 text-sm">Twoje Projekty</span>
             <button onClick={addNewPlateConfig} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 shadow-sm"><Plus size={16} /></button>
          </div>
          <div className="flex-1 p-2 space-y-2">
            {plates.map((plate, index) => (
              <div 
                key={plate.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onClick={() => { setActivePlateId(plate.id); if (window.innerWidth < 1536) setIsSidebarOpen(false); }}
                className={`p-3 rounded-xl cursor-pointer border transition-all relative group
                  ${activePlateId === plate.id ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}
                  ${draggedPlateIndex === index ? 'opacity-40 border-dashed border-gray-400' : ''}
                `}
              >
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab">
                    <GripVertical size={14} />
                </div>
                <div className="pl-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-gray-800 text-xs">#{index + 1} {plate.type === 'shelf' ? 'Półkowy' : plate.type === 'cantilever' ? 'Wspornikowy' : plate.type === 'mobile' ? 'Mobilny' : 'Paletowy'}</div>
                      <div className="bg-white border text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{plate.quantity} szt.</div>
                    </div>
                    <div className="text-[11px] text-gray-600 truncate mt-1 font-semibold">{plate.customerName || 'Brak nazwy'}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex overflow-hidden">
          {/* PREVIEW PANEL (Drop Target) */}
          <section ref={previewContainerRef} className={`${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'} bg-gray-200/50 flex flex-col border-r overflow-hidden`} style={{ width: window.innerWidth >= 1024 ? `${leftPanelWidth}%` : '100%' }}>
            <div className="p-3 flex justify-between items-center bg-white border-b shadow-sm shrink-0">
               <h3 className="text-gray-700 font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                <FileText size={16} className="text-blue-500" /> Podgląd (A4)
              </h3>
              <div className="flex items-center gap-2">
                 <div className="text-[10px] text-gray-400 font-medium hidden md:block mr-2">
                   Przeciągnij tabliczkę, aby zmienić kolejność
                 </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                   <button onClick={() => setViewMode('single')} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Pojedyncza</button>
                   <button onClick={() => setViewMode('sheet')} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewMode === 'sheet' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Arkusze</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-200/30">
               {viewMode === 'single' ? (
                  <div className="bg-white shadow-2xl origin-top rounded-sm transition-transform" style={{ transform: `scale(${previewScale})` }}>
                     {activePlate && <PlatePreview data={activePlate} />}
                  </div>
                ) : (
                  <div className="flex flex-col gap-8 origin-top transition-transform pb-20" style={{ transform: `scale(${previewScale * (activePlate?.type === 'shelf' || activePlate?.type === 'cantilever' || activePlate?.type === 'gravity' ? 0.9 : 0.7)})` }}>
                    {pages.map((page, pageIdx) => (
                      <div key={pageIdx} className="bg-white shadow-2xl relative flex flex-col items-center overflow-hidden" style={{ width: '210mm', height: '297mm' }}>
                         <div className="absolute top-4 left-4 text-gray-100 font-black text-6xl select-none pointer-events-none">A4 - {page.pageNumber}</div>
                         <div 
                          className="w-full h-full flex flex-wrap content-start items-start relative transition-all"
                          style={{ 
                            paddingTop: `${activePlate.topMargin !== undefined ? activePlate.topMargin : 5}mm`,
                            paddingLeft: '5mm',
                            paddingRight: '5mm',
                            paddingBottom: '0mm'
                          }}
                         >
                            {page.items.map((item, idx) => (
                              <div 
                                key={`${item.plate.id}-${idx}`}
                                className="relative group p-1 border-2 border-transparent hover:border-blue-300 hover:bg-blue-50/50 rounded cursor-grab active:cursor-grabbing transition-colors"
                                style={{ 
                                  width: `${item.widthPct}%`, 
                                  display: 'flex', 
                                  justifyContent: 'center',
                                  marginBottom: `${activePlate.plateSpacing !== undefined ? activePlate.plateSpacing : 3}mm`
                                }}
                                draggable
                                onDragStart={(e) => {
                                    handleDragStart(item.originalIndex);
                                    // Add a small delay to visual drag to avoid ghosting the whole container weirdly
                                    const target = e.target as HTMLElement;
                                    target.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                    const target = e.target as HTMLElement;
                                    target.style.opacity = '1';
                                }}
                                onDragOver={handleDragOver}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDrop(item.originalIndex);
                                }}
                                onClick={() => setActivePlateId(item.plate.id)}
                              >
                                <div className="pointer-events-none">
                                    <PlatePreview data={item.plate} />
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white shadow rounded-full p-1 text-gray-500">
                                   <GripHorizontal size={16} />
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </section>

          <div onMouseDown={startResizing} className="hidden lg:flex w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize items-center justify-center">
            <div className="w-4 h-12 bg-gray-200 border rounded-full flex items-center justify-center shadow-sm"><GripVertical size={14} className="text-gray-400" /></div>
          </div>

          <section className={`${mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'} flex-1 bg-gray-100 p-3 md:p-8 overflow-y-auto`}>
            <div className="max-w-3xl mx-auto w-full">
              {activePlate && <PlateEditor data={activePlate} onChange={updateActivePlate} onDuplicate={() => duplicatePlate(activePlate)} onRemove={() => removePlate(activePlate.id)} />}
            </div>
          </section>
        </div>
      </main>

      {/* PRINT-ONLY SECTION (Using same Mixed Flow Logic) */}
      <div className="hidden print:block bg-white w-full h-auto">
           {pages.map((page, pageIdx) => (
             <div 
               key={pageIdx} 
               className="print-page flex flex-col" 
               style={{ 
                width: '210mm', 
                minHeight: '297mm', 
                margin: '0 auto', 
                paddingTop: `${activePlate.topMargin !== undefined ? activePlate.topMargin : 5}mm`,
                paddingLeft: '5mm',
                paddingRight: '5mm',
                paddingBottom: '0mm'
              }}
             >
                <div className="w-full h-full flex flex-wrap content-start items-start">
                  {page.items.map((item, itemIdx) => (
                    <div 
                        key={`${item.plate.id}-${pageIdx}-${itemIdx}`} 
                        className="flex justify-center plate-container"
                        style={{ 
                          width: `${item.widthPct}%`, 
                          marginBottom: `${activePlate.plateSpacing !== undefined ? activePlate.plateSpacing : 3}mm` 
                        }}
                    >
                      <PlatePreview data={item.plate} />
                    </div>
                  ))}
                </div>
             </div>
           ))}
      </div>

      <GlobalEditorModal isOpen={isGlobalEditorOpen} onClose={() => setIsGlobalEditorOpen(false)} currentTemplate={activePlate} onApply={applyGlobalUpdates} />
    </div>
  );
};

export default App;
