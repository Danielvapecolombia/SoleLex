import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { analyzeContractContent } from '../services/geminiService';
import { openDrivePicker, downloadFileContent } from '../services/googleDriveService';
import { Contract } from '../types';
import * as pdfjsLibModule from 'pdfjs-dist';

// Handle potential ESM/CommonJS interop issues with esm.sh
const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;

// Configurar el worker de PDF.js usando UNPKG para mayor estabilidad
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface ContractUploadProps {
  onAnalysisComplete: (contract: Contract) => void;
  isGuest?: boolean;
}

const ContractUpload: React.FC<ContractUploadProps> = ({ onAnalysisComplete, isGuest }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTextFromBuffer = async (arrayBuffer: ArrayBuffer, mimeType: string): Promise<string> => {
     if (mimeType.includes('pdf')) {
        return extractTextFromPdf(arrayBuffer);
     } else {
        // Assume text/plain
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(arrayBuffer);
     }
  };

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
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
      throw new Error(`Error técnico leyendo PDF: ${e.message || e}.`);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      let text = '';
      const arrayBuffer = await file.arrayBuffer();
      
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractTextFromPdf(arrayBuffer);
      } else {
        text = await file.text();
      }
      await processText(text, file.name, 'upload');
    } catch (e: any) {
      setError("Error leyendo el archivo: " + e.message);
      setIsProcessing(false);
    }
  };

  const handleDriveClick = async () => {
    if (isGuest) {
      alert("🔒 Acceso a Google Drive restringido\n\nEsta función requiere iniciar sesión con una cuenta de Google para acceder a tus documentos en la nube. En modo invitado, por favor utiliza la opción 'Subir Archivo'.");
      return;
    }

    try {
      const file = await openDrivePicker();
      if (file) {
        setIsProcessing(true);
        setError(null);
        // Download content
        const buffer = await downloadFileContent(file.id);
        const text = await extractTextFromBuffer(buffer, file.mimeType);
        await processText(text, file.name, 'drive');
      }
    } catch (e: any) {
      console.error(e);
      setError("Error conectando con Google Drive: " + e.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 px-4 md:pt-10 md:px-6">
      <div className="text-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Analizar Nuevo Contrato</h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Sube un documento PDF o texto, o impórtalo directamente desde tu Google Drive.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Main Upload Area */}
        <div className="p-4 md:p-10">
          <div 
            className={`border-2 border-dashed rounded-xl p-6 md:p-12 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-[#1D99CC] bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) {
                 setIsProcessing(true);
                 try {
                    let text = '';
                    const arrayBuffer = await file.arrayBuffer();
                    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                        text = await extractTextFromPdf(arrayBuffer);
                    } else {
                        text = await file.text();
                    }
                    await processText(text, file.name, 'upload');
                 } catch(err: any) {
                     setError(err.message);
                     setIsProcessing(false);
                 }
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
                onClick={handleDriveClick}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5 mr-2" />
                Google Drive
                {isGuest && <Lock className="h-3 w-3 ml-2 text-slate-400" />}
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
            <p className="text-slate-500 mt-2 text-sm">Extrayendo texto y analizando condiciones legales.</p>
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