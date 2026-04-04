import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Loader2,
  Activity,
  Wind,
  ShieldAlert,
  Lock,
  X,
  Users,
  MapPin,
  Globe,
  AlertTriangle,
  CloudRain,
  Biohazard,
  Cloud,
  Move,
  Thermometer,
  Ban,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { PolicyTemplate, CoveredEvent, WeatherData } from '../types';
import { calculateRiskScore, calculateDynamicPremium } from '../services/riskService';

const EVENT_DISPLAY_NAMES: Record<CoveredEvent, string> = {
  rains_floods_cyclones: 'Rains, Floods, Cyclones',
  wars: 'Wars',
  pandemic: 'Pandemic',
  strikes: 'Strikes',
  lockdown: 'Lockdown',
  aqi: 'AQI',
  refuge_migration: 'Refuge and Migration',
  global_recession: 'Global Recession',
  extreme_temperature: 'Extreme Temperature',
  curfews_transport_bans: 'Curfews and Transport Bans (Bharath Band)',
};

import { getAIRiskAssessment, RiskAssessment } from '../services/geminiService';

const EVENT_ICONS: Record<CoveredEvent, any> = {
  rains_floods_cyclones: CloudRain,
  wars: ShieldAlert,
  pandemic: Biohazard,
  strikes: Users,
  lockdown: Lock,
  aqi: Cloud,
  refuge_migration: Move,
  global_recession: TrendingDown,
  extreme_temperature: Thermometer,
  curfews_transport_bans: Ban,
};

