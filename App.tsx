import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContractUpload from './components/ContractUpload';
import ContractDetail from './components/ContractDetail';
import ContractList from './components/ContractList';
import TemplateManager from './components/TemplateManager';
import Login from './components/Login';
import ConfigWizard from './components/ConfigWizard';
import { ViewState, Contract } from './types';
import { Menu, Leaf, LogOut } from 'lucide-react';

interface User {
  name: string;
  picture: string;
  email: string;
  isGuest?: boolean;
}

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if Gemini Key is present. Google Keys are optional for Guest mode.
    const hasGemini = !!process.env.GEMINI_API_KEY;
    setIsConfigured(hasGemini);
  }, []);

  const handleLoginSuccess = (userData: any, token: string) => {
    setUser({
      name: userData.name,
      picture: userData.picture,
      email: userData.email,
      isGuest: false
    });
  };

  const handleGuestLogin = () => {
    setUser({
        name: "Usuario Invitado",
        picture: "https://ui-avatars.com/api/?name=Invitado&background=cbd5e1&color=64748b",
        email: "invitado@solelex.local",
        isGuest: true
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAnalysisComplete = (newContract: Contract) => {
    setContracts(prev => [newContract, ...prev]);
    setSelectedContract(newContract);
    setCurrentView(ViewState.CONTRACT_DETAIL);
  };

  const handleSelectContract = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView(ViewState.CONTRACT_DETAIL);
  };

  // 1. If keys are missing, show Config Wizard
  if (!isConfigured) {
    return <ConfigWizard />;
  }

  // 2. If not logged in, show Login Screen
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
  }

  // 3. Main App
  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return (
          <Dashboard 
            contracts={contracts} 
            onSelectContract={handleSelectContract} 
          />
        );
      case ViewState.UPLOAD:
        return (
          <ContractUpload 
            onAnalysisComplete={handleAnalysisComplete}
            isGuest={user.isGuest}
          />
        );
      case ViewState.CONTRACT_LIST:
        return (
          <ContractList 
            contracts={contracts} 
            onSelectContract={handleSelectContract} 
          />
        );
      case ViewState.CONTRACT_DETAIL:
        if (!selectedContract) return <Dashboard contracts={contracts} onSelectContract={handleSelectContract} />;
        return (
          <ContractDetail 
            contract={selectedContract} 
            onBack={() => setCurrentView(ViewState.CONTRACT_LIST)} 
          />
        );
      case ViewState.TEMPLATE_MANAGER:
        return <TemplateManager isGuest={user.isGuest} />;
      default:
        return <Dashboard contracts={contracts} onSelectContract={handleSelectContract} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-64 h-screen relative transition-all duration-300">
         
         {/* Mobile Header */}
         <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center space-x-2">
               <div className="bg-gradient-to-r from-[#3BB339] to-[#1D99CC] p-1.5 rounded-full">
                  <Leaf className="h-5 w-5 text-white" fill="white" />
               </div>
               <span className="font-bold text-slate-800 text-lg">SoleLex</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
         </div>

         {/* Desktop User Info / Logout (Absolute top right) */}
         <div className="hidden md:flex absolute top-4 right-8 z-10 items-center space-x-3 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm border border-slate-200">
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
            <div className="text-xs text-right hidden lg:block">
              <p className="font-bold text-slate-700">{user.name}</p>
              <p className="text-slate-500">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Cerrar Sesión">
               <LogOut className="h-4 w-4" />
            </button>
         </div>

         <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
            {/* Background accent */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-[#3BB339]/5 to-[#1D99CC]/5 -z-10"></div>
            {renderContent()}
         </main>
      </div>
    </div>
  );
};

export default App;