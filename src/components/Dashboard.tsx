/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Loader2,
  LayoutDashboard,
  FileEdit,
  ArrowUpRight
} from 'lucide-react';
import { Dw_nota_spesesService } from '../generated/services/Dw_nota_spesesService';
import type { Dw_nota_speses } from '../generated/models/Dw_nota_spesesModel';

const ExpenseDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Dw_nota_speses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDrafts, setShowOnlyDrafts] = useState(false);

  function getField(record: any, field: string): string {
    return record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ?? '—';
  }

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Dw_nota_spesesService.getAll();
      const data = ((result as any)?.data ?? (result as any)?.value ?? []) as Dw_nota_speses[];
      setExpenses(data);
    } catch (err) {
      setError('Impossibile caricare le note spese.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const stats = useMemo(() => {
    return {
      bozze: expenses.filter(e => {
        const stato = (e as any)['dw_stato@OData.Community.Display.V1.FormattedValue']?.toUpperCase() ?? '';
        return stato === 'IN COMPOSIZIONE' || stato === 'BOZZA';
      }).length,
      attesa: expenses.filter(e => (e as any)['dw_stato@OData.Community.Display.V1.FormattedValue']?.toUpperCase() === 'IN ATTESA DI APPROVAZIONE').length,
      approvate: expenses.filter(e => (e as any)['dw_stato@OData.Community.Display.V1.FormattedValue']?.toUpperCase() === 'APPROVATA').length,
      rifiutate: expenses.filter(e => (e as any)['dw_stato@OData.Community.Display.V1.FormattedValue']?.toUpperCase() === 'RIFIUTATA').length,
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const dipendente = getField(e, 'dw_dipendente').toLowerCase();
      const commessa = getField(e, 'dw_codicedicommessa').toLowerCase();
      const stato = (e as any)['dw_stato@OData.Community.Display.V1.FormattedValue']?.toUpperCase() ?? '';
      const matchesSearch = dipendente.includes(searchTerm.toLowerCase()) || commessa.includes(searchTerm.toLowerCase());
      const matchesTab = !showOnlyDrafts ? true : (stato === 'IN COMPOSIZIONE' || stato === 'BOZZA');
      return matchesSearch && matchesTab;
    });
  }, [expenses, searchTerm, showOnlyDrafts]);

  const getStatusStyle = (stato: string) => {
    switch (stato?.toUpperCase()) {
      case 'APPROVATA': return 'bg-green-50 text-green-700 border-green-200';
      case 'IN ATTESA DI APPROVAZIONE': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'RIFIUTATA': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getStatusIcon = (stato: string) => {
    switch (stato?.toUpperCase()) {
      case 'APPROVATA': return <CheckCircle2 size={14} />;
      case 'IN ATTESA DI APPROVAZIONE': return <Clock size={14} />;
      case 'RIFIUTATA': return <XCircle size={14} />;
      case 'BOZZA':
      case 'IN COMPOSIZIONE': return <FileEdit size={14} />;
      default: return null;
    }
  };

  const handleRowClick = (record: any) => {
    const stato = record['dw_stato@OData.Community.Display.V1.FormattedValue']?.toUpperCase() ?? '';
    if (stato === 'IN COMPOSIZIONE' || stato === 'BOZZA') return;
    setSelectedId(record.dw_nota_speseid === selectedId ? null : record.dw_nota_speseid);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 px-10 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E85C24] rounded-lg flex items-center justify-center text-white shadow-md shadow-orange-100">
              <span className="text-lg font-black tracking-tighter">AG</span>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">AGIC</span>
              <span className="text-xl font-light text-slate-400 ml-1">Group</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <h1 className="text-2xl font-bold text-slate-800">Note Spese - Operatore</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E85C24] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cerca per dipendente o commessa..." 
              className="pl-12 pr-6 py-2.5 bg-slate-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-[#E85C24]/20 focus:border-[#E85C24] transition-all outline-none w-80 text-sm border hover:border-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="p-10 max-w-[1600px] mx-auto space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Bozze', val: stats.bozze, color: 'text-slate-400', bg: 'bg-slate-50', icon: <FileEdit size={24} /> },
            { label: 'In Attesa', val: stats.attesa, color: 'text-orange-500', bg: 'bg-orange-50', icon: <Clock size={24} /> },
            { label: 'Approvate', val: stats.approvate, color: 'text-green-500', bg: 'bg-green-50', icon: <CheckCircle2 size={24} /> },
            { label: 'Rifiutate', val: stats.rifiutate, color: 'text-red-500', bg: 'bg-red-50', icon: <XCircle size={24} /> },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#E85C24] transition-all">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1">{card.label}</p>
                <p className="text-3xl font-black text-slate-800">{isLoading ? '...' : card.val}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center transition-colors group-hover:scale-110 duration-200`}>
                {card.icon}
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col lg:flex-row lg:items-center gap-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
<div className="flex items-center gap-3">
  <span
    className={`text-sm font-semibold transition-colors ${
      !showOnlyDrafts ? "text-slate-900" : "text-slate-400"
    }`}
  >
    Tutte le Note
  </span>

  <button
    type="button"
    role="switch"
    aria-checked={showOnlyDrafts}
    data-state={showOnlyDrafts ? "checked" : "unchecked"}
    onClick={() => setShowOnlyDrafts(prev => !prev)}
    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-200 p-[2px] transition-colors duration-200 data-[state=checked]:bg-[#E85C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85C24] focus-visible:ring-offset-2"
  >
    <span
      data-state={showOnlyDrafts ? "checked" : "unchecked"}
      className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
    />
  </button>

  <span
    className={`text-sm font-semibold transition-colors ${
      showOnlyDrafts ? "text-slate-900" : "text-slate-400"
    }`}
  >
    Bozze
  </span>
</div>
            
          <div className="flex items-center gap-6 flex-1">
            <div className="flex-1 max-w-[240px]">
              <div className="relative">
                <select className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium cursor-pointer focus:border-[#E85C24] hover:bg-slate-100 transition-colors">
                  <option>Tutti gli stati</option>
                  <option>Approvata</option>
                  <option>In Attesa</option>
                  <option>Rifiutata</option>
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-[#E85C24] hover:text-[#E85C24] transition-all">
              <Calendar size={16} /> Ultimi 30 giorni
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-[#E85C24] hover:text-[#E85C24] transition-all ml-auto">
              <Filter size={18} /> Filtri Avanzati
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} className="text-[#E85C24]" />
              <h2 className="text-xl font-bold text-slate-800">Elenco Note Spese</h2>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E85C24] text-[#E85C24] rounded-xl text-sm font-bold hover:bg-orange-50 transition-all">
              <Download size={18} /> Esporta Note <ChevronRight size={14} className="rotate-90" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-80 gap-4 text-slate-400">
                <Loader2 className="animate-spin text-[#E85C24]" size={40} />
                <p className="font-medium animate-pulse">Caricamento dati...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold border-b border-slate-100">
                    <th className="px-8 py-5">Nome</th>
                    <th className="px-6 py-5">Dipendente</th>
                    <th className="px-6 py-5">Codice Commessa</th>
                    <th className="px-6 py-5">Periodo Tempo</th>
                    <th className="px-6 py-5">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((record: any) => {
                    const name = record.dw_name ?? 'Nota_Spesa';
                    const dipendente = getField(record, 'dw_dipendente');
                    const commessa = getField(record, 'dw_codicedicommessa');
                    const periodo = getField(record, 'dw_periodotempo');
                    const stato = record['dw_stato@OData.Community.Display.V1.FormattedValue'] ?? 'In Attesa';
                    const isDraft = stato.toUpperCase() === 'IN COMPOSIZIONE' || stato.toUpperCase() === 'BOZZA';
                    return (
                      <tr 
                        key={record.dw_nota_speseid} 
                        onClick={() => handleRowClick(record)}
                        className={`transition-all duration-150 group ${isDraft ? 'cursor-default opacity-80 italic bg-slate-50/30' : 'cursor-pointer hover:bg-slate-50'} ${selectedId === record.dw_nota_speseid ? 'bg-orange-50 border-l-4 border-l-[#E85C24]' : 'border-l-4 border-l-transparent'}`}
                      >
                        <td className={`px-8 py-6 text-sm font-bold transition-colors ${selectedId === record.dw_nota_speseid ? 'text-[#E85C24]' : 'text-slate-800'}`}>{name}</td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase border ${selectedId === record.dw_nota_speseid ? 'bg-white border-[#E85C24] text-[#E85C24]' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                              {dipendente.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{dipendente}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-sm text-slate-500 font-medium">{commessa}</td>
                        <td className="px-6 py-6 text-sm text-slate-500 font-medium">{periodo}</td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getStatusStyle(stato)}`}>
                            {getStatusIcon(stato)}
                            {stato}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-5 pt-4">
          <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:border-[#E85C24] hover:text-[#E85C24] transition-all flex items-center gap-2">Esporta Report</button>
          <button 
            disabled={!selectedId}
            className={`px-12 py-4 font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg ${selectedId ? 'bg-[#E85C24] text-white hover:bg-[#d04a1b] shadow-orange-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'}`}
          >
            Apri Dettagli <ArrowUpRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default ExpenseDashboard;
