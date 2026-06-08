/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Search,
  ChevronRight,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  LayoutDashboard,
  Filter,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { getContext } from "@microsoft/power-apps/app";
import {
  ContactsService,
  Dw_nota_spesesService,
  Dw_detaglinotespesasService,
  Dw_notificationtrackersService,
} from "@/generated";
import MainLayout from "../MainLayout";
import DipendenteDettagliDrawer from "./DipendenteDettagliDrawer";
import DipendenteDettaglioFullView from "./DipendenteDettaglioFullView";
import HalfMonthPicker from "@/components/HalfMonthPicker";

type AppPage = "dashboard" | "analytics" | "settings";

const NOTA_IN_COMPOSIZIONE = 121950000;
const NOTA_IN_ATTESA = 121950001;
const NOTA_RIFIUTATA = 121950003;

const DETTAGLIO_VERIFICATO = 1;

type PendingDetailUpdate = {
  fields: {
    dw_totalcost: number;
    dw_categoriadispesa: string;
    dw_currency: string;
    dw_transactiondate: string;
    dw_merchantname: string;
    dw_additionalnotes: string;
  };
  receiptFile?: File | null;
};

type NotaSpesa = {
  dw_nota_speseid: string;
  dw_name?: string;
  createdon?: string;
  dw_stato?: number;
  dw_noteaggiuntive?: string;
};

interface DipendenteHomeProps {
  currentUserName: string;
  currentUserEmail: string;
  onNavigate?: (page: AppPage) => void;
  notificationsEnabled?: boolean;
}

