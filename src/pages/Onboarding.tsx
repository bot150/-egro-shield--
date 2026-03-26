import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShoppingBag, Utensils, Zap, ChevronRight, CheckCircle2, CreditCard, UserCheck, AlertCircle, MapPin, Loader2, RefreshCw, CloudRain, Sun, Cloud, Wind, Droplets, Shield } from 'lucide-react';
import { calculateRiskScore } from '../services/gemini';
import { useRef, useEffect } from 'react';
import { fetchWeatherByCoords, fetchWeatherByCity } from '../services/weatherService';
import { WeatherData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const categories = [
  {
    id: 'food',
    title: 'Food Delivery',
    icon: Utensils,
    color: 'bg-orange-100 text-orange-600',
    options: ['Swiggy', 'Zomato']
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce',
    icon: ShoppingBag,
    color: 'bg-blue-100 text-blue-600',
    options: ['Amazon', 'Flipkart', 'Myntra', 'AJIO']
  },
  {
    id: 'quick_commerce',
    title: 'Quick Commerce',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
    options: ['Zepto', 'Blinkit']
  }
];

export const Onboarding: React.FC = () => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState({
    aadharNumber: '',
    bankAccount: '',
    ifsc: '',
    age: '',
    location: 'New Delhi',
  });
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [accountData, setAccountData] = useState({
    emailOrPhone: profile?.email || user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [riskResult, setRiskResult] = useState<{ score: number; premium: number } | null>(null);
  const navigate = useNavigate();

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
          setWeather(data);
          setVerificationData(prev => ({ ...prev, location: data.city }));
        } catch (err: any) {
          setError(err.message || "Failed to detect location weather");
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setError("Location access denied. Please enter your city manually.");
        setDetectingLocation(false);
      }
    );
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setStep(2);
  };

  const handleSubSelect = (sub: string) => {
    setSelectedSub(sub);
    setStep(3);
  };

  const handleVerificationContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions to proceed.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      let currentWeather = weather;
      if (!currentWeather) {
        try {
          currentWeather = await fetchWeatherByCity(verificationData.location);
        } catch (e) {
          console.warn("Could not fetch weather for risk calculation", e);
        }
      }

      const result = await calculateRiskScore(
        verificationData.location || "New Delhi", 
        currentWeather || { temp: 32, humidity: 80, forecast: "Clear" }
      );
      setRiskResult(result);
      await finalizeOnboarding(result);
    } catch (err) {
      console.error(err);
      setError('Failed to calculate risk profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !profile || !riskResult) return;
    setLoading(true);
    setError(null);

    try {
      const [orderRes, keyRes] = await Promise.all([
        fetch('/api/payment/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: riskResult.premium, // in INR
            receipt: `rcpt_${user.uid.slice(0, 8)}_${Date.now()}`,
          }),
        }),
        fetch('/api/payment/key').then(r => r.json())
      ]);

      if (!orderRes.ok) throw new Error('Failed to create payment order');
      const order = await orderRes.json();
      
      if (keyRes.error) {
        setError(keyRes.error);
        setLoading(false);
        return;
      }
      const { key } = keyRes;

      // 3. Open Razorpay Checkout
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "ErgoShield Insurance",
        description: "Weekly Insurance Premium",
        order_id: order.id,
        handler: async (response: any) => {
          // 4. Verify Payment
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });

          if (verifyResponse.ok) {
            await finalizeOnboarding(riskResult);
          } else {
            setError('Payment verification failed. Please contact support.');
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
      rzp.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setError('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  const finalizeOnboarding = async (riskResult: any) => {
    if (!user) return;
    try {
      // 1. Check for duplicates using index collection
      const aadharIndexRef = doc(db, 'indices', `aadhar_${verificationData.aadharNumber}`);
      const bankIndexRef = doc(db, 'indices', `bank_${verificationData.bankAccount}`);
      
      let aadharSnap, bankSnap;
      try {
        [aadharSnap, bankSnap] = await Promise.all([
          getDoc(aadharIndexRef),
          getDoc(bankIndexRef)
        ]);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `indices/aadhar_${verificationData.aadharNumber} or bank_${verificationData.bankAccount}`);
      }

      if (aadharSnap?.exists() && aadharSnap.data().ownerId !== user.uid) {
        setError('This Aadhar number is already registered with another account.');
        setLoading(false);
        return;
      }

      if (bankSnap?.exists() && bankSnap.data().ownerId !== user.uid) {
        setError('This Bank account is already registered with another account.');
        setLoading(false);
        return;
      }

      // 3. Update User Profile
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          category: selectedCategory,
          subCategory: selectedSub,
          aadharNumber: verificationData.aadharNumber,
          bankAccountNumber: verificationData.bankAccount,
          ifscCode: verificationData.ifsc,
          age: parseInt(verificationData.age),
          location: verificationData.location,
          riskScore: riskResult.score,
          weeklyPremium: riskResult.premium,
          onboarded: true,
          aadharVerified: true,
          bankVerified: true
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }

      // 5.1 Create Active Policy
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1); // 1 year policy

      try {
        await addDoc(collection(db, 'policies'), {
          userId: user.uid,
          status: 'active',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          premiumAmount: riskResult.premium,
          coverageAmount: 50000, // Default coverage
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'policies');
      }

      // 6. Create Indices for uniqueness
      try {
        await Promise.all([
          setDoc(aadharIndexRef, { ownerId: user.uid, type: 'aadhar' }),
          setDoc(bankIndexRef, { ownerId: user.uid, type: 'bank' })
        ]);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'indices');
      }

      setStep(5);
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 border border-neutral-100">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-emerald-600' : 'bg-neutral-100'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Select Your Category</h2>
            <p className="text-neutral-500 mb-8">Tell us which platform you deliver for</p>
            <div className="grid grid-cols-1 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="flex items-center gap-4 p-6 bg-neutral-50 border border-neutral-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                    <cat.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900 text-lg">{cat.title}</h3>
                    <p className="text-sm text-neutral-500">{cat.options.join(', ')}</p>
                  </div>
                  <ChevronRight className="text-neutral-300 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedCategory && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(1)} className="text-emerald-600 font-medium mb-6 flex items-center gap-1">
              ← Back to Categories
            </button>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Choose Platform</h2>
            <p className="text-neutral-500 mb-8">Select the specific app you use</p>
            <div className="grid grid-cols-2 gap-4">
              {categories.find(c => c.id === selectedCategory)?.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSubSelect(opt)}
                  className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all font-bold text-neutral-800"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Verification</h2>
            <p className="text-neutral-500 mb-6">We need some details to verify your identity</p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="text-amber-600 mt-1 shrink-0" size={20} />
              <div>
                <p className="text-amber-900 font-bold text-sm mb-1">Important Document Instructions</p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Please ensure you provide the <strong>correct Aadhar Number</strong> and <strong>Bank Passbook details</strong>. 
                  Mismatched information will lead to claim rejection.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerificationContinue} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Aadhar Number</label>
                  <div className="relative mb-3">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="1234 5678 9012"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={verificationData.aadharNumber}
                      onChange={(e) => setVerificationData({ ...verificationData, aadharNumber: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      className="hidden"
                      id="aadhar-upload"
                      accept="image/*,.pdf"
                      onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="aadhar-upload"
                      className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-xs font-bold cursor-pointer transition-all ${aadharFile ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-neutral-200 text-neutral-500 hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                      {aadharFile ? <><CheckCircle2 size={16} /> {aadharFile.name}</> : <><Zap size={14} /> Upload Aadhar Card</>}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    placeholder="25"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={verificationData.age}
                    onChange={(e) => setVerificationData({ ...verificationData, age: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Location</label>
                  <div className="relative mb-2">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="New Delhi"
                      className="w-full pl-12 pr-24 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={verificationData.location}
                      onChange={(e) => setVerificationData({ ...verificationData, location: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {detectingLocation ? <RefreshCw size={12} className="animate-spin" /> : <MapPin size={12} />}
                      Detect
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {weather && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img src={weather.icon} alt={weather.condition} className="w-8 h-8" />
                          <div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{weather.condition}</div>
                            <div className="text-xs font-medium text-emerald-900">{weather.temp}°C in {weather.city}</div>
                          </div>
                        </div>
                        {weather.isRisk && (
                          <div className="flex items-center gap-1 text-red-500 font-bold text-[10px] bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            <AlertCircle size={10} />
                            HIGH RISK
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Bank Account Number</label>
                  <div className="relative mb-3">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="Account Number"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={verificationData.bankAccount}
                      onChange={(e) => setVerificationData({ ...verificationData, bankAccount: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      className="hidden"
                      id="bank-upload"
                      accept="image/*,.pdf"
                      onChange={(e) => setBankFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="bank-upload"
                      className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-xs font-bold cursor-pointer transition-all ${bankFile ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-neutral-200 text-neutral-500 hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                      {bankFile ? <><CheckCircle2 size={16} /> {bankFile.name}</> : <><Zap size={14} /> Upload Bank Passbook</>}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SBIN0001234"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={verificationData.ifsc}
                    onChange={(e) => setVerificationData({ ...verificationData, ifsc: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all"
              >
                Continue to Account Setup
              </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Account & Terms</h2>
            <p className="text-neutral-500 mb-8">Review your account details and our policy terms</p>
            
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Registered Email/Phone</label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed"
                    value={accountData.emailOrPhone}
                  />
                  <p className="text-xs text-neutral-400 mt-2">This is the account linked to your ErgoShield profile.</p>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 space-y-4">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Insurance Terms & Conditions
                </h3>
                <ul className="space-y-3 text-sm text-emerald-800">
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Risk Score Calculation:</strong> We calculate a "Risk Score" (0-100) based on local weather patterns and platform disruption data.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Premium Generation:</strong> Based on your score, we assign a Weekly Premium (typically ₹30, ₹50, or ₹70).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Policy Summary:</strong> You will receive a summary including your personalized risk level, weekly cost, and maximum payout per disruption.</span>
                  </li>
                </ul>
                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    required
                    className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span className="text-sm font-bold text-emerald-900">I accept the terms and conditions</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
              >
                {loading ? 'Generating AI Profile...' : 'Accept & Complete Onboarding'}
              </button>
            </form>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Welcome to ErgoShield!</h2>
              <p className="text-neutral-500">Your profile is ready. Choose a protection plan or explore the dashboard first.</p>
            </div>

            {riskResult && (
              <div className="bg-neutral-50 rounded-2xl p-4 mb-6 border border-neutral-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">Your AI Risk Score</p>
                  <p className="text-2xl font-bold text-neutral-900">{riskResult.score}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">Recommended</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{riskResult.premium}/week</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mb-6">
              {[
                { id: 'basic', name: 'Basic Shield', premium: 30, payout: '₹2,000', color: 'emerald', tagline: 'Essential coverage for low-risk zones' },
                { id: 'standard', name: 'Standard Shield', premium: 50, payout: '₹5,000', color: 'blue', tagline: 'AI-recommended balanced protection' },
                { id: 'premium', name: 'Premium Shield', premium: 70, payout: '₹10,000', color: 'purple', tagline: 'Maximum coverage for high-risk conditions' },
              ].map((plan) => {
                const isRecommended = riskResult && riskResult.premium === plan.premium;
                return (
                  <button
                    key={plan.id}
                    onClick={() => {
                      // Just navigate to dashboard; actual subscription handled in Insurance page
                      navigate('/dashboard');
                    }}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg ${
                      isRecommended
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-100'
                        : 'border-neutral-100 bg-white hover:border-neutral-200'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        AI Recommended
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      plan.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Shield size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-neutral-900">{plan.name}</h4>
                      <p className="text-xs text-neutral-500 truncate">{plan.tagline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-neutral-900">₹{plan.premium}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">/week</p>
                    </div>
                    <ChevronRight size={18} className="text-neutral-300 shrink-0" />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-xl border-2 border-neutral-200 text-neutral-500 font-bold hover:bg-neutral-50 hover:text-neutral-700 transition-all"
            >
              Skip for now → Go to Dashboard
            </button>
            <p className="text-center text-xs text-neutral-400 mt-3">
              You can always choose a plan later from the Insurance page.
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">Verification Complete!</h2>
            <p className="text-neutral-500 mb-8">Your AI Risk Profile has been generated.</p>
            
            <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left border border-neutral-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-neutral-600 font-medium">Risk Score</span>
                <span className="text-emerald-600 font-bold text-xl">{profile?.riskScore || 45}/100</span>
              </div>
              <div className="w-full bg-neutral-200 h-3 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000" 
                  style={{ width: `${profile?.riskScore || 45}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Weekly Premium</span>
                <span className="text-neutral-900 font-bold text-2xl">₹{profile?.weeklyPremium || 50}/week</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
