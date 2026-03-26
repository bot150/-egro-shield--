import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';

const plans = [
  {
    id: 'basic',
    name: 'Basic Shield',
    premium: 30,
    payout: 2000,
    duration: '7 days',
    tagline: 'Essential coverage for low-risk zones',
    target: 'Low-risk zones, part-time workers',
    savings: 600,
    recommended: false,
    color: 'emerald',
    icon: Shield
  },
  {
    id: 'standard',
    name: 'Standard Shield',
    premium: 50,
    payout: 5000,
    duration: '7 days',
    tagline: 'AI-recommended balanced protection',
    target: 'Medium-risk, regular delivery workers',
    savings: 1200,
    recommended: true,
    color: 'blue',
    icon: ShieldCheck
  },
  {
    id: 'premium',
    name: 'Premium Shield',
    premium: 70,
    payout: 10000,
    duration: '7 days',
    tagline: 'Maximum coverage for high-risk conditions',
    target: 'High-risk zones, full-time workers',
    savings: 2500,
    recommended: false,
    color: 'purple',
    icon: Zap
  }
];

const colorMap: Record<string, { border: string, bg: string, text: string, ring: string, shadow: string, from: string, to: string, hover: string, borderLight: string, darkBg: string }> = {
  emerald: { 
    border: 'border-emerald-500', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600', 
    ring: 'ring-emerald-50', 
    shadow: 'shadow-emerald-200',
    from: 'from-emerald-50/30',
    to: 'to-emerald-50/10',
    hover: 'hover:bg-emerald-700',
    borderLight: 'border-emerald-100',
    darkBg: 'bg-emerald-900'
  },
  blue: { 
    border: 'border-blue-500', 
    bg: 'bg-blue-50', 
    text: 'text-blue-600', 
    ring: 'ring-blue-50', 
    shadow: 'shadow-blue-200',
    from: 'from-blue-50/30',
    to: 'to-blue-50/10',
    hover: 'hover:bg-blue-700',
    borderLight: 'border-blue-100',
    darkBg: 'bg-blue-900'
  },
  purple: { 
    border: 'border-purple-500', 
    bg: 'bg-purple-50', 
    text: 'text-purple-600', 
    ring: 'ring-purple-50', 
    shadow: 'shadow-purple-200',
    from: 'from-purple-50/30',
    to: 'to-purple-50/10',
    hover: 'hover:bg-purple-700',
    borderLight: 'border-purple-100',
    darkBg: 'bg-purple-900'
  }
};

export const InsurancePage: React.FC = () => {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePayment = async (plan: typeof plans[0]) => {
    setLoading(true);
    setPayingPlanId(plan.id);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Get Razorpay Key & Create Order in parallel
      const [keyRes, orderRes] = await Promise.all([
        fetch('/api/payment/key').then(r => r.json()),
        fetch('/api/payment/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: plan.premium,
            receipt: `rcpt_${(profile?.uid || 'g').slice(0, 8)}_${Date.now()}`,
          }),
        })
      ]);

      if (keyRes.error) {
        setError(keyRes.error);
        setLoading(false);
        setPayingPlanId(null);
        return;
      }
      const { key } = keyRes;

      if (!orderRes.ok) throw new Error('Failed to create payment order');
      const order = await orderRes.json();

      // 2. Open Razorpay Checkout
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "ErgoShield Insurance",
        description: `${plan.name} - Weekly Premium`,
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            if (verifyRes.ok) {
              setSuccessMessage(`${plan.name} activated successfully! Your coverage is now active.`);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch {
            setError('Payment verification failed. Please try again.');
          }
          setLoading(false);
          setPayingPlanId(null);
        },
        prefill: {
          name: profile?.fullName || '',
          email: profile?.email || '',
          contact: profile?.phoneNumber || '',
        },
        theme: {
          color: "#059669",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPayingPlanId(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
        setPayingPlanId(null);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setError('Failed to initiate payment. Please try again.');
      setLoading(false);
      setPayingPlanId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tighter text-neutral-900 mb-2">Insurance Plans</h2>
        <p className="text-neutral-500 font-medium">Choose the best protection plan for your gig work.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 font-bold text-xs">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 font-bold text-xs">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-col">
            <button
              onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
              className={`group relative bg-white p-8 rounded-[32px] border-2 transition-all text-left h-full flex flex-col ${
                selectedPlan === plan.id 
                  ? `${colorMap[plan.color].border} shadow-xl ring-4 ${colorMap[plan.color].ring}` 
                  : 'border-neutral-100 hover:border-neutral-200 shadow-sm'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Recommended
                </div>
              )}
              <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 ${colorMap[plan.color].bg} ${colorMap[plan.color].text} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <plan.icon size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">Weekly Premium</p>
                  <p className="text-4xl font-display tracking-tighter text-neutral-900">₹{plan.premium}</p>
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-2xl font-black uppercase tracking-tighter text-neutral-900 mb-2">{plan.name}</h4>
                <p className="text-neutral-500 text-sm font-medium leading-relaxed">{plan.tagline}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-50 flex items-center justify-between text-neutral-400 group-hover:text-neutral-900 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">View Full Details</span>
                {selectedPlan === plan.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: 20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            {(() => {
              const plan = plans.find(p => p.id === selectedPlan)!;
              const colors = colorMap[plan.color];
              const isPayingThis = payingPlanId === plan.id;
              return (
                <div className={`relative bg-gradient-to-br from-white ${colors.from} rounded-[40px] border-2 ${colors.borderLight} shadow-2xl overflow-hidden`}>
                  {/* Top Header */}
                  <div className={`bg-neutral-900/5 px-10 py-4 flex items-center justify-between border-b ${colors.borderLight}`}>
                    <div className="flex items-center gap-3">
                      <span className={`${colors.bg} ${colors.text} text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm`}>
                        No income proof required
                      </span>
                      <span className="bg-white/80 text-neutral-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-neutral-100">
                        Instant Activation
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <plan.icon size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{plan.name}</span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                    {/* Left: Main Stat */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Max Weekly Payout</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-neutral-900 tracking-tight">₹{plan.payout.toLocaleString()}</span>
                        <span className="text-neutral-400 font-bold">/week</span>
                      </div>
                      <p className="text-base font-medium text-neutral-500">Comprehensive coverage for up to {plan.duration}.</p>
                    </div>

                    {/* Middle: Features */}
                    <div className="space-y-5">
                      {[
                        'Weather-based automatic payout',
                        'Instant claim processing (24/7)',
                        'No income proof or documentation',
                        'Platform outage protection'
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className={`w-6 h-6 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center shadow-sm`}>
                            <CheckCircle2 size={14} />
                          </div>
                          <p className="text-base font-bold text-neutral-700">{feature}</p>
                        </div>
                      ))}
                    </div>

                    {/* Right: CTA */}
                    <div className="flex flex-col gap-6">
                      <div className={`p-6 rounded-[24px] ${colors.bg} border ${colors.borderLight} shadow-sm`}>
                        <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2">Ideal For</p>
                        <p className={`text-base font-bold ${colors.text} leading-snug`}>{plan.target}</p>
                      </div>
                      <button
                        onClick={() => handlePayment(plan)}
                        disabled={loading}
                        className={`w-full py-5 rounded-[24px] bg-neutral-900 text-white font-black text-lg ${colors.hover} transition-all flex items-center justify-center gap-3 group/btn shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      >
                        {isPayingThis ? (
                          <>
                            <Loader2 size={22} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Activate {plan.name}
                            <ArrowRight size={22} className="group-hover/btn:translate-x-1.5 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className={`bg-neutral-50/50 px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-t ${colors.borderLight}`}>
                    <div className="flex flex-wrap items-center gap-8">
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={16} className="text-emerald-500" />
                        <span className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">
                          Save ₹{plan.savings} vs income loss
                        </span>
                      </div>
                      <button className="text-[11px] font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors underline underline-offset-4">
                        View Policy Document
                      </button>
                    </div>
                    {plan.recommended && (
                      <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                          Best fit for your risk score
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Table or Extra Info */}
      <div className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm">
        <h3 className="text-2xl font-black text-neutral-900 mb-8 tracking-tight">Why choose ErgoShield?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center">
              <Zap size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Instant Payouts</h4>
            <p className="text-neutral-500 text-sm font-medium leading-relaxed">No waiting for weeks. Our AI triggers payouts the moment a disruption is detected.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Full Transparency</h4>
            <p className="text-neutral-500 text-sm font-medium leading-relaxed">Know exactly what you're paying for. No hidden clauses or complex legal jargon.</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Gig-First Design</h4>
            <p className="text-neutral-500 text-sm font-medium leading-relaxed">Built specifically for delivery partners, ride-share drivers, and freelance workers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
