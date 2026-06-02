/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  FileEdit,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import { Dw_nota_spesesService } from "../generated/services/Dw_nota_spesesService";
import type { Dw_nota_speses } from "../generated/models/Dw_nota_spesesModel";
import { Dw_time_periodsService } from "@/generated/services/Dw_time_periodsService";
import { ContactsService } from "../generated/services/ContactsService";
import { Dw_notificationtrackersService } from "../generated/services/Dw_notificationtrackersService";

import DettagliDrawer from "./DettagliDrawer";
import DettaglioFullView from "./DettaglioFullView";
import MainLayout from "./MainLayout";
import HalfMonthPicker from "./HalfMonthPicker";

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function normalizeStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function normalizeEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getSelectedHalfMonthRange(value: string) {
  if (!value) return null;

  const selectedDate = parseDateOnly(value);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const day = selectedDate.getDate();

  if (day === 1) {
    return {
      start: normalizeStartOfDay(new Date(year, month, 1)),
      end: normalizeEndOfDay(new Date(year, month, 15)),
    };
  }

  if (day === 16) {
    return {
      start: normalizeStartOfDay(new Date(year, month, 16)),
      end: normalizeEndOfDay(new Date(year, month + 1, 0)),
    };
  }

  return null;
}

function isSamePeriodRange(period: any, range: { start: Date; end: Date }) {
  const periodStart = normalizeStartOfDay(new Date(period.dw_periodoinizio));
  const periodEnd = normalizeEndOfDay(new Date(period.dw_periodofine));

  return (
    periodStart.getTime() === range.start.getTime() &&
    periodEnd.getTime() === range.end.getTime()
  );
}

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";
type DashboardView = "active" | "drafts" | "completed";

