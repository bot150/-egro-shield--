import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Heart, BarChart3, ChevronRight, Play, CheckCircle2, Mail, Lock, User, Phone, Chrome, Utensils, ShoppingBag, ArrowLeft, Quote, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'initial' | 'login_methods' | 'email_login' | 'phone_login' | 'register_platform' | 'register_form'>('initial');
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
      }
      
      if (!userDoc?.exists()) {
        try {
          await setDoc(userDocRef, {
            uid: firebaseUser.uid,
            fullName: firebaseUser.displayName || 'New User',
            email: firebaseUser.email,
            phoneNumber: firebaseUser.phoneNumber || '',
            role: 'worker',
            createdAt: new Date().toISOString(),
            category: view === 'register_form' ? categories.find(c => c.options.includes(selectedPlatform!))?.id : null,
            subCategory: selectedPlatform,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in your Firebase project. Please enable it in the Firebase Console.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in your Firebase project. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check for duplicate phone number
      const phoneIndexRef = doc(db, 'indices', `phone_${phoneNumber}`);
      let phoneSnap;
      try {
        phoneSnap = await getDoc(phoneIndexRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `indices/phone_${phoneNumber}`);
      }
      
      if (phoneSnap?.exists()) {
        setError('This phone number is already registered.');
        setLoading(false);
        return;
      }

      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          fullName,
          email,
          phoneNumber,
          role: 'worker',
          createdAt: new Date().toISOString(),
          category: categories.find(c => c.options.includes(selectedPlatform!))?.id,
          subCategory: selectedPlatform,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }

      try {
        await setDoc(phoneIndexRef, { ownerId: firebaseUser.uid, type: 'phone' });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `indices/phone_${phoneNumber}`);
      }
      navigate('/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in your Firebase project. Please enable it in the Firebase Console.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Set view first so it's ready when the component re-renders after sign out
      setView('login_methods');
      await auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-100 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Shield size={20} className="md:w-6 md:h-6" />
            </div>
            <span className="text-xl md:text-3xl font-display uppercase tracking-tighter">ErgoShield</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <div className="flex items-center gap-4 md:gap-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-neutral-900 text-white px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-neutral-200 cursor-pointer"
                >
                  Dashboard
                </button>
                <button 
                  onClick={handleSignOut}
                  className="text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-red-600 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 md:gap-8">
                <button 
                  onClick={() => navigate('/login')}
                  className="hidden sm:block text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="bg-emerald-600 text-white px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-neutral-900 shadow-xl shadow-emerald-200 transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-[0.25em] mb-6 border border-emerald-100/50"
            >
              <Zap size={14} className="fill-emerald-600" />
              The Future of Gig Work Security
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-display uppercase leading-[0.9] text-neutral-900 mb-8 tracking-tighter">
              Your Hustle. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400">Our Shield.</span>
            </h1>
            
            <p className="max-w-xl text-lg md:text-2xl text-neutral-500 mb-10 font-medium leading-relaxed">
              You brave the roads, the heat, and the rain. We ensure your earnings never stop. <span className="text-emerald-600 font-bold italic font-serif">ErgoShield</span> is the first AI-powered safety net built exclusively for India's delivery heroes.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-10 mb-8 md:mb-12">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-sm md:text-base font-bold text-neutral-800">Instant Payouts</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-sm md:text-base font-bold text-neutral-800">Zero Paperwork</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto group bg-neutral-900 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-lg md:text-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-emerald-200 cursor-pointer"
              >
                Protect My Income <ArrowRight size={20} className="md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full" />
            
            {user ? (
              <div className="bg-white p-12 rounded-[48px] border border-neutral-100 shadow-2xl text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Shield size={48} className="fill-emerald-100" />
                </div>
                <h2 className="text-4xl font-display uppercase tracking-tighter text-neutral-900 mb-4">Welcome Back</h2>
                <p className="text-neutral-500 mb-10 font-medium text-lg max-w-xs mx-auto">Your shield is active and protecting your hustle. Ready to check your stats?</p>
                <div className="flex flex-col gap-4 relative z-20">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-neutral-900 text-white px-10 py-6 rounded-3xl font-black text-xl shadow-2xl shadow-neutral-200 hover:bg-emerald-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    Go to Dashboard <ChevronRight size={24} />
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] hover:text-red-600 transition-colors py-4"
                  >
                    Sign Out Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-neutral-100 border-t-4 border-t-white shadow-2xl relative overflow-hidden min-h-[450px] md:min-h-[500px] flex flex-col">
                
                {view !== 'initial' && (
                  <button 
                    onClick={() => {
                      if (view === 'email_login' || view === 'phone_login') setView('login_methods');
                      else if (view === 'login_methods') setView('initial');
                      else if (view === 'register_platform') setView('initial');
                      else if (view === 'register_form') setView('register_platform');
                    }}
                    className="absolute top-6 left-6 text-neutral-400 hover:text-emerald-600 transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  {view === 'initial' && (
                    <div className="space-y-10 animate-in fade-in zoom-in duration-300">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200/50">
                          <Shield size={40} />
                        </div>
                        <h2 className="text-5xl font-display uppercase tracking-tighter text-neutral-900 mb-4">Join the Shield</h2>
                        <p className="text-neutral-500 font-medium leading-relaxed text-lg">
                          Secure your daily earnings in less than 2 minutes. <br />
                          <span className="text-emerald-600 font-bold italic font-serif">"Because your hustle is worth protecting."</span>
                        </p>
                      </div>
                      <div className="space-y-4">
                        <button 
                          onClick={() => navigate('/signup')}
                          className="w-full bg-neutral-900 text-white font-black text-xl py-6 rounded-2xl shadow-2xl shadow-neutral-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 cursor-pointer"
                        >
                          Register Now <ChevronRight size={24} />
                        </button>
                        <button 
                          onClick={() => navigate('/login')}
                          className="w-full bg-white border-2 border-neutral-100 text-neutral-900 font-black text-xl py-6 rounded-2xl hover:border-emerald-600 transition-all cursor-pointer"
                        >
                          Log In
                        </button>
                      </div>
                    </div>
                  )}

                  {view === 'login_methods' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-center mb-10">
                        <h2 className="text-4xl font-display uppercase tracking-tighter text-neutral-900 mb-2">Welcome Back</h2>
                        <p className="text-neutral-500 font-medium text-base">Select how you want to sign in.</p>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-4 bg-white border-2 border-neutral-100 text-neutral-900 font-bold text-base py-5 rounded-2xl hover:bg-neutral-50 hover:border-emerald-600 transition-all"
                        >
                          <Chrome size={24} className="text-blue-500" />
                          Continue with Google
                        </button>
                        <button
                          onClick={() => setView('email_login')}
                          className="w-full flex items-center justify-center gap-4 bg-white border-2 border-neutral-100 text-neutral-900 font-bold text-base py-5 rounded-2xl hover:bg-neutral-50 hover:border-emerald-600 transition-all"
                        >
                          <Mail size={24} className="text-emerald-600" />
                          Continue with Email
                        </button>
                        <button
                          onClick={() => setView('phone_login')}
                          className="w-full flex items-center justify-center gap-4 bg-white border-2 border-neutral-100 text-neutral-900 font-bold text-base py-5 rounded-2xl hover:bg-neutral-50 hover:border-emerald-600 transition-all"
                        >
                          <Phone size={24} className="text-blue-600" />
                          Continue with Phone
                        </button>
                      </div>
                    </div>
                  )}

                  {view === 'email_login' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-center mb-6 md:mb-10">
                        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-neutral-900 mb-2">Email Login</h2>
                        <p className="text-neutral-500 font-medium text-sm md:text-base">Enter your credentials below.</p>
                      </div>
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                          <input
                            type="email"
                            required
                            placeholder="Email Address"
                            className="w-full pl-14 pr-6 py-5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-base font-medium outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            className="w-full pl-14 pr-6 py-5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-base font-medium outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-neutral-900 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-neutral-200 transition-all disabled:opacity-50 text-xl"
                        >
                          {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                      </form>
                    </div>
                  )}

                  {view === 'phone_login' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-neutral-900 mb-2">Phone Login</h2>
                        <p className="text-neutral-500 font-medium text-sm">Login with your registered number.</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                          Note: Phone login currently uses email/password internally. Please use the email login if you haven't set up a phone-specific password.
                        </p>
                      </div>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="tel"
                            required
                            placeholder="Phone Number"
                            className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                        >
                          {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                      </form>
                    </div>
                  )}

                  {view === 'register_platform' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-center mb-6 md:mb-10">
                        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-neutral-900 mb-2">Select Platform</h2>
                        <p className="text-neutral-500 font-medium text-sm md:text-base italic font-serif">"Choose your battlefield, we'll provide the armor."</p>
                      </div>
                      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                        {categories.map((cat) => (
                          <div key={cat.id} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                              <cat.icon size={18} className="text-emerald-600" />
                              <span className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">{cat.title}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {cat.options.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    setSelectedPlatform(opt);
                                    setView('register_form');
                                  }}
                                  className="p-5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-sm font-bold text-neutral-800 text-left flex items-center justify-between group"
                                >
                                  {opt}
                                  <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {view === 'register_form' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="text-center mb-6 md:mb-8">
                        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-neutral-900 mb-2">Create Account</h2>
                        <p className="text-neutral-500 font-medium text-sm md:text-base">Registering for <span className="text-emerald-600 font-black">{selectedPlatform}</span></p>
                      </div>
                      
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-4 bg-white border-2 border-neutral-100 text-neutral-900 font-bold text-base py-4 rounded-2xl hover:bg-neutral-50 hover:border-emerald-600 transition-all mb-6"
                      >
                        <Chrome size={20} className="text-blue-500" />
                        Sign up with Google
                      </button>

                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-neutral-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-white px-4 text-neutral-400 font-black tracking-[0.25em]">Or email</span>
                        </div>
                      </div>

                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-base font-medium outline-none"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="email"
                            required
                            placeholder="Email Address"
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-base font-medium outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="tel"
                            required
                            placeholder="Phone Number"
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-base font-medium outline-none"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-base font-medium outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-neutral-900 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-neutral-200 transition-all disabled:opacity-50 text-lg"
                        >
                          {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 text-red-600 p-2 rounded-lg text-[10px] font-bold border border-red-100 text-center">
                    {error}
                  </div>
                )}
                
                <p className="text-center mt-6 text-[10px] text-neutral-400 font-medium">
                  {view === 'initial' ? 'By continuing, you agree to our Terms.' : ''}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 border-y border-neutral-100 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 grayscale">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 mb-4 md:mb-0">Trusted by workers from</span>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="flex items-center gap-2 font-display text-2xl">SWIGGY</div>
              <div className="flex items-center gap-2 font-display text-2xl">ZOMATO</div>
              <div className="flex items-center gap-2 font-display text-2xl">AMAZON</div>
              <div className="flex items-center gap-2 font-display text-2xl">ZEPTO</div>
              <div className="flex items-center gap-2 font-display text-2xl">BLINKIT</div>
            </div>
          </div>
        </div>
      </section>

      {/* Protect My Income Section */}
      <section className="py-40 px-6 bg-[#0F0F0F] text-white overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.15),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.1),transparent_60%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-display uppercase tracking-tighter leading-tight mb-8 md:mb-12">
              Protect My <br />
              <span className="text-emerald-500">Income</span>
            </h2>
            <p className="text-lg md:text-3xl text-neutral-400 max-w-4xl mx-auto font-medium leading-relaxed mb-10 md:mb-16">
              Stop worrying about rain, accidents, or platform bans. ErgoShield automatically triggers payments when your income is at risk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
              <button 
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-emerald-600 text-white px-10 md:px-16 py-5 md:py-8 rounded-2xl md:rounded-[32px] font-black text-lg md:text-xl hover:bg-white hover:text-black transition-all shadow-2xl shadow-emerald-900/40 uppercase tracking-widest"
              >
                Secure My Future
              </button>
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-[10px]">
                  <CheckCircle2 size={14} />
                  Instant Activation
                </div>
                <div className="flex items-center gap-3 text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
                  <CheckCircle2 size={14} />
                  No Questions Asked
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8">
            {[
              { label: 'Claims Paid', value: '₹1.2Cr+' },
              { label: 'Active Workers', value: '50k+' },
              { label: 'Auto-Triggered', value: '100%' },
              { label: 'Avg. Weekly Cost', value: '₹50' }
            ].map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-6xl font-display text-neutral-900 mb-2 md:mb-3 tracking-tighter">{stat.value}</p>
                <p className="text-[10px] md:text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-40 px-6 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-3xl">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-6xl md:text-8xl font-display uppercase tracking-tighter mb-6 md:mb-8 leading-tight md:leading-[0.85]"
              >
                Built for the <br /><span className="text-emerald-600">Gig Speed.</span>
              </motion.h2>
              <p className="text-lg md:text-2xl text-neutral-500 font-medium leading-relaxed">Traditional insurance is too slow for your life. ErgoShield is built to keep up with every turn you take.</p>
            </div>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-2 rounded-full bg-neutral-200 overflow-hidden">
                  {i === 1 && <motion.div initial={{ x: "-100%" }} whileInView={{ x: 0 }} transition={{ duration: 1.5, ease: "easeInOut" }} className="w-full h-full bg-emerald-600" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: 'Instant Payouts', 
                desc: 'When rain hits or the app crashes, we know. Payouts land in your account before the storm clears.',
                icon: Zap,
                theme: 'light'
              },
              { 
                title: 'AI Risk Profiling', 
                desc: 'Our Gemini AI analyzes weather and traffic patterns to give you the fairest, lowest premiums in India.',
                icon: BarChart3,
                theme: 'dark'
              },
              { 
                title: 'Income Security', 
                desc: "Never lose a day's earnings to things you can't control. We're the safety net that's always there.",
                icon: Heart,
                theme: 'emerald'
              }
            ].map((feature, idx) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -15 }}
                className={`rounded-[32px] md:rounded-[50px] p-8 md:p-14 flex flex-col justify-between shadow-2xl transition-all duration-500 min-h-[350px] md:aspect-square ${
                  feature.theme === 'dark' ? 'bg-neutral-900 text-white shadow-neutral-200/50' : 
                  feature.theme === 'emerald' ? 'bg-emerald-600 text-white shadow-emerald-200/50' : 
                  'bg-white text-neutral-900 shadow-neutral-100'
                }`}
              >
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg ${
                  feature.theme === 'dark' ? 'bg-white text-neutral-900' : 
                  feature.theme === 'emerald' ? 'bg-white text-emerald-600' : 
                  'bg-emerald-600 text-white'
                }`}>
                  <feature.icon size={28} className="md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-4xl font-black mb-4 md:mb-6 leading-tight">{feature.title.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br className="hidden md:block" /> </React.Fragment>)}</h3>
                  <p className={`text-base md:text-lg font-medium leading-relaxed ${
                    feature.theme === 'light' ? 'text-neutral-500' : 'text-white/70'
                  }`}>
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-40 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto bg-neutral-900 rounded-[40px] md:rounded-[80px] p-10 md:p-32 text-center text-white relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.25),transparent_60%)] pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-3xl sm:text-5xl md:text-8xl font-display uppercase tracking-tighter mb-8 md:mb-10 leading-tight md:leading-[0.85]">
              Ready to secure your <br /> <span className="text-emerald-400">delivery income?</span>
            </h2>
            <p className="text-lg md:text-2xl text-neutral-400 mb-10 md:mb-14 max-w-2xl mx-auto font-medium">
              Join 50,000+ delivery partners who have already protected their hustle.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto bg-emerald-600 text-white px-10 md:px-14 py-4 md:py-6 rounded-2xl md:rounded-3xl font-bold text-xl md:text-2xl hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 hover:-translate-y-1"
              >
                Join ErgoShield Today
              </Link>
              <div className="flex items-center gap-4 text-neutral-300 font-bold text-base md:text-lg">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={16} className="md:w-5 md:h-5" />
                </div>
                No credit card required
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 bg-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-neutral-900 mb-8">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <Shield size={24} />
                </div>
                <span className="text-3xl font-display uppercase tracking-tighter">ErgoShield</span>
              </div>
              <p className="text-xl text-neutral-500 max-w-sm font-medium leading-relaxed">
                Empowering India's gig economy with the world's first AI-driven income security platform.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black text-neutral-900 uppercase tracking-[0.2em] mb-8">Platform</h4>
              <ul className="space-y-4 text-base font-bold text-neutral-500">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Claims</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black text-neutral-900 uppercase tracking-[0.2em] mb-8">Company</h4>
              <ul className="space-y-4 text-base font-bold text-neutral-500">
                <li><Link to="/support" className="hover:text-emerald-600 transition-colors">Support</Link></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-sm font-bold text-neutral-400">© 2026 ErgoShield. All rights reserved.</p>
            <div className="flex gap-8 text-neutral-400">
              <span className="text-xs font-black uppercase tracking-widest hover:text-emerald-600 cursor-pointer transition-colors">Twitter</span>
              <span className="text-xs font-black uppercase tracking-widest hover:text-emerald-600 cursor-pointer transition-colors">LinkedIn</span>
              <span className="text-xs font-black uppercase tracking-widest hover:text-emerald-600 cursor-pointer transition-colors">Instagram</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
