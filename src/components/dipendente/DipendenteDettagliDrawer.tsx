/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { X, Loader2, FileText, Send } from "lucide-react";
import { Dw_detaglinotespesasService } from "@/generated/services/Dw_detaglinotespesasService";

interface DipendenteDettagliDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    notaSpesaId: string | null;
    notaSpesaName: string;
    rejectionReason?: string;
    onResend: () => void;
    onSetSelectedDetail: (detailId: string) => void;
}

const DipendenteDettagliDrawer: React.FC<DipendenteDettagliDrawerProps> = ({
    isOpen,
    onClose,
    notaSpesaId,
    notaSpesaName,
    rejectionReason,
    onResend,
    onSetSelectedDetail
}) => {
    const [details, setDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const loadDetails = async () => {
            if(!notaSpesaId) return;

            try{
                setLoading(true);

                const result = await Dw_detaglinotespesasService.getAll({
                    filter: `_dw_notaspesa_value eq '${notaSpesaId}'`
                })
                const records = ((result as any)?.data ?? (result as any)?.value ?? []) as any[];
                setDetails(records);
            }catch(err){
                console.error("[DipendenteDettagliDrawer] Failed to load details:", err);
            }finally{
                setLoading(false);
            }
        }
        loadDetails();
    }, [notaSpesaId, isOpen])

    return(
        <>
      <div
        className={`fixed inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-50 dark:bg-slate-950 shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out border-l border-slate-200 dark:border-slate-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Voci di Spesa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {notaSpesaName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100%-210px)] overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-[#E85C24]" size={32} />
            </div>
          ) : details.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <FileText size={40} />
              <p className="text-sm font-bold">Nessuna voce trovata</p>
            </div>
          ) : (
            <button className="space-y-4"  >
              {details.map((detail: any) => (
                <div
                  key={detail.dw_detaglinotespesaid}
                  onClick={() => onSetSelectedDetail(detail.dw_detaglinotespesaid)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4"
                >
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {detail.dw_name || "Dettaglio Spesa"}
                  </p>

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Importo:{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {detail.dw_totalcost ?? detail.dw_amount ?? 0}
                    </span>
                  </p>
                </div>
              ))}
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">
              Motivo rifiuto
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {rejectionReason || "Nessun motivo specificato."}
            </p>
          </div>

          <button
            onClick={onResend}
            className="w-full py-3 rounded-xl bg-[#E85C24] text-white font-black flex items-center justify-center gap-2 hover:bg-[#d04a1b] transition-all"
          >
            <Send size={18} />
            Reinvia Nota
          </button>
        </div>
      </aside>
    </>
    )
}

export default DipendenteDettagliDrawer;