import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Claim, InsurancePolicy } from '../types';
import { 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  IndianRupee, 
  Clock, 
  CheckCircle2,
  CloudRain,
  Thermometer,
  Wind,
  FileText,
  User,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';
import Weather from "../weather"; // adjust path

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;

    const claimsQuery = query(
      collection(db, 'claims'),
      where('userId', '==', profile.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubClaims = onSnapshot(claimsQuery, (snap) => {
      setClaims(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim)));
    });

    const policyQuery = query(
      collection(db, 'policies'),
      where('userId', '==', profile.uid),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubPolicy = onSnapshot(policyQuery, (snap) => {
      if (!snap.empty) {
        setPolicy({ id: snap.docs[0].id, ...snap.docs[0].data() } as InsurancePolicy);
      }
    });

    return () => {
      unsubClaims();
      unsubPolicy();
    };
  }, [profile?.uid]);

  const stats = [
    { label: 'Total Earnings', value: '₹0', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Premium Paid', value: '₹0', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Claims', value: claims.filter(c => c.status === 'pending').length.toString(), icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Payouts Received', value: '₹0', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <Weather />

      {/* Welcome Section */}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Hello, {profile?.fullName.split(' ')[0]}!</h2>
          <p className="text-neutral-500">Here's what's happening with your ErgoShield insurance.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
            Active Plan: {profile?.subCategory} Plan
          </div>
          <div className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-bold text-sm">
            Risk Score: {profile?.riskScore}/100
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0 snap-x no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <button 
          onClick={() => navigate('/claims')}
          className="flex-shrink-0 w-[280px] md:w-auto snap-start group bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all text-left relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <FileText size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <FileText size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-neutral-900 mb-1 md:mb-2">Manage Claims</h3>
            <p className="text-neutral-500 text-xs md:text-sm font-medium">Track your active claims and file new ones instantly.</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className="flex-shrink-0 w-[280px] md:w-auto snap-start group bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all text-left relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <User size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <User size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-neutral-900 mb-1 md:mb-2">Your Profile</h3>
            <p className="text-neutral-500 text-xs md:text-sm font-medium">Update your personal details and platform preferences.</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/insurance')}
          className="flex-shrink-0 w-[280px] md:w-auto snap-start group bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl hover:border-emerald-600 transition-all text-left relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Shield size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <Shield size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-neutral-900 mb-1 md:mb-2">Insurance</h3>
            <p className="text-neutral-500 text-xs md:text-sm font-medium">Explore and activate your insurance coverage plans.</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/support')}
          className="flex-shrink-0 w-[280px] md:w-auto snap-start group bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl hover:border-purple-500 transition-all text-left relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-neutral-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <HelpCircle size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <HelpCircle size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-neutral-900 mb-1 md:mb-2">Help & Support</h3>
            <p className="text-neutral-500 text-xs md:text-sm font-medium">Get assistance with your policy or talk to our AI assistant.</p>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-neutral-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Policy Section */}
      {policy && (
        <div className="bg-emerald-900 text-white p-8 rounded-[40px] shadow-xl shadow-emerald-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Active Insurance Plan</h3>
              </div>
              <p className="text-emerald-100 font-medium max-w-md">
                Your ErgoShield insurance is currently active. You are covered for weather disruptions and platform outages.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 md:col-span-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Coverage Amount</p>
                <p className="text-2xl font-black">₹{policy.coverageAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Weekly Premium</p>
                <p className="text-2xl font-black">₹{policy.premiumAmount}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Valid From</p>
                <p className="text-lg font-bold">{new Date(policy.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Valid Until</p>
                <p className="text-lg font-bold">{new Date(policy.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Weather/Risk Section */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">Real-time Risk</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <CloudRain className="text-orange-600" />
                  <div>
                    <p className="font-bold text-orange-900">Heavy Rain Alert</p>
                    <p className="text-xs text-orange-700">Expected in 2 hours</p>
                  </div>
                </div>
                <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">High</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 flex items-center gap-2"><Thermometer size={16} /> Temperature</span>
                  <span className="font-bold text-neutral-900">34°C</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 flex items-center gap-2"><Wind size={16} /> Air Quality</span>
                  <span className="font-bold text-emerald-600">Good (42)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 flex items-center gap-2"><Clock size={16} /> Peak Hours</span>
                  <span className="font-bold text-neutral-900">6 PM - 10 PM</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center pt-4 md:pt-0 md:pl-8 md:border-l border-neutral-100">
              <p className="text-sm font-medium text-neutral-700 mb-3">Your Insurance Status</p>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
                <CheckCircle2 size={24} />
                Fully Covered
              </div>
              <p className="text-neutral-500 text-sm mt-2">ErgoShield is monitoring your location for any disruptions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Claims */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-neutral-900">Recent Claims</h3>
          <button className="text-emerald-600 font-bold text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-8 py-4">Trigger Event</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-neutral-400">No claims found</td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-8 py-5 font-bold text-neutral-900">{claim.triggerEvent}</td>
                    <td className="px-8 py-5 text-neutral-500">{new Date(claim.timestamp).toLocaleDateString()}</td>
                    <td className="px-8 py-5 font-bold text-neutral-900">₹{claim.amount}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        claim.status === 'processed' ? 'bg-emerald-100 text-emerald-700' :
                        claim.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
