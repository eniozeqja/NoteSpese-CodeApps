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

interface SidebarProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

/**
 * AGIC Group Sidebar Component
 * Features:
 * - Minimizable state (collapsed/expanded)
 * - Brand-aligned styling (Agile Orange)
 * - Enterprise navigation items
 */
const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 ease-in-out z-50 flex flex-col ${
        isMinimized ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header / Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 overflow-hidden shrink-0">
        <div className="w-9 h-9 bg-[#E85C24] rounded-lg flex items-center justify-center text-white shadow-lg shrink-0">
          <span className="text-lg font-black tracking-tighter">AG</span>
        </div>
        {!isMinimized && (
          <div className="ml-3 transition-opacity duration-300">
            <p className="text-sm font-black tracking-tight leading-none uppercase">AGIC Group</p>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">EXPENSE PORTAL</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[#E85C24] text-white shadow-lg shadow-orange-900/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={`shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
              {!isMinimized && <span className="font-bold text-sm truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / Controls */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          {isMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isMinimized && <span className="font-bold text-sm">Riduci Menu</span>}
        </button>
        
        <button className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-2">
          <LogOut size={20} />
          {!isMinimized && <span className="font-bold text-sm">Esci</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
