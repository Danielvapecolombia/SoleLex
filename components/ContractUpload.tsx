import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2, FileType, AlertTriangle } from 'lucide-react';
import { analyzeContractContent } from '../services/geminiService';
import { Contract } from '../types';
import * as pdfjsLibModule from 'pdfjs-dist';

// Handle potential ESM/CommonJS interop issues with esm.sh
const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;

// Configurar el worker de PDF.js usando UNPKG para mayor estabilidad
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
} else {
    console.warn("PDF.js GlobalWorkerOptions is not available.");
}

interface ContractUploadProps {
  onAnalysisComplete: (contract: Contract) => void;
}

const ContractUpload: React.FC<ContractUploadProps> = ({ onAnalysisComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated Drive Files
  const driveFiles = [
    { id: '1', name: 'Contrato_Servicios_Tech_2024.pdf', date: '2024-05-10', type: 'pdf' },
    { id: '2', name: 'Acuerdo_Confidencialidad_NDA.txt', date: '2024-04-22', type: 'text' },
    { id: '3', name: 'Renovación_Licencias_Software.pdf', date: '2024-06-01', type: 'pdf' },
  ];

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (!pdfjsLib.getDocument) {
          throw new Error("PDF.js library not fully loaded.");
      }
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
      });

      const pdf = await loadingTask.promise;
      
      const pagePromises = Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        // @ts-ignore
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        return `--- Página ${pageNum} ---\n${pageText}\n\n`;
      });

      const pageTexts = await Promise.all(pagePromises);
      return pageTexts.join('');
      
    } catch (e: any) {
      console.error("Error parsing PDF", e);
      throw new Error(`Error técnico leyendo PDF: ${e.message || e}. Si el error persiste, intente convertir el PDF a texto o usar otro navegador.`);
    }
  };

  const processText = async (text: string, title: string, source: 'upload' | 'drive') => {
    setIsProcessing(true);
    setError(null);
    try {
      if (!text || text.trim().length === 0) {
        throw new Error("El documento parece estar vacío o no se pudo extraer texto. Es posible que sea un PDF escaneado (imagen) sin OCR.");
      }

      const analysis = await analyzeContractContent(text);
      const newContract: Contract = {
        id: Math.random().toString(36).substr(2, 9),
        title: title,
        content: text,
        status: 'analyzed',
        uploadDate: new Date().toISOString(),
        source: source,
        analysis: analysis
      };
      onAnalysisComplete(newContract);
    } catch (e: any) {
      setError("Error analizando el contrato: " + (e.message || "Intente nuevamente."));
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }
      await processText(text, file.name, 'upload');
    } catch (e: any) {
      setError("Error leyendo el archivo: " + e.message);
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDriveSelect = async (file: { name: string, type: string }) => {
    setShowDriveModal(false);
    
    // Simulación
    let content = "";
    if (file.type === 'pdf') {
       content = `--- Página 1 ---\nCONTRATO DE SERVICIOS PROFESIONALES (Simulación PDF)...`;
    } else {
       content = `CONTRATO SIMPLE DE EJEMPLO...`;
    }
    processText(content, file.name, 'drive');
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 px-4 md:pt-10 md:px-6">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Analizar Nuevo Contrato</h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Sube un documento PDF o texto, o impórtalo desde Google Drive.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Main Upload Area */}
        <div className="p-4 md:p-10">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 md:p-12 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-[#1D99CC] bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) {
                 processFile(file);
              }
            }}
          >
            <div className="bg-slate-100 p-3 md:p-4 rounded-full mb-4">
              <UploadCloud className="h-8 w-8 md:h-10 md:w-10 text-slate-600" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2 text-center">Arrastra y suelta tu contrato aquí</h3>
            <p className="text-slate-500 mb-6 text-sm md:text-base">Soporta formatos PDF y TXT</p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <label className="px-6 py-2.5 bg-[#1D99CC] hover:bg-[#1681ad] text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center shadow-md">
                <FileText className="w-4 h-4 mr-2"/>
                Subir Archivo
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} />
              </label>
              <span className="hidden sm:flex items-center text-slate-400">o</span>
              <button 
                onClick={() => setShowDriveModal(true)}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5 mr-2" />
                Google Drive
              </button>
            </div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-sm text-center mx-4">
            <Loader2 className="h-12 w-12 text-[#1D99CC] animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-900">Procesando Documento...</h3>
            <p className="text-slate-500 mt-2 text-sm">Extrayendo texto y analizando condiciones legales, plazos y montos.</p>
          </div>
        </div>
      )}

      {/* Drive Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5 mr-2" />
                Seleccionar desde Drive
              </h3>
              <button onClick={() => setShowDriveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-3">Archivos Recientes</p>
              <div className="space-y-2">
                {driveFiles.map(file => (
                  <button 
                    key={file.id}
                    onClick={() => handleDriveSelect(file)}
                    className="w-full flex items-center p-3 hover:bg-[#E1F3FA] border border-transparent hover:border-[#1D99CC]/30 rounded-lg transition-all group"
                  >
                    {file.type === 'pdf' ? (
                       <FileType className="h-8 w-8 text-red-400 group-hover:text-red-500 mr-3" />
                    ) : (
                       <FileText className="h-8 w-8 text-slate-400 group-hover:text-[#1D99CC] mr-3" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-slate-700 group-hover:text-[#1D99CC]">{file.name}</p>
                      <p className="text-xs text-slate-400">{file.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button onClick={() => setShowDriveModal(false)} className="text-sm text-slate-500 hover:text-slate-800">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 inline mr-2"/>
          {error}
        </div>
      )}
    </div>
  );
};

export default ContractUpload;