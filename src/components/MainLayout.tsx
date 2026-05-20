/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  X,
  Clock,
  Inbox,
} from "lucide-react";
import { getContext } from "@microsoft/power-apps/app";
import { Dw_nota_spesesService } from "@/generated";
import { ContactsService } from "@/generated/services/ContactsService";

function getRawContactRoleName(contact: any): string {
  return (
    contact?.["_cr098_ruolosicurezza_value@OData.Community.Display.V1.FormattedValue"] ??
    contact?.cr098_ruolosicurezzaname ??
    contact?.cr098_ruolosicurezza ??
    ""
  );
}

function getAppRoleFromContact(contact: any): "Operatore" | "Dipendente" {
  const rawRole = getRawContactRoleName(contact).toLowerCase();

  const isOperator =
    rawRole.includes("system customizer") ||
    rawRole.includes("admin") ||
    rawRole.includes("approvatore");

  return isOperator ? "Operatore" : "Dipendente";
}

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: AppPage;
  onNavigate?: (page: AppPage) => void;
  notificationsEnabled?: boolean;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  notificationsEnabled = true,
  title = "Note Spese - Operatore",
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    fullName: "Utente",
    email: "",
    initials: "U",
    role: "Dipendente"
  });

  const [notificationCount, setNotificationCount] = useState(0);
  const [latestCreatedOn, setLatestCreatedOn] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeNotifications = (noteId: string) => {
    setLatestNotifications((prev) =>
      prev.filter((note) => note.dw_nota_speseid !== noteId)
    );

    setNotificationCount((prev) => Math.max(prev - 1, 0));
  };

  const clearAllNotifications = () => {
    setLatestNotifications([]);
    setNotificationCount(0);
    setShowNotifications(false);
  };

  useEffect(() => {
  const loadContext = async () => {
    try {
      const ctx = await getContext();

      const fullName = ctx.user.fullName || "Utente";
      const email = ctx.user.userPrincipalName || "";

      const initials =
        fullName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase() || "U";

      let role = "Dipendente";

      if (email) {
        const safeEmail = email.replace(/'/g, "''");

        const contactResult = await ContactsService.getAll({
          filter: `emailaddress1 eq '${safeEmail}'`,
        });

        const contacts = (((contactResult as any)?.data ??
          (contactResult as any)?.value ??
          []) as any[]);

        const contact = contacts[0];

        console.log("[MainLayout] Current user email:", email);
        console.log("[MainLayout] Contact found:", contact);

        role = getAppRoleFromContact(contact);

        console.log("[MainLayout] Role:", role);
      }

      setCurrentUser({ fullName, email, initials, role });
    } catch (err) {
      console.error("Errore caricamento contesto:", err);
    }
  };

  loadContext();
}, []);

  useEffect(() => {
    if (!notificationsEnabled) {
      return;
    }

    let intervalId: number | undefined;

    const checkForNewNote = async () => {
      try {
        const result = await Dw_nota_spesesService.getAll();
        const notes = ((result as any)?.data ??
          (result as any)?.value ??
          []) as any[];

        if (!notes.length) return;

        const sortedNotes = notes
          .filter((note) => note.createdon)
          .sort(
            (a, b) =>
              new Date(b.createdon).getTime() -
              new Date(a.createdon).getTime()
          );

        const newestCreatedOn = sortedNotes[0]?.createdon;

        if (!newestCreatedOn) return;

        if (!latestCreatedOn) {
          setLatestCreatedOn(newestCreatedOn);
          return;
        }

        const newNotes = sortedNotes.filter(
          (note) =>
            new Date(note.createdon).getTime() >
            new Date(latestCreatedOn).getTime()
        );

        if (newNotes.length > 0) {
          setNotificationCount((prev) => prev + newNotes.length);
          setLatestNotifications((prev) => [...newNotes, ...prev].slice(0, 8));
          setLatestCreatedOn(newestCreatedOn);
        }
      } catch (err) {
        console.error("Errore controllo nuove note spese:", err);
      }
    };

    checkForNewNote();

    intervalId = window.setInterval(checkForNewNote, 5000);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [latestCreatedOn, notificationsEnabled]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Impostazioni", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-50 flex flex-col ${
          isMinimized ? "w-20" : "w-64"
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 overflow-hidden shrink-0">
          <div className="w-9 h-9 bg-[#E85C24] rounded-lg flex items-center justify-center text-white shadow-md shrink-0 font-black tracking-tighter">
            AG
          </div>

          {!isMinimized && (
            <div className="ml-3 transition-opacity duration-300">
              <p className="text-sm font-black tracking-tight leading-none uppercase text-slate-800 dark:text-slate-100">
                AGIC Group
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest mt-1 uppercase">
                Expense Portal
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id as AppPage)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? "bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    isActive
                      ? "text-[#E85C24]"
                      : "group-hover:scale-110 transition-transform"
                  }`}
                />
                {!isMinimized && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {isMinimized ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
            {!isMinimized && (
              <span className="font-bold text-sm">Riduci Menu</span>
            )}
          </button>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isMinimized ? "pl-20" : "pl-64"
        }`}
      >
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-slate-700">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className={`p-2 rounded-lg transition-all relative ${
                    showNotifications
                      ? "bg-orange-50 dark:bg-orange-950/30 text-[#E85C24]"
                      : "text-slate-400 dark:text-slate-500 hover:text-[#E85C24] hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  }`}
                  title="Notifiche"
                >
                  <Bell
                    size={22}
                    className={notificationCount > 0 ? "animate-pulse" : ""}
                  />

                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                          Notifiche
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          {notificationCount} Nuovi aggiornamenti
                        </p>
                      </div>

                      {latestNotifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          Cancella tutto
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                      {latestNotifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <Inbox size={24} className="opacity-30" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-widest opacity-70">
                            Nessuna nuova notifica
                          </p>
                        </div>
                      ) : (
                        latestNotifications.map((note) => (
                          <div
                            key={note.dw_nota_speseid}
                            className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-4 relative group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-900/50 shadow-sm">
                              <Clock size={18} className="text-[#E85C24]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                {note.dw_name ?? "Nuova Nota Spesa"}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <Clock size={10} className="opacity-50" />
                                {new Date(note.createdon).toLocaleString(
                                  "it-IT",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotifications(note.dw_nota_speseid);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                              title="Rimuovi"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {latestNotifications.length > 0 && (
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-center">
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#E85C24] hover:underline">
                          Vedi tutte le note spese
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowHelp((prev) => !prev)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#E85C24] hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-all"
                  title="Aiuto"
                >
                  <HelpCircle size={20} />
                </button>

                {showHelp && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        Aiuto rapido
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                        Note Spese - Operatore
                      </p>
                    </div>

                    <div className="p-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Dashboard
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Visualizza, filtra e apri le note spese da
                          controllare.
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Approvazione
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Puoi approvare o rifiutare solo la Nota Spesa
                          completa, non le singole voci.
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          Periodo
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Il filtro periodo permette di selezionare solo il
                          giorno 1 o 16 del mese.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Supporto
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Contatta il team AGIC per problemi o richieste.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex items-center gap-3 pl-2 group cursor-pointer"
              title={currentUser.email || currentUser.fullName}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none group-hover:text-[#E85C24] transition-colors">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {currentUser.role}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-[#E85C24] text-white border-2 border-white dark:border-slate-900 shadow-md ring-1 ring-orange-100 dark:ring-orange-900/40 flex items-center justify-center text-sm font-black transform group-hover:scale-105 transition-transform">
                {currentUser.initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;