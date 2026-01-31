import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContractUpload from './components/ContractUpload';
import ContractDetail from './components/ContractDetail';
import ContractList from './components/ContractList';
import TemplateManager from './components/TemplateManager';
import { ViewState, Contract } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

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
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 ml-64 overflow-hidden h-screen relative">
         {/* Background accent - Adjusted to light blue/green tint */}
         <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-[#3BB339]/5 to-[#1D99CC]/5 -z-10"></div>
         {renderContent()}
      </main>
    </div>
  );
};

export default App;