const DipendenteHome: React.FC<DipendenteHomeProps> = ({
  currentUserName,
  currentUserEmail,
  onNavigate,
  notificationsEnabled,
}) => {
  const [loading, setLoading] = useState(true);
  const [noteSpese, setNoteSpese] = useState<NotaSpesa[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [pendingDetailUpdates, setPendingDetailUpdates] = useState<
    Record<string, PendingDetailUpdate>
  >({});

  const [pendingDetailDeletes, setPendingDetailDeletes] = useState<string[]>(
    [],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "121950000" | "121950003"
  >("ALL");
  const [periodFilter, setPeriodFilter] = useState("");

  const hasPendingChanges =
    Object.keys(pendingDetailUpdates).length > 0 ||
    pendingDetailDeletes.length > 0;

  const loadMyNoteSpese = async () => {
    try {
      setLoading(true);

      const ctx = await getContext();
      const objId = ctx.user.objectId;

      if (!objId) {
        setNoteSpese([]);
        return;
      }

      const safeObjId = objId.replace(/'/g, "''");

      const contactResult = await ContactsService.getAll({
        filter: `externaluseridentifier eq '${safeObjId}'`,
      });

      const contacts = ((contactResult as any)?.data ??
        (contactResult as any)?.value ??
        []) as any[];

      const contact = contacts[0];
      const contactId = contact?.contactid;

      if (!contactId) {
        setNoteSpese([]);
        return;
      }

      const result = await Dw_nota_spesesService.getAll({
        filter: `_dw_dipendente_value eq ${contactId} and (dw_stato eq ${NOTA_RIFIUTATA} or dw_stato eq ${NOTA_IN_COMPOSIZIONE})`,
      });

      const records = ((result as any)?.data ??
        (result as any)?.value ??
        []) as NotaSpesa[];

      setNoteSpese(records);
    } catch (err) {
      console.error("[DipendenteHome] Error fetching note spese:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyNoteSpese();
  }, []);

  const handleRefresh = async () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPeriodFilter("");
    setShowFilters(false);
    await loadMyNoteSpese();
  };

  function matchesHalfMonth(
    dateString: string | undefined,
    selectedPeriod: string,
  ) {
    if (!selectedPeriod) return true;
    if (!dateString) return false;

    const noteDate = new Date(dateString);
    const selectedDate = new Date(selectedPeriod);

    const sameYear = noteDate.getFullYear() === selectedDate.getFullYear();
    const sameMonth = noteDate.getMonth() === selectedDate.getMonth();

    if (!sameYear || !sameMonth) return false;

    const selectedDay = selectedDate.getDate();
    const noteDay = noteDate.getDate();

    if (selectedDay === 1) {
      return noteDay >= 1 && noteDay <= 15;
    }

    if (selectedDay === 16) {
      return noteDay >= 16;
    }

    return false;
  }

  const filteredNotes = useMemo(() => {
    return noteSpese.filter((nota) => {
      const matchesSearch = (nota.dw_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || nota.dw_stato === Number(statusFilter);

      const matchesPeriod = matchesHalfMonth(nota.createdon, periodFilter);

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [noteSpese, searchTerm, statusFilter, periodFilter]);

  const clearPendingChanges = () => {
    setPendingDetailUpdates({});
    setPendingDetailDeletes([]);
  };

  const clearSelectedNotaState = () => {
    setPendingDetailUpdates({});
    setPendingDetailDeletes([]);
    setIsDrawerOpen(false);
    setSelectedId(null);
    setSelectedName("");
    setSelectedStatus(null);
    setSelectedRejectionReason("");
  };

  const savePendingDetailChanges = async ({
    markUpdatedAsVerified,
  }: {
    markUpdatedAsVerified: boolean;
  }) => {
    for (const detailId of pendingDetailDeletes) {
      await Dw_detaglinotespesasService.delete(detailId);
    }

    for (const [detailId, update] of Object.entries(pendingDetailUpdates)) {
      await Dw_detaglinotespesasService.update(detailId, {
        ...(update.fields as any),
        ...(markUpdatedAsVerified
          ? { dw_statoverifica: DETTAGLIO_VERIFICATO }
          : {}),
      } as any);

      if (update.receiptFile) {
        await Dw_detaglinotespesasService.upload(
          detailId,
          "dw_receipt",
          update.receiptFile,
          update.receiptFile.name,
        );
      }
    }
  };

  const loadSelectedDetails = async () => {
    if (!selectedId) return [];

    const result = await Dw_detaglinotespesasService.getAll({
      filter: `_dw_notaspesa_value eq ${selectedId}`,
    });

    return ((result as any)?.data ?? (result as any)?.value ?? []) as any[];
  };

  const handleSaveDetailsInComposizione = async () => {
    if (!selectedId) return;

    if (selectedStatus !== NOTA_IN_COMPOSIZIONE) {
      alert("Puoi usare Salva dettagli solo per note in composizione.");
      return;
    }

    if (!hasPendingChanges) {
      alert("Non ci sono modifiche da salvare.");
      return;
    }

    try {
      await savePendingDetailChanges({ markUpdatedAsVerified: false });

      clearPendingChanges();
      setIsDrawerOpen(false);

      await loadMyNoteSpese();

      alert("Dettagli salvati correttamente.");
    } catch (err) {
      console.error("[DipendenteHome] Save details failed:", err);
      alert("Errore durante il salvataggio dei dettagli.");
    }
  };

  const handleResendRejectedNota = async () => {
    if (!selectedId) return;

    try {
      const ctx = await getContext();
      const currentUserObjectId = ctx.user.objectId;

      if (!currentUserObjectId) {
        alert("Impossibile identificare l'utente corrente.");
        return;
      }

      if (selectedStatus !== NOTA_RIFIUTATA) {
        alert("Puoi reinviare solo una Nota Spesa rifiutata.");
        return;
      }

      const currentDetails = await loadSelectedDetails();

      const activeDetails = currentDetails.filter(
        (detail: any) =>
          !pendingDetailDeletes.includes(detail.dw_detaglinotespesaid),
      );

      if (activeDetails.length === 0) {
        alert("Non puoi reinviare una Nota Spesa senza dettagli.");
        return;
      }

      const editedDetailIds = new Set(Object.keys(pendingDetailUpdates));

      const notEditedDetails = activeDetails.filter(
        (detail: any) => !editedDetailIds.has(detail.dw_detaglinotespesaid),
      );

      if (notEditedDetails.length > 0) {
        const confirmed = window.confirm(
          `Hai modificato ${editedDetailIds.size} dettagli su ${activeDetails.length}. Ci sono ancora ${notEditedDetails.length} dettagli non modificati. Vuoi comunque reinviare la Nota Spesa?`,
        );

        if (!confirmed) return;
      }

      if (hasPendingChanges) {
        await savePendingDetailChanges({ markUpdatedAsVerified: true });
        clearPendingChanges();
      }

      await Dw_nota_spesesService.update(selectedId, {
        dw_stato: NOTA_IN_ATTESA,
        dw_noteaggiuntive: null,
      } as any);

      await Dw_notificationtrackersService.create({
        dw_name: `Aggiornamento! ${
          selectedName || "Nota Spesa"
        } reinviata per approvazione`,
        dw_operation: 2,
        dw_type: 2,
        dw_visualizedstate: 1,
        dw_utenteobjectid: currentUserObjectId,
      } as any);

      clearSelectedNotaState();

      await loadMyNoteSpese();

      alert("Nota Spesa reinviata correttamente.");
    } catch (err) {
      console.error("[DipendenteHome] Reinvia failed:", err);
      alert("Errore durante il reinvio della Nota Spesa.");
    }
  };

  if (selectedDetailId) {
    return (
      <DipendenteDettaglioFullView
        detailId={selectedDetailId}
        onBack={() => {
          setSelectedDetailId(null);
          setIsDrawerOpen(true);
        }}
        onSaved={() => {
          loadMyNoteSpese();
        }}
        onLocalSave={(detailId, update) => {
          setPendingDetailUpdates((prev) => ({
            ...prev,
            [detailId]: update,
          }));

          setPendingDetailDeletes((prev) =>
            prev.filter((id) => id !== detailId),
          );
        }}
        onLocalDelete={(detailId) => {
          setPendingDetailDeletes((prev) =>
            prev.includes(detailId) ? prev : [...prev, detailId],
          );

          setPendingDetailUpdates((prev) => {
            const copy = { ...prev };
            delete copy[detailId];
            return copy;
          });
        }}
      />
    );
  }

  return (
    <MainLayout
      role="dipendente"
      activeTab="dashboard"
      title="Le mie Note Spese"
      onNavigate={onNavigate}
      notificationsEnabled={notificationsEnabled}
    >
      <div className="p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Le mie Note Spese
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
              Gestisci le tue note spese in bozza o quelle che richiedono
              correzioni.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm transition-all duration-500 ease-in-out">
            <div
              className={`relative group transition-all duration-500 ease-in-out ${
                showFilters ? "w-48 xl:w-64" : "w-64 xl:w-80"
              }`}
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E85C24] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Cerca nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/10 focus:bg-white dark:focus:bg-slate-950 transition-all w-full"
              />
            </div>

            <div
              className={`flex items-center gap-3 transition-all duration-500 ease-in-out ${
                showFilters
                  ? "max-w-xl opacity-100 overflow-visible"
                  : "max-w-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="flex items-center gap-3 whitespace-nowrap pl-2 border-l border-slate-100 dark:border-slate-800 ml-1">
                <div className="relative group w-44">
                  <AlertCircle
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all cursor-pointer appearance-none w-full"
                  >
                    <option value="ALL">Tutti gli stati</option>
                    <option value={String(NOTA_IN_COMPOSIZIONE)}>
                      Composizione
                    </option>
                    <option value={String(NOTA_RIFIUTATA)}>Rifiutata</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>

                <div className="w-52">
                  <HalfMonthPicker
                    value={periodFilter}
                    onChange={setPeriodFilter}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                showFilters
                  ? "bg-orange-50 dark:bg-orange-950/30 text-[#E85C24]"
                  : "text-slate-400 hover:text-[#E85C24] hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
              title={showFilters ? "Nascondi filtri" : "Mostra filtri"}
            >
              {showFilters ? (
                <X
                  size={20}
                  className="animate-in fade-in spin-in-90 duration-300"
                />
              ) : (
                <Filter size={20} className="animate-in fade-in duration-300" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                loading
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed"
                  : "text-slate-400 hover:text-[#E85C24] hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
              title="Aggiorna"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-[#E85C24]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Totale
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                {noteSpese.length}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Da Correggere
              </p>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                {noteSpese.filter((n) => n.dw_stato === NOTA_RIFIUTATA).length}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-orange-100 dark:border-orange-900 border-t-[#E85C24] rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                Sincronizzazione dati...
              </p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 text-center shadow-sm border-dashed">
            <div className="flex flex-col items-center gap-4 opacity-40">
              <FileText size={48} className="text-slate-300" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                {searchTerm || showFilters
                  ? "Nessuna nota corrisponde ai filtri selezionati."
                  : "Ottimo lavoro! Non hai note spese in attesa di azione."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <DipendenteDettagliDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              notaSpesaId={selectedId}
              notaSpesaName={selectedName}
              notaSpesaStatus={selectedStatus}
              rejectionReason={selectedRejectionReason}
              pendingDetailUpdates={pendingDetailUpdates}
              pendingDetailDeletes={pendingDetailDeletes}
              onSaveDetails={handleSaveDetailsInComposizione}
              onLocalDelete={(detailId) => {
                setPendingDetailDeletes((prev) =>
                  prev.includes(detailId) ? prev : [...prev, detailId],
                );

                setPendingDetailUpdates((prev) => {
                  const copy = { ...prev };
                  delete copy[detailId];
                  return copy;
                });
              }}
              onCancelPendingChanges={() => {
                setPendingDetailUpdates({});
                setPendingDetailDeletes([]);
              }}
              onResend={handleResendRejectedNota}
              onSetSelectedDetail={(detailId) => {
                setSelectedDetailId(detailId);
                setIsDrawerOpen(false);
              }}
            />

            {filteredNotes.map((nota) => (
              <button
                key={nota.dw_nota_speseid}
                onClick={() => {
                  setSelectedId(nota.dw_nota_speseid);
                  setSelectedName(nota.dw_name || "Nota Spesa");
                  setSelectedStatus(nota.dw_stato ?? null);
                  setIsDrawerOpen(true);
                  setSelectedRejectionReason(nota.dw_noteaggiuntive || "");
                }}
                className="group relative text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-[#E85C24] hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between min-h-[180px] overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-2.5 rounded-xl ${
                        nota.dw_stato === NOTA_RIFIUTATA
                          ? "bg-red-50 text-red-500 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/50"
                          : "bg-slate-50 text-slate-400 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                      }`}
                    >
                      {nota.dw_stato === NOTA_RIFIUTATA ? (
                        <AlertCircle size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                        nota.dw_stato === NOTA_RIFIUTATA
                          ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                          : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                      }`}
                    >
                      {nota.dw_stato === NOTA_RIFIUTATA
                        ? "Rifiutata"
                        : "In Composizione"}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-[#E85C24] transition-colors leading-tight truncate pr-4">
                    {nota.dw_name || "Nota Spesa"}
                  </h3>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarIcon size={14} />
                    <span className="text-xs font-bold uppercase tracking-tighter">
                      {nota.createdon
                        ? new Date(nota.createdon).toLocaleDateString("it-IT")
                        : "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-[#E85C24] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                    Gestisci{" "}
                    <ChevronRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DipendenteHome;
