import React, { useState } from 'react';
import { PenTool, Copy, Download, UploadCloud, Loader2, FileText, FileType, RefreshCw, Image as ImageIcon, Check } from 'lucide-react';
import { analyzeTemplateVariables, TemplateAnalysis } from '../services/geminiService';
import * as pdfjsLibModule from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';

// Handle potential ESM/CommonJS interop issues
const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;
if (pdfjsLib.GlobalWorkerOptions) {
  // Use unpkg for standard worker script (fixes importScripts error)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const TemplateManager: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'fill'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [templateAnalysis, setTemplateAnalysis] = useState<TemplateAnalysis | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Simulated Drive Files for Templates
  const driveFiles = [
    { id: '1', name: 'Plantilla_Contrato_Servicios.docx', date: '2024-01-15', type: 'docx' },
    { id: '2', name: 'NDA_Estandar_Empresa.pdf', date: '2023-11-20', type: 'pdf' },
    { id: '3', name: 'Formato_Renovacion.txt', date: '2024-02-10', type: 'text' },
  ];

  const extractText = async (file: File): Promise<string> => {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'pdf') {
       const arrayBuffer = await file.arrayBuffer();
       
       // Enhanced PDF load options
       const loadingTask = pdfjsLib.getDocument({ 
         data: arrayBuffer,
         cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
         cMapPacked: true,
         standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
       });
       
       const pdf = await loadingTask.promise;
       
       // Procesamiento paralelo de páginas
       const pagePromises = Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (pageNum) => {
         const page = await pdf.getPage(pageNum);
         const textContent = await page.getTextContent();
         // @ts-ignore
         return textContent.items.map((item: any) => item.str).join(' ');
       });

       const pageTexts = await Promise.all(pagePromises);
       return pageTexts.join('\n\n');

    } else if (fileType === 'docx') {
       const arrayBuffer = await file.arrayBuffer();
       const result = await mammoth.extractRawText({ arrayBuffer });
       return result.value;
    } else {
       // Assume text
       return await file.text();
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
        const text = await extractText(file);
        if (!text.trim()) throw new Error("No se pudo extraer texto del archivo.");
        
        const analysis = await analyzeTemplateVariables(text);
        setTemplateAnalysis(analysis);
        
        // Init form values
        const initialValues: Record<string, string> = {};
        analysis.variables.forEach(v => initialValues[v] = '');
        setFormValues(initialValues);
        
        // Initial preview logic
        updatePreview(initialValues, analysis);
        
        setStep('fill');
    } catch (error) {
        console.error(error);
        alert("Error procesando la plantilla. Puede que el documento sea demasiado grande o ilegible.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDriveSelect = async (file: { name: string, type: string }) => {
    setShowDriveModal(false);
    setIsProcessing(true);
    
    // Simulación de contenido de Drive
    setTimeout(async () => {
        let content = "";
        if (file.type === 'docx') {
            content = "CONTRATO DE SERVICIOS\n\nEntre [NOMBRE_CLIENTE] y [NOMBRE_PROVEEDOR]...\nFecha: ______\nMonto: ______\n\nFOTO PROYECTO ANEXO";
        } else if (file.type === 'pdf') {
            content = "ACUERDO DE CONFIDENCIALIDAD\n\nEste acuerdo se firma el día [DIA] del mes [MES] del año [AÑO].\nParte Reveladora: [•]\nParte Receptora: (*)";
        } else {
            content = "Formato simple... Nombre: [NOMBRE]";
        }

        try {
            const analysis = await analyzeTemplateVariables(content);
            setTemplateAnalysis(analysis);
            const initialValues: Record<string, string> = {};
            analysis.variables.forEach(v => initialValues[v] = '');
            setFormValues(initialValues);
            updatePreview(initialValues, analysis);
            setStep('fill');
        } catch(e) {
            alert("Error simulado en análisis");
        } finally {
            setIsProcessing(false);
        }
    }, 1500);
  };

  const isImageField = (fieldName: string) => {
    const upper = fieldName.toUpperCase();
    return upper.startsWith('FOTO') || upper.startsWith('IMAGEN') || upper.startsWith('IMG') || upper.includes('LOGO');
  };

  const handleInputChange = (field: string, value: string) => {
    const newValues = { ...formValues, [field]: value };
    setFormValues(newValues);
    updatePreview(newValues, templateAnalysis);
  };

  const handleImageUpload = (field: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        handleInputChange(field, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updatePreview = (currentValues: Record<string, string>, analysis: TemplateAnalysis | null) => {
      if (!analysis) return;
      let text = analysis.normalizedText;
      
      Object.entries(currentValues).forEach(([key, val]) => {
          let replacement = val;
          if (!val) {
               replacement = `[${key}]`;
          } else if (val.startsWith('data:image')) {
               // Use a unique marker for images that we can parse later in render
               replacement = `<<IMG_DATA:${key}>>`;
          }
          
          // Escape key for regex
          const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\[${safeKey}\\]`, 'g');
          text = text.replace(regex, replacement);
      });
      setGeneratedDoc(text);
  };

  const renderDocContent = (text: string) => {
    // Split text by the image marker regex
    const parts = text.split(/(<<IMG_DATA:.*?>>)/g);
    return parts.map((part, index) => {
        if (part.startsWith('<<IMG_DATA:')) {
            const key = part.replace('<<IMG_DATA:', '').replace('>>', '');
            const imgSrc = formValues[key];
            if (imgSrc) {
                return (
                    <div key={index} className="my-6 flex justify-center">
                        <div className="relative group">
                            <img src={imgSrc} alt="Inserted" className="max-w-full h-auto max-h-[400px] rounded shadow-md border border-slate-200" />
                            <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Check className="h-4 w-4 text-green-600"/>
                            </div>
                        </div>
                    </div>
                );
            }
            return <span key={index} className="text-red-400 italic font-bold">[Espacio para Imagen: {key.replace('FOTO_', '')}]</span>;
        }
        return <span key={index}>{part}</span>;
    });
  };

  const handleCopy = () => {
     // For copy, we might want to strip image markers or warn
    const plainText = generatedDoc.replace(/<<IMG_DATA:.*?>>/g, '[IMAGEN ADJUNTA]');
    navigator.clipboard.writeText(plainText);
    alert('Texto copiado al portapapeles (las imágenes no se copian como texto).');
  };

  const reset = () => {
      setStep('upload');
      setTemplateAnalysis(null);
      setFormValues({});
      setGeneratedDoc('');
  };

  if (step === 'upload') {
      return (
        <div className="max-w-4xl mx-auto pt-10 px-6 h-full flex flex-col">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900">Gestor de Plantillas <span className="text-[#3BB339]">Inteligente</span></h2>
                <p className="text-slate-500 mt-2">Sube una plantilla (PDF, Word, TXT) y la IA detectará los campos a rellenar automáticamente.</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 max-h-[600px]">
                <div className="p-10 h-full flex flex-col justify-center">
                <div 
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors h-full ${isDragging ? 'border-[#1D99CC] bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileUpload(file);
                    }}
                >
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                       <UploadCloud className="h-10 w-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Arrastra tu plantilla aquí</h3>
                    <p className="text-slate-500 mb-8">Soporta .docx, .pdf, .txt</p>
                    
                    <div className="flex space-x-4">
                        <label className="px-6 py-3 bg-[#1D99CC] hover:bg-[#1681ad] text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center shadow-md">
                            <FileText className="w-5 h-5 mr-2"/>
                            Subir Documento
                            <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                        </label>
                        <span className="flex items-center text-slate-400">o</span>
                        <button 
                            onClick={() => setShowDriveModal(true)}
                            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center"
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
                    <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-sm text-center">
                        <Loader2 className="h-12 w-12 text-[#1D99CC] animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">Analizando Plantilla...</h3>
                        <p className="text-slate-500 mt-2 text-sm">Identificando espacios, variables y zonas de imagen.</p>
                    </div>
                </div>
            )}

            {/* Drive Modal */}
            {showDriveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5 mr-2" />
                                Seleccionar Plantilla
                            </h3>
                            <button onClick={() => setShowDriveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-3">Mis Unidades</p>
                            <div className="space-y-2">
                                {driveFiles.map(file => (
                                <button 
                                    key={file.id}
                                    onClick={() => handleDriveSelect(file)}
                                    className="w-full flex items-center p-3 hover:bg-[#E1F3FA] border border-transparent hover:border-[#1D99CC]/30 rounded-lg transition-all group"
                                >
                                    {file.type === 'pdf' ? (
                                        <FileType className="h-8 w-8 text-red-400 group-hover:text-red-500 mr-3" />
                                    ) : file.type === 'docx' ? (
                                        <FileText className="h-8 w-8 text-blue-500 group-hover:text-blue-600 mr-3" />
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
                    </div>
                </div>
            )}
        </div>
      );
  }

  // FILL STEP
  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Rellenar Plantilla</h1>
            <p className="text-slate-500">Completa los campos detectados, incluidos textos e imágenes.</p>
        </div>
        <button onClick={reset} className="flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium">
            <RefreshCw className="h-4 w-4 mr-2" /> Subir otra plantilla
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        
        {/* Left Column: Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center">
               <PenTool className="h-4 w-4 mr-2 text-[#1D99CC]" />
               Campos Detectados
             </h3>
             <span className="text-xs text-white bg-[#3BB339] px-2 py-0.5 rounded-full font-bold">
                 {templateAnalysis?.variables.length} Campos
             </span>
          </div>
          
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="space-y-6">
                {templateAnalysis?.variables.map((field) => {
                    const isImg = isImageField(field);
                    return (
                        <div key={field} className={isImg ? "p-4 bg-slate-50 rounded-lg border border-slate-200" : ""}>
                            <label className="block text-xs font-bold text-[#1D99CC] mb-1 uppercase tracking-wide flex items-center">
                                {isImg && <ImageIcon className="h-3 w-3 mr-1" />}
                                {field.replace(/_/g, ' ')}
                            </label>
                            
                            {isImg ? (
                                <div className="mt-2">
                                    <label className="flex flex-col items-center px-4 py-6 bg-white text-slate-500 rounded-lg shadow-sm tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue-50 hover:text-[#1D99CC] transition-colors border-dashed border-2 border-slate-300">
                                        {formValues[field] ? (
                                            <div className="flex flex-col items-center text-[#3BB339]">
                                                <Check className="h-8 w-8 mb-2" />
                                                <span className="text-sm font-semibold">Imagen Cargada</span>
                                                <span className="text-xs mt-1">Clic para cambiar</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <UploadCloud className="h-8 w-8 mb-2" />
                                                <span className="text-sm leading-normal">Seleccionar Foto</span>
                                            </div>
                                        )}
                                        <input type='file' className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(field, e.target.files[0])} />
                                    </label>
                                    {formValues[field] && (
                                      <div className="mt-2 text-center">
                                        <img src={formValues[field]} alt="Preview" className="h-20 object-cover rounded mx-auto border" />
                                      </div>
                                    )}
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#3BB339] focus:ring-1 focus:ring-[#3BB339] transition-all bg-slate-50 focus:bg-white text-slate-900"
                                    value={formValues[field] || ''}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    placeholder={`Ingresa ${field.toLowerCase().replace(/_/g, ' ')}...`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center">
               <FileText className="h-4 w-4 mr-2 text-[#3BB339]" />
               Vista Previa
             </h3>
             <div className="flex space-x-2">
               <button onClick={handleCopy} className="p-2 text-slate-600 hover:text-[#1D99CC] hover:bg-blue-50 rounded-md transition-colors" title="Copiar Texto">
                 <Copy className="h-4 w-4" />
               </button>
               <button className="p-2 text-slate-600 hover:text-[#3BB339] hover:bg-green-50 rounded-md transition-colors" title="Descargar .txt">
                 <Download className="h-4 w-4" />
               </button>
             </div>
           </div>

           <div className="flex-1 p-8 overflow-y-auto bg-white">
             <div className="max-w-none prose prose-slate">
                <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
                  {renderDocContent(generatedDoc)}
                </pre>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;