interface ExpenseDashboardProps {
  onNavigate?: (page: AppPage) => void;
  itemsPerPage: number;
  notificationsEnabled: boolean;
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({
  onNavigate,
  itemsPerPage,
  notificationsEnabled,
}) => {
  const [expenses, setExpenses] = useState<Dw_nota_speses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<DashboardView>("active");
  const [statusFilter, setStatusFilter] = useState("Tutti gli stati");

  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodDate, setSelectedPeriodDate] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingRejectNotaId, setPendingRejectNotaId] = useState<string | null>(
    null,
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [fullDetailId, setFullDetailId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingNotaId, setUpdatingNotaId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeView, statusFilter, selectedPeriodDate]);

  function getField(record: any, field: string): string {
    return (
      record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ?? "—"
    );
  }

  function getStatus(record: any): string {
    return (
      record["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? ""
    ).toUpperCase();
  }

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await Dw_nota_spesesService.getAll();
      const data = ((result as any)?.data ??
        (result as any)?.value ??
        []) as Dw_nota_speses[];
      setExpenses(data);

      const periodsResult = await Dw_time_periodsService.getAll();
      const periodsData = ((periodsResult as any)?.data ??
        (periodsResult as any)?.value ??
        []) as any[];
      setPeriods(periodsData);
    } catch (err) {
      console.error("Errore caricamento Note Spese:", err);
      setError("Impossibile caricare le note spese.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const stats = useMemo(() => {
    return {
      bozze: expenses.filter((e) => {
        const stato = getStatus(e);
        return stato === "IN COMPOSIZIONE" || stato === "BOZZA";
      }).length,
      attesa: expenses.filter(
        (e) => getStatus(e) === "IN ATTESA DI APPROVAZIONE",
      ).length,
      approvate: expenses.filter((e) => getStatus(e) === "APPROVATA").length,
      rifiutate: expenses.filter((e) => getStatus(e) === "RIFIUTATA").length,
      completate: expenses.filter((e) => getStatus(e) === "COMPLETATA").length,
    };
  }, [expenses]);

  const activeCount = stats.attesa + stats.approvate + stats.rifiutate;

  const filteredExpenses = useMemo(() => {
    const selectedRange = getSelectedHalfMonthRange(selectedPeriodDate);

    const selectedPeriod = selectedRange
      ? periods.find((period) => isSamePeriodRange(period, selectedRange))
      : null;

    return expenses.filter((e) => {
      const record = e as any;

      const dipendente = getField(record, "dw_dipendente").toLowerCase();
      const commessa = getField(record, "dw_codicedicommessa").toLowerCase();

      const statoFull =
        record["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? "";
      const statoUpper = statoFull.toUpperCase();

      const matchesSearch =
        dipendente.includes(searchTerm.toLowerCase()) ||
        commessa.includes(searchTerm.toLowerCase());

      const isDraftStatus =
        statoUpper === "IN COMPOSIZIONE" || statoUpper === "BOZZA";
      const isCompletedStatus = statoUpper === "COMPLETATA";

      const matchesView =
        activeView === "active"
          ? !isDraftStatus && !isCompletedStatus
          : activeView === "drafts"
            ? isDraftStatus
            : isCompletedStatus;

      const statusFilterUpper = statusFilter.toUpperCase();

      const matchesStatusDropdown =
        statusFilter === "Tutti gli stati" || statoUpper === statusFilterUpper;

      const notePeriodId = record._dw_periodotempo_value;

      const matchesPeriod = selectedPeriodDate
        ? !!selectedPeriod && notePeriodId === selectedPeriod.dw_time_periodid
        : true;

      return (
        matchesSearch && matchesView && matchesStatusDropdown && matchesPeriod
      );
    });
  }, [
    expenses,
    periods,
    searchTerm,
    activeView,
    statusFilter,
    selectedPeriodDate,
  ]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredExpenses.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, filteredExpenses]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const getStatusStyle = (stato: string) => {
    switch (stato?.toUpperCase()) {
      case "APPROVATA":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
      case "IN ATTESA DI APPROVAZIONE":
        return "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
      case "RIFIUTATA":
        return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case "COMPLETATA":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const getStatusIcon = (stato: string) => {
    switch (stato?.toUpperCase()) {
      case "APPROVATA":
        return <CheckCircle2 size={14} />;
      case "IN ATTESA DI APPROVAZIONE":
        return <Clock size={14} />;
      case "RIFIUTATA":
        return <XCircle size={14} />;
      case "BOZZA":
      case "IN COMPOSIZIONE":
        return <FileEdit size={14} />;
      case "COMPLETATA":
        return <CheckCircle size={14} />;
      default:
        return null;
    }
  };

  const handleRowClick = (record: any) => {
    const stato = getStatus(record);

    if (
      stato === "IN COMPOSIZIONE" ||
      stato === "BOZZA" ||
      stato === "COMPLETATA"
    ) {
      return;
    }

    const id = record.dw_nota_speseid;
    setSelectedId(id === selectedId ? null : id);
    setIsDrawerOpen(id !== selectedId);
  };

  const getDipendenteObjectId = async (notaId: string) => {
    const nota = expenses.find(
      (expense: any) => expense.dw_nota_speseid === notaId,
    ) as any;

    const dipendenteContactId = nota?._dw_dipendente_value;

    if (!dipendenteContactId) return null;

    const contactResult = await ContactsService.get(dipendenteContactId);

    const contact =
      (contactResult as any)?.data ??
      (contactResult as any)?.value ??
      contactResult;

    return contact?.externaluseridentifier ?? null;
  };

  const handleApproveNota = async (id: string) => {
    if (updatingNotaId) return;

    const confirmed = window.confirm(
      "Sei sicuro di voler approvare questa Nota Spesa?",
    );

    if (!confirmed) return;

    try {
      setUpdatingNotaId(id);

      await Dw_nota_spesesService.update(id, {
        dw_stato: 121950002,
      } as any);

      const dipendenteObjectId = await getDipendenteObjectId(id);

      if (dipendenteObjectId) {
        const notaName =
          (
            expenses.find(
              (expense: any) => expense.dw_nota_speseid === id,
            ) as any
          )?.dw_name || "Nota Spesa";

        await Dw_notificationtrackersService.create({
          dw_name: `La tua Nota Spesa ${notaName} è stata approvata!`,
          dw_operation: 2,
          dw_type: 2,
          dw_visualizedstate: 3,
          dw_utenteobjectid: dipendenteObjectId,
        } as any);
      }

      setIsDrawerOpen(false);
      setSelectedId(null);
      await loadExpenses();
    } catch (err) {
      console.error("Errore durante l'approvazione:", err);
      alert("Errore durante l'approvazione");
    } finally {
      setUpdatingNotaId(null);
    }
  };

  const handleRejectNota = (id: string) => {
    if (updatingNotaId) return;

    setPendingRejectNotaId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const confirmRejectNota = async () => {
    if (!pendingRejectNotaId || updatingNotaId) return;

    const trimmedReason = rejectReason.trim();

    if (!trimmedReason) {
      alert("Il motivo del rifiuto è obbligatorio.");
      return;
    }

    try {
      setUpdatingNotaId(pendingRejectNotaId);

      await Dw_nota_spesesService.update(pendingRejectNotaId, {
        dw_stato: 121950003,
        dw_noteaggiuntive: trimmedReason,
      } as any);

      const dipendenteObjectId =
        await getDipendenteObjectId(pendingRejectNotaId);

      if (dipendenteObjectId) {
        const notaName =
          (
            expenses.find(
              (expense: any) => expense.dw_nota_speseid === pendingRejectNotaId,
            ) as any
          )?.dw_name || "Nota Spesa";

        await Dw_notificationtrackersService.create({
          dw_name: `La Nota Spesa ${notaName} è stata rifiutata`,
          dw_operation: 2,
          dw_type: 2,
          dw_visualizedstate: 2,
          dw_utenteobjectid: dipendenteObjectId,
        } as any);
      }

      setRejectModalOpen(false);
      setRejectReason("");
      setPendingRejectNotaId(null);

      setIsDrawerOpen(false);
      setSelectedId(null);

      await loadExpenses();
    } catch (err) {
      console.error("Errore durante il rifiuto:", err);
      alert("Errore durante il rifiuto della Nota Spesa.");
    } finally {
      setUpdatingNotaId(null);
    }
  };

  const cancelRejectNota = () => {
    if (updatingNotaId) return;

    setRejectModalOpen(false);
    setRejectReason("");
    setPendingRejectNotaId(null);
  };

  if (fullDetailId) {
    return (
      <DettaglioFullView
        detailId={fullDetailId}
        onBack={() => {
          setFullDetailId(null);
          setIsDrawerOpen(true);
        }}
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
          .join(","),
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

  const selectedNota = expenses.find(
    (expense: any) => expense.dw_nota_speseid === selectedId,
  ) as any;

  const selectedNotaStatus =
    selectedNota?.["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? "";

  return (
    <MainLayout
      activeTab="dashboard"
      onNavigate={onNavigate}
      notificationsEnabled={notificationsEnabled}
    >
      <div className="p-10 max-w-[1600px] mx-auto space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              label: "In Composizione",
              val: stats.bozze,
              color: "text-slate-400",
              bg: "bg-slate-50",
              icon: <FileEdit size={24} />,
            },
            {
              label: "In Attesa",
              val: stats.attesa,
              color: "text-orange-500",
              bg: "bg-orange-50",
              icon: <Clock size={24} />,
            },
            {
              label: "Approvate",
              val: stats.approvate,
              color: "text-green-500",
              bg: "bg-green-50",
              icon: <CheckCircle2 size={24} />,
            },
            {
              label: "Rifiutate",
              val: stats.rifiutate,
              color: "text-red-500",
              bg: "bg-red-50",
              icon: <XCircle size={24} />,
            },
            {
              label: "Completate",
              val: stats.completate,
              color: "text-slate-500",
              bg: "bg-slate-100",
              icon: <CheckCircle size={24} />,
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-[#E85C24] transition-all"
            >
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-1">
                  {card.label}
                </p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {isLoading ? "..." : card.val}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center transition-colors group-hover:scale-110 duration-200`}
              >
                {card.icon}
              </div>
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
              {[
                {
                  key: "active" as DashboardView,
                  label: "Attive",
                  count: activeCount,
                },
                {
                  key: "drafts" as DashboardView,
                  label: "In composizione",
                  count: stats.bozze,
                },
                {
                  key: "completed" as DashboardView,
                  label: "Completate",
                  count: stats.completate,
                },
              ].map((tab) => {
                const isActive = activeView === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveView(tab.key);
                      setStatusFilter("Tutti gli stati");
                      setSelectedId(null);
                      setIsDrawerOpen(false);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-white dark:bg-slate-950 text-[#E85C24] shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-orange-50 dark:bg-orange-950/40 text-[#E85C24]"
                          : "bg-white dark:bg-slate-900 text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1 xl:justify-end">
              <div className="w-full lg:w-[230px]">
                <div className="relative">
                  <select
                    disabled={activeView !== "active"}
                    className={`w-full appearance-none px-4 py-2.5 border rounded-xl outline-none text-sm font-medium transition-colors ${
                      activeView !== "active"
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:border-[#E85C24] hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>Tutti gli stati</option>

                    {activeView === "active" && (
                      <>
                        <option>In attesa di approvazione</option>
                        <option>Approvata</option>
                        <option>Rifiutata</option>
                      </>
                    )}
                  </select>

                  <ChevronRight
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <HalfMonthPicker
                value={selectedPeriodDate}
                onChange={setSelectedPeriodDate}
              />

              <div className="relative w-full lg:w-[320px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cerca dipendente o commessa..."
                  className="w-full pl-12 pr-6 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-full focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#E85C24]/10 focus:border-[#E85C24]/30 transition-all outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} className="text-[#E85C24]" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {activeView === "active"
                  ? "Note Spese Attive"
                  : activeView === "drafts"
                    ? "Note Spese in Composizione"
                    : "Note Spese Completate"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadExpenses}
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm font-bold transition-all ${
                  isLoading
                    ? "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#E85C24] hover:text-[#E85C24]"
                }`}
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-[#E85C24] text-[#E85C24] rounded-xl text-sm font-bold hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              >
                <Download size={18} /> Esporta Note{" "}
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-80 gap-4 text-slate-400">
                <Loader2 className="animate-spin text-[#E85C24]" size={40} />
                <p className="font-medium animate-pulse">Caricamento dati...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
                <p className="text-sm font-bold text-red-500">{error}</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
                <LayoutDashboard size={40} className="text-slate-300" />
                <p className="text-sm font-bold text-slate-400">
                  Nessuna nota spesa trovata.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/70 text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                    <th className="px-8 py-5">Nome</th>
                    <th className="px-6 py-5">Dipendente</th>
                    <th className="px-6 py-5">Codice Commessa</th>
                    <th className="px-6 py-5">Periodo Tempo</th>
                    <th className="px-6 py-5">Stato</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paginatedExpenses.map((record: any) => {
                    const id = record.dw_nota_speseid;
                    const stato =
                      record[
                        "dw_stato@OData.Community.Display.V1.FormattedValue"
                      ] ?? "In Attesa di Approvazione";

                    const statoUpper = stato.toUpperCase();

                    const isReadOnlyRow =
                      statoUpper === "IN COMPOSIZIONE" ||
                      statoUpper === "BOZZA" ||
                      statoUpper === "COMPLETATA";

                    return (
                      <tr
                        key={id}
                        onClick={() => handleRowClick(record)}
                        className={`transition-all duration-150 group ${
                          isReadOnlyRow
                            ? "cursor-default opacity-80 italic bg-slate-50/30 dark:bg-slate-800/30"
                            : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        } ${
                          selectedId === id
                            ? "bg-orange-50 dark:bg-orange-950/30 border-l-4 border-l-[#E85C24]"
                            : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <td
                          className={`px-8 py-6 text-sm font-bold transition-colors ${
                            selectedId === id
                              ? "text-[#E85C24]"
                              : "text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {record.dw_name ?? "Nota_Spesa"}
                        </td>

                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase border ${
                                selectedId === id
                                  ? "bg-white dark:bg-slate-900 border-[#E85C24] text-[#E85C24]"
                                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {getField(record, "dw_dipendente")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </div>

                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {getField(record, "dw_dipendente")}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {getField(record, "dw_codicedicommessa")}
                        </td>

                        <td className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {getField(record, "dw_periodotempo")}
                        </td>

                        <td className="px-6 py-6">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border shadow-sm ${getStatusStyle(stato)}`}
                          >
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

          {filteredExpenses.length > 0 && (
            <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Mostrando{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredExpenses.length,
                  )}
                </span>{" "}
                di{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {filteredExpenses.length}
                </span>{" "}
                note spese
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                    currentPage === 1
                      ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#E85C24] hover:text-[#E85C24]"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      currentPage === page
                        ? "bg-[#E85C24] text-white shadow-sm"
                        : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#E85C24] hover:text-[#E85C24]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                    currentPage === totalPages
                      ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#E85C24] hover:text-[#E85C24]"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-5 pt-4">
          <button
            disabled={!selectedId}
            className={`px-12 py-4 font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg ${
              selectedId
                ? "bg-[#E85C24] text-white hover:bg-[#d04a1b] shadow-orange-200 dark:shadow-orange-950/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700"
            }`}
            onClick={() => setIsDrawerOpen(true)}
          >
            Apri Dettagli <ArrowUpRight size={20} />
          </button>
        </div>
      </div>

      <DettagliDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notaSpesaId={selectedId}
        notaSpesaName={
          expenses.find((e) => e.dw_nota_speseid === selectedId)?.dw_name ||
          "Nota Spesa"
        }
        notaSpesaStatus={selectedNotaStatus}
        onSelectDetail={(detailId) => {
          setFullDetailId(detailId);
          setIsDrawerOpen(false);
        }}
        onApproveNota={handleApproveNota}
        onRejectNota={handleRejectNota}
        isUpdatingNota={updatingNotaId === selectedId}
      />

      {rejectModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                Motivo del rifiuto
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Inserisci una spiegazione per aiutare il dipendente a correggere
                la Nota Spesa.
              </p>
            </div>

            <div className="p-8 space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Nota per il dipendente
                </span>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={5}
                  placeholder="Esempio: Ricevuta non leggibile, importo errato, categoria non corretta..."
                  className="mt-3 w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#E85C24] focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/30 transition-all"
                />
              </label>

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Questo motivo sarà visibile al dipendente quando riaprirà la
                Nota Spesa rifiutata.
              </p>
            </div>

            <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cancelRejectNota}
                disabled={!!updatingNotaId}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={confirmRejectNota}
                disabled={!!updatingNotaId || !rejectReason.trim()}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  updatingNotaId || !rejectReason.trim()
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {updatingNotaId ? "Rifiuto in corso..." : "Conferma rifiuto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ExpenseDashboard;
