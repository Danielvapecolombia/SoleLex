import React from 'react';
import { Contract } from '../types';
import { AlertTriangle, CheckCircle, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ contracts, onSelectContract }) => {
  // Aggregate data
  const totalAnalyzed = contracts.filter(c => c.status === 'analyzed').length;
  
  const highRiskContracts = contracts.filter(c => 
    c.status === 'analyzed' && (c.analysis?.riskScore || 0) > 70
  );

  const financialErrors = contracts.filter(c => 
    c.status === 'analyzed' && c.analysis?.financials.isValid === false
  ).length;

  const upcomingDeadlines = contracts.flatMap(c => 
    (c.analysis?.deadlines || []).filter(d => !d.isOverdue && d.daysRemaining <= 30)
  ).length;

  // Chart Data - Using SoleLex Palette
  // Green: #3BB339, Blue: #1D99CC, Grey: #B3B3B3
  const complianceData = [
    { name: 'Sin Errores', value: contracts.filter(c => c.status === 'analyzed' && (c.analysis?.riskScore || 0) < 20).length, color: '#3BB339' }, // SoleLex Green
    { name: 'Riesgo Alto', value: highRiskContracts.length, color: '#ef4444' }, // Alert Red (Keep for critical)
    { name: 'Financiero', value: financialErrors, color: '#1D99CC' }, // SoleLex Blue
    { name: 'Plazos', value: contracts.flatMap(c => c.analysis?.deadlines.filter(d => d.isOverdue) || []).length, color: '#B3B3B3' }, // SoleLex Grey
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-slate-500 mt-1">Resumen de cumplimiento <span className="text-[#1D99CC] font-medium">SoleLex CLM</span></p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Contratos Analizados</h3>
            <div className="p-2 bg-[#EAF8E9] rounded-lg">
              <CheckCircle className="h-5 w-5 text-[#3BB339]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalAnalyzed}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Alertas de Riesgo</h3>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{highRiskContracts.length}</p>
          <p className="text-xs text-red-500 mt-1">Requieren atención inmediata</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Próximos Deadlines</h3>
            <div className="p-2 bg-[#E1F3FA] rounded-lg">
              <Clock className="h-5 w-5 text-[#1D99CC]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{upcomingDeadlines}</p>
          <p className="text-xs text-slate-500 mt-1">En los próximos 30 días</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Errores Financieros</h3>
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-[#B3B3B3]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{financialErrors}</p>
          <p className="text-xs text-slate-500 mt-1">Discrepancias detectadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Estado de Contratos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Acción Requerida</h3>
          <div className="space-y-4">
            {highRiskContracts.length === 0 && (
              <p className="text-slate-500 text-sm">No hay contratos de alto riesgo pendientes.</p>
            )}
            {highRiskContracts.slice(0, 4).map((contract) => (
              <div key={contract.id} className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors" onClick={() => onSelectContract(contract)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{contract.title}</h4>
                    <p className="text-xs text-red-600 mt-1 font-medium">Score de Riesgo: {contract.analysis?.riskScore}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-red-400" />
                </div>
              </div>
            ))}
            {contracts.filter(c => c.status === 'pending').length > 0 && (
              <div className="p-3 bg-[#E1F3FA] border border-[#1D99CC]/30 rounded-lg">
                <div className="flex justify-between items-center">
                   <h4 className="font-medium text-[#1D99CC] text-sm">
                     {contracts.filter(c => c.status === 'pending').length} Contratos pendientes de análisis
                   </h4>
                </div>
              </div>
            )}
            
             <div className="mt-6 pt-4 border-t border-slate-100">
                <button className="w-full py-2 bg-[#3BB339] hover:bg-[#2da02b] text-white rounded-lg text-sm font-medium transition-colors">
                  Generar Informe Mensual
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;