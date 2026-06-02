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
  Settings,
  ChevronDown,
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
    className="peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85C24] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#E85C24] data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700"
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
  setTheme,
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
      <div className="p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] flex items-center justify-center border border-orange-100 dark:border-orange-900/40 shadow-sm">
                <Settings size={28} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E85C24] mb-2">
                  Configurazione
                </p>

                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Impostazioni
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">
                  Gestisci preferenze, notifiche, tema e informazioni utente
                  dell&apos;app Note Spese.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Utente corrente
              </p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">
                {userInfo.fullName}
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-7">
            <SectionHeader
              icon={User}
              title="Informazioni Utente"
              subtitle="Power Apps Context"
              colorClass="bg-orange-50 dark:bg-orange-950/30 text-[#E85C24] border-orange-100 dark:border-orange-900/40"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Nome" value={userInfo.fullName} />
              <InfoRow icon={Mail} label="Email" value={userInfo.email} />
              <InfoRow
                icon={Shield}
                label="Object ID"
                value={userInfo.objectId}
              />
              <InfoRow
                icon={Building2}
                label="Tenant ID"
                value={userInfo.tenantId}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-7">
            <SectionHeader
              icon={theme === "dark" ? Moon : Sun}
              title="Tema"
              subtitle="Aspetto interfaccia"
              colorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            />

            <SettingRow
              title="Modalità scura"
              description="Cambia il tema dell'interfaccia tra chiaro e scuro."
              icon={theme === "dark" ? Moon : Sun}
              rightContent={
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  theme === "light"
                    ? "border-[#E85C24] bg-orange-50 dark:bg-orange-950/20 text-[#E85C24]"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <Sun size={18} className="mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">
                  Chiaro
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  theme === "dark"
                    ? "border-[#E85C24] bg-orange-50 dark:bg-orange-950/20 text-[#E85C24]"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <Moon size={18} className="mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">
                  Scuro
                </p>
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-7">
            <SectionHeader
              icon={LayoutList}
              title="Preferenze Dashboard"
              subtitle="Visualizzazione elenco"
              colorClass="bg-blue-50 dark:bg-blue-950/30 text-blue-500 border-blue-100 dark:border-blue-900/40"
            />

            <SettingRow
              title="Note spese per pagina"
              description="Numero di righe mostrate nella dashboard operatore."
              icon={LayoutList}
              rightContent={
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-700 dark:text-slate-100 outline-none hover:border-[#E85C24] focus:border-[#E85C24] focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/30 transition-all cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              }
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-7">
            <SectionHeader
              icon={Bell}
              title="Notifiche"
              subtitle="Avvisi operatore"
              colorClass="bg-red-50 dark:bg-red-950/30 text-red-500 border-red-100 dark:border-red-900/40"
            />

            <SettingRow
              title="Abilita notifiche"
              description="Ricevi avvisi per nuove note, aggiornamenti e stati importanti."
              icon={Bell}
              rightContent={
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              }
            />

            <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Stato notifiche
              </p>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    notificationsEnabled ? "bg-green-500" : "bg-slate-400"
                  }`}
                />

                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {notificationsEnabled ? "Attive" : "Disattivate"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  colorClass: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  colorClass,
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${colorClass}`}
    >
      <Icon size={22} />
    </div>

    <div>
      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
        {title}
      </h3>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">
        {subtitle}
      </p>
    </div>
  </div>
);

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 min-w-0">
    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
      <Icon size={17} className="text-[#E85C24]" />
    </div>

    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </p>

      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 break-all leading-relaxed">
        {value}
      </p>
    </div>
  </div>
);

interface SettingRowProps {
  title: string;
  description: string;
  icon: React.ElementType;
  rightContent: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  icon: Icon,
  rightContent,
}) => (
  <div className="flex items-center justify-between gap-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
    <div className="flex items-start gap-4 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#E85C24]" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
          {title}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>

    <div className="shrink-0">{rightContent}</div>
  </div>
);

export default SettingsPage;
