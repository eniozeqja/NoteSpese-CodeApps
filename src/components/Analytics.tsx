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

const COLORS = ["#E85C24", "#334155", "#94A3B8", "#FDBA74", "#1E293B"];

const ANALYTICS_INCLUDED_STATUSES = [
  "IN ATTESA DI APPROVAZIONE",
  "APPROVATA",
  "RIFIUTATA",
  "COMPLETATA",
];

function getFormattedValue(record: any, field: string): string {
  return (
    record[`${field}@OData.Community.Display.V1.FormattedValue`] ??
    record[`_${field}_value@OData.Community.Display.V1.FormattedValue`] ??
    "—"
  );
}

function getNotaStatus(nota: any): string {
  return (
    nota?.["dw_stato@OData.Community.Display.V1.FormattedValue"] ?? ""
  ).toUpperCase();
}

function getDetailAmount(detail: any): number {
  const amount = detail.dw_totalcost ?? detail.dw_amount ?? 0;
  return Number(amount) || 0;
}

function getDetailDate(detail: any): Date | null {
  const dateValue = detail.dw_transactiondate ?? detail.createdon;

  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("it-IT", {
    month: "short",
    year: "2-digit",
  });
}

const analyticsTooltipStyle = {
  borderRadius: "16px",
  border: "1px solid rgb(51 65 85)",
  backgroundColor: "rgb(15 23 42)",
  color: "rgb(248 250 252)",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.25)",
  padding: "12px",
};

const analyticsTooltipLabelStyle = {
  color: "rgb(248 250 252)",
  fontWeight: 900,
  marginBottom: "6px",
};

const analyticsTooltipItemStyle = {
  color: "#FDBA74",
  fontWeight: 900,
};

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
        (expensesRes as any)?.data ?? (expensesRes as any)?.value ?? [],
      );

      setRawDetails(
        (detailsRes as any)?.data ?? (detailsRes as any)?.value ?? [],
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

  const expensesById = useMemo(() => {
    const map = new Map<string, any>();

    rawExpenses.forEach((expense: any) => {
      if (expense.dw_nota_speseid) {
        map.set(expense.dw_nota_speseid, expense);
      }
    });

    return map;
  }, [rawExpenses]);

  const analyticsDetails = useMemo(() => {
    return rawDetails.filter((detail: any) => {
      const parentNota = expensesById.get(detail._dw_notaspesa_value);

      if (!parentNota) return false;

      const status = getNotaStatus(parentNota);

      return ANALYTICS_INCLUDED_STATUSES.includes(status);
    });
  }, [rawDetails, expensesById]);

  const searchedDetails = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return analyticsDetails;

    return analyticsDetails.filter((detail: any) => {
      const parentNota = expensesById.get(detail._dw_notaspesa_value);

      const project =
        parentNota?.[
          "_dw_codicedicommessa_value@OData.Community.Display.V1.FormattedValue"
        ] ??
        parentNota?.[
          "dw_codicedicommessa@OData.Community.Display.V1.FormattedValue"
        ] ??
        "";

      const employee =
        parentNota?.[
          "_dw_dipendente_value@OData.Community.Display.V1.FormattedValue"
        ] ?? "";

      const detailName = detail.dw_name ?? "";
      const notaName = parentNota?.dw_name ?? "";

      return (
        project.toLowerCase().includes(q) ||
        employee.toLowerCase().includes(q) ||
        detailName.toLowerCase().includes(q) ||
        notaName.toLowerCase().includes(q)
      );
    });
  }, [analyticsDetails, expensesById, searchTerm]);

  const timeFilteredDetails = useMemo(() => {
    const days = Number(timeRange);
    const now = new Date();
    const minDate = new Date();

    minDate.setDate(now.getDate() - days);
    minDate.setHours(0, 0, 0, 0);

    return searchedDetails.filter((detail: any) => {
      const detailDate = getDetailDate(detail);

      if (!detailDate) return false;

      return detailDate >= minDate && detailDate <= now;
    });
  }, [searchedDetails, timeRange]);

  const filteredNotaIds = useMemo(() => {
    return new Set(
      timeFilteredDetails
        .map((detail: any) => detail._dw_notaspesa_value)
        .filter(Boolean),
    );
  }, [timeFilteredDetails]);

  const stats = useMemo(() => {
    if (!timeFilteredDetails.length) {
      return { total: 0, avg: 0, pending: 0, count: 0 };
    }

    const total = timeFilteredDetails.reduce(
      (sum, detail) => sum + getDetailAmount(detail),
      0,
    );

    const count = filteredNotaIds.size;
    const avg = count > 0 ? total / count : 0;

    const pendingTotal = timeFilteredDetails.reduce((sum, detail: any) => {
      const parentNota = expensesById.get(detail._dw_notaspesa_value);
      const status = getNotaStatus(parentNota);

      if (status.includes("ATTESA")) {
        return sum + getDetailAmount(detail);
      }

      return sum;
    }, 0);

    return {
      total,
      avg,
      pending: pendingTotal,
      count,
    };
  }, [timeFilteredDetails, filteredNotaIds, expensesById]);

  const trendData = useMemo(() => {
    const buckets: Record<
      string,
      {
        name: string;
        total: number;
        count: number;
      }
    > = {};

    timeFilteredDetails.forEach((detail: any) => {
      const detailDate = getDetailDate(detail);

      if (!detailDate) return;

      const key = getMonthKey(detailDate);
      const name = getMonthLabel(detailDate);

      if (!buckets[key]) {
        buckets[key] = {
          name,
          total: 0,
          count: 0,
        };
      }

      buckets[key].total += getDetailAmount(detail);
      buckets[key].count += 1;
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, bucket]) => ({
        name: bucket.name,
        total: bucket.total,
        avg: bucket.count > 0 ? bucket.total / bucket.count : 0,
      }));
  }, [timeFilteredDetails]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};

    timeFilteredDetails.forEach((detail: any) => {
      const category =
        detail[
          "dw_categoriadispesa@OData.Community.Display.V1.FormattedValue"
        ] ??
        detail[
          "dw_categoriadispesa@OData.Community.Display.V1.FormattedValue"
        ] ??
        "Altro";

      categories[category] =
        (categories[category] || 0) + getDetailAmount(detail);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [timeFilteredDetails]);

  const urgentCount = useMemo(() => {
    const today = new Date();

    return rawExpenses.filter((expense: any) => {
      if (!filteredNotaIds.has(expense.dw_nota_speseid)) return false;

      const status = getNotaStatus(expense);

      const createdOn = new Date(expense.createdon);

      if (Number.isNaN(createdOn.getTime())) return false;

      const diffDays =
        (today.getTime() - createdOn.getTime()) / (1000 * 60 * 60 * 24);

      return status.includes("ATTESA") && diffDays > 5;
    }).length;
  }, [rawExpenses, filteredNotaIds]);

  const projectData = useMemo(() => {
    const projects: Record<
      string,
      {
        id: string;
        total: number;
        count: number;
        pendingAmount: number;
        noteIds: Set<string>;
      }
    > = {};

    timeFilteredDetails.forEach((detail: any) => {
      const parentNotaId = detail._dw_notaspesa_value;
      const parentNota = expensesById.get(parentNotaId);

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

      const status = getNotaStatus(parentNota);
      const amount = getDetailAmount(detail);

      if (!projects[project]) {
        projects[project] = {
          id: project,
          total: 0,
          count: 0,
          pendingAmount: 0,
          noteIds: new Set<string>(),
        };
      }

      projects[project].total += amount;
      projects[project].count += 1;

      if (parentNotaId) {
        projects[project].noteIds.add(parentNotaId);
      }

      if (status.includes("ATTESA")) {
        projects[project].pendingAmount += amount;
      }
    });

    return Object.values(projects)
      .map((project) => ({
        id: project.id,
        total: project.total,
        count: project.count,
        noteCount: project.noteIds.size,
        pendingAmount: project.pendingAmount,
      }))
      .sort((a, b) => b.total - a.total);
  }, [timeFilteredDetails, expensesById]);

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
      <div className="space-y-8 max-w-[1400px] ml-28 mt-10 ">
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
                  maximumFractionDigits: 2,
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
              €{" "}
              {stats.pending.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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

          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cerca per commessa, dipendente o dettaglio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-[#E85C24] focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/30 transition-all"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Costo Medio Nota",
              val: `€ ${stats.avg.toFixed(0)}`,
              sub: "Media per nota nel periodo",
              icon: DollarSign,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-950/30",
            },
            {
              label: "Note nel periodo",
              val: stats.count,
              sub: "Note con dettagli filtrati",
              icon: BarChart3,
              color: "text-green-500",
              bg: "bg-green-50 dark:bg-green-950/30",
            },
            {
              label: "Categoria Top",
              val: categoryData[0]?.name || "N/A",
              sub: "Per importo",
              icon: TrendingUp,
              color: "text-orange-500",
              bg: "bg-orange-50 dark:bg-orange-950/30",
            },
            {
              label: "Urgenti",
              val: urgentCount,
              sub: "In attesa da oltre 5 giorni",
              icon: AlertCircle,
              color: "text-red-500",
              bg: "bg-red-50 dark:bg-red-950/30",
            },
          ].map((metric, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  {metric.label}
                </p>

                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {metric.val}
                </p>

                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                  {metric.sub}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${metric.bg} ${metric.color} flex items-center justify-center shadow-inner`}
              >
                <metric.icon size={24} />
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Trend di Spesa
                </h3>

                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">
                  Basato sulla data transazione dei dettagli
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
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(value: number) => `€${value / 1000}k`}
                  />

                  <Tooltip
                    contentStyle={analyticsTooltipStyle}
                    labelStyle={analyticsTooltipLabelStyle}
                    itemStyle={analyticsTooltipItemStyle}
                    formatter={(value: any) => [
                      `€ ${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                      "Spesa totale",
                    ]}
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
              {categoryData.length === 0 ? (
                <p className="text-sm font-bold text-slate-400">
                  Nessun dato disponibile
                </p>
              ) : (
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

                    <Tooltip
                      contentStyle={analyticsTooltipStyle}
                      labelStyle={analyticsTooltipLabelStyle}
                      itemStyle={analyticsTooltipItemStyle}
                      formatter={(value: any) => [
                        `€ ${Number(value).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                        "Importo",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-3 pt-4">
              {categoryData.slice(0, 3).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />

                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {category.name}
                    </span>
                  </div>

                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {stats.total > 0
                      ? ((category.value / stats.total) * 100).toFixed(0)
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
                Progetti con Maggiori Spese
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
                  <th className="px-6 py-5">Numero Note</th>
                  <th className="px-6 py-5 text-right">Spesa Totale</th>
                  <th className="px-6 py-5">Stato</th>
                  <th className="px-8 py-5 text-center">Workflow</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectData.slice(0, 10).map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-[#E85C24] group-hover:underline underline-offset-4">
                        {row.id}
                      </span>
                    </td>

                    <td className="px-6 py-6 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {row.count} dettagli
                    </td>

                    <td className="px-6 py-6 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {row.noteCount} note
                    </td>

                    <td className="px-6 py-6 text-sm font-black text-slate-900 dark:text-slate-100 text-right">
                      €{" "}
                      {row.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
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
