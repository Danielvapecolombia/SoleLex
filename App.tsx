import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContractUpload from './components/ContractUpload';
import ContractDetail from './components/ContractDetail';
import ContractList from './components/ContractList';
import TemplateManager from './components/TemplateManager';
import { ViewState, Contract } from './types';
import { Menu, Leaf } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAnalysisComplete = (newContract: Contract) => {
    setContracts(prev => [newContract, ...prev]);
    setSelectedContract(newContract);
    setCurrentView(ViewState.CONTRACT_DETAIL);
  };

  const handleSelectContract = (contract: Contract) => {
    setSelectedContract(contract);
    setCurrentView(ViewState.CONTRACT_DETAIL);
  };

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
        return <TemplateManager />;
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