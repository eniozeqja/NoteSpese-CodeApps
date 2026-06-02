/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  FileText,
  Send,
  ChevronRight,
  AlertCircle,
  Calendar,
  Coins,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Dw_detaglinotespesasService } from "@/generated/services/Dw_detaglinotespesasService";

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

interface DipendenteDettagliDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notaSpesaId: string | null;
  notaSpesaName: string;
  rejectionReason?: string;
  onResend: () => void;
  onSetSelectedDetail: (detailId: string) => void;
  onRefresh?: () => void;

  pendingDetailUpdates?: Record<string, PendingDetailUpdate>;
  pendingDetailDeletes?: string[];
  onLocalDelete?: (detailId: string) => void;
  onCancelPendingChanges?: () => void;
}

const DipendenteDettagliDrawer: React.FC<DipendenteDettagliDrawerProps> = ({
  isOpen,
  onClose,
  notaSpesaId,
  notaSpesaName,
  rejectionReason,
  onResend,
  onSetSelectedDetail,
  onRefresh,
  pendingDetailUpdates = {},
  pendingDetailDeletes = [],
  onLocalDelete,
  onCancelPendingChanges,
}) => {
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasPendingChanges =
    Object.keys(pendingDetailUpdates).length > 0 ||
    pendingDetailDeletes.length > 0;

  const loadDetails = async () => {
    if (!notaSpesaId || !isOpen) return;

    try {
      setLoading(true);

      const result = await Dw_detaglinotespesasService.getAll({
        filter: `_dw_notaspesa_value eq '${notaSpesaId}'`,
      });

      const records = ((result as any)?.data ??
        (result as any)?.value ??
        []) as any[];

      setDetails(records);
    } catch (err) {
      console.error("[DipendenteDettagliDrawer] Failed to load details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [notaSpesaId, isOpen]);

  const displayDetails = useMemo(() => {
    return details
      .filter(
        (detail) =>
          !pendingDetailDeletes.includes(detail.dw_detaglinotespesaid),
      )
      .map((detail) => {
        const pendingUpdate =
          pendingDetailUpdates[detail.dw_detaglinotespesaid];

        if (!pendingUpdate) {
          return {
            ...detail,
            __isPendingUpdate: false,
            __hasPendingReceipt: false,
          };
        }

        return {
          ...detail,
          ...pendingUpdate.fields,
          __isPendingUpdate: true,
          __hasPendingReceipt: Boolean(pendingUpdate.receiptFile),
        };
      });
  }, [details, pendingDetailUpdates, pendingDetailDeletes]);

  const handleDeleteDetail = (e: React.MouseEvent, detailId: string) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Vuoi segnare questa voce per l'eliminazione? Verrà eliminata definitivamente solo quando clicchi Reinvia Nota Spese.",
    );

    if (!confirmed) return;

    onLocalDelete?.(detailId);
    onRefresh?.();
  };

  function getFormattedValue(record: any, field: string): string {
    return (
      record[`${field}@OData.Community.Display.V1.FormattedValue`] ??
      record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ??
      "—"
    );
  }

  function getCurrencyLabel(detail: any): string {
    if (
      detail.dw_currency === "121950000" ||
      detail.dw_currency === 121950000
    ) {
      return "EUR";
    }

    if (
      detail.dw_currency === "121950001" ||
      detail.dw_currency === 121950001
    ) {
      return "USD";
    }

    if (
      detail.dw_currency === "121950002" ||
      detail.dw_currency === 121950002
    ) {
      return "GBP";
    }

    return getFormattedValue(detail, "dw_currency");
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-50 dark:bg-slate-950 shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out border-l border-slate-200 dark:border-slate-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Voci di Spesa
            </h2>
            <p className="text-[10px] font-black text-[#E85C24] uppercase tracking-widest mt-0.5">
              REF: {notaSpesaName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100%-270px)] overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {hasPendingChanges && (
            <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#E85C24] mb-1">
                Modifiche non ancora inviate
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Le modifiche verranno salvate definitivamente solo quando
                clicchi Reinvia Nota Spese.
              </p>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="animate-spin text-[#E85C24]" size={36} />
              <p className="text-xs font-bold uppercase tracking-tighter">
                Caricamento voci...
              </p>
            </div>
          ) : displayDetails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300 dark:text-slate-700">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                <FileText size={32} />
              </div>
              <p className="text-sm font-bold">Nessun dettaglio trovato</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                {displayDetails.length}{" "}
                {displayDetails.length === 1 ? "Elemento" : "Elementi"} in
                elenco
              </p>

              {displayDetails.map((detail: any) => (
                <div
                  key={detail.dw_detaglinotespesaid}
                  onClick={() =>
                    onSetSelectedDetail(detail.dw_detaglinotespesaid)
                  }
                  className={`w-full text-left bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all hover:border-[#E85C24] hover:shadow-md hover:shadow-orange-500/5 group relative overflow-hidden cursor-pointer ${
                    detail.__isPendingUpdate
                      ? "border-orange-300 dark:border-orange-800"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-4">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#E85C24] transition-colors truncate">
                        {detail.dw_name || "Dettaglio Spesa"}
                      </h4>

                      {detail.__isPendingUpdate && (
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#E85C24]">
                          Modificato localmente
                          {detail.__hasPendingReceipt
                            ? " + nuova ricevuta"
                            : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) =>
                          handleDeleteDetail(e, detail.dw_detaglinotespesaid)
                        }
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                        title="Segna per eliminazione"
                      >
                        <Trash2 size={14} />
                      </button>

                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-[#E85C24] group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Coins size={12} className="text-[#E85C24]/60" />
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {getCurrencyLabel(detail)}{" "}
                        {Number(
                          detail.dw_totalcost ?? detail.dw_amount ?? 0,
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">
                        {detail.dw_transactiondate
                          ? detail.dw_transactiondate.slice(0, 10)
                          : getFormattedValue(detail, "createdon")}
                      </span>
                    </div>
                  </div>

                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E85C24] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">
                Motivo rifiuto nota
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed italic">
                "
                {rejectionReason ||
                  "Nessun motivo specificato dall'approvatore."}
                "
              </p>
            </div>
          </div>

          {hasPendingChanges && (
            <button
              type="button"
              onClick={onCancelPendingChanges}
              className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Cancella modifiche
            </button>
          )}

          <button
            type="button"
            onClick={onResend}
            disabled={displayDetails.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              displayDetails.length === 0
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-[#E85C24] text-white hover:bg-[#d04a1b] shadow-orange-500/20"
            }`}
          >
            <Send size={18} />
            Reinvia Nota Spese
          </button>

          {displayDetails.length === 0 && (
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Aggiungi almeno una voce prima di reinviare
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default DipendenteDettagliDrawer;
