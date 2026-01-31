import React, { useState } from 'react';
import { Contract, ViewState } from '../types';
import { ArrowLeft, AlertTriangle, Check, DollarSign, Calendar, FileText, Ban } from 'lucide-react';

interface ContractDetailProps {
  contract: Contract;
  onBack: () => void;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contract, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'dates' | 'compliance'>('overview');

  if (!contract.analysis) return null;

  const { analysis } = contract;
  const isFinancialValid = analysis.financials.isValid;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Resumen Ejecutivo</h3>
              <p className="text-slate-600 leading-relaxed">{analysis.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-[#1D99CC]"/> Ortografía y Redacción
                  </h3>
                  {analysis.spellingErrors.length === 0 ? (
                    <div className="flex items-center text-[#3BB339] bg-[#EAF8E9] p-3 rounded-lg">
                      <Check className="h-5 w-5 mr-2" /> Sin errores detectados.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {analysis.spellingErrors.map((err, idx) => (
                        <li key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <p className="text-sm text-slate-500 italic">"{err.context}"</p>
                           <p className="text-sm font-semibold text-[#1D99CC] mt-1">Sugerencia: {err.suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  )}
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Score de Riesgo</h3>
                  <div className="flex items-center justify-center py-4">
                     <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-slate-100">
                        <span className={`text-4xl font-bold ${analysis.riskScore > 70 ? 'text-red-600' : analysis.riskScore > 30 ? 'text-amber-500' : 'text-[#3BB339]'}`}>
                          {analysis.riskScore}
                        </span>
                        <div className="absolute top-0 right-0 -mr-2 bg-slate-800 text-white text-xs px-2 py-1 rounded-full">/100</div>
                     </div>
                  </div>
                  <p className="text-center text-sm text-slate-500">
                    Calculado basado en {analysis.complianceAlerts.length} alertas de cumplimiento y {analysis.financials.discrepancies.length} discrepancias financieras.
                  </p>
               </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
             <div className={`p-4 rounded-xl border ${isFinancialValid ? 'bg-[#EAF8E9] border-[#3BB339]/30' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center">
                   {isFinancialValid ? <Check className="h-6 w-6 text-[#3BB339] mr-2"/> : <AlertTriangle className="h-6 w-6 text-red-600 mr-2"/>}
                   <h3 className={`font-bold ${isFinancialValid ? 'text-[#3BB339]' : 'text-red-800'}`}>
                     {isFinancialValid ? 'Análisis Financiero Correcto' : 'Discrepancias Financieras Detectadas'}
                   </h3>
                </div>
                {!isFinancialValid && (
                  <ul className="mt-3 list-disc list-inside text-red-700 text-sm">
                    {analysis.financials.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Plan de Pagos</h3>
                 <span className="text-xl font-mono font-semibold text-slate-700">
                    Total: {analysis.financials.totalContractValue.toLocaleString()} {analysis.financials.currency}
                 </span>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-200">
                   <thead className="bg-slate-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hito</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">%</th>
                       <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-slate-200">
                     {analysis.financials.paymentMilestones.map((milestone, idx) => (
                       <tr key={idx}>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{milestone.description}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{milestone.dueDate}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{milestone.percentage}%</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                           {milestone.amount.toLocaleString()}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        );

      case 'dates':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Línea de Tiempo y Deadlines</h3>
            <div className="space-y-4">
               {analysis.deadlines.map((deadline, idx) => (
                 <div key={idx} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm flex items-start justify-between ${deadline.isOverdue ? 'border-l-red-500' : deadline.daysRemaining < 30 ? 'border-l-amber-500' : 'border-l-[#1D99CC]'}`}>
                    <div>
                      <h4 className="font-bold text-slate-900">{deadline.description}</h4>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 bg-slate-100 rounded text-slate-600">{deadline.type}</span>
                        <span className="text-sm text-slate-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1"/> {deadline.date}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                       {deadline.isOverdue ? (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           Vencido hace {Math.abs(deadline.daysRemaining)} días
                         </span>
                       ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${deadline.daysRemaining < 30 ? 'bg-amber-100 text-amber-800' : 'bg-[#E1F3FA] text-[#1D99CC]'}`}>
                           {deadline.daysRemaining} días restantes
                        </span>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Alertas de Cumplimiento y Multas</h3>
            <div className="grid grid-cols-1 gap-4">
               {analysis.complianceAlerts.map((alert, idx) => (
                 <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-start">
                       <div className={`p-2 rounded-lg mr-4 ${alert.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Ban className="h-6 w-6" />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-slate-900 capitalize">{alert.type}</h4>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${alert.responsibleParty === 'us' ? 'bg-[#E1F3FA] text-[#1D99CC]' : alert.responsibleParty === 'counterparty' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                               Responsable: {alert.responsibleParty === 'us' ? 'Nosotros' : alert.responsibleParty === 'counterparty' ? 'Contraparte' : 'Mutuo'}
                            </span>
                          </div>
                          <p className="mt-2 text-slate-600 text-sm">{alert.description}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
         <div className="flex items-center">
           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full mr-4 transition-colors">
             <ArrowLeft className="h-5 w-5 text-slate-600"/>
           </button>
           <div>
             <h2 className="text-xl font-bold text-slate-900">{contract.title}</h2>
             <p className="text-xs text-slate-500">Subido el {new Date(contract.uploadDate).toLocaleDateString()}</p>
           </div>
         </div>
         <div className="flex space-x-2">
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
               Exportar PDF
            </button>
            <button className="px-4 py-2 bg-[#1D99CC] hover:bg-[#1681ad] text-white rounded-lg text-sm font-medium transition-colors">
               Compartir
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-8 pt-2 border-b border-slate-200">
         <div className="flex space-x-6">
            {[
              { id: 'overview', label: 'General', icon: FileText },
              { id: 'dates', label: 'Tiempos & Deadlines', icon: Calendar },
              { id: 'financial', label: 'Financiero', icon: DollarSign },
              { id: 'compliance', label: 'Cumplimiento', icon: AlertTriangle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-[#1D99CC] text-[#1D99CC]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
         </div>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto flex-1">
        <div className="max-w-5xl mx-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;