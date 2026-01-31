import React, { useState } from 'react';
import { Contract } from '../types';
import { Search, FileText, ChevronRight, AlertTriangle } from 'lucide-react';

interface ContractListProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
}

const ContractList: React.FC<ContractListProps> = ({ contracts, onSelectContract }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.analysis?.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mis Contratos</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Gestión y archivo de documentos legales analizados</p>
        </div>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, contenido o resumen..." 
            className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        {/* Table Container with horizontal scroll for mobile */}
        <div className="overflow-x-auto flex-1">
          <div className="inline-block min-w-full align-middle">
            {filteredContracts.length === 0 ? (
              <div className="h-64 md:h-full flex flex-col items-center justify-center text-slate-400 p-8">
                 <FileText className="h-16 w-16 mb-4 opacity-50" />
                 <p>No se encontraron contratos</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Fecha de Subida</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Riesgo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Origen</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onSelectContract(contract)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 max-w-[150px] md:max-w-xs truncate">{contract.title}</div>
                            <div className="text-sm text-slate-500 truncate max-w-[150px] md:max-w-xs hidden sm:block">{contract.analysis?.summary.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-slate-900">{new Date(contract.uploadDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         {(contract.analysis?.riskScore || 0) > 50 ? (
                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                             Alto ({contract.analysis?.riskScore})
                           </span>
                         ) : (contract.analysis?.riskScore || 0) > 20 ? (
                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                             Medio ({contract.analysis?.riskScore})
                           </span>
                         ) : (
                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                             Bajo ({contract.analysis?.riskScore})
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize hidden lg:table-cell">
                        {contract.source === 'drive' ? 'Google Drive' : 'Subida Manual'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractList;