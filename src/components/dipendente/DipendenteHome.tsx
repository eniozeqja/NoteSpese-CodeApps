import React from "react";
import { User, FilePlus2, Clock, LogOut } from "lucide-react";

interface DipendenteHomeProps {
  currentUserName?: string;
  currentUserEmail?: string;
}

const DipendenteHome: React.FC<DipendenteHomeProps> = ({
  currentUserName = "Dipendente",
  currentUserEmail = "",
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Area Dipendente
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-1">
            Gestisci le tue note spese personali.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
              {currentUserName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              {currentUserEmail}
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#E85C24] text-white flex items-center justify-center font-black">
            <User size={18} />
          </div>
        </div>
      </header>

      <main className="p-10 max-w-6xl mx-auto space-y-8">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-10 shadow-sm">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            Benvenuto, {currentUserName}
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-2xl">
            Questa sarà la pagina dedicata al dipendente. Qui potremo aggiungere
            la creazione di nuove note spese, caricamento ricevute, invio in
            approvazione e visualizzazione dello stato.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] flex items-center justify-center mb-5">
              <FilePlus2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Nuova Nota Spesa
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Funzionalità da implementare.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center mb-5">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Le mie Note Spese
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Qui mostreremo solo le note spese del dipendente.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center mb-5">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              Stato Approvazioni
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Qui potremo mostrare bozze, inviate, approvate e rifiutate.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DipendenteHome;