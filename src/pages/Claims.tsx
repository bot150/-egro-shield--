import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useClaims } from '../ClaimsContext';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  IndianRupee, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  ShieldAlert, 
  Zap,
  MessageSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Claim } from '../types';

const STATUS_CONFIG = {
  pending_auto: { label: 'Pending Auto', color: 'bg-blue-100 text-blue-700', icon: Zap },
  needs_manual_review: { label: 'Manual Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  processed: { label: 'Processed', color: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck },
  refunded: { label: 'Refunded', color: 'bg-emerald-600 text-white', icon: IndianRupee },
  appealed: { label: 'Appealed', color: 'bg-purple-100 text-purple-700', icon: MessageSquare },
};

export const Claims: React.FC = () => {
  const { profile } = useAuth();
  const { claims, submitAppeal } = useClaims();
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [appealModal, setAppealModal] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');

  const userClaims = claims.filter(c => c.userId === profile?.uid);

  const handleAppeal = async () => {
    if (!appealModal || !appealReason.trim()) return;
    await submitAppeal(appealModal, appealReason);
    setAppealModal(null);
    setAppealReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Your Claims</h2>
          <p className="text-neutral-500 font-medium">Track your income protection payouts and status.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-black text-lg border border-emerald-100 shadow-sm">
          Total Paid: ₹{userClaims.filter(c => c.status === 'processed' || c.status === 'approved').reduce((acc, c) => acc + c.amount, 0)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {userClaims.length === 0 ? (
          <div className="bg-white p-16 rounded-[40px] border border-neutral-100 text-center shadow-sm">
            <div className="w-20 h-20 bg-neutral-50 text-neutral-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-neutral-900 mb-2">No claims recorded yet</h3>
            <p className="text-neutral-500 font-medium max-w-xs mx-auto">Claims are automatically triggered during disruptions in your covered zone.</p>
          </div>
        ) : (
          userClaims.map((claim) => {
            const config = STATUS_CONFIG[claim.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending_auto;
            const isExpanded = expandedClaim === claim.id;

            return (
              <div key={claim.id} className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                  onClick={() => setExpandedClaim(isExpanded ? null : claim.id!)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.color}`}>
                      <config.icon size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-neutral-900 text-lg tracking-tight">{claim.triggerEvent}</h3>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2 py-0.5 bg-neutral-50 rounded-md">
                          ID: {claim.id?.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-neutral-500 font-bold flex items-center gap-1">
                          <Clock size={14} /> {new Date(claim.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-neutral-500 font-bold flex items-center gap-1">
                          <MapPin size={14} /> {claim.zone || 'Mumbai'}
                        </span>
                        <span className="text-xs text-neutral-500 font-bold flex items-center gap-1">
                          <Zap size={14} /> {claim.calamityType || 'Weather'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-1">Payout Amount</p>
                      <p className="text-2xl font-black text-neutral-900 tracking-tight">₹{claim.amount}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mb-1">Status</p>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-neutral-400" /> : <ChevronDown size={20} className="text-neutral-400" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-neutral-50 bg-neutral-50/50 p-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Verification Breakdown */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Verification Checks</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-100">
                              <span className="text-xs font-bold text-neutral-600">Eligibility</span>
                              {claim.eligibilityStatus === 'pass' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-amber-500" />}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-100">
                              <span className="text-xs font-bold text-neutral-600">Fraud Check</span>
                              {claim.fraudCheckStatus === 'pass' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-amber-500" />}
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-neutral-100">
                              <span className="text-xs font-bold text-neutral-600">Income Loss</span>
                              {claim.incomeLossVerified ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-amber-500" />}
                            </div>
                          </div>
                        </div>

                        {/* Payout Calculation */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Payout Details</h4>
                          <div className="bg-white p-4 rounded-2xl border border-neutral-100 space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-neutral-500 font-medium">Days Lost</span>
                              <span className="font-black text-neutral-900">{claim.daysLost || 0} Days</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-neutral-500 font-medium">Daily Wage</span>
                              <span className="font-black text-neutral-900">₹{claim.dailyWage || 0}</span>
                            </div>
                            <div className="pt-2 border-t border-neutral-50 flex justify-between text-sm">
                              <span className="text-neutral-900 font-black">Total Payout</span>
                              <span className="font-black text-emerald-600">₹{claim.amount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timeline & Actions */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Timeline</h4>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                              <div>
                                <p className="text-xs font-black text-neutral-900">Claim Triggered</p>
                                <p className="text-[10px] text-neutral-400 font-medium">{new Date(claim.timestamp).toLocaleString()}</p>
                              </div>
                            </div>
                            {claim.reviewedAt && (
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                <div>
                                  <p className="text-xs font-black text-neutral-900">Review Completed</p>
                                  <p className="text-[10px] text-neutral-400 font-medium">By {claim.reviewedBy || 'System'} at {new Date(claim.reviewedAt).toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                            {claim.refundedAt && (
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                                <div>
                                  <p className="text-xs font-black text-emerald-600">Refund Processed</p>
                                  <p className="text-[10px] text-neutral-400 font-medium">Transaction: {claim.refundTransactionId}</p>
                                  <p className="text-[10px] text-neutral-400 font-medium">{new Date(claim.refundedAt).toLocaleString()}</p>
                                </div>
                              </div>
                            )}
                            {claim.status === 'rejected' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAppealModal(claim.id!);
                                }}
                                className="w-full mt-4 bg-neutral-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                              >
                                <MessageSquare size={14} />
                                Appeal Rejection
                              </button>
                            )}
                            {claim.status === 'appealed' && (
                              <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">Appeal Reason</p>
                                <p className="text-xs text-purple-600 font-medium italic">"{claim.appealReason}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Appeal Modal */}
      <AnimatePresence>
        {appealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Appeal Rejection</h3>
                <button onClick={() => setAppealModal(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-neutral-500 font-medium mb-6">Please provide a reason for your appeal. Our team will review it manually.</p>
              <textarea 
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why you believe this claim should be approved..."
                className="w-full h-32 p-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm font-medium resize-none mb-6"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setAppealModal(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAppeal}
                  disabled={!appealReason.trim()}
                  className="flex-1 py-3 rounded-2xl text-sm font-black uppercase tracking-widest bg-neutral-900 text-white hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  Submit Appeal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-neutral-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl border border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={28} />
          </div>
          <div>
            <h4 className="font-black text-xl tracking-tight">Standard Policy Exclusions</h4>
            <p className="text-sm text-neutral-400 font-medium">Certain events are not covered under standard policy terms.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
          {['War', 'Pandemics', 'Terrorism', 'Illegal Acts'].map((item, i) => (
            <span key={i} className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 flex items-start gap-6 shadow-sm">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h4 className="font-black text-lg text-blue-900 tracking-tight">How payouts work?</h4>
          <p className="text-sm text-blue-700 mt-2 font-medium leading-relaxed">
            GigShield uses parametric triggers. When weather or platform data confirms a disruption in your area, 
            we automatically process your claim. No manual filing required! Payouts are sent directly to your linked bank account within 24 hours of approval.
          </p>
        </div>
      </div>
    </div>
  );
};
