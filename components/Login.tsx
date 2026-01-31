import React, { useEffect, useState } from 'react';
import { Leaf, ArrowRight, Loader2, User } from 'lucide-react';
import { handleLogin, initGoogleServices, getUserInfo } from '../services/googleDriveService';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onGuestLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGuestLogin }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initGoogleServices();
      } catch (e) {
        console.warn("Google Services init warning (might be missing keys):", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const onGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const token = await handleLogin();
      const userInfo = await getUserInfo(token);
      onLoginSuccess(userInfo, token);
    } catch (e: any) {
      console.error(e);
      setError("No se pudo iniciar sesión. " + (e.message || "Verifica tu configuración de Google Cloud."));
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#3BB339] animate-spin mb-4" />
        <p className="text-slate-500">Cargando SoleLex...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#3BB339] to-[#1D99CC] p-10 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SoleLex CLM</h1>
          <p className="text-blue-50 text-sm font-medium tracking-wide opacity-90">ABOGADOS CORPORATIVOS & COMERCIALES</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">Bienvenido</h2>
            <p className="text-slate-500 mt-2">Inicia sesión para acceder a todas las funciones.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#1D99CC]" />
              ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="h-5 w-5" />
              )}
              <span>{isLoggingIn ? 'Conectando...' : 'Continuar con Google'}</span>
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">O bien</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={onGuestLogin}
              className="w-full flex items-center justify-center space-x-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl transition-all"
            >
              <User className="h-5 w-5" />
              <span>Entrar como Invitado</span>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
              {error}
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-400">
             Modo invitado permite subir archivos locales.<br/>
             Para conectar con Drive se requiere inicio de sesión.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;