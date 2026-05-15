import React from "react";
import {
  FileText,
  Paperclip,
  ChevronRight,
  Calendar,
  Tag,
  ImageIcon,
} from "lucide-react";

export interface ExpenseDetail {
  id: string;
  name: string;
  createdOn: string;
  category: string;
  currency: string;
  amount: number;
  receiptType: "image" | "pdf" | "other";
  receiptUrl?: string;
  fileName?: string;
  hasReceipt?: boolean;
}

interface ExpenseDetailCardProps {
  detail: ExpenseDetail;
  onClick?: (id: string) => void;
}

const ExpenseDetailCard: React.FC<ExpenseDetailCardProps> = ({
  detail,
  onClick,
}) => {
  const fileType = detail.receiptType;

  const renderReceiptPreview = () => {
    if (!detail.hasReceipt) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 gap-1">
          <Paperclip
            size={24}
            className="text-slate-400 dark:text-slate-500 group-hover:text-[#E85C24] transition-colors"
          />
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
            No file
          </span>
        </div>
      );
    }

    if (fileType === "image") {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 gap-1 border-2 border-dashed border-slate-200 dark:border-slate-700">
          <ImageIcon size={26} className="text-[#E85C24]" />
          <span className="text-[9px] font-black text-[#E85C24] uppercase tracking-tighter">
            Image
          </span>
        </div>
      );
    }

    if (fileType === "pdf") {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/50 dark:bg-orange-950/30 gap-1 border-2 border-dashed border-orange-100 dark:border-orange-900/50">
          <FileText size={28} className="text-[#E85C24] drop-shadow-sm" />
          <span className="text-[9px] font-black text-[#E85C24] uppercase tracking-tighter">
            PDF
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 gap-1">
        <Paperclip
          size={24}
          className="text-slate-400 dark:text-slate-500 group-hover:text-[#E85C24] transition-colors"
        />
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
          File
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={() => onClick?.(detail.id)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-black/20 hover:border-[#E85C24] transition-all cursor-pointer flex gap-5 overflow-hidden"
    >
      <div className="flex-shrink-0 w-20 h-20 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-800">
        {renderReceiptPreview()}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#E85C24] transition-colors">
              {detail.name}
            </h4>

            <div className="text-right">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700">
                {detail.currency}{" "}
                {detail.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Tag size={13} className="text-[#E85C24]/70" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                {detail.category}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
              <span className="text-[11px] font-medium">
                {detail.createdOn}
              </span>
            </div>
          </div>

          {detail.fileName && (
            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {detail.fileName}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-end">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 group-hover:text-[#E85C24] flex items-center gap-1 transition-colors uppercase tracking-widest">
            Vedi Voce{" "}
            <ChevronRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </span>
        </div>
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E85C24] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
    </div>
  );
};

export default ExpenseDetailCard;