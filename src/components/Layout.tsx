import React from 'react';
import { Shield, Bell } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const location = useLocation();

  const navLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/claims': 'My Claims',
    '/profile': 'Profile',
    '/insurance': 'Insurance',
    '/terms': 'Policy Conditions & Exclusions',
    '/support': 'Support',
    '/admin': 'Admin Dashboard',
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="h-16 bg-white border-b border-neutral-200 px-8 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-black text-neutral-900 tracking-tight">
          {navLabels[location.pathname] || 'GigShield'}
        </h1>
        <div className="flex items-center gap-4">
          <button className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-neutral-900">{profile?.fullName}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{profile?.role}</p>
            </div>
            <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 font-black border border-neutral-200">
              {profile?.fullName?.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;
