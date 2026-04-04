import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  ClipboardList, 
  AlertTriangle, 
  BarChart2, 
  ClipboardCheck, 
  Users, 
  Map, 
  IndianRupee, 
  Zap, 
  UserCircle, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { useClaims } from '../ClaimsContext';
import { motion, AnimatePresence } from 'motion/react';

export const Sidebar: React.FC = () => {
  const { user, profile } = useAuth();
  const { claims, triggerDisruption } = useClaims();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hide sidebar on landing page or if not logged in
  if (!user && location.pathname === '/') return null;
  if (!user && location.pathname === '/login') return null;
  if (!user && location.pathname === '/signup') return null;

  const isAdmin = profile?.role === 'admin';
  const isWorker = profile?.role === 'worker';

  const pendingManualReviewCount = claims.filter(c => c.status === 'needs_manual_review').length;
  const workerPendingClaimsCount = claims.filter(c => 
    c.userId === profile?.uid && (c.status === 'pending_auto' || c.status === 'needs_manual_review')
  ).length;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', show: true },
    { icon: FileText, label: 'Claims', path: '/claims', show: true },
    { icon: UserCircle, label: 'Profile', path: '/profile', show: true },
    { icon: Shield, label: 'Insurance', path: '/insurance', show: true },
    { icon: FileText, label: 'Conditions', path: '/terms', show: true },
    { icon: HelpCircle, label: 'Support', path: '/support', show: true },
  ];

  const activeAlert = claims?.find(c => c.status === 'pending_auto') || null;

  return (
    <div 
      className={`bg-white border-r border-neutral-100 flex flex-col transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-white border border-neutral-200 rounded-full p-1 shadow-sm z-50 hover:bg-neutral-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Branding */}
      <div className={`p-8 mb-4 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-100">
          <Shield size={22} />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-2xl font-black tracking-tight text-neutral-900 block leading-none">ErgoShield</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 no-scrollbar">
        {navItems.map((item) => (
          item.show && (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${
                location.pathname === item.path
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <item.icon size={22} className={`shrink-0 ${location.pathname === item.path ? 'text-emerald-600' : 'group-hover:text-neutral-900'}`} />
              {!isCollapsed && (
                <span className="text-base flex-1 truncate tracking-tight">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1.5 bg-neutral-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          )
        ))}
      </div>

      {/* Bottom Section - Minimal Logout */}
      <div className="p-6 border-t border-neutral-50">
        <button 
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-bold">Logout</span>}
        </button>
      </div>
    </div>
  );
};
