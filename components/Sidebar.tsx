import React from 'react';
import { LayoutDashboard, FileText, UploadCloud, Settings, Leaf, PenTool, X } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; picture: string; isGuest?: boolean } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, user }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.CONTRACT_LIST, label: 'Mis Contratos', icon: FileText },
    { id: ViewState.UPLOAD, label: 'Analizar Nuevo', icon: UploadCloud },
    { id: ViewState.TEMPLATE_MANAGER, label: 'Plantillas', icon: PenTool },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 left-0 h-screen w-64 flex flex-col shadow-xl z-40 text-white transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #3BB339 0%, #1D99CC 100%)' }}
      >
        
        {/* Brand Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-full shadow-lg">
              <Leaf className="h-6 w-6 text-[#3BB339]" fill="#3BB339" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block leading-none">SoleLex</span>
              <span className="text-xs font-medium text-blue-50 tracking-widest opacity-90">CLM</span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                onClose(); // Close sidebar on selection (mobile)
              }}
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
          {user && (
            <div className="mt-4 flex items-center px-4 space-x-3 bg-black/20 p-3 rounded-xl backdrop-blur-sm">
              <img src={user.picture} alt="Avatar" className="h-9 w-9 rounded-full border border-white/20 shadow-sm shrink-0" />
              <div className="text-sm overflow-hidden">
                <p className="font-medium text-white truncate">{user.name}</p>
                <p className="text-blue-100 text-xs truncate">
                  {user.isGuest ? 'Modo Invitado' : 'Abogado'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;