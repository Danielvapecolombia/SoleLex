import React from 'react';
import { LayoutDashboard, FileText, UploadCloud, Settings, Leaf, PenTool } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.CONTRACT_LIST, label: 'Mis Contratos', icon: FileText },
    { id: ViewState.UPLOAD, label: 'Analizar Nuevo', icon: UploadCloud },
    { id: ViewState.TEMPLATE_MANAGER, label: 'Plantillas', icon: PenTool },
  ];

  return (
    <div className="w-64 flex flex-col h-screen fixed left-0 top-0 shadow-xl z-20 text-white" 
         style={{ background: 'linear-gradient(180deg, #3BB339 0%, #1D99CC 100%)' }}>
      
      {/* Brand Header */}
      <div className="p-6 border-b border-white/20 flex items-center space-x-3">
        <div className="bg-white p-1.5 rounded-full shadow-lg">
           <Leaf className="h-6 w-6 text-[#3BB339]" fill="#3BB339" />
        </div>
        <div>
           <span className="text-xl font-bold tracking-tight block leading-none">SoleLex</span>
           <span className="text-xs font-medium text-blue-50 tracking-widest opacity-90">CLM</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/20">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white transition-colors">
          <Settings className="h-5 w-5" />
          <span className="font-medium">Configuración</span>
        </button>
        <div className="mt-4 flex items-center px-4 space-x-3 bg-black/20 p-3 rounded-xl backdrop-blur-sm">
           <div className="h-9 w-9 rounded-full bg-white text-[#1D99CC] flex items-center justify-center text-sm font-bold shadow-sm">JT</div>
           <div className="text-sm">
             <p className="font-medium text-white">Juan C Toro</p>
             <p className="text-blue-100 text-xs">Abogado Senior</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;