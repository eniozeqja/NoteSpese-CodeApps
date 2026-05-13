/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  ClipboardCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Bell,
  HelpCircle,
  Search
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

/**
 * MainLayout Component
 * Updated: Sidebar color now matches the dashboard (slate-50/white base) to support future themes.
 * TopBar: Displays the page title "Note Spese - Operatore" instead of the search bar.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'approvals', label: 'Approvazioni', icon: ClipboardCheck },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Minimizable Sidebar - Updated to light theme colors */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-50 flex flex-col ${
          isMinimized ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 overflow-hidden shrink-0">
          <div className="w-9 h-9 bg-[#E85C24] rounded-lg flex items-center justify-center text-white shadow-md shrink-0 font-black tracking-tighter">
            AG
          </div>
          {!isMinimized && (
            <div className="ml-3 transition-opacity duration-300">
              <p className="text-sm font-black tracking-tight leading-none uppercase text-slate-800">AGIC Group</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1 uppercase">Expense Portal</p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-orange-50 text-[#E85C24] font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-[#E85C24]' : 'group-hover:scale-110 transition-transform'}`} />
                {!isMinimized && <span className="text-sm truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
          >
            {isMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isMinimized && <span className="font-bold text-sm">Riduci Menu</span>}
          </button>
          
          <button className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} />
            {!isMinimized && <span className="font-bold text-sm">Esci</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isMinimized ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Global TopBar - Updated with Page Title */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Note Spese - Operatore</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
               <button className="p-2 text-slate-400 hover:text-[#E85C24] hover:bg-orange-50 rounded-lg transition-all relative">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
               </button>
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                  <HelpCircle size={20} />
               </button>
            </div>

            <div className="flex items-center gap-3 pl-2">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-800 leading-none">Mario Rossi</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">OPERATORE</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-100 cursor-pointer">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mario" alt="Profile" />
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;