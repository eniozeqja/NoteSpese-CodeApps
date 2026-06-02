/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { getContext } from "@microsoft/power-apps/app";
import { ContactsService } from "@/generated/services/ContactsService";
import NotificationBell from "./notifications/NotificationBell";

function getRawContactRoleName(contact: any): string {
  return (
    contact?.[
      "_cr098_ruolosicurezza_value@OData.Community.Display.V1.FormattedValue"
    ] ??
    contact?.cr098_ruolosicurezzaname ??
    contact?.cr098_ruolosicurezza ??
    ""
  );
}

function getAppRoleFromContact(contact: any): "Operatore" | "Dipendente" {
  const rawRole = getRawContactRoleName(contact).toLowerCase();

  const isOperator =
    rawRole.includes("operatore") ||
    rawRole.includes("system customizer") ||
    rawRole.includes("admin") ||
    rawRole.includes("approvatore");

  return isOperator ? "Operatore" : "Dipendente";
}

type AppPage = "dashboard" | "analytics" | "settings";

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
    role: "Dipendente",
  });

  const [showHelp, setShowHelp] = useState(false);

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

        if (ctx.user.objectId) {
          const contactResult = await ContactsService.getAll({
            filter: `externaluseridentifier eq ${ctx.user.objectId}`,
          });

          role = getAppRoleFromContact(contactResult.data[0]);
        }

        setCurrentUser({ fullName, email, initials, role });
      } catch (err) {
        console.error("Errore caricamento contesto:", err);
      }
    };

    loadContext();
  }, []);

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
              <NotificationBell
                notificationsEnabled={notificationsEnabled}
                role={currentUser.role as "Operatore" | "Dipendente"}
              />

              <div className="relative">
                <button
                  type="button"
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