const colorMap: Record<string, { border: string, bg: string, text: string, ring: string, shadow: string, from: string, to: string, hover: string, borderLight: string, darkBg: string }> = {
  low: { 
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
  medium: { 
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
  high: { 
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

const EVENT_COVERAGE: Record<CoveredEvent, number> = {
  rains_floods_cyclones: 0.7,
  wars: 0.8,
  pandemic: 0.6,
  strikes: 0.6,
  lockdown: 0.75,
  aqi: 0.4,
  refuge_migration: 0.4,
  global_recession: 0.5,
  extreme_temperature: 0.6,
  curfews_transport_bans: 0.7,
};

const HOURLY_INCOME = 90; // Default average hourly income

export const Insurance: React.FC = () => {
  const { user, profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ status: string; message: string } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [policies, setPolicies] = useState<PolicyTemplate[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [riskScore, setRiskScore] = useState(50);
  const [activeTab, setActiveTab] = useState<'browse' | 'dashboard'>('browse');
  const [userPolicies, setUserPolicies] = useState<any[]>([]);
  const [userClaims, setUserClaims] = useState<any[]>([]);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [activeDisruptions, setActiveDisruptions] = useState<any[]>([]);
  const [riskFactors, setRiskFactors] = useState<any[]>([]);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [aiAssessment, setAiAssessment] = useState<RiskAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch User Policies
    const qPolicies = query(collection(db, 'policies'), where('userId', '==', user.uid));
    const unsubUserPolicies = onSnapshot(qPolicies, (snap) => {
      setUserPolicies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'policies');
    });

    // Fetch User Claims
    const qClaims = query(collection(db, 'claims'), where('userId', '==', user.uid));
    const unsubUserClaims = onSnapshot(qClaims, (snap) => {
      setUserClaims(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'claims');
    });

    // Fetch User Payments
    const qPayments = query(collection(db, 'premium_payments'), where('userId', '==', user.uid));
    const unsubUserPayments = onSnapshot(qPayments, (snap) => {
      setUserPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'premium_payments');
    });

    // Fetch Risk Factors
    const unsubRiskFactors = onSnapshot(collection(db, 'risk_factors'), (snap) => {
      setRiskFactors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'risk_factors');
    });

    // Fetch Active Disruptions
    const qDisruptions = query(collection(db, 'disruptions'), where('status', '==', 'active'));
    const unsubDisruptions = onSnapshot(qDisruptions, (snap) => {
      setActiveDisruptions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'disruptions');
    });

    return () => {
      unsubUserPolicies();
      unsubUserClaims();
      unsubUserPayments();
      unsubRiskFactors();
      unsubDisruptions();
    };
  }, [user]);

  useEffect(() => {
    // Fetch Policy Templates
    const unsubPolicies = onSnapshot(collection(db, 'policy_templates'), (snap) => {
      const allPolicies = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PolicyTemplate));
      // STRICT FILTER: Only show the two target GigShield plans and ensure uniqueness by name
      const targetNames = ['GigShield Standard', 'GigShield Pro'];
      
      const uniquePoliciesMap = new Map<string, PolicyTemplate>();
      allPolicies.forEach(p => {
        if (targetNames.includes(p.name) && !uniquePoliciesMap.has(p.name)) {
          uniquePoliciesMap.set(p.name, p);
        }
      });
      
      setPolicies(Array.from(uniquePoliciesMap.values()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'policy_templates');
    });

    // Fetch Weather for Risk Assessment
    const fetchWeather = async () => {
      try {
        const location = profile?.location || 'Mumbai';
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=bd5e378503939ddaee76f12ad7a97608`);
        const data = await res.json();
        
        if (data.cod !== 200) throw new Error(data.message);

        const weatherData: WeatherData = {
          city: data.name,
          temp: data.main.temp,
          condition: data.weather[0].main,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          icon: data.weather[0].icon,
          isRisk: data.weather[0].main === 'Rain' || data.weather[0].main === 'Thunderstorm' || data.main.temp > 35,
          lastUpdated: new Date().toISOString()
        };
        setWeather(weatherData);
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    };

    fetchWeather();
    fetch('/api/payment/verify-config')
      .then(res => res.json())
      .then(data => setPaymentStatus(data))
      .catch(err => console.error("Failed to check payment status", err));

    // Seed initial policies if none exist
    const seedInitialPolicies = async () => {
      const snap = await getDocs(collection(db, 'policy_templates'));
      const existingDocs = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      
      const targetPolicyNames = ['GigShield Standard', 'GigShield Pro'];
      
      // 1. Aggressively cleanup any policy that isn't one of the two target plans
      // OR any duplicate of the target plans
      const seenNames = new Set<string>();
      for (const docInfo of existingDocs) {
        if (!targetPolicyNames.includes(docInfo.name) || seenNames.has(docInfo.name)) {
          try {
            await deleteDoc(doc(db, 'policy_templates', docInfo.id));
          } catch (err) {
            console.error("Failed to delete old or duplicate policy", err);
          }
        } else {
          seenNames.add(docInfo.name);
        }
      }

      // 2. Add missing target plans
      const initialPolicies: Partial<PolicyTemplate>[] = [
        {
          name: 'GigShield Standard',
          coverageType: 'Parametric',
          coveredEvents: ['rains_floods_cyclones', 'extreme_temperature', 'aqi', 'strikes', 'lockdown'],
          coverageLimit: 10000,
          basePremium: 70,
          durationDays: 7,
          riskCategory: 'medium',
          description: 'Balanced protection with automatic payouts based on income loss formula.',
          termsAndConditions: ['Payout = Lost Hours × ₹90 × Coverage %', 'Max weekly payout = 4x Premium'],
          verificationRules: ['Hyper-local weather data verification', 'Platform disruption validation'],
          createdAt: new Date().toISOString()
        },
        {
          name: 'GigShield Pro',
          coverageType: 'Comprehensive',
          coveredEvents: ['rains_floods_cyclones', 'wars', 'pandemic', 'strikes', 'lockdown', 'aqi', 'refuge_migration', 'global_recession', 'extreme_temperature', 'curfews_transport_bans'],
          coverageLimit: 50000,
          basePremium: 50,
          durationDays: 7,
          riskCategory: 'high',
          description: 'Full-spectrum protection including civil unrest and economic recession.',
          termsAndConditions: ['Payout = Lost Hours × ₹90 × Coverage %', 'Max weekly payout = 4x Premium'],
          verificationRules: ['Multi-source AI verification'],
          createdAt: new Date().toISOString()
        }
      ];

      for (const policy of initialPolicies) {
        const existing = snap.docs.find(d => d.data().name === policy.name);
        if (!existing) {
          await addDoc(collection(db, 'policy_templates'), policy);
        } else if (existing.data().basePremium !== policy.basePremium) {
          // Update premium if it changed
          await updateDoc(doc(db, 'policy_templates', existing.id), { basePremium: policy.basePremium });
        }
      }
      // 3. Seed initial risk factors if none exist
      const snapRiskFactors = await getDocs(collection(db, 'risk_factors'));
      if (snapRiskFactors.empty) {
        const initialRisks = [
          { type: 'aqi_pollution', value: 124, threshold: 100, status: 'warning', timestamp: new Date().toISOString() },
          { type: 'rain_flood', value: 'Light Rain', threshold: 'Heavy Rain', status: 'stable', timestamp: new Date().toISOString() },
          { type: 'lockdown_curfew', value: 'None', threshold: 'Active', status: 'stable', timestamp: new Date().toISOString() }
        ];
        for (const r of initialRisks) {
          await addDoc(collection(db, 'risk_factors'), r);
        }
      }
    };

    seedInitialPolicies();
    return () => unsubPolicies();
  }, []);

  useEffect(() => {
    if (profile) {
      const score = calculateRiskScore(profile, weather);
      setRiskScore(score);
    }
  }, [profile, weather]);

  const handleFileClaim = async (disruption: any, policy: any) => {
    if (!user) return;
    setIsClaiming(disruption.id);
    try {
      // 1. Calculate Lost Hours (Mocked for now based on disruption severity)
      // In a real app, this would come from a platform API or worker logs
      const lostHours = disruption.severity === 'high' ? 5 : disruption.severity === 'medium' ? 3 : 1;
      
      // 2. Get Coverage % for the event
      const coverage = EVENT_COVERAGE[disruption.type as CoveredEvent] || 0.5;
      
      // 3. Apply Base Income Loss Formula
      // Payout = Lost Hours × Average Hourly Income × Coverage %
      let payoutAmount = lostHours * HOURLY_INCOME * coverage;
      
      // 4. Apply Company Profit Protection Rule
      // Maximum payout per week = 4 × weekly premium
      const weeklyPremium = policy.premiumAmount || 50;
      const maxWeeklyPayout = 4 * weeklyPremium;
      
      // Check total claims for this policy in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentClaims = userClaims.filter(c => 
        c.policyId === (policy.templateId || policy.id) && 
        new Date(c.timestamp) > sevenDaysAgo &&
        c.status === 'processed'
      );
      
      const totalRecentPayout = recentClaims.reduce((sum, c) => sum + c.amount, 0);
      
      if (totalRecentPayout + payoutAmount > maxWeeklyPayout) {
        payoutAmount = Math.max(0, maxWeeklyPayout - totalRecentPayout);
        if (payoutAmount === 0) {
          toast.error('Weekly payout limit reached (Profit Protection Rule)');
          return;
        }
        toast.warning(`Payout capped at ₹${payoutAmount} due to weekly limit.`);
      }

      // AI Verification Simulation
      toast.info('AI is verifying your claim against live data...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await addDoc(collection(db, 'claims'), {
        userId: user.uid,
        userName: profile?.fullName || 'Worker',
        policyId: policy.templateId || policy.id,
        policyName: policy.policyName,
        disruptionId: disruption.id,
        triggerEvent: disruption.type,
        amount: Math.round(payoutAmount),
        lostHours,
        hourlyIncome: HOURLY_INCOME,
        coveragePercentage: coverage * 100,
        status: 'processed', // Auto-processed after AI verification
        timestamp: new Date().toISOString(),
        location: disruption.location,
        evidence: `AI-verified: ${lostHours}h loss @ ₹${HOURLY_INCOME}/h with ${coverage*100}% coverage`
      });
      toast.success(`Claim verified! ₹${Math.round(payoutAmount)} payout initiated.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'claims');
    } finally {
      setIsClaiming(null);
    }
  };

  const runAIAssessment = async () => {
    if (!profile || !weather) return;
    setIsAssessing(true);
    try {
      const assessment = await getAIRiskAssessment(profile, weather);
      setAiAssessment(assessment);
      setRiskScore(assessment.riskScore);
      toast.success('AI Risk Assessment Complete');
    } catch (err) {
      console.error(err);
      toast.error('Failed to run AI Risk Assessment');
    } finally {
      setIsAssessing(false);
    }
  };

  const [showPaymentModal, setShowPaymentModal] = useState<{ policy: PolicyTemplate, amount: number } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cards');
  const [upiId, setUpiId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePayment = async (policy: PolicyTemplate, amount: number) => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }
    setShowPaymentModal({ policy, amount });
  };

  const finalizePayment = async () => {
    if (!user || !showPaymentModal) return;
    const { policy, amount } = showPaymentModal;
    
    setIsProcessingPayment(true);
    // Simulate network delay for "Processing" feel
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsPaying(true);
    try {
      // Update user profile in Firestore
      if (user.uid) {
        const userRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userRef, {
            'insurance.plan': policy.name,
            'insurance.status': 'active',
            'insurance.activatedAt': serverTimestamp(),
            'insurance.expiryDate': new Date(Date.now() + policy.durationDays * 24 * 60 * 60 * 1000),
            'weeklyPremium': amount
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }

        // Save to Policies
        let policyId = '';
        try {
          const policyDoc = await addDoc(collection(db, 'policies'), {
            userId: user.uid,
            customerName: profile?.fullName || 'Worker',
            templateId: policy.id,
            policyName: policy.name,
            coverageAmount: policy.coverageLimit,
            coveredEvents: policy.coveredEvents,
            premiumAmount: amount,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + policy.durationDays * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            termsAndConditions: policy.termsAndConditions || [],
            verificationRules: policy.verificationRules || [],
            paymentStatus: 'paid',
            hourlyIncome: HOURLY_INCOME,
            coveragePercentage: 70 // Default
          });
          policyId = policyDoc.id;
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'policies');
        }

        // Create initial payment record and schedule next one
        try {
          const now = new Date();
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          // Current Payment (Paid)
          await addDoc(collection(db, 'premium_payments'), {
            policyId: policyId,
            userId: user.uid,
            weekNumber: 1,
            amount: amount,
            status: 'paid',
            dueDate: now.toISOString(),
            paidAt: now.toISOString()
          });

          // Next Payment (Pending)
          await addDoc(collection(db, 'premium_payments'), {
            policyId: policyId,
            userId: user.uid,
            weekNumber: 2,
            amount: amount,
            status: 'pending',
            dueDate: nextWeek.toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'premium_payments');
        }

        // Log transaction
        try {
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            policyName: policy.name,
            amount,
            razorpay_payment_id: `mock_paytm_${Date.now()}`,
            status: 'success',
            timestamp: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'transactions');
        }

        toast.success(`Payment successful! ${policy.name} is now active.`);
        setSelectedPlan(null);
        setShowPaymentModal(null);
        setUpiId('');
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      let errorMessage = 'Failed to process payment';
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error) {
          errorMessage = `Payment failed: ${errorData.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }
      toast.error(errorMessage);
      setIsProcessingPayment(false);
    } finally {
      setIsPaying(false);
      setIsProcessingPayment(false);
    }
  };

  const handleRenew = async (policy: any) => {
    try {
      const newEndDate = new Date(policy.endDate);
      newEndDate.setDate(newEndDate.getDate() + 7); // Extend by 7 days
      
      await updateDoc(doc(db, 'policies', policy.id), {
        endDate: newEndDate.toISOString(),
        status: 'active'
      });
      
      toast.success('Policy renewed successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `policies/${policy.id}`);
    }
  };

  const handleCancel = async (policy: any) => {
    try {
      await updateDoc(doc(db, 'policies', policy.id), {
        status: 'cancelled'
      });
      toast.success('Policy cancelled.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `policies/${policy.id}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Insurance & Protection</h2>
          <p className="text-neutral-500 font-medium">AI-powered coverage for real-world gig work risks.</p>
        </div>

        <div className="flex bg-neutral-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'browse' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Browse Plans
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            My Dashboard
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <button 
                  onClick={runAIAssessment}
                  disabled={isAssessing || !weather}
                  className="ml-2 p-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                  title="Run AI Risk Assessment"
                >
                  {isAssessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                </button>
              </div>
              
              {weather && (
                <div className="bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 ${weather.isRisk ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} rounded-xl flex items-center justify-center`}>
                    {weather.isRisk ? <AlertTriangle size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Local Risk</p>
                    <p className="text-xl font-black text-neutral-900">{weather.isRisk ? 'Elevated' : 'Stable'}</p>
                  </div>
                </div>
              )}
            </div>
            
            {paymentStatus && (
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                paymentStatus.status === 'ok' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                  : 'bg-amber-50 border-amber-100 text-amber-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${paymentStatus.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {paymentStatus.status === 'ok' ? 'Payment System: Ready' : 'Payment System: Check Config'}
              </div>
            )}
          </div>

          {aiAssessment && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 text-white p-6 rounded-[32px] shadow-xl border border-neutral-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs text-emerald-400">AI Risk Assessment</h4>
                  <p className="text-lg font-black">{aiAssessment.riskLevel.toUpperCase()} RISK DETECTED</p>
                </div>
              </div>
              <p className="text-neutral-400 text-sm font-medium mb-4 leading-relaxed">{aiAssessment.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiAssessment.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-neutral-300">{rec}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policies.map((policy) => {
          const dynamicPremium = calculateDynamicPremium(policy.basePremium, riskScore, policy.riskCategory);
          const colors = colorMap[policy.riskCategory];
          
          return (
            <div key={policy.id} className="flex flex-col">
              <button
                onClick={() => setSelectedPlan(selectedPlan === policy.id ? null : policy.id!)}
                className={`group relative bg-white p-8 rounded-[32px] border-2 transition-all text-left h-full flex flex-col ${
                  selectedPlan === policy.id 
                    ? `${colors.border} shadow-xl ring-4 ${colors.ring}` 
                    : 'border-neutral-100 hover:border-neutral-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <Shield size={28} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Weekly Premium</p>
                    <p className="text-2xl font-black text-neutral-900">₹{dynamicPremium}</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-xl font-black text-neutral-900 mb-2">{policy.name}</h4>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">{policy.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {policy.coveredEvents.slice(0, 3).map((event) => (
                      <span key={event} className="px-2 py-1 bg-neutral-50 text-neutral-400 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        {React.createElement(EVENT_ICONS[event], { size: 10 })}
                        {EVENT_DISPLAY_NAMES[event as CoveredEvent] || event.split('_').join(' ')}
                      </span>
                    ))}
                    {policy.coveredEvents.length > 3 && (
                      <span className="px-2 py-1 bg-neutral-50 text-neutral-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                        +{policy.coveredEvents.length - 3} More
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-50 flex items-center justify-between text-neutral-400 group-hover:text-neutral-900 transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest">View Full Details</span>
                  {selectedPlan === policy.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
            </div>
          );
        })}
        {policies.length === 0 && (
          <div className="col-span-full bg-neutral-50 p-12 rounded-[40px] border border-dashed border-neutral-200 text-center">
            <Shield size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-bold">No insurance plans available at the moment.</p>
          </div>
        )}
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
              const policy = policies.find(p => p.id === selectedPlan)!;
              const colors = colorMap[policy.riskCategory];
              const dynamicPremium = calculateDynamicPremium(policy.basePremium, riskScore, policy.riskCategory);
              
              return (
                <div className={`relative bg-gradient-to-br from-white ${colors.from} rounded-[40px] border-2 ${colors.borderLight} shadow-2xl overflow-hidden`}>
                  {/* Top Header */}
                  <div className={`bg-neutral-900/5 px-10 py-4 flex items-center justify-between border-b ${colors.borderLight}`}>
                    <div className="flex items-center gap-3">
                      <span className={`${colors.bg} ${colors.text} text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm`}>
                        {policy.coverageType}
                      </span>
                      <span className="bg-white/80 text-neutral-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-neutral-100">
                        {policy.durationDays} Days Duration
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Shield size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{policy.name}</span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                    {/* Left: Main Stat */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Max Coverage Limit</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-neutral-900 tracking-tight">₹{policy.coverageLimit.toLocaleString()}</span>
                      </div>
                      <p className="text-base font-medium text-neutral-500">Comprehensive protection against {policy.coveredEvents.length} distinct event types.</p>
                    </div>

                    {/* Middle: Covered Events */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3">Covered Events</p>
                        <div className="grid grid-cols-2 gap-3">
                          {policy.coveredEvents.map((event) => (
                            <div key={event} className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center shadow-sm`}>
                                {React.createElement(EVENT_ICONS[event], { size: 16 })}
                              </div>
                              <p className="text-xs font-bold text-neutral-700 capitalize">{EVENT_DISPLAY_NAMES[event as CoveredEvent] || event.split('_').join(' ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payout Formula Display */}
                      <div className="bg-neutral-900/5 p-6 rounded-3xl border border-neutral-100 space-y-4">
                        <div className="flex items-center gap-2 text-neutral-900">
                          <TrendingUp size={18} className="text-emerald-500" />
                          <h4 className="font-black text-sm uppercase tracking-widest">Base Income Loss Formula</h4>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
                            <span>Payout = Lost Hours × Average Hourly Income × Coverage %</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-neutral-100 text-[10px] text-neutral-500 font-medium italic">
                            Example: 3h loss × ₹90/h × 70% coverage = ₹189 payout
                          </div>
                        </div>
                      </div>

                      {/* Risk Factor Compensation Model Display */}
                      <div>
                        <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3">Risk Factor Compensation Model</p>
                        <div className="grid grid-cols-2 gap-3">
                          {policy.coveredEvents.map((event) => (
                            <div key={event} className="flex items-center justify-between p-2 bg-neutral-50 rounded-xl border border-neutral-100">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center`}>
                                  {React.createElement(EVENT_ICONS[event as CoveredEvent] || AlertTriangle, { size: 12 })}
                                </div>
                                <p className="text-[10px] font-bold text-neutral-700 capitalize">{EVENT_DISPLAY_NAMES[event as CoveredEvent] || event.split('_').join(' ')}</p>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600">{(EVENT_COVERAGE[event as CoveredEvent] || 0.5) * 100}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {policy.eventPayouts && Object.keys(policy.eventPayouts).length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3">Event Payouts</p>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(policy.eventPayouts).map(([event, amount]) => (
                              <div key={event} className="flex items-center justify-between p-2 bg-neutral-50 rounded-xl border border-neutral-100">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center`}>
                                    {React.createElement(EVENT_ICONS[event as CoveredEvent] || AlertTriangle, { size: 12 })}
                                  </div>
                                  <p className="text-[10px] font-bold text-neutral-700 capitalize">{EVENT_DISPLAY_NAMES[event as CoveredEvent] || event.split('_').join(' ')}</p>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600">₹{amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {policy.termsAndConditions && policy.termsAndConditions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3">Policy Terms</p>
                          <ul className="space-y-2">
                            {policy.termsAndConditions.map((term, i) => (
                              <li key={i} className="flex items-start gap-2 text-[10px] font-medium text-neutral-500">
                                <span className="w-1 h-1 bg-neutral-300 rounded-full mt-1.5 shrink-0" />
                                {term}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {policy.verificationRules && policy.verificationRules.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3">Claim Verification Rules</p>
                          <ul className="space-y-2">
                            {policy.verificationRules.map((rule, i) => (
                              <li key={i} className="flex items-start gap-2 text-[10px] font-medium text-neutral-500">
                                <Zap size={10} className="text-amber-500 mt-0.5 shrink-0" />
                                {rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right: CTA */}
                      <div className="flex flex-col gap-6">
                        <div className={`p-6 rounded-[24px] ${colors.bg} border ${colors.borderLight} shadow-sm`}>
                          <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2">Weekly Premium</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-neutral-900">₹{dynamicPremium}</span>
                            <span className="text-neutral-400 text-xs font-bold">/week</span>
                          </div>
                          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black uppercase text-neutral-400 tracking-widest">Profit Protection</span>
                              <span className="text-[10px] font-bold text-emerald-600">Active</span>
                            </div>
                            <p className="text-[9px] text-neutral-500 font-medium">
                              Max weekly payout: ₹{dynamicPremium * 4} (4x Premium)
                            </p>
                          </div>
                        </div>
                      <button 
                        onClick={() => handlePayment(policy, dynamicPremium)}
                        disabled={isPaying}
                        className={`w-full py-5 rounded-[24px] bg-neutral-900 text-white font-black text-lg ${colors.hover} transition-all flex items-center justify-center gap-3 group/btn shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isPaying ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={22} />
                            Activate {policy.name}
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
                          AI-Optimized Risk Protection
                        </span>
                      </div>
                      <button className="text-[11px] font-black text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors underline underline-offset-4">
                        View Policy Document
                      </button>
                    </div>
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={() => handlePayment(policy, dynamicPremium)}
                        className={`w-full py-5 ${colors.hover} bg-neutral-900 text-white rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-neutral-200 transition-all flex items-center justify-center gap-3`}
                      >
                        <CreditCard size={24} />
                        Buy {policy.name} Now
                      </button>
                      {policy.riskCategory === 'low' && (
                        <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                            Best fit for your risk profile
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insurance Domain Knowledge */}
      <div className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-3xl font-black text-neutral-900 mb-4 tracking-tight">Comprehensive Coverage</h3>
          <p className="text-neutral-500 font-medium text-lg">Our policies are built specifically for the gig economy, covering more than just weather.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 rounded-[32px] bg-blue-50 border border-blue-100 space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-2">
              <Shield size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Income Protection</h4>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Automatic payouts during severe weather or platform outages that prevent work.</p>
          </div>
          
          <div className="p-8 rounded-[32px] bg-emerald-50 border border-emerald-100 space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-2">
              <ShieldCheck size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Accident Coverage</h4>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Medical expense reimbursement for on-duty accidents up to ₹50,000.</p>
          </div>
          
          <div className="p-8 rounded-[32px] bg-purple-50 border border-purple-100 space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-2">
              <Zap size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Disability Support</h4>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Lump-sum payout in case of temporary or permanent disability during work hours.</p>
          </div>
          
          <div className="p-8 rounded-[32px] bg-amber-50 border border-amber-100 space-y-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center mb-2">
              <TrendingUp size={24} />
            </div>
            <h4 className="text-lg font-black text-neutral-900">Liability Protection</h4>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed">Third-party property damage or injury coverage while you are on a delivery/ride.</p>
          </div>
        </div>
      </div>

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

      {/* Razorpay-themed Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
            >
              {/* Test Mode Ribbon */}
              <div className="absolute top-0 right-0 z-10 overflow-hidden w-32 h-32 pointer-events-none">
                <div className="absolute top-6 -right-8 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-10 rotate-45 shadow-lg border-y border-white/20">
                  Test Mode
                </div>
              </div>

              {/* Left Sidebar (Razorpay Style) */}
              <div className="md:w-1/3 bg-[#0a5d4a] p-8 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                      <Shield size={20} className="text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tight">ErgoShield Insurance</span>
                  </div>

                  <div className="bg-white rounded-xl p-6 text-neutral-900 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-1">Price Summary</p>
                    <p className="text-4xl font-black">₹{showPaymentModal.amount}</p>
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} />
                        Fake Payment Mode
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-md flex items-center justify-between group cursor-pointer hover:bg-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Users size={16} className="text-emerald-400" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Using as</p>
                        <p className="text-sm font-bold">{profile?.phoneNumber || '+91 93921 49774'}</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full p-8 opacity-20">
                  <div className="flex gap-2 items-end">
                    <div className="w-8 h-12 bg-white rounded-t-lg" />
                    <div className="w-12 h-20 bg-white rounded-t-lg" />
                    <div className="w-10 h-16 bg-white rounded-t-lg" />
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/40 mt-12">
                  <span className="text-[8px] font-black uppercase tracking-widest">Secured by</span>
                  <span className="text-xs font-black italic tracking-tighter text-white/60">Razorpay</span>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="md:w-2/3 p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-neutral-800 uppercase tracking-tight">Payment Options</h3>
                  <div className="flex items-center gap-2">
                    <button className="text-neutral-400 hover:text-neutral-600">
                      <Activity size={18} />
                    </button>
                    <button onClick={() => setShowPaymentModal(null)} className="text-neutral-400 hover:text-neutral-600 p-1">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 gap-8">
                  {/* Options List */}
                  <div className="w-1/3 space-y-1">
                    {[
                      { id: 'upi', label: 'UPI', icons: ['phonepe', 'gpay', 'paytm'] },
                      { id: 'cards', label: 'Cards', icons: ['visa', 'mastercard', 'rupay'] },
                      { id: 'netbanking', label: 'Netbanking', icons: ['sbi', 'hdfc', 'icici'] },
                      { id: 'wallet', label: 'Wallet', icons: ['paytm', 'mobikwik'] },
                      { id: 'paylater', label: 'Pay Later', icons: ['simpl', 'lazypay'] }
                    ].map((opt) => (
                      <button 
                        key={opt.id}
                        onClick={() => setSelectedPaymentMethod(opt.id)}
                        className={`w-full p-4 rounded-xl text-left transition-all flex flex-col gap-2 ${
                          selectedPaymentMethod === opt.id ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <span className={`text-sm font-bold ${selectedPaymentMethod === opt.id ? 'text-emerald-900' : 'text-neutral-600'}`}>{opt.label}</span>
                        <div className="flex gap-1 opacity-40">
                          <div className="w-4 h-2.5 bg-neutral-400 rounded-sm" />
                          <div className="w-4 h-2.5 bg-neutral-400 rounded-sm" />
                          <div className="w-4 h-2.5 bg-neutral-400 rounded-sm" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Active Option Detail */}
                  <div className="w-2/3 space-y-6">
                    {selectedPaymentMethod === 'cards' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Add a new card</h4>
                        <div className="space-y-3">
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Card Number" 
                              className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-20">
                              <CreditCard size={16} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="MM / YY" 
                              className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                            <input 
                              type="text" 
                              placeholder="CVV" 
                              className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-5 h-5 rounded border-2 border-neutral-200 group-hover:border-emerald-500 transition-colors flex items-center justify-center">
                              <div className="w-2 h-2 bg-emerald-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs font-medium text-neutral-500">Save this card as per RBI guidelines</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod === 'upi' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Pay via UPI App</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'PhonePe', icon: '🟣' },
                            { name: 'Google Pay', icon: '🔵' },
                            { name: 'Paytm', icon: '🔵' },
                            { name: 'BharatPe', icon: '🟢' }
                          ].map((app) => (
                            <button key={app.name} className="flex items-center gap-3 p-4 border border-neutral-200 rounded-xl hover:border-emerald-500 transition-all text-left">
                              <span className="text-xl">{app.icon}</span>
                              <span className="text-sm font-bold text-neutral-700">{app.name}</span>
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-100"></div>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-neutral-400 font-black tracking-widest">OR</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Enter UPI ID</p>
                          <input 
                            type="text" 
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. ravi@okaxis" 
                            className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          />
                          <p className="text-[10px] text-neutral-400 font-medium italic">Hint: You can enter any ID for this test payment.</p>
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod === 'netbanking' && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Select Bank</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                            <button key={bank} className="flex items-center gap-3 p-4 border border-neutral-200 rounded-xl hover:border-emerald-500 transition-all text-left">
                              <div className="w-6 h-6 bg-neutral-100 rounded flex items-center justify-center text-[10px] font-black">{bank[0]}</div>
                              <span className="text-sm font-bold text-neutral-700">{bank}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod !== 'cards' && selectedPaymentMethod !== 'upi' && selectedPaymentMethod !== 'netbanking' && (
                      <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center">
                          <Activity className="text-neutral-300" size={32} />
                        </div>
                        <p className="text-sm font-medium text-neutral-500">This payment method is currently being integrated.</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-neutral-100">
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-3 mb-4">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                          <span className="font-black uppercase tracking-widest block mb-1">Simulated Payment</span>
                          This is a <span className="font-black">FAKE PAYMENT</span> for demonstration purposes. No real money will be deducted from your account.
                        </p>
                      </div>
                      <button 
                        onClick={finalizePayment}
                        disabled={isPaying || isProcessingPayment}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-black py-5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 size={24} className="animate-spin" />
                            Processing...
                          </>
                        ) : isPaying ? (
                          <>
                            <Loader2 size={24} className="animate-spin" />
                            Finalizing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={24} />
                            Pay ₹{showPaymentModal.amount} Securely
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Active Policies & Claims */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="text-purple-500" size={24} />
                Premium History
              </h3>
              <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Week</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Next Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {userPayments.sort((a, b) => b.weekNumber - a.weekNumber).map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 text-sm font-bold text-neutral-900">Week {payment.weekNumber}</td>
                        <td className="px-6 py-4 text-sm font-bold text-neutral-900">₹{payment.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            payment.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-500 font-medium">
                          {payment.paidAt ? (
                            <div className="flex flex-col">
                              <span>{new Date(payment.paidAt).toLocaleDateString()}</span>
                              <span className="text-[10px] text-neutral-400">{new Date(payment.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-300 italic">Not Paid</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-500 font-medium">
                          {payment.status === 'pending' ? (
                            <span className="text-amber-600 font-bold">{new Date(payment.dueDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-neutral-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {userPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-400 font-medium">
                          No payment history available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Column: Risk Alerts & Disruption Detection */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={24} />
                Live Risk Alerts
              </h3>
              <div className="space-y-4">
                {activeDisruptions.map((disruption) => {
                  // Check if user has a policy covering this event
                  const matchingPolicy = userPolicies.find(p => p.coveredEvents.includes(disruption.type));
                  
                  return (
                    <div key={disruption.id} className={`p-6 rounded-[32px] border-2 transition-all ${
                      matchingPolicy ? 'bg-amber-50 border-amber-200' : 'bg-neutral-50 border-neutral-100'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          matchingPolicy ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                          {EVENT_ICONS[disruption.type as CoveredEvent] ? React.createElement(EVENT_ICONS[disruption.type as CoveredEvent], { size: 20 }) : <Zap size={20} />}
                        </div>
                        <div>
                          <h4 className="font-black text-neutral-900 capitalize">{EVENT_DISPLAY_NAMES[disruption.type as CoveredEvent] || disruption.type.split('_').join(' ')}</h4>
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Detected in {disruption.location}</p>
                        </div>
                      </div>
                      
                      {matchingPolicy ? (
                        <div className="space-y-4">
                          <p className="text-sm font-bold text-amber-800 leading-relaxed">
                            This event is covered by your <span className="underline">{matchingPolicy.policyName}</span>. You are eligible for an instant claim.
                          </p>
                          <button
                            onClick={() => handleFileClaim(disruption, matchingPolicy)}
                            disabled={isClaiming === disruption.id}
                            className="w-full py-3 bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                          >
                            {isClaiming === disruption.id ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                            File Instant Claim
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-neutral-500 leading-relaxed">
                          You don't have a policy covering this event. Upgrade your plan to stay protected.
                        </p>
                      )}
                    </div>
                  );
                })}
                {activeDisruptions.length === 0 && (
                  <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-900">All Clear</h4>
                      <p className="text-xs font-bold text-emerald-700">No active disruptions detected in your area.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-neutral-900 p-8 rounded-[40px] text-white space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Globe size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">Global Risk Monitor</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">AQI Level</p>
                  <p className="text-xl font-black text-white">{weather?.aqi || 124}</p>
                  <p className="text-[10px] font-bold text-amber-400 uppercase mt-1">Unhealthy</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Gov Alerts</p>
                  <p className="text-xl font-black text-white">None</p>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1">Stable</p>
                </div>
              </div>

              <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                Our AI monitors weather, government alerts, and social feeds 24/7 to protect your income.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-neutral-500">System Status</span>
                  <span className="text-emerald-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-neutral-500">Last Scan</span>
                  <span className="text-white">Just Now</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
