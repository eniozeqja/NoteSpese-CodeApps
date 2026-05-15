/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Dw_nota_spesesService } from "../generated/services/Dw_nota_spesesService";
import { Dw_detaglinotespesasService } from "../generated/services/Dw_detaglinotespesasService";
import MainLayout from "./MainLayout";

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";

interface AnalyticsPageProps {
  onNavigate?: (page: AppPage) => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawExpenses, setRawExpenses] = useState<any[]>([]);
  const [rawDetails, setRawDetails] = useState<any[]>([]);

  const [timeRange, setTimeRange] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [expensesRes, detailsRes] = await Promise.all([
        Dw_nota_spesesService.getAll(),
        Dw_detaglinotespesasService.getAll(),
      ]);

      setRawExpenses(
        (expensesRes as any)?.data ?? (expensesRes as any)?.value ?? []
      );
      setRawDetails(
        (detailsRes as any)?.data ?? (detailsRes as any)?.value ?? []
      );
    } catch (err) {
      console.error("Analytics load error:", err);
      setError("Impossibile caricare i dati analitici.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const searchedDetails = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return rawDetails;

    return rawDetails.filter((detail: any) => {
      const parentNota = rawExpenses.find(
        (expense: any) => expense.dw_nota_speseid === detail._dw_notaspesa_value
      );

      const project =
        parentNota?.[
          "_dw_codicedicommessa_value@OData.Community.Display.V1.FormattedValue"
        ] ??
        parentNota?.[
          "dw_codicedicommessa@OData.Community.Display.V1.FormattedValue"
        ] ??
        "";

      const manager =
        parentNota?.[
          "_dw_dipendente_value@OData.Community.Display.V1.FormattedValue"
        ] ?? "";

      const name = detail.dw_name ?? "";

      return (
        project.toLowerCase().includes(q) ||
        manager.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q)
      );
    });
  }, [rawDetails, rawExpenses, searchTerm]);

  const timeFilteredDetails = useMemo(() => {
    const days = Number(timeRange);
    const now = new Date();
    const minDate = new Date();

    minDate.setDate(now.getDate() - days);

    return searchedDetails.filter((detail: any) => {
      const createdOn = new Date(detail.createdon);
      return createdOn >= minDate && createdOn <= now;
    });
  }, [searchedDetails, timeRange]);

  const stats = useMemo(() => {
    if (!timeFilteredDetails.length) {
      return { total: 0, avg: 0, pending: 0, count: 0 };
    }

    const total = timeFilteredDetails.reduce(
      (sum, d) => sum + (d.dw_totalcost ?? d.dw_amount ?? 0),
      0
    );

    const filteredNotaIds = new Set(
      timeFilteredDetails
        .map((detail: any) => detail._dw_notaspesa_value)
        .filter(Boolean)
    );

    const count = filteredNotaIds.size;
    const avg = count > 0 ? total / count : 0;

    const pendingTotal = rawExpenses
      .filter((e) =>
        e["dw_stato@OData.Community.Display.V1.FormattedValue"]
          ?.toUpperCase()
          .includes("ATTESA")
      )
      .reduce((sum, e) => {
        const details = timeFilteredDetails.filter(
          (d) => d._dw_notaspesa_value === e.dw_nota_speseid
        );

        return (
          sum +
          details.reduce(
            (s, d) => s + (d.dw_totalcost ?? d.dw_amount ?? 0),
            0
          )
        );
      }, 0);

    return { total, avg, pending: pendingTotal, count };
  }, [rawExpenses, timeFilteredDetails]);

  const trendData = useMemo(() => {
    const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"];

    return months.map((month, index) => {
      const detailsInMonth = timeFilteredDetails.filter((detail: any) => {
        const createdOn = new Date(detail.createdon);
        return createdOn.getMonth() === index;
      });

      const total = detailsInMonth.reduce(
        (sum, detail: any) =>
          sum + (detail.dw_totalcost ?? detail.dw_amount ?? 0),
        0
      );

      const count = detailsInMonth.length;

      return {
        name: month,
        total,
        avg: count > 0 ? total / count : 0,
      };
    });
  }, [timeFilteredDetails]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};

    timeFilteredDetails.forEach((d) => {
      const cat =
        d["dw_categoriadispesa@OData.Community.Display.V1.FormattedValue"] ||
        "Altro";

      categories[cat] =
        (categories[cat] || 0) + (d.dw_totalcost ?? d.dw_amount ?? 0);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [timeFilteredDetails]);

  const urgentCount = useMemo(() => {
    const today = new Date();

    const filteredNotaIds = new Set(
      timeFilteredDetails
        .map((detail: any) => detail._dw_notaspesa_value)
        .filter(Boolean)
    );

    return rawExpenses.filter((expense: any) => {
      if (!filteredNotaIds.has(expense.dw_nota_speseid)) return false;

      const status =
        expense["dw_stato@OData.Community.Display.V1.FormattedValue"]
          ?.toUpperCase() ?? "";

      const createdOn = new Date(expense.createdon);
      const diffDays =
        (today.getTime() - createdOn.getTime()) / (1000 * 60 * 60 * 24);

      return status.includes("ATTESA") && diffDays > 5;
    }).length;
  }, [rawExpenses, timeFilteredDetails]);

  const projectData = useMemo(() => {
    const projects: Record<
      string,
      {
        id: string;
        total: number;
        count: number;
        pendingAmount: number;
      }
    > = {};

    timeFilteredDetails.forEach((detail: any) => {
      const parentNotaId = detail._dw_notaspesa_value;

      const parentNota = rawExpenses.find(
        (expense: any) => expense.dw_nota_speseid === parentNotaId
      );

      const project =
        parentNota?.[
          "_dw_codicedicommessa_value@OData.Community.Display.V1.FormattedValue"
        ] ??
        parentNota?.[
          "dw_codicedicommessa@OData.Community.Display.V1.FormattedValue"
        ] ??
        detail[
          "_dw_codicedicommessa_value@OData.Community.Display.V1.FormattedValue"
        ] ??
        "Senza commessa";

      const status =
        parentNota?.["dw_stato@OData.Community.Display.V1.FormattedValue"] ??
        "Sconosciuto";

      const amount = detail.dw_totalcost ?? detail.dw_amount ?? 0;

      if (!projects[project]) {
        projects[project] = {
          id: project,
          total: 0,
          count: 0,
          pendingAmount: 0,
        };
      }

      projects[project].total += amount;
      projects[project].count += 1;

      if (status.toUpperCase().includes("ATTESA")) {
        projects[project].pendingAmount += amount;
      }
    });

    return Object.values(projects).sort((a, b) => b.total - a.total);
  }, [timeFilteredDetails, rawExpenses]);

  const COLORS = ["#E85C24", "#334155", "#94A3B8", "#FDBA74", "#1E293B"];

  if (loading) {
    return (
      <MainLayout activeTab="analytics" onNavigate={onNavigate}>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-slate-400 dark:text-slate-500">
          <Loader2 className="animate-spin text-[#E85C24]" size={40} />
          <p className="font-bold">Aggregazione dati in corso...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout activeTab="analytics" onNavigate={onNavigate}>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {error}
          </p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-[#E85C24] hover:text-[#E85C24] transition-all"
          >
            Riprova
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout activeTab="analytics" onNavigate={onNavigate}>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Spesa Totale
            </h2>

            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-slate-900 dark:text-slate-100">
                €{" "}
                {stats.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>

              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700">
                Live Dataverse
              </span>
            </div>
          </div>

          <div className="h-12 w-px bg-slate-100 dark:bg-slate-700 hidden lg:block" />

          <div className="space-y-1 text-right lg:text-left">
            <h2 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
              In Attesa
            </h2>
            <p className="text-2xl font-black text-orange-500">
              € {stats.pending.toLocaleString()}
            </p>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                size={16}
              />

              <select
                className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 outline-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="30">Ultimi 30 giorni</option>
                <option value="90">Ultimo Trimestre</option>
                <option value="365">Anno Corrente</option>
              </select>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Costo Medio Nota",
              val: `€ ${stats.avg.toFixed(0)}`,
              sub: "Calcolato dai dettagli",
              icon: DollarSign,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-950/30",
            },
            {
              label: "Note Processate",
              val: stats.count,
              sub: "Note Totali",
              icon: BarChart3,
              color: "text-green-500",
              bg: "bg-green-50 dark:bg-green-950/30",
            },
            {
              label: "Categoria Top",
              val: categoryData[0]?.name || "N/A",
              sub: "Per Importo",
              icon: TrendingUp,
              color: "text-orange-500",
              bg: "bg-orange-50 dark:bg-orange-950/30",
            },
            {
              label: "Urgenti",
              val: urgentCount,
              sub: "Oltre i 5 giorni",
              icon: AlertCircle,
              color: "text-red-500",
              bg: "bg-red-50 dark:bg-red-950/30",
            },
          ].map((m, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  {m.label}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {m.val}
                </p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                  {m.sub}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${m.bg} ${m.color} flex items-center justify-center shadow-inner`}
              >
                <m.icon size={24} />
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Trend di Spesa Semestrale
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">
                  Analisi dei costi mensili consolidati
                </p>
              </div>

              <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all">
                <BarChart3 size={18} />
              </button>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient
                      id="colorTotal"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#E85C24" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#E85C24" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(v: number) => `€${v / 1000}k`}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid rgb(226 232 240)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                    itemStyle={{ fontWeight: 900, color: "#E85C24" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#E85C24"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 flex flex-col">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                Distribuzione Categorie
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">
                Breakdown per tipologia di spesa
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 pt-4">
              {categoryData.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {c.name}
                    </span>
                  </div>

                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {stats.total > 0
                      ? ((c.value / stats.total) * 100).toFixed(0)
                      : "0"}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                Progetti con Maggiore Spese
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">
                Classifica per volume di spesa accumulato
              </p>
            </div>

            <button className="flex items-center gap-2 px-5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <Download size={14} /> Scarica Report CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/70 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-black border-b border-slate-100 dark:border-slate-700">
                  <th className="px-8 py-5">Codice Commessa</th>
                  <th className="px-6 py-5">Numero Dettagli</th>
                  <th className="px-6 py-5 text-right">Spesa Totale</th>
                  <th className="px-6 py-5">Stato</th>
                  <th className="px-8 py-5 text-center">Workflow</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectData.slice(0, 10).map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-[#E85C24] group-hover:underline underline-offset-4">
                        {row.id}
                      </span>
                    </td>

                    <td className="px-6 py-6 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {row.count} dettagli
                    </td>

                    <td className="px-6 py-6 text-sm font-black text-slate-900 dark:text-slate-100 text-right">
                      €{" "}
                      {row.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-6">
                      <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                        {row.pendingAmount > 0 ? "IN ATTESA" : "PROCESSATO"}
                      </span>
                    </td>

                    <td className="px-8 py-6 text-center">
                      {row.pendingAmount > 0 ? (
                        <Clock size={16} className="text-orange-400 mx-auto" />
                      ) : (
                        <CheckCircle2
                          size={16}
                          className="text-green-400 mx-auto"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;