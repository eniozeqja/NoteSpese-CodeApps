import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Shield,
  Building2,
  LayoutList,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { getContext } from "@microsoft/power-apps/app";
import MainLayout from "./MainLayout";
import * as SwitchPrimitive from "@radix-ui/react-switch";

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";

type Theme = "light" | "dark";

interface SettingsPageProps {
  onNavigate?: (page: AppPage) => void;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  theme: Theme;
  setTheme: (value: Theme) => void;
}

const Switch = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) => (
  <SwitchPrimitive.Root
    checked={checked}
    onCheckedChange={onCheckedChange}
    className="peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85C24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#E85C24] data-[state=unchecked]:bg-slate-200"
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
);

const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  itemsPerPage,
  setItemsPerPage,
  notificationsEnabled,
  setNotificationsEnabled,
  theme,
  setTheme
}) => {
  const [userInfo, setUserInfo] = useState({
    fullName: "Utente",
    email: "—",
    objectId: "—",
    tenantId: "—",
  });

  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const ctx = await getContext();

        setUserInfo({
          fullName: ctx.user.fullName || "Utente",
          email: ctx.user.userPrincipalName || "—",
          objectId: ctx.user.objectId || "—",
          tenantId: ctx.user.tenantId || "—",
        });
      } catch (err) {
        console.error("Could not load Power Apps user context:", err);
      }
    };

    loadUserContext();
  }, []);

  return (
    <MainLayout
  activeTab="settings"
  onNavigate={onNavigate}
  notificationsEnabled={notificationsEnabled}
>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            Impostazioni
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Gestisci preferenze e informazioni dell&apos;app Note Spese.
          </p>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#E85C24] flex items-center justify-center">
                <User size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Informazioni Utente
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Power Apps Context
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InfoRow icon={User} label="Nome" value={userInfo.fullName} />
              <InfoRow icon={Mail} label="Email" value={userInfo.email} />
              <InfoRow icon={Shield} label="Object ID" value={userInfo.objectId} />
              <InfoRow icon={Building2} label="Tenant ID" value={userInfo.tenantId} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <LayoutList size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Preferenze Dashboard
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Visualizzazione elenco
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div>
  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
    Note spese per pagina
  </p>
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
    Numero di righe mostrate nella dashboard.
  </p>
</div>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-100 outline-none hover:border-[#E85C24] transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Bell size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Notifiche
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  Nuove note spese
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div>
  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
    Abilita notifiche
  </p>
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
    Ricevi avvisi quando vengono create nuove note spese.
  </p>
</div>

              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>

        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-6">
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
      {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
    </div>

    <div>
      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
        Tema
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
        Aspetto interfaccia
      </p>
    </div>
  </div>

  <div className="flex items-center justify-between gap-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
        Modalità scura
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Cambia il tema dell&apos;interfaccia tra chiaro e scuro.
      </p>
    </div>

    <Switch
      checked={theme === "dark"}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
    />
  </div>
</section>
      </div>
    </MainLayout>
  );
};

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
    <Icon size={18} className="text-[#E85C24] mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 break-all">
        {value}
      </p>
    </div>
  </div>
);

export default SettingsPage;