import React, { useState } from 'react';
import { Leaf, Save, Settings, AlertCircle, HelpCircle } from 'lucide-react';

const ConfigWizard: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [clientId, setClientId] = useState('');

  const handleSave = () => {
    // Only Gemini Key is strictly required for the core AI functionality
    if (!geminiKey) {
      alert("La Gemini API Key es obligatoria para el funcionamiento de la IA.");
      return;
    }

    const config = {
      GEMINI_API_KEY: geminiKey,
      GOOGLE_API_KEY: googleKey,
      CLIENT_ID: clientId
    };

    localStorage.setItem('solelex_config', JSON.stringify(config));
    // Reload to apply changes to window.process in index.html
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-[#3BB339] to-[#1D99CC] p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuración Inicial</h1>
          <p className="text-blue-50 text-sm font-medium tracking-wide opacity-90">CONECTA TUS SERVICIOS</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
             <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
             <p className="text-sm text-blue-800">
               Ingresa tus credenciales para habilitar las funciones. Estas se guardan localmente en tu navegador.
             </p>
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">1. Gemini API Key (Obligatorio)</label>
             <p className="text-xs text-slate-500 mb-2">
               El cerebro de SoleLex. 
               <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#3BB339] hover:underline ml-1">
                 Obtener en AI Studio
               </a>
             </p>
             <input 
               type="text" 
               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3BB339] focus:border-transparent outline-none font-mono text-sm"
               placeholder="Ej: AIzaSyB..."
               value={geminiKey}
               onChange={(e) => setGeminiKey(e.target.value)}
             />
          </div>

          <div className="pt-4 border-t border-slate-100">
             <h3 className="text-sm font-bold text-slate-900 mb-3">Integración Google Drive (Opcional)</h3>
             <p className="text-xs text-slate-500 mb-4">Solo necesario si quieres importar documentos directamente desde Drive.</p>

             <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Google OAuth Client ID</label>
                    <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1D99CC] focus:border-transparent outline-none font-mono text-sm"
                    placeholder="Ej: 123456789-abcde.apps.googleusercontent.com"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Google API Key (GCP)</label>
                    <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1D99CC] focus:border-transparent outline-none font-mono text-sm"
                    placeholder="Ej: AIzaSyD..."
                    value={googleKey}
                    onChange={(e) => setGoogleKey(e.target.value)}
                    />
                </div>
             </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigWizard;