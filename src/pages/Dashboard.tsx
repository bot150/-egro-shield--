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
  ArrowRight,
  Loader2,
  AlertTriangle,
  Gift
} from 'lucide-react';
import { WeatherWidget } from '../components/WeatherWidget';
import { WeatherData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);

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

  const handlePayment = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get Razorpay Key & Create Order
      const [keyRes, orderRes] = await Promise.all([
        fetch('/api/payment/key').then(r => r.json()),
        fetch('/api/payment/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: profile.weeklyPremium || 50,
            receipt: `rcpt_${profile.uid.slice(0, 8)}_${Date.now()}`,
          }),
        })
      ]);

      if (keyRes.error) {
        setError(keyRes.error);
        setLoading(false);
        return;
      }
      const { key } = keyRes;

      if (!orderRes.ok) throw new Error('Failed to create order');
      const order = await orderRes.json();

      // 3. Open Razorpay
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "ErgoShield Insurance",
        description: "Weekly Premium Payment",
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });

          if (verifyRes.ok) {
            // Update policy end date or create new one
            alert('Payment successful! Your coverage has been extended.');
          } else {
            setError('Payment verification failed.');
          }
        },
        prefill: {
          name: profile.fullName,
          email: profile.email,
          contact: profile.phoneNumber,
        },
        theme: {
          color: "#059669",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setError('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Earnings', value: '₹0', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Premium Paid', value: '₹0', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Claims', value: claims.filter(c => c.status === 'pending').length.toString(), icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Payouts Received', value: '₹0', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tighter text-neutral-900 mb-2">Hello, {profile?.fullName.split(' ')[0]}!</h2>
          <p className="text-neutral-500 font-medium">Here's what's happening with your ErgoShield insurance.</p>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-500 text-xs font-bold">{error}</span>}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border-2 border-neutral-100 shadow-sm">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">
              {profile?.subCategory} Plan
            </div>
            <div className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">
              Risk Score: {profile?.riskScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Weather & Compensation Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WeatherWidget onWeatherUpdate={setWeather} />
        </div>
        
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {weather?.isRisk ? (
              <motion.div 
                key="hazard-active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full bg-gradient-to-br from-red-600 to-orange-600 rounded-[32px] p-6 text-white shadow-xl shadow-orange-100 relative overflow-hidden flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Zap className="text-white fill-white" size={20} />
                    </div>
                    <h3 className="text-2xl font-display uppercase tracking-tighter leading-tight">Hazard Active</h3>
                  </div>
                  <p className="text-orange-50 text-xs font-medium mb-4">
                    Severe weather in {weather.city}. Hazard pay active.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                      <TrendingUp size={12} />
                      +₹25/hr
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="hazard-inactive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full bg-white rounded-[32px] p-6 text-neutral-900 border border-neutral-100 shadow-sm relative overflow-hidden flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="text-emerald-600" size={20} />
                    </div>
                    <h3 className="text-2xl font-display uppercase tracking-tighter">Status: Optimal</h3>
                  </div>
                  <p className="text-neutral-500 text-xs font-medium mb-4">
                    Conditions in {weather?.city || 'your area'} are safe.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                      <CheckCircle2 size={14} />
                      Monitoring
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          <div key={i} className="bg-white p-6 rounded-3xl border-2 border-neutral-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className="text-4xl font-display tracking-tighter text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Policy Section */}
      {policy && (
        <div className="bg-neutral-900 text-white p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-3xl font-display uppercase tracking-tighter">Active Shield</h3>
              </div>
              <p className="text-neutral-400 font-medium max-w-md text-lg leading-relaxed">
                Your earnings are protected. You are fully covered for severe weather and gig platform disruptions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:col-span-2 self-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2">Coverage</p>
                <p className="text-3xl font-display tracking-tighter text-emerald-400">₹{policy.coverageAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2">Premium</p>
                <p className="text-3xl font-display tracking-tighter">₹{policy.premiumAmount}<span className="text-sm text-neutral-500 font-bold ml-1">/wk</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2">Valid From</p>
                <p className="text-base font-bold text-neutral-200">{new Date(policy.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2">Valid Until</p>
                <p className="text-base font-bold text-neutral-200">{new Date(policy.endDate).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2 mt-2">
                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-neutral-900 transition-all shadow-xl shadow-emerald-900/40 disabled:opacity-50 group/btn"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="group-hover/btn:text-emerald-500" />}
                  Renew Shield (₹{policy.premiumAmount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Claims */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <h3 className="text-2xl font-display uppercase tracking-tighter text-neutral-900">Claim History</h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Trigger Event</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
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
