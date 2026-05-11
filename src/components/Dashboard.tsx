/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
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
  ArrowUpRight,
} from "lucide-react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Dw_nota_spesesService } from "../generated/services/Dw_nota_spesesService";
import type { Dw_nota_speses } from "../generated/models/Dw_nota_spesesModel";
import { Dw_time_periodsService } from "@/generated/services/Dw_time_periodsService";

// Integrated Components
import DettagliDrawer from './DettagliDrawer';
import DettaglioFullView from './DettaglioFullView';

/**
 * Modern Radix-style Switch Component
 */
const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (val: boolean) => void }) => (
  <SwitchPrimitive.Root
    checked={checked}
    onCheckedChange={onCheckedChange}
    className="peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85C24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#E85C24] data-[state=unchecked]:bg-slate-200"
  >
    <SwitchPrimitive.Thumb
      className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
    />
  </SwitchPrimitive.Root>
);

const ExpenseDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Dw_nota_speses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDrafts, setShowOnlyDrafts] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Tutti gli stati");
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("current");

  // Navigation & Integration State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [fullDetailId, setFullDetailId] = useState<string | null>(null);

  function getField(record: any, field: string): string {
    return record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ?? "—";
  }

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Dw_nota_spesesService.getAll();
      const data = ((result as any)?.data ?? (result as any)?.value ?? []) as Dw_nota_speses[];
      setExpenses(data);

      const periodsResult = await Dw_time_periodsService.getAll();
      const periodsData = ((periodsResult as any)?.data ?? (periodsResult as any)?.value ?? []) as any[];
      setPeriods(periodsData);
    } catch (err) {
      setError("Impossibile caricare le note spese.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const stats = useMemo(() => {
    return {
      bozze: expenses.filter((e) => {
        const stato = (e as any)["dw_stato@OData.Community.Display.V1.FormattedValue"]?.toUpperCase() ?? "";
        return stato === "IN COMPOSIZIONE" || stato === "BOZZA";
      }).length,
      attesa: expenses.filter((e) => (e as any)["dw_stato@OData.Community.Display.V1.FormattedValue"]?.toUpperCase() === "IN ATTESA DI APPROVAZIONE").length,
      approvate: expenses.filter((e) => (e as any)["dw_stato@OData.Community.Display.V1.FormattedValue"]?.toUpperCase() === "APPROVATA").length,
      rifiutate: expenses.filter((e) => (e as any)["dw_stato@OData.Community.Display.V1.FormattedValue"]?.toUpperCase() === "RIFIUTATA").length,
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const currentPeriod = periods.find((period) => {
      const start = new Date(period.dw_periodoinizio);
      start.setHours(0, 0, 0, 0);
      const end = new Date(period.dw_periodofine);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    return expenses.filter((e) => {
      const record = e as any;
      const dipendente = getField(record, "dw_dipendente").toLowerCase();
      const commessa = getField(record, "dw_codicedicommessa").toLowerCase();
      const statoFull = record["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? "";
      const statoUpper = statoFull.toUpperCase();
      const matchesSearch = dipendente.includes(searchTerm.toLowerCase()) || commessa.includes(searchTerm.toLowerCase());
      const isDraftStatus = statoUpper === "IN COMPOSIZIONE" || statoUpper === "BOZZA";
      const matchesToggle = showOnlyDrafts ? isDraftStatus : !isDraftStatus;
      const statusFilterUpper = statusFilter.toUpperCase();
      const matchesStatusDropdown = statusFilter === "Tutti gli stati" || statoUpper === statusFilterUpper;
      const notePeriodId = record._dw_periodotempo_value;
      
      let matchesPeriod = true;
      if (selectedPeriodId === "current") {
        matchesPeriod = !!currentPeriod && notePeriodId === currentPeriod.dw_time_periodid;
      } else if (selectedPeriodId === "previous") {
        matchesPeriod = !!currentPeriod && periods.some(p => {
            const pEnd = new Date(p.dw_periodofine);
            pEnd.setHours(23, 59, 59, 999);
            const cStart = new Date(currentPeriod.dw_periodoinizio);
            cStart.setHours(0, 0, 0, 0);
            return p.dw_time_periodid === notePeriodId && pEnd < cStart;
        });
      } else if (selectedPeriodId === "all") {
        matchesPeriod = true;
      } else {
        matchesPeriod = notePeriodId === selectedPeriodId;
      }
      return matchesSearch && matchesToggle && matchesStatusDropdown && matchesPeriod;
    });
  }, [expenses, periods, searchTerm, showOnlyDrafts, statusFilter, selectedPeriodId]);

  const getStatusStyle = (stato: string) => {
    switch (stato?.toUpperCase()) {
      case "APPROVATA": return "bg-green-50 text-green-700 border-green-200";
      case "IN ATTESA DI APPROVAZIONE": return "bg-orange-50 text-orange-700 border-orange-200";
      case "RIFIUTATA": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const getStatusIcon = (stato: string) => {
    switch (stato?.toUpperCase()) {
      case "APPROVATA": return <CheckCircle2 size={14} />;
      case "IN ATTESA DI APPROVAZIONE": return <Clock size={14} />;
      case "RIFIUTATA": return <XCircle size={14} />;
      case "BOZZA":
      case "IN COMPOSIZIONE": return <FileEdit size={14} />;
      default: return null;
    }
  };

  const handleRowClick = (record: any) => {
    const stato = record["dw_stato@OData.Community.Display.V1.FormattedValue"]?.toUpperCase() ?? "";
    if (stato === "IN COMPOSIZIONE" || stato === "BOZZA") return;
    const id = record.dw_nota_speseid;
    setSelectedId(id === selectedId ? null : id);
    setIsDrawerOpen(id !== selectedId);
  };

const handleApproveNota = async (id: string) => {
  try {
    await Dw_nota_spesesService.update(id, {
      dw_stato: 121950002, // Approvata
    } as any);

    setIsDrawerOpen(false);
    setSelectedId(null);
    await loadExpenses();
  } catch (err) {
    console.error("Errore durante l'approvazione:", err);
    alert("Errore durante l'approvazione");
  }
};

const handleRejectNota = async (id: string) => {
  try {
    await Dw_nota_spesesService.update(id, {
      dw_stato: 121950003, // Rifiutata
    } as any);

    setIsDrawerOpen(false);
    setSelectedId(null);
    await loadExpenses();
  } catch (err) {
    console.error("Errore durante il rifiuto:", err);
    alert("Errore durante il rifiuto");
  }
};

  if (fullDetailId) {
    return (
      <DettaglioFullView 
        detailId={fullDetailId} 
        onBack={() => setFullDetailId(null)}
      />
    );
  }

  const handleExport = () => {
  if (filteredExpenses.length === 0) {
    alert("Nessuna nota spesa da esportare.");
    return;
  }

  const rows = filteredExpenses.map((record: any) => {
    const name = record.dw_name ?? "Nota_Spesa";
    const dipendente = getField(record, "dw_dipendente");
    const commessa = getField(record, "dw_codicedicommessa");
    const periodo = getField(record, "dw_periodotempo");
    const stato =
      record["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? "";

    return {
      Nome: name,
      Dipendente: dipendente,
      "Codice Commessa": commessa,
      "Periodo Tempo": periodo,
      Stato: stato,
    };
  });

  const headers = Object.keys(rows[0]);

  const escapeCsvValue = (value: unknown) => {
    const stringValue = String(value ?? "");

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsvValue(row[header as keyof typeof row]))
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `note-spese-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
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
            { label: "Bozze", val: stats.bozze, color: "text-slate-400", bg: "bg-slate-50", icon: <FileEdit size={24} /> },
            { label: "In Attesa", val: stats.attesa, color: "text-orange-500", bg: "bg-orange-50", icon: <Clock size={24} /> },
            { label: "Approvate", val: stats.approvate, color: "text-green-500", bg: "bg-green-50", icon: <CheckCircle2 size={24} /> },
            { label: "Rifiutate", val: stats.rifiutate, color: "text-red-500", bg: "bg-red-50", icon: <XCircle size={24} /> },
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#E85C24] transition-all">
              <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1">{card.label}</p>
              <p className="text-3xl font-black text-slate-800">{isLoading ? "..." : card.val}</p></div>
              <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center transition-colors group-hover:scale-110 duration-200`}>{card.icon}</div>
            </div>
          ))}
        </section>

        <section className="flex flex-col lg:flex-row lg:items-center gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-6">
            <span className={`text-sm font-semibold transition-colors ${!showOnlyDrafts ? "text-slate-900" : "text-slate-400"}`}>Tutte le Note</span>
            <Switch checked={showOnlyDrafts} onCheckedChange={setShowOnlyDrafts} />
            <span className={`text-sm font-semibold transition-colors ${showOnlyDrafts ? "text-slate-900" : "text-slate-400"}`}>Bozze</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-1 max-w-[240px]">
              <div className="relative">
                <select className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium cursor-pointer focus:border-[#E85C24] hover:bg-slate-100 transition-colors" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>Tutti gli stati</option><option>Approvata</option><option>In attesa di approvazione</option><option>Rifiutata</option>
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="ml-auto flex justify-end gap-3 items-center">
            <div className="relative">
              <select className="appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer hover:border-[#E85C24] hover:text-[#E85C24] transition-all" value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)}>
                <option value="current">Periodo corrente</option><option value="previous">Periodi precedenti</option><option value="all">Tutti i periodi</option>
                {periods.slice().sort((a, b) => new Date(b.dw_periodoinizio).getTime() - new Date(a.dw_periodoinizio).getTime()).map((p) => (<option key={p.dw_time_periodid} value={p.dw_time_periodid}>{p.dw_name}</option>))}
              </select>
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3"><LayoutDashboard size={20} className="text-[#E85C24]" /><h2 className="text-xl font-bold text-slate-800">Elenco Note Spese</h2></div>
            <button
  onClick={handleExport}
  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E85C24] text-[#E85C24] rounded-xl text-sm font-bold hover:bg-orange-50 transition-all"
>
  <Download size={18} /> Esporta Note{" "}
  <ChevronRight size={14} className="rotate-90" />
</button>
          </div>
          <div className="overflow-x-auto flex-1">
            {isLoading ? (<div className="flex flex-col items-center justify-center h-80 gap-4 text-slate-400"><Loader2 className="animate-spin text-[#E85C24]" size={40} /><p className="font-medium animate-pulse">Caricamento dati...</p></div>) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold border-b border-slate-100">
                    <th className="px-8 py-5">Nome</th><th className="px-6 py-5">Dipendente</th><th className="px-6 py-5">Codice Commessa</th><th className="px-6 py-5">Periodo Tempo</th><th className="px-6 py-5">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((record: any) => {
                    const id = record.dw_nota_speseid;
                    const stato = record["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? "In Attesa di Approvazione";
                    const isDraft = stato.toUpperCase() === "IN COMPOSIZIONE" || stato.toUpperCase() === "BOZZA";
                    return (
                      <tr key={id} onClick={() => handleRowClick(record)} className={`transition-all duration-150 group ${isDraft ? "cursor-default opacity-80 italic bg-slate-50/30" : "cursor-pointer hover:bg-slate-50"} ${selectedId === id ? "bg-orange-50 border-l-4 border-l-[#E85C24]" : "border-l-4 border-l-transparent"}`}>
                        <td className={`px-8 py-6 text-sm font-bold transition-colors ${selectedId === id ? "text-[#E85C24]" : "text-slate-800"}`}>{record.dw_name ?? "Nota_Spesa"}</td>
                        <td className="px-6 py-6"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase border ${selectedId === id ? "bg-white border-[#E85C24] text-[#E85C24]" : "bg-slate-100 border-slate-200 text-slate-500"}`}>{getField(record, "dw_dipendente").split(" ").map((n: string) => n[0]).join("")}</div><span className="text-sm font-semibold text-slate-700">{getField(record, "dw_dipendente")}</span></div></td>
                        <td className="px-6 py-6 text-sm text-slate-500 font-medium">{getField(record, "dw_codicedicommessa")}</td>
                        <td className="px-6 py-6 text-sm text-slate-500 font-medium">{getField(record, "dw_periodotempo")}</td>
                        <td className="px-6 py-6"><span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getStatusStyle(stato)}`}>{getStatusIcon(stato)}{stato}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-5 pt-4">
          <button disabled={!selectedId} className={`px-12 py-4 font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg ${selectedId ? "bg-[#E85C24] text-white hover:bg-[#d04a1b] shadow-orange-200" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"}`} onClick={() => setIsDrawerOpen(true)}>Apri Dettagli <ArrowUpRight size={20} /></button>
        </div>
      </main>

      {/* Slide-in Details Drawer */}
      <DettagliDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notaSpesaId={selectedId}
        notaSpesaName={expenses.find(e => e.dw_nota_speseid === selectedId)?.dw_name || 'Nota Spesa'}
        onSelectDetail={(detailId) => {
          setFullDetailId(detailId);
          setIsDrawerOpen(false);
        }}
        onApproveNota={handleApproveNota}
        onRejectNota={handleRejectNota}
      />
    </div>
  );
};

export default ExpenseDashboard;
