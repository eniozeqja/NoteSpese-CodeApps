/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Euro,
  FileEdit,
  Loader2,
  PieChart as PieChartIcon,
  XCircle,
} from "lucide-react";
import { getContext } from "@microsoft/power-apps/app";
import { ContactsService } from "@/generated/services/ContactsService";
import { Dw_nota_spesesService } from "@/generated/services/Dw_nota_spesesService";
import { Dw_detaglinotespesasService } from "@/generated/services/Dw_detaglinotespesasService";
import MainLayout from "../MainLayout";

type AppPage = "dashboard" | "analytics" | "settings";

type StatusFilter = "all" | "draft" | "pending" | "approved" | "rejected";

type StatusKey =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "unknown";

interface DipendenteAnalyticsProps {
  onNavigate?: (page: AppPage) => void;
  notificationsEnabled?: boolean;
}

function getStatusLabel(nota: any): string {
  const formatted =
    nota?.["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? "";

  if (formatted) return formatted.toUpperCase();

  switch (Number(nota?.dw_stato)) {
    case 121950000:
      return "IN COMPOSIZIONE";
    case 121950001:
      return "IN ATTESA DI APPROVAZIONE";
    case 121950002:
      return "APPROVATA";
    case 121950003:
      return "RIFIUTATA";
    case 121950004:
      return "COMPLETATA";
    default:
      return "";
  }
}

function getStatusKey(nota: any): StatusKey {
  const numericStatus = Number(nota?.dw_stato);

  if (numericStatus === 121950000) return "draft";
  if (numericStatus === 121950001) return "pending";
  if (numericStatus === 121950002) return "approved";
  if (numericStatus === 121950003) return "rejected";
  if (numericStatus === 121950004) return "completed";

  const label = getStatusLabel(nota);

  if (label.includes("COMPOSIZIONE") || label.includes("BOZZA")) {
    return "draft";
  }

  if (label.includes("ATTESA")) {
    return "pending";
  }

  if (label.includes("APPROV")) {
    return "approved";
  }

  if (label.includes("RIFIUT")) {
    return "rejected";
  }

  if (label.includes("COMPLET")) {
    return "completed";
  }

  return "unknown";
}

function matchesStatusFilter(statusKey: StatusKey, filter: StatusFilter) {
  if (filter === "all") {
    return statusKey !== "completed";
  }

  return statusKey === filter;
}

function getAmount(detail: any): number {
  return Number(detail?.dw_totalcost ?? detail?.dw_amount ?? 0) || 0;
}

function getDetailDate(detail: any): Date | null {
  const value = detail?.dw_transactiondate ?? detail?.createdon;

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatCurrency(value: number) {
  return `€ ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusFilterLabel(statusFilter: StatusFilter) {
  switch (statusFilter) {
    case "draft":
      return "In composizione";
    case "pending":
      return "In attesa";
    case "approved":
      return "Approvate";
    case "rejected":
      return "Rifiutate";
    default:
      return "Tutte";
  }
}

const DipendenteAnalytics: React.FC<DipendenteAnalyticsProps> = ({
  onNavigate,
  notificationsEnabled = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteSpese, setNoteSpese] = useState<any[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("365");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const ctx = await getContext();
      const objectId = ctx.user.objectId;

      if (!objectId) {
        setNoteSpese([]);
        setDetails([]);
        return;
      }

      const safeObjectId = objectId.replace(/'/g, "''");

      const contactResult = await ContactsService.getAll({
        filter: `externaluseridentifier eq '${safeObjectId}'`,
      });

      const contacts = ((contactResult as any)?.data ??
        (contactResult as any)?.value ??
        []) as any[];

      const contactId = contacts[0]?.contactid;

      if (!contactId) {
        setNoteSpese([]);
        setDetails([]);
        return;
      }

      const noteResult = await Dw_nota_spesesService.getAll({
        filter: `_dw_dipendente_value eq ${contactId} and dw_stato ne 121950004`,
      });

      const notes = ((noteResult as any)?.data ??
        (noteResult as any)?.value ??
        []) as any[];

      const noteIds = new Set(
        notes.map((nota: any) => nota.dw_nota_speseid).filter(Boolean),
      );

      const detailsResult = await Dw_detaglinotespesasService.getAll();

      const allDetails = ((detailsResult as any)?.data ??
        (detailsResult as any)?.value ??
        []) as any[];

      const myDetails = allDetails.filter((detail: any) =>
        noteIds.has(detail._dw_notaspesa_value),
      );

      setNoteSpese(notes);
      setDetails(myDetails);
    } catch (err) {
      console.error("[DipendenteAnalytics] Failed to load data:", err);
      setError("Impossibile caricare le statistiche personali.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notesById = useMemo(() => {
    const map = new Map<string, any>();

    noteSpese.forEach((nota: any) => {
      if (nota.dw_nota_speseid) {
        map.set(nota.dw_nota_speseid, nota);
      }
    });

    return map;
  }, [noteSpese]);

  const timeFilteredDetails = useMemo(() => {
    const days = Number(timeRange);
    const now = new Date();
    const minDate = new Date();

    minDate.setDate(now.getDate() - days);
    minDate.setHours(0, 0, 0, 0);

    return details.filter((detail: any) => {
      const date = getDetailDate(detail);

      if (!date) return false;

      const parentNota = notesById.get(detail._dw_notaspesa_value);

      if (!parentNota) return false;

      const statusKey = getStatusKey(parentNota);

      if (statusKey === "completed") return false;

      return date >= minDate && date <= now;
    });
  }, [details, timeRange, notesById]);

  const filteredDetails = useMemo(() => {
    return timeFilteredDetails.filter((detail: any) => {
      const parentNota = notesById.get(detail._dw_notaspesa_value);

      if (!parentNota) return false;

      const statusKey = getStatusKey(parentNota);

      return matchesStatusFilter(statusKey, statusFilter);
    });
  }, [timeFilteredDetails, notesById, statusFilter]);

  const noteTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    details.forEach((detail: any) => {
      const notaId = detail._dw_notaspesa_value;

      if (!notaId) return;

      totals[notaId] = (totals[notaId] || 0) + getAmount(detail);
    });

    return totals;
  }, [details]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let draft = 0;

    filteredDetails.forEach((detail: any) => {
      const amount = getAmount(detail);
      const parentNota = notesById.get(detail._dw_notaspesa_value);
      const statusKey = getStatusKey(parentNota);

      total += amount;

      if (statusKey === "pending") {
        pending += amount;
      } else if (statusKey === "approved") {
        approved += amount;
      } else if (statusKey === "rejected") {
        rejected += amount;
      } else if (statusKey === "draft") {
        draft += amount;
      }
    });

    return {
      total,
      pending,
      approved,
      rejected,
      draft,
      noteCount: new Set(
        filteredDetails
          .map((detail: any) => detail._dw_notaspesa_value)
          .filter(Boolean),
      ).size,
      detailCount: filteredDetails.length,
    };
  }, [filteredDetails, notesById]);

  const statusCounts = useMemo(() => {
    return {
      all: noteSpese.filter((nota) => getStatusKey(nota) !== "completed")
        .length,
      draft: noteSpese.filter((nota) => getStatusKey(nota) === "draft").length,
      pending: noteSpese.filter((nota) => getStatusKey(nota) === "pending")
        .length,
      approved: noteSpese.filter((nota) => getStatusKey(nota) === "approved")
        .length,
      rejected: noteSpese.filter((nota) => getStatusKey(nota) === "rejected")
        .length,
    };
  }, [noteSpese]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};

    filteredDetails.forEach((detail: any) => {
      const category =
        detail[
          "dw_categoriadispesa@OData.Community.Display.V1.FormattedValue"
        ] ?? "Altro";

      categories[category] = (categories[category] || 0) + getAmount(detail);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDetails]);

  const rejectedNotes = useMemo(() => {
    return noteSpese
      .filter((nota: any) => getStatusKey(nota) === "rejected")
      .map((nota: any) => ({
        id: nota.dw_nota_speseid,
        name: nota.dw_name ?? "Nota Spesa",
        createdon: nota.createdon,
        reason: nota.dw_noteaggiuntive ?? "Nessun motivo specificato.",
        total: noteTotals[nota.dw_nota_speseid] ?? 0,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.createdon ?? 0).getTime();
        const dateB = new Date(b.createdon ?? 0).getTime();
        return dateB - dateA;
      });
  }, [noteSpese, noteTotals]);

  if (loading) {
    return (
      <MainLayout
        role="dipendente"
        activeTab="analytics"
        onNavigate={onNavigate}
        notificationsEnabled={notificationsEnabled}
        title="Le mie statistiche"
      >
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-slate-400">
          <Loader2 className="animate-spin text-[#E85C24]" size={40} />
          <p className="font-bold">Caricamento statistiche personali...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout
        role="dipendente"
        activeTab="analytics"
        onNavigate={onNavigate}
        notificationsEnabled={notificationsEnabled}
        title="Le mie statistiche"
      >
        <div className="p-10 max-w-[1400px] mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {error}
            </p>

            <button
              onClick={loadData}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#E85C24] text-white text-sm font-black hover:bg-[#d94f1f] transition-all"
            >
              Riprova
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      role="dipendente"
      activeTab="analytics"
      onNavigate={onNavigate}
      notificationsEnabled={notificationsEnabled}
      title="Le mie statistiche"
    >
      <div className="p-10 max-w-[1500px] mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E85C24] mb-2">
              Riepilogo personale
            </p>

            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
              Le mie statistiche
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Controlla importi inviati, note in attesa, approvate e da
              correggere.
              {statusFilter !== "all" && (
                <span className="ml-2 font-bold text-[#E85C24]">
                  Filtro: {getStatusFilterLabel(statusFilter)}.
                </span>
              )}
            </p>
          </div>

          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 outline-none hover:border-[#E85C24] transition-all cursor-pointer"
            >
              <option value="30">Ultimi 30 giorni</option>
              <option value="90">Ultimo trimestre</option>
              <option value="365">Ultimo anno</option>
            </select>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            label="Totale filtrato"
            value={formatCurrency(stats.total)}
            subtitle={`${stats.noteCount} note · ${stats.detailCount} dettagli`}
            icon={Euro}
            colorClass="text-slate-600 dark:text-slate-300"
            bgClass="bg-slate-100 dark:bg-slate-800"
          />

          <MetricCard
            label="In attesa"
            value={formatCurrency(stats.pending)}
            subtitle={`${statusCounts.pending} note in approvazione`}
            icon={Clock}
            colorClass="text-orange-500"
            bgClass="bg-orange-50 dark:bg-orange-950/30"
          />

          <MetricCard
            label="Approvate"
            value={formatCurrency(stats.approved)}
            subtitle={`${statusCounts.approved} note approvate`}
            icon={CheckCircle2}
            colorClass="text-green-500"
            bgClass="bg-green-50 dark:bg-green-950/30"
          />

          <MetricCard
            label="Da correggere"
            value={formatCurrency(stats.rejected)}
            subtitle={`${statusCounts.rejected} note rifiutate`}
            icon={XCircle}
            colorClass="text-red-500"
            bgClass="bg-red-50 dark:bg-red-950/30"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Le mie categorie principali
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                Classifica per importo nel periodo e stato selezionato
              </p>
            </div>

            {categoryData.length === 0 ? (
              <div className="p-10">
                <EmptyState text="Nessuna categoria disponibile per il filtro selezionato." />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryData.slice(0, 6).map((category, index) => {
                  const percentage =
                    stats.total > 0 ? (category.value / stats.total) * 100 : 0;

                  return (
                    <div key={category.name} className="px-8 py-5">
                      <div className="flex items-center justify-between gap-6 mb-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {index + 1}. {category.name}
                          </p>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
                            {percentage.toFixed(0)}% del totale filtrato
                          </p>
                        </div>

                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(category.value)}
                        </p>
                      </div>

                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#E85C24]"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Stato note
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                Clicca per filtrare
              </p>
            </div>

            <StatusMiniCard
              label="Tutte"
              value={statusCounts.all}
              icon={PieChartIcon}
              colorClass="text-[#E85C24]"
              bgClass="bg-orange-50 dark:bg-orange-950/30"
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />

            <StatusMiniCard
              label="In composizione"
              value={statusCounts.draft}
              icon={FileEdit}
              colorClass="text-slate-500"
              bgClass="bg-slate-100 dark:bg-slate-800"
              active={statusFilter === "draft"}
              onClick={() => setStatusFilter("draft")}
            />

            <StatusMiniCard
              label="In attesa"
              value={statusCounts.pending}
              icon={Clock}
              colorClass="text-orange-500"
              bgClass="bg-orange-50 dark:bg-orange-950/30"
              active={statusFilter === "pending"}
              onClick={() => setStatusFilter("pending")}
            />

            <StatusMiniCard
              label="Approvate"
              value={statusCounts.approved}
              icon={CheckCircle2}
              colorClass="text-green-500"
              bgClass="bg-green-50 dark:bg-green-950/30"
              active={statusFilter === "approved"}
              onClick={() => setStatusFilter("approved")}
            />

            <StatusMiniCard
              label="Rifiutate"
              value={statusCounts.rejected}
              icon={XCircle}
              colorClass="text-red-500"
              bgClass="bg-red-50 dark:bg-red-950/30"
              active={statusFilter === "rejected"}
              onClick={() => setStatusFilter("rejected")}
            />
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Note da correggere
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                Note rifiutate che richiedono attenzione
              </p>
            </div>

            <AlertCircle size={20} className="text-red-500" />
          </div>

          {rejectedNotes.length === 0 ? (
            <div className="p-10">
              <EmptyState text="Nessuna nota da correggere." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rejectedNotes.slice(0, 5).map((nota) => (
                <div
                  key={nota.id}
                  className="px-8 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {nota.name}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {nota.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Importo
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(nota.total)}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40">
                      Da correggere
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  bgClass,
}) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-5">
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
        {label}
      </p>

      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 truncate">
        {value}
      </p>

      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
        {subtitle}
      </p>
    </div>

    <div
      className={`w-12 h-12 rounded-2xl ${bgClass} ${colorClass} flex items-center justify-center shrink-0`}
    >
      <Icon size={24} />
    </div>
  </div>
);

interface StatusMiniCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  active?: boolean;
  onClick?: () => void;
}

const StatusMiniCard: React.FC<StatusMiniCardProps> = ({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  active = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all ${
      active
        ? "border-[#E85C24] bg-orange-50 dark:bg-orange-950/20 shadow-sm"
        : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-[#E85C24]/50 hover:bg-orange-50/40 dark:hover:bg-orange-950/10"
    }`}
  >
    <div>
      <p
        className={`text-[10px] font-black uppercase tracking-widest ${
          active ? "text-[#E85C24]" : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {label}
      </p>

      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
        {value}
      </p>
    </div>

    <div
      className={`w-10 h-10 rounded-xl ${bgClass} ${colorClass} flex items-center justify-center`}
    >
      <Icon size={20} />
    </div>
  </button>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center gap-3 text-slate-400 dark:text-slate-500">
    <PieChartIcon size={34} />
    <p className="text-sm font-bold">{text}</p>
  </div>
);

export default DipendenteAnalytics;
