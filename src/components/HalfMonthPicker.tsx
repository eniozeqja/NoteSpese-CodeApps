import React, { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface HalfMonthPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayValue(value: string): string {
  if (!value) return "Seleziona periodo";

  const [year, month, day] = value.split("-").map(Number);

  if (day === 1) {
    return `1–15/${String(month).padStart(2, "0")}/${year}`;
  }

  if (day === 16) {
    return `16–fine/${String(month).padStart(2, "0")}/${year}`;
  }

  return value;
}

function getDaysInMonth(year: number, monthIndex: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    days.push(new Date(year, monthIndex, day));
  }

  return days;
}

const monthNames = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const weekDays = ["L", "M", "M", "G", "V", "S", "D"];

const HalfMonthPicker: React.FC<HalfMonthPickerProps> = ({
  value,
  onChange,
}) => {
  const initialDate = value ? new Date(value) : new Date();

  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(initialDate.getMonth());
  const [visibleYear, setVisibleYear] = useState(initialDate.getFullYear());

  const days = useMemo(
    () => getDaysInMonth(visibleYear, visibleMonth),
    [visibleYear, visibleMonth]
  );

  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(visibleYear, visibleMonth, 1).getDay();

    // JS: Sunday = 0. We want Monday = 0.
    return firstDay === 0 ? 6 : firstDay - 1;
  }, [visibleYear, visibleMonth]);

  const goToPreviousMonth = () => {
    if (visibleMonth === 0) {
      setVisibleMonth(11);
      setVisibleYear((prev) => prev - 1);
    } else {
      setVisibleMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (visibleMonth === 11) {
      setVisibleMonth(0);
      setVisibleYear((prev) => prev + 1);
    } else {
      setVisibleMonth((prev) => prev + 1);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-[240px] flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none hover:border-[#E85C24] hover:text-[#E85C24] transition-all"
        >
          <span>{formatDisplayValue(value)}</span>
          <Calendar size={16} className="text-slate-400" />
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#E85C24] hover:border-[#E85C24] transition-all"
            title="Cancella filtro periodo"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-12 z-50 w-[300px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#E85C24] transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="text-sm font-black text-slate-800">
              {monthNames[visibleMonth]} {visibleYear}
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#E85C24] transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-[10px] font-black text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, index) => (
              <div key={`empty-${index}`} className="h-9" />
            ))}

            {days.map((date) => {
              const day = date.getDate();
              const isSelectable = day === 1 || day === 16;
              const dateValue = formatDateValue(date);
              const isSelected = value === dateValue;

              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => {
                    if (!isSelectable) return;

                    onChange(dateValue);
                    setIsOpen(false);
                  }}
                  className={`h-9 rounded-lg text-sm font-bold transition-all ${
                    isSelected
                      ? "bg-[#E85C24] text-white shadow-sm"
                      : isSelectable
                        ? "bg-orange-50 text-[#E85C24] hover:bg-[#E85C24] hover:text-white"
                        : "bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-slate-400 font-medium">
            Puoi selezionare solo il giorno 1 o il giorno 16 del mese.
          </p>
        </div>
      )}
    </div>
  );
};

export default HalfMonthPicker;