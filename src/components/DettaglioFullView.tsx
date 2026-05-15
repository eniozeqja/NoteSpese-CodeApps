/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Tag,
  Coins,
  FileText,
  ExternalLink,
  Download,
  Clock,
  Maximize2,
  Paperclip,
  Loader2,
} from "lucide-react";
import { Dw_detaglinotespesasService } from "../generated/services/Dw_detaglinotespesasService";
import type { Dw_detaglinotespesas } from "../generated/models/Dw_detaglinotespesasModel";
import { useAttachment } from "../hooks/useAttachment";

interface DettaglioFullViewProps {
  detailId: string;
  onBack: () => void;
}

const DettaglioFullView: React.FC<DettaglioFullViewProps> = ({
  detailId,
  onBack,
}) => {
  const [detail, setDetail] = useState<Dw_detaglinotespesas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const {
    attachmentUrl,
    loading: attachmentLoading,
    error: attachmentError,
  } = useAttachment(detail);

  function getFormattedValue(record: any, field: string): string {
    return (
      record[`${field}@OData.Community.Display.V1.FormattedValue`] ??
      record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ??
      "—"
    );
  }

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      setDetail(null);

      try {
        const result = await Dw_detaglinotespesasService.get(detailId);
        setDetail(result.data || (result as any).value || null);
      } catch (err) {
        console.error("Error fetching detail:", err);
        setError("Impossibile caricare i dati del dettaglio spesa.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [detailId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#E85C24]" size={40} />
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Caricamento dettagli voce di spesa...
        </p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
          <Paperclip size={32} />
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Errore di caricamento
        </h2>

        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          {error || "Voce di spesa non trovata."}
        </p>

        <button
          onClick={onBack}
          className="mt-6 px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          Torna all'elenco
        </button>
      </div>
    );
  }

  const fileName = (detail as any).dw_receipt_name ?? "";
  const hasReceipt = Boolean((detail as any).dw_receipt);

  const lowerFileName = fileName.toLowerCase();
  const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(lowerFileName);
  const isPdf = lowerFileName.endsWith(".pdf");
  const receiptType = isImage ? "IMAGE" : isPdf ? "PDF" : "OTHER";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20 relative transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-all group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {detail.dw_name || "Dettaglio Spesa"}
            </h1>

            <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
              <span>ID: {detail.dw_detaglinotespesaid}</span>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
              <span>Creato il {getFormattedValue(detail, "createdon")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock size={14} /> Solo Visualizzazione
          </span>
        </div>
      </header>

      <main className="p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Dettagli Economici
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] rounded-xl flex items-center justify-center">
                    <Coins size={24} />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      Importo Totale
                    </p>

                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {getFormattedValue(detail, "dw_currency")}{" "}
                      {(
                        (detail as any).dw_totalcost ??
                        (detail as any).dw_amount ??
                        0
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Tag size={12} /> Categoria
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {getFormattedValue(detail, "dw_categoriadispesa")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} /> Data Spesa
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {getFormattedValue(detail, "createdon")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Note Aggiuntive
              </h3>

              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  {(detail as any).dw_additionalnotes ||
                    "Nessuna nota aggiuntiva fornita."}
                </p>
              </div>
            </div>
          </section>

          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl shadow-slate-200 dark:shadow-black/30 border border-transparent dark:border-slate-800">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-[#E85C24]" /> Supporto
              Decisionale
            </h4>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Verifica la conformità dell'allegato alla policy aziendale AGIC
              Group.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Paperclip size={20} className="text-[#E85C24]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Allegato Ricevuta
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {attachmentUrl && (
                  <>
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#E85C24] transition-all"
                      title="Apri originale"
                    >
                      <ExternalLink size={18} />
                    </a>

                    <a
                      href={attachmentUrl}
                      download={fileName || "ricevuta"}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#E85C24] transition-all"
                      title="Scarica"
                    >
                      <Download size={18} />
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 bg-slate-100/50 dark:bg-slate-950/60 p-8 flex items-center justify-center relative group">
              {attachmentError ? (
                <div className="flex flex-col items-center justify-center text-red-400 gap-4">
                  <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 border-2 border-dashed border-red-200 dark:border-red-900/50 flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <p className="font-medium">{attachmentError}</p>
                </div>
              ) : attachmentLoading ? (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
                  <Loader2 className="animate-spin text-[#E85C24]" size={32} />
                  <p className="font-medium">Caricamento allegato...</p>
                </div>
              ) : isImage && attachmentUrl ? (
                <div
                  className="relative max-w-full max-h-[700px] shadow-2xl rounded-lg overflow-hidden border-4 border-white dark:border-slate-800 cursor-pointer"
                  onClick={() => setIsZoomed(true)}
                >
                  <img
                    src={attachmentUrl}
                    alt={fileName || "Receipt Full Preview"}
                    className="object-contain w-full h-full"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <Maximize2 size={16} /> Ingrandisci
                    </button>
                  </div>
                </div>
              ) : isPdf && attachmentUrl ? (
                <iframe
                  src={attachmentUrl}
                  className="w-full h-[700px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner"
                />
              ) : hasReceipt ? (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
                  <Paperclip size={32} />
                  <p className="font-medium">
                    Allegato presente, ma anteprima non disponibile.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Paperclip size={32} />
                  </div>
                  <p className="font-medium">Nessuna anteprima disponibile</p>
                </div>
              )}
            </div>

            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex justify-between">
              <span>FILE: {fileName || "NESSUN FILE"}</span>
              <span>TIPO: {receiptType}</span>
            </div>
          </div>
        </div>
      </main>

      {isZoomed && isImage && attachmentUrl && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-10 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={attachmentUrl}
            alt="Zoomed Receipt"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
          />

          <button
            className="absolute top-10 right-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
            onClick={() => setIsZoomed(false)}
          >
            <Maximize2 size={24} className="rotate-45" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DettaglioFullView;