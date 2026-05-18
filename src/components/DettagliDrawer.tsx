/* eslint-disable @typescript-eslint/no-explicit-any */
import { getReceiptType } from "../services/receiptService";
import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import ExpenseDetailCard, { type ExpenseDetail } from "./ExpenseDetailCard";
import { Dw_detaglinotespesasService } from "../generated/services/Dw_detaglinotespesasService";
import type { Dw_detaglinotespesas } from "../generated/models/Dw_detaglinotespesasModel";

interface DettagliDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isUpdatingNota?: boolean;
  notaSpesaId: string | null;
  notaSpesaName: string;
  notaSpesaStatus?: string;
  onSelectDetail: (detailId: string) => void;
  onApproveNota?: (id: string) => void;
  onRejectNota?: (id: string) => void;
}

const DettagliDrawer: React.FC<DettagliDrawerProps> = ({
  isOpen,
  onClose,
  notaSpesaId,
  notaSpesaName,
  notaSpesaStatus,
  onSelectDetail,
  onApproveNota,
  onRejectNota,
  isUpdatingNota = false,
}) => {
  const [details, setDetails] = useState<Dw_detaglinotespesas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedStatus = notaSpesaStatus?.toUpperCase();

  const isApproved = normalizedStatus === "APPROVATA";
  const isRejected = normalizedStatus === "RIFIUTATA";

  const approveDisabled = !notaSpesaId || isUpdatingNota || isApproved
  const rejectDisabled = !notaSpesaId || isUpdatingNota || isRejected

  function getFormattedValue(record: any, field: string): string {
    return (
      record[`${field}@OData.Community.Display.V1.FormattedValue`] ??
      record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ??
      "—"
    );
  }

  useEffect(() => {
    const fetchDetails = async () => {
      if (!notaSpesaId || !isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await Dw_detaglinotespesasService.getAll({
          filter: `_dw_notaspesa_value eq ${notaSpesaId}`,
        });

        const data = ((result as any)?.data ??
          (result as any)?.value ??
          []) as Dw_detaglinotespesas[];

        setDetails(data);
      } catch (err) {
        console.error("Error fetching details:", err);
        setError("Impossibile caricare i dettagli della nota spesa.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [notaSpesaId, isOpen]);

  const mappedDetails: ExpenseDetail[] = useMemo(() => {
    return details.map((d: any) => {
      const fileName = d.dw_receipt_name ?? "";
      const hasReceipt = Boolean(d.dw_receipt);

      return {
        id: d.dw_detaglinotespesaid,
        name: d.dw_name || "Dettaglio Spesa",
        createdOn: getFormattedValue(d, "createdon"),
        category: getFormattedValue(d, "dw_categoriadispesa"),
        currency: getFormattedValue(d, "dw_currency"),
        amount: d.dw_totalcost ?? 0,
        receiptType: hasReceipt ? getReceiptType(fileName) : "other",
        fileName,
        hasReceipt,
      };
    });
  }, [details]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-50 dark:bg-slate-950 shadow-2xl dark:shadow-black/40 z-[70] transform transition-transform duration-500 ease-in-out border-l border-slate-200 dark:border-slate-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Voci di Spesa
            </h2>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              Ref:{" "}
              <span className="text-[#E85C24] font-bold">
                {notaSpesaName}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100%-160px)] overflow-y-auto p-6 pb-24">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
              <Loader2 className="animate-spin text-[#E85C24]" size={32} />
              <p className="text-sm font-medium">Caricamento...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 dark:text-red-400">
                <AlertCircle size={24} />
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {error}
              </p>
            </div>
          ) : mappedDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4 opacity-70">
              <FileText
                size={48}
                className="text-slate-300 dark:text-slate-700"
              />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nessuna voce trovata.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {mappedDetails.length} Voci in totale
                </span>
              </div>

              {mappedDetails.map((detail) => (
                <ExpenseDetailCard
                  key={detail.id}
                  detail={detail}
                  onClick={onSelectDetail}
                />
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
          <button
            disabled={rejectDisabled}
            onClick={() => notaSpesaId && onRejectNota?.(notaSpesaId)}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              rejectDisabled
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60 grayscale shadow-none"
                : "bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                
            }`}
          >
            <XCircle size={18} />
            {isUpdatingNota ? "Aggiornamento..." : "Rifiuta Nota"}
          </button>

          <button
            disabled={approveDisabled}
            onClick={() => notaSpesaId && onApproveNota?.(notaSpesaId)}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              approveDisabled
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60 grayscale shadow-none"
                : "bg-[#E85C24] text-white hover:bg-[#d04a1b]"
            }`}
          >
            {isUpdatingNota ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Approva Nota
          </button>
        </div>
      </aside>
    </>
  );
};

export default DettagliDrawer;