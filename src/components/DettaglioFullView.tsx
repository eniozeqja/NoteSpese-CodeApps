/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Coins, 
  FileText, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Maximize2, 
  Paperclip,
  Loader2
} from 'lucide-react';
import { Dw_detaglinotespesasService } from '../generated/services/Dw_detaglinotespesasService';
import type { Dw_detaglinotespesas } from '../generated/models/Dw_detaglinotespesasModel';

interface DettaglioFullViewProps {
  detailId: string;
  onBack: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

/**
 * DettaglioFullView Component
 * Enhanced with exhaustive Dataverse file property extraction and robust rendering.
 */
const DettaglioFullView: React.FC<DettaglioFullViewProps> = ({ 
  detailId, 
  onBack, 
  onApprove, 
  onReject 
}) => {
  const [detail, setDetail] = useState<Dw_detaglinotespesas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getFormattedValue(record: any, field: string): string {
    return record[`${field}@OData.Community.Display.V1.FormattedValue`] ?? 
           record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ?? 
           '—';
  }

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await Dw_detaglinotespesasService.get(detailId);
        setDetail(result.data || (result as any).value || null);
      } catch (err) {
        console.error('Error fetching detail:', err);
        setError('Impossibile caricare i dati del dettaglio spesa.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [detailId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#E85C24]" size={40} />
        <p className="text-slate-500 font-medium">Caricamento dettagli voce di spesa...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Errore di caricamento</h2>
        <p className="text-slate-500 mt-2 max-w-md">{error || 'Voce di spesa non trovata.'}</p>
        <button 
          onClick={onBack}
          className="mt-6 px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
        >
          Torna all'elenco
        </button>
      </div>
    );
  }

  // Robust extraction from Dataverse file column
  const receiptData = (detail as any).dw_receipt;
  const receiptUrl = receiptData?.url || receiptData?.value || (typeof receiptData === 'string' ? receiptData : undefined);
  const mimeType = (receiptData?.mimeType || receiptData?.contentType || receiptData?.type || '').toLowerCase();
  const fileName = (receiptData?.fileName || receiptData?.name || '').toLowerCase();

  const isPdf = mimeType.includes('pdf') || fileName.endsWith('.pdf') || (receiptUrl?.toLowerCase().includes('.pdf'));
  const isImage = mimeType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) || (receiptUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)/));

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 px-10 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{detail.dw_name || 'Dettaglio Spesa'}</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-400">
              <span>ID: {detail.dw_detaglinotespesaid}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Creato il {getFormattedValue(detail, 'createdon')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => onReject?.(detailId)} className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-all flex items-center gap-2">
            <XCircle size={18} /> Rifiuta Voce
          </button>
          <button onClick={() => onApprove?.(detailId)} className="px-8 py-2.5 bg-[#E85C24] text-white font-bold rounded-xl text-sm shadow-lg shadow-orange-100 hover:bg-[#d04a1b] transition-all flex items-center gap-2">
            <CheckCircle2 size={18} /> Approva Voce
          </button>
        </div>
      </header>

      <main className="p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dettagli Economici</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-[#E85C24] rounded-xl flex items-center justify-center">
                    <Coins size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Importo Totale</p>
                    <p className="text-2xl font-black text-slate-900">
                      {getFormattedValue(detail, 'dw_currency')} {(detail as any).dw_totalcost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || (detail as any).dw_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5"><Tag size={12} /> Categoria</p>
                    <p className="text-sm font-bold text-slate-700">{getFormattedValue(detail, 'dw_categoriadispesa')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5"><Calendar size={12} /> Data Spesa</p>
                    <p className="text-sm font-bold text-slate-700">{getFormattedValue(detail, 'createdon')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Note Aggiuntive</h3>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed italic">{(detail as any).dw_additionalnotes || 'Nessuna nota aggiuntiva fornita.'}</p>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Stato Approvazione</h3>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-bold uppercase tracking-wider">
                <Clock size={14} /> In Attesa di Revisione
              </span>
            </div>
          </section>
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl shadow-slate-200">
            <h4 className="font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-[#E85C24]" /> Supporto Decisionale</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">Verifica la conformità dell'allegato alla policy aziendale.</p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10">Visualizza Policy</button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Paperclip size={20} className="text-[#E85C24]" />
                <h3 className="text-sm font-bold text-slate-800">Allegato Ricevuta</h3>
              </div>
              <div className="flex items-center gap-2">
                {receiptUrl && (
                  <>
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#E85C24] transition-all" title="Apri originale"><ExternalLink size={18} /></a>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#E85C24] transition-all" title="Scarica"><Download size={18} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 bg-slate-100/50 p-8 flex items-center justify-center relative group">
              {isImage && receiptUrl ? (
                <div className="relative max-w-full max-h-[700px] shadow-2xl rounded-lg overflow-hidden border-4 border-white">
                  <img src={receiptUrl} alt="Receipt Full Preview" className="object-contain w-full h-full" onError={(e) => {(e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Immagine+Non+Disponibile'}} />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-5 py-2.5 bg-white text-slate-900 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform"><Maximize2 size={16} /> Ingrandisci</button>
                  </div>
                </div>
              ) : isPdf ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                  <div className="w-32 h-40 bg-white shadow-xl rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                    <FileText size={64} className="text-red-500/20" />
                    <span className="text-xs font-black text-red-500 uppercase tracking-widest">PDF Doc</span>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-bold text-slate-800">{fileName || 'documento_ricevuta.pdf'}</p>
                    <p className="text-xs text-slate-500">Anteprima PDF non disponibile nel browser.</p>
                  </div>
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-[#E85C24] hover:text-[#E85C24] transition-all flex items-center gap-2">Visualizza PDF <ExternalLink size={18} /></a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-slate-200 flex items-center justify-center"><Paperclip size={32} /></div>
                  <p className="font-medium">Nessuna anteprima disponibile</p>
                </div>
              )}
            </div>
            
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex justify-between">
              <span>MIME-TYPE: {mimeType || 'NON DEFINITO'}</span>
              <span>DIMENSIONE: {receiptData?.size ? `${(receiptData.size / 1024).toFixed(1)} KB` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DettaglioFullView;
