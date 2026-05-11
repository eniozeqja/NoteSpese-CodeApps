/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getReceiptType } from "../services/receiptService";
import React, { useEffect, useState, useMemo } from 'react';
import { X, Loader2, FileText, AlertCircle, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import ExpenseDetailCard, { type ExpenseDetail } from './ExpenseDetailCard';
import { Dw_detaglinotespesasService } from '../generated/services/Dw_detaglinotespesasService';
import type { Dw_detaglinotespesas } from '../generated/models/Dw_detaglinotespesasModel';

interface DettagliDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notaSpesaId: string | null;
  notaSpesaName: string;
  onSelectDetail: (detailId: string) => void;
  onApproveNota?: (id: string) => void;
  onRejectNota?: (id: string) => void;
}

/**
 * DettagliDrawer Component
 * Slide-in panel for viewing expense items. 
 * Corrected: Approval/rejection now applies to the whole parent Nota Spesa.
 */
const DettagliDrawer: React.FC<DettagliDrawerProps> = ({ 
  isOpen, 
  onClose, 
  notaSpesaId, 
  notaSpesaName,
  onSelectDetail,
  onApproveNota,
  onRejectNota
}) => {
  const [details, setDetails] = useState<Dw_detaglinotespesas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getFormattedValue(record: any, field: string): string {
    return record[`${field}@OData.Community.Display.V1.FormattedValue`] ?? 
           record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ?? 
           '—';
  }

  useEffect(() => {
    const fetchDetails = async () => {
      if (!notaSpesaId || !isOpen) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await Dw_detaglinotespesasService.getAll({
          filter: `_dw_notaspesa_value eq ${notaSpesaId}`
        });

        const data = ((result as any)?.data ?? (result as any)?.value ?? []) as Dw_detaglinotespesas[];
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Impossibile caricare i dettagli della nota spesa.');
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
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside 
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out border-l border-slate-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Voci di Spesa</h2>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
              Ref: <span className="text-[#E85C24] font-bold">{notaSpesaName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100%-160px)] overflow-y-auto p-6 pb-24">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="animate-spin text-[#E85C24]" size={32} />
              <p className="text-sm font-medium">Caricamento...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500"><AlertCircle size={24} /></div>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          ) : mappedDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4 opacity-60">
              <FileText size={48} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Nessuna voce trovata.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {mappedDetails.length} Voci in totale
                </span>
              </div>
              {mappedDetails.map((detail) => (
                <ExpenseDetailCard key={detail.id} detail={detail} onClick={onSelectDetail} />
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 grid grid-cols-2 gap-4">
          <button 
            onClick={() => notaSpesaId && onRejectNota?.(notaSpesaId)}
            className="py-4 bg-white border border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={18} /> Rifiuta Nota
          </button>
          <button 
            onClick={() => notaSpesaId && onApproveNota?.(notaSpesaId)}
            className="py-4 bg-[#E85C24] text-white font-bold rounded-2xl shadow-lg shadow-orange-100 hover:bg-[#d04a1b] transition-all flex items-center justify-center gap-2 group"
          >
            <CheckCircle2 size={18} /> Approva Nota
          </button>
        </div>
      </aside>
    </>
  );
};

export default DettagliDrawer;
