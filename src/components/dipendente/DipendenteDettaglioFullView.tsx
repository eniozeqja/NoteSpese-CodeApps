/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Trash2, 
  Upload, 
  Calendar, 
  Tag, 
  Building2, 
  Coins, 
  StickyNote,
  FileText,
  X
} from "lucide-react";
import { Dw_detaglinotespesasService } from "@/generated/services/Dw_detaglinotespesasService";
import { useAttachment } from "@/hooks/useAttachment";

interface DipendenteDettaglioFullViewProps {
    detailId: string;
    onBack: () => void;
    onSaved: () => void;
}

/**
 * Enhanced Employee Detail View
 * Refined layout with a two-column grid for better information hierarchy.
 * Maintains all original functional logic for Dataverse updates and receipt uploads.
 * Added loading states for saving and deleting operations.
 */
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
    const [deleting, setDeleting] = useState(false)

    const { attachmentUrl, loading: attachmentLoading, error: attachmentError } = useAttachment(detail)

    useEffect(() => {
        const loadDetail = async () => {
            try {
                setLoading(true)
                const result = await Dw_detaglinotespesasService.get(detailId)
                const record = (result as any)?.data ?? (result as any)?.value ?? null;
                
                setDetail(record)
                setFormData({
                    totalCost: String(record?.dw_totalcost ?? ""),
                    category: String(record?.dw_categoriadispesa ?? ""),
                    currency: String(record?.dw_currency ?? ""),
                    transactionDate: record?.dw_transactiondate ? record.dw_transactiondate.slice(0, 10) : "",
                    merchantName: record?.dw_merchantname || "",
                    additionalNotes: record?.dw_additionalnotes || ""
                })
            } catch (err) {
                console.error("Failed to load detail: ", err)
            } finally {
                setLoading(false)
            }
        }
        loadDetail()
    }, [detailId])

    const handleSave = async () => {
        try {
            if (
                !formData.category ||
                !formData.currency ||
                !formData.merchantName ||
                !formData.totalCost ||
                !formData.transactionDate
            ) {
                alert("Compila tutti i campi obbligatori")
                return;
            }

            setSaving(true);
            await Dw_detaglinotespesasService.update(detailId, {
                dw_totalcost: Number(formData.totalCost),
                dw_categoriadispesa: String(formData.category),
                dw_currency: String(formData.currency),
                dw_transactiondate: formData.transactionDate,
                dw_merchantname: formData.merchantName,
                dw_additionalnotes: formData.additionalNotes,
            } as any)

            if (newReceiptFile) {
                await Dw_detaglinotespesasService.upload(detailId, "dw_receipt", newReceiptFile, newReceiptFile.name)
            }

            alert("Modifiche salvate correttamente.")
            onSaved?.()
        } catch (err) {
            console.error("Save failed: ", err)
            alert("Errore durante il salvataggio.")
        } finally {
            setSaving(false);
        }
    }

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Sei sicuro di voler eliminare questa voce di spesa? L'azione non può essere annullata."
        )

        if(!confirmed) return;

        try{
            setDeleting(true);
            await Dw_detaglinotespesasService.delete(detailId);
            alert("Voce di spesa eliminata correttamente.")

            onSaved?.()
            onBack();
        }catch(err){
            console.log("Failed: ", err)
            alert("Errore durante l'eliminazione della voce di spesa.")
        } finally {
            setDeleting(false);
        }
    }

    const handleReceiptChange = (file: File | null) => {
        if (!file) return;
        setNewReceiptFile(file)
        const previewUrl = URL.createObjectURL(file)
        setNewReceiptPreviewUrl(previewUrl)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-[#E85C24]" size={40} />
                    <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Caricamento...</p>
                </div>
            </div>
        )
    }

    if (!detail) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                    <FileText size={32} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold">Dettaglio non trovato.</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                >
                    Torna indietro
                </button>
            </div>
        );
    }

    const previewUrl = newReceiptPreviewUrl || attachmentUrl
    const previewName = newReceiptFile?.name || detail.dw_receipt_name;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
            {/* Elegant Header */}
            <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={onBack}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    <div>
                        <div className="flex items-center gap-2">
                           <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                               Modifica Voce
                           </h1>
                           <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] text-[10px] font-black uppercase tracking-wider">
                               Dettaglio
                           </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {detail.dw_name || "Dettaglio Spesa"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || saving}
                        className={`px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-all ${
                            deleting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        {deleting ? "Eliminazione..." : "Elimina"}
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || deleting}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-orange-100 dark:shadow-none ${
                            saving
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                : "bg-[#E85C24] text-white hover:bg-[#d04a1b]"
                        }`}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? "Salvataggio..." : "Salva modifiche"}
                    </button>
                </div>
            </header>

            <main className="p-8 lg:p-12 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Receipt Preview */}
                    <div className="lg:col-span-7">
                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                            <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-[#E85C24]">
                                        <Upload size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                                            Ricevuta
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                                            {previewName || "Nessun file selezionato"}
                                        </p>
                                    </div>
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

                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                >
                                    Cambia file
                                </button>
                            </div>

                            <div className="p-8 bg-slate-100/50 dark:bg-slate-950 flex items-center justify-center min-h-[500px]">
                                {attachmentLoading ? (
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Loader2 className="animate-spin" size={32} />
                                        <p className="text-xs font-bold uppercase tracking-tighter">Caricamento anteprima...</p>
                                    </div>
                                ) : attachmentError ? (
                                    <div className="flex flex-col items-center gap-3 text-red-500">
                                        <X size={32} />
                                        <p className="text-xs font-bold">{attachmentError}</p>
                                    </div>
                                ) : !previewUrl ? (
                                    <div className="flex flex-col items-center gap-4 text-slate-400 opacity-50">
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                            <FileText size={32} />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest">Nessun allegato</p>
                                    </div>
                                ) : previewName?.toLowerCase().endsWith(".pdf") ? (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-[650px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-2xl"
                                        title="Ricevuta PDF"
                                    />
                                ) : (
                                    <div className="relative group max-w-full">
                                        <img
                                            src={previewUrl}
                                            alt="Ricevuta"
                                            className="max-w-full max-h-[700px] object-contain rounded-2xl border-4 border-white dark:border-slate-800 shadow-2xl"
                                        />
                                        <div className="absolute inset-0 rounded-2xl bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Form Data */}
                    <div className="lg:col-span-5 space-y-8">
                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-[#E85C24] rounded-full" />
                                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                    Informazioni Spesa
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {/* Total Cost Input */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                        <Coins size={12} /> Importo Totale
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.totalCost}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, totalCost: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-5 py-4 text-base font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#E85C24] focus:ring-4 focus:ring-orange-500/5 transition-all"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none">
                                            VAL
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Category Select */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                            <Tag size={12} /> Categoria
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#E85C24] transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>Scegli...</option>
                                            <option value="121950000">Vitto</option>
                                            <option value="121950001">Alloggio</option>
                                            <option value="121950002">Trasporto</option>
                                            <option value="121950003">Carburante</option>
                                            <option value="121950004">Rappresentanza</option>
                                            <option value="121950005">Altro</option>
                                        </select>
                                    </div>

                                    {/* Currency Select */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                            <Coins size={12} /> Valuta
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#E85C24] transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>Valuta...</option>
                                            <option value="121950000">EUR</option>
                                            <option value="121950001">USD</option>
                                            <option value="121950002">GBP</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Transaction Date */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                            <Calendar size={12} /> Data
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.transactionDate}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#E85C24] transition-all"
                                        />
                                    </div>

                                    {/* Merchant Name */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                            <Building2 size={12} /> Merchant
                                        </label>
                                        <input
                                            value={formData.merchantName}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, merchantName: e.target.value }))}
                                            placeholder="es. Amazon, Uber..."
                                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#E85C24] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Additional Notes */}
                                <div className="space-y-2 pt-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                        <StickyNote size={12} /> Note Aggiuntive
                                    </label>
                                    <textarea
                                        value={formData.additionalNotes}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                                        rows={5}
                                        placeholder="Inserisci dettagli utili per l'approvatore..."
                                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none resize-none focus:border-[#E85C24] transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Audit Info / Non-editable Summary */}
                        <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-200 dark:shadow-none">
                            <h3 className="font-black text-xs uppercase tracking-widest text-[#E85C24] mb-4">Informazioni Sistema</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Creato il</span>
                                    <span className="text-sm font-bold">{detail.createdon ? new Date(detail.createdon).toLocaleDateString() : "—"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DipendenteDettaglioFullView;
