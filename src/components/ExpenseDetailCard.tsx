import React from 'react';
import { 
  FileText, 
  Paperclip, 
  ChevronRight, 
  Calendar,
  Tag
} from 'lucide-react';

/**
 * Interface for the Expense Detail item
 */
export interface ExpenseDetail {
  id: string;
  name: string;
  createdOn: string;
  category: string;
  currency: string;
  amount: number;
  receiptType: 'image' | 'pdf' | 'other';
  receiptUrl?: string;
}

interface ExpenseDetailCardProps {
  detail: ExpenseDetail;
  onClick?: (id: string) => void;
}

/**
 * ExpenseDetailCard Component
 * Refined to show visual receipt previews and corrected data mapping.
 */
const ExpenseDetailCard: React.FC<ExpenseDetailCardProps> = ({ detail, onClick }) => {
  
  /**
   * Renders the receipt preview area based on the file type
   * Now prioritizes showing the actual image or a specific PDF icon
   */
  const renderReceiptPreview = () => {
    const iconClasses = "text-slate-400 group-hover:text-[#E85C24] transition-colors";
    
    if (detail.receiptType === 'image' && detail.receiptUrl) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-50 overflow-hidden">
          <img 
            src={detail.receiptUrl} 
            alt="Receipt thumbnail" 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
        </div>
      );
    }

    if (detail.receiptType === 'pdf') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/50 gap-1 border-2 border-dashed border-orange-100">
          <FileText size={28} className="text-[#E85C24] drop-shadow-sm" />
          <span className="text-[9px] font-black text-[#E85C24] uppercase tracking-tighter">PDF</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <Paperclip size={24} className={iconClasses} />
      </div>
    );
  };

  return (
    <div 
      onClick={() => onClick?.(detail.id)}
      className="group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#E85C24] transition-all cursor-pointer flex gap-5 overflow-hidden"
    >
      {/* Receipt Preview Area - Enhanced for visual priority */}
      <div className="flex-shrink-0 w-20 h-20 rounded-xl border border-slate-100 overflow-hidden shadow-inner bg-slate-50">
        {renderReceiptPreview()}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-[#E85C24] transition-colors">
              {detail.name}
            </h4>
            <div className="text-right">
              <span className="text-sm font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                {detail.currency} {detail.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Tag size={13} className="text-[#E85C24]/60" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{detail.category}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-[11px] font-medium">{detail.createdOn}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <span className="text-[10px] font-black text-slate-400 group-hover:text-[#E85C24] flex items-center gap-1 transition-colors uppercase tracking-widest">
            Vedi Voce <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>

      {/* Active Indicator Strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E85C24] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
    </div>
  );
};

export default ExpenseDetailCard;
