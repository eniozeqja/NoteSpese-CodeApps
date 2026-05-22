/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import {ArrowLeft, Loader2, Save, Trash2} from "lucide-react";
import { Dw_detaglinotespesasService } from "@/generated/services/Dw_detaglinotespesasService";

interface DipendenteDettaglioFullViewProps {
    detailId: string;
    onBack: () => void;
    onSaved: () => void;
}

const DipendenteDettaglioFullView: React.FC<DipendenteDettaglioFullViewProps> = ({
    detailId,
    onBack,
    onSaved
}) => {
    const [detail, setDetail] = useState<any | null>(null);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadDetail = async () => {
            try{
                setLoading(true)
                const result = await Dw_detaglinotespesasService.get(detailId)
                const record = (result as any)?.data ?? (result as any)?.value ?? null;

                setDetail(record)
            } catch(err){
                console.log("Failed: ", err)
            } finally{
                setLoading(false)
            }
        }
        loadDetail()
    }, [detailId])

    if(loading){
        return(
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#E85C24]" size={36} />
            </div>
        )
    }
    if (!detail) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500 dark:text-slate-400 font-bold">
                    Dettaglio non trovato.
                </p>
                <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300"
        >
          Torna indietro
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">
              Modifica Voce di Spesa
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
              {detail.dw_name || "Dettaglio Spesa"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2">
            <Trash2 size={16} />
            Elimina
          </button>

          <button className="px-5 py-2.5 rounded-xl bg-[#E85C24] text-white font-bold text-sm hover:bg-[#d04a1b] flex items-center gap-2">
            <Save size={16} />
            Salva modifiche
          </button>
        </div>
      </header>

      <main className="p-10 max-w-5xl mx-auto">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">
            Dati attuali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Nome
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {detail.dw_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Importo
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {detail.dw_totalcost ?? detail.dw_amount ?? 0}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );

}

export default DipendenteDettaglioFullView;

