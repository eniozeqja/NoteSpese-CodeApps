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
type AppRole = "operatore" | "dipendente";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: AppPage;
  onNavigate?: (page: AppPage) => void;
  notificationsEnabled?: boolean;
  title?: string;
  role?: AppRole;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  notificationsEnabled = true,
  title,
  role = "operatore",
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    fullName: "Utente",
    email: "",
    initials: "U",
    role: role === "operatore" ? "Operatore" : "Dipendente",
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

        let detectedRole = role === "operatore" ? "Operatore" : "Dipendente";

        if (ctx.user.objectId) {
          const contactResult = await ContactsService.getAll({
            filter: `externaluseridentifier eq ${ctx.user.objectId}`,
          });

          const contacts = ((contactResult as any)?.data ??
            (contactResult as any)?.value ??
            []) as any[];

          if (contacts[0]) {
            detectedRole = getAppRoleFromContact(contacts[0]);
          }
        }

        setCurrentUser({
          fullName,
          email,
          initials,
          role: detectedRole,
        });
      } catch (err) {
        console.error("Errore caricamento contesto:", err);
      }
    };

    loadContext();
  }, [role]);

  const effectiveTitle =
    title ??
    (role === "dipendente"
      ? "Note Spese - Dipendente"
      : "Note Spese - Operatore");

  const menuItems =
    role === "dipendente"
      ? [
          {
            id: "dashboard" as AppPage,
            label: "Le mie note",
            icon: LayoutDashboard,
          },
          {
            id: "analytics" as AppPage,
            label: "Le mie statistiche",
            icon: BarChart3,
          },
          {
            id: "settings" as AppPage,
            label: "Impostazioni",
            icon: Settings,
          },
        ]
      : [
          {
            id: "dashboard" as AppPage,
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          {
            id: "analytics" as AppPage,
            label: "Analytics",
            icon: BarChart3,
          },
          {
            id: "settings" as AppPage,
            label: "Impostazioni",
            icon: Settings,
          },
        ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <aside
        className={`sticky top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 flex flex-col ${
          isMinimized ? "w-24" : "w-72"
        }`}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E85C24] text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
              AG
            </div>

            {!isMinimized && (
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  AGIC Group
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Expense Portal
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate?.(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? "bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon size={21} className="shrink-0" />

                {!isMinimized && (
                  <span className="text-sm font-bold">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {isMinimized ? (
              <ChevronRight size={21} />
            ) : (
              <ChevronLeft size={21} />
            )}
            {!isMinimized && (
              <span className="text-sm font-bold">Riduci Menu</span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-10 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {effectiveTitle}
            </h1>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
              {role === "dipendente"
                ? "Area personale dipendente"
                : "Area operatore"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#E85C24] hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-all"
                title="Aiuto"
              >
                <HelpCircle size={21} />
              </button>

              {showHelp && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-5 z-50">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3">
                    Aiuto rapido
                  </p>

                  {role === "dipendente" ? (
                    <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                      <p>
                        <span className="font-black text-slate-700 dark:text-slate-200">
                          Le mie note:
                        </span>{" "}
                        visualizza bozze e note rifiutate da correggere.
                      </p>
                      <p>
                        <span className="font-black text-slate-700 dark:text-slate-200">
                          Statistiche:
                        </span>{" "}
                        controlla importi personali, note in attesa e categorie.
                      </p>
                      <p>
                        <span className="font-black text-slate-700 dark:text-slate-200">
                          Reinvia:
                        </span>{" "}
                        le modifiche vengono inviate solo quando clicchi
                        Reinvia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                      <p>
                        <span className="font-black text-slate-700 dark:text-slate-200">
                          Dashboard:
                        </span>{" "}
                        visualizza, filtra e apri le note spese da controllare.
                      </p>
                      <p>
                        <span className="font-black text-slate-700 dark:text-slate-200">
                          Approvazione:
                        </span>{" "}
                        puoi approvare o rifiutare solo la Nota Spesa completa.
                      </p>
                      <p>
                        <span className="font-black text-slate-700 dark:text-slate-200">
                          Periodo:
                        </span>{" "}
                        il filtro periodo permette di selezionare solo il giorno
                        1 o 16 del mese.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <NotificationBell
              role={role === "dipendente" ? "Dipendente" : "Operatore"}
              notificationsEnabled={notificationsEnabled}
            />

            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {currentUser.role}
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-sm font-black">
                {currentUser.initials}
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default MainLayout;
