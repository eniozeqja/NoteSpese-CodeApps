/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import {ArrowLeft, Loader2, Save, Trash2} from "lucide-react";
import { Dw_detaglinotespesasService } from "@/generated/services/Dw_detaglinotespesasService";
import { useAttachment } from "@/hooks/useAttachment";

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
    const [formData, setFormData] = useState({
        totalCost: "",
        category: "",
        currency: "",
        transactionDate: "",
        merchantName: "",
        additionalNotes: ""
    })
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [newReceiptFile, setNewReceiptFile] = useState<File | null>(null)
    const [newReceiptPreviewUrl, setNewReceiptPreviewUrl] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    

    const {attachmentUrl, loading: attachmentLoading, error: attachmentError} = useAttachment(detail)

    useEffect(() => {
        const loadDetail = async () => {
            try{
                setLoading(true)
                const result = await Dw_detaglinotespesasService.get(detailId)
                const record = (result as any)?.data ?? (result as any)?.value ?? null;
                // console.log("[Dipendente Detail Full Object]", record);

                setDetail(record)
                setFormData({
                    totalCost: String(record?.dw_totalcost ?? ""),
                    category: String(record?.dw_categoriadispesa ?? ""),
                    currency: String(record?.dw_currency ?? ""),
                    transactionDate: record?.dw_transactiondate ? record.dw_transactiondate.slice(0,10) : "",
                    merchantName: record?.dw_merchantname || "",
                    additionalNotes: record?.dw_additionalnotes || ""
                })
            } catch(err){
                console.log("Failed: ", err)
            } finally{
                setLoading(false)
            }
        }
        loadDetail()
    }, [detailId])


    const handleSave = async () => {
        try{
            if(
                !formData.category ||
                !formData.currency ||
                !formData.merchantName ||
                !formData.totalCost ||
                !formData.transactionDate
            ){
                alert("Compila tutti i campi obbligatori")
                return;
            }

            await Dw_detaglinotespesasService.update(detailId, {
                dw_totalcost: Number(formData.totalCost),
                dw_categoriadispesa: String(formData.category),
                dw_currency: String(formData.currency),
                dw_transactiondate: formData.transactionDate,
                dw_merchantname: formData.merchantName,
                dw_additionalnotes: formData.additionalNotes,
            } as any)

            if(newReceiptFile){
                await Dw_detaglinotespesasService.upload(detailId, "dw_receipt", newReceiptFile, newReceiptFile.name)
            }


            alert("Modifiche salvate correttamente.")
            
            onSaved?.()
        }catch(err){
            console.log("Failed: ", err)
            alert("Errore durante il salvataggio.")
        }
    }

    const handleReceiptChange = (file: File | null) => {
        if(!file) return;

        setNewReceiptFile(file)

        const previewUrl = URL.createObjectURL(file)
        setNewReceiptPreviewUrl(previewUrl)
    }

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

  const previewUrl = newReceiptPreviewUrl || attachmentUrl
  const previewName = newReceiptFile?.name || detail.dw_receipt_name;

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

<button
  type="button"
  onClick={handleSave}
  disabled={saving}
  className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
    saving
      ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
      : "bg-[#E85C24] text-white hover:bg-[#d04a1b]"
  }`}
>
  <Save size={16} />
  {saving ? "Salvataggio..." : "Salva modifiche"}
</button>
        </div>
      </header>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm mb-8">
  <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
    <div>
      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
        Ricevuta
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
        {previewName || "Nessun file allegato"}
      </p>
    </div>

    <input
  ref={fileInputRef}
  type="file"
  accept="image/*,.pdf"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0] ?? null;
    handleReceiptChange(file);
  }}
/>

    <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
      Cambia ricevuta
    </button>
  </div>

  <div className="p-8 bg-slate-50 dark:bg-slate-950">
    {attachmentLoading ? (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Caricamento ricevuta...
      </p>
    ) : attachmentError ? (
      <p className="text-sm text-red-500">{attachmentError}</p>
    ) : !previewUrl ? (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nessuna anteprima disponibile.
      </p>
    ) : previewName?.toLowerCase().endsWith(".pdf") ? (
      <iframe
        src={previewUrl}
        className="w-full h-[650px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white"
        title="Ricevuta PDF"
      />
    ) : (
      <img
        src={previewUrl}
        alt="Ricevuta"
        className="w-full max-h-[700px] object-contain rounded-2xl border border-slate-200 dark:border-slate-700 bg-white"
      />
    )}
  </div>
</section>

      <main className="p-10 max-w-5xl mx-auto">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">
            Dati attuali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      Nome dettaglio
    </p>
    <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
      {detail.dw_name || "—"}
    </p>
  </div>

  <div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      Importo
    </p>
    <input
      type="number"
      value={formData.totalCost}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, totalCost: e.target.value }))
      }
      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#E85C24]"
    />
  </div>

  <div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      Categoria
    </p>
<select
  value={formData.category}
  onChange={(e) =>
    setFormData((prev) => ({ ...prev, category: e.target.value }))
  }
  className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#E85C24]"
>
  <option value="" disabled>Seleziona categoria</option>
  <option value="121950000">Vitto</option>
  <option value="121950001">Alloggio</option>
  <option value="121950002">Trasporto</option>
  <option value="121950003">Carburante</option>
  <option value="121950004">Rappresentanza</option>
  <option value="121950005">Altro</option>
</select>
  </div>

  <div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      Valuta
    </p>
    <select
      value={formData.currency}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, currency: e.target.value }))
      }
      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#E85C24]"
    >
      <option value="" disabled>Seleziona valuta</option>
      <option value="121950000">EUR</option>
      <option value="121950001">USD</option>
      <option value="121950002">GBP</option>
    </select>
  </div>

  <div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      Data transazione
    </p>
    <input
      type="date"
      value={formData.transactionDate}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          transactionDate: e.target.value,
        }))
      }
      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#E85C24]"
    />
  </div>

  <div>
    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      Merchant
    </p>
    <input
      value={formData.merchantName}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          merchantName: e.target.value,
        }))
      }
      className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#E85C24]"
    />
  </div>
</div>

<div className="mt-6">
  <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
    Note aggiuntive
  </p>
  <textarea
    value={formData.additionalNotes}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        additionalNotes: e.target.value,
      }))
    }
    rows={4}
    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none resize-none focus:border-[#E85C24]"
  />
</div>
        </section>
      </main>
    </div>
  );

}

export default DipendenteDettaglioFullView;

