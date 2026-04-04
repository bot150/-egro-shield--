import React, { useState, useMemo } from 'react';
import { Claim } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  MoreHorizontal,
  ChevronRight,
  ArrowUpDown,
  Check,
  X,
  AlertTriangle,
  Clock,
  IndianRupee,
  BarChart3,
  ClipboardCheck,
  Zap,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useClaims } from '../ClaimsContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const Admin: React.FC = () => {
  const { claims, triggerDisruption } = useClaims();
  const [activeTab, setActiveTab] = useState<'analytics' | 'claims'>('analytics');

  const pendingCount = claims.filter(c => c.status === 'needs_manual_review').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Admin Control Center</h2>
          <p className="text-neutral-500 font-medium">Manage claims, monitor risks, and trigger simulations.</p>
        </div>

        <div className="flex bg-neutral-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'analytics' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
              activeTab === 'claims' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Claims Management
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' ? (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <BarChart3 size={28} />
                </div>
                <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Total Payouts</p>
                <p className="text-3xl font-black text-neutral-900 mt-1 tracking-tight">₹{claims.filter(c => c.status === 'processed' || c.status === 'approved').reduce((acc, c) => acc + c.amount, 0).toLocaleString()}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <ClipboardCheck size={28} />
                </div>
                <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Claims Processed</p>
                <p className="text-3xl font-black text-neutral-900 mt-1 tracking-tight">{claims.filter(c => c.status === 'processed' || c.status === 'approved').length}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <AlertCircle size={28} />
                </div>
                <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Pending Review</p>
                <p className="text-3xl font-black text-neutral-900 mt-1 tracking-tight">{pendingCount}</p>
              </div>
            </div>

            <div className="bg-neutral-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl border border-neutral-800">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Zap size={32} />
                </div>
                <div>
                  <h4 className="font-black text-xl tracking-tight">Simulation Controls</h4>
                  <p className="text-sm text-neutral-400 font-medium">Trigger a mock calamity event to test automated STP logic and manual review flows.</p>
                </div>
              </div>
              <button 
                onClick={triggerDisruption}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all flex items-center gap-3"
              >
                <Zap size={20} />
                Trigger Disruption
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="claims"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ClaimsManagement />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClaimsManagement: React.FC = () => {
  const { claims } = useClaims();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [calamityFilter, setCalamityFilter] = useState('All Calamities');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high'>('newest');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [fraudModalClaim, setFraudModalClaim] = useState<Claim | null>(null);
  const [appealModalClaim, setAppealModalClaim] = useState<Claim | null>(null);

  const filteredClaims = useMemo(() => {
    return claims
      .filter(c => {
        const matchesSearch = (c.id?.toLowerCase().includes(search.toLowerCase()) || c.userId.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
        const matchesCalamity = calamityFilter === 'All Calamities' || c.calamityType === calamityFilter;
        const matchesZone = zoneFilter === 'All Zones' || c.zone === zoneFilter;
        return matchesSearch && matchesStatus && matchesCalamity && matchesZone;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        if (sortBy === 'amount_high') return b.amount - a.amount;
        return 0;
      });
  }, [claims, search, statusFilter, calamityFilter, zoneFilter, sortBy]);

  const handleUpdateStatus = async (claimId: string, newStatus: 'approved' | 'rejected' | 'processed') => {
    try {
      await updateDoc(doc(db, 'claims', claimId), {
        status: newStatus,
        reviewedBy: 'admin_manual',
        reviewedAt: new Date().toISOString()
      });
      toast.success(`Claim ${claimId} marked as ${newStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `claims/${claimId}`);
    }
  };

  const handleBulkAction = async (newStatus: 'approved' | 'rejected') => {
    const toUpdate = selectedClaims.filter(id => {
      const claim = claims.find(c => c.id === id);
      return claim?.status === 'needs_manual_review' || claim?.status === 'appealed';
    });

    for (const id of toUpdate) {
      await handleUpdateStatus(id, newStatus);
    }
    
    setSelectedClaims([]);
  };

  const exportCSV = () => {
    const headers = ['Claim ID', 'Worker ID', 'Zone', 'Calamity', 'Date', 'Amount', 'Status', 'Eligibility', 'Fraud', 'Income Verified'];
    const rows = filteredClaims.map(c => [
      c.id,
      c.userId,
      c.zone,
      c.calamityType,
      new Date(c.timestamp).toLocaleDateString(),
      c.amount,
      c.status,
      c.eligibilityStatus,
      c.fraudCheckStatus,
      c.incomeLossVerified ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `claims_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_auto: 'bg-blue-100 text-blue-700',
      needs_manual_review: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      processed: 'bg-teal-100 text-teal-700',
      appealed: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-neutral-100 text-neutral-600'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getCheckIndicator = (status: 'pass' | 'fail' | 'flag' | 'pending' | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'bg-emerald-500' : 'bg-amber-500';
    }
    if (status === 'pass') return 'bg-emerald-500';
    if (status === 'fail' || status === 'flag') return 'bg-red-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-neutral-900 tracking-tight">Claims Management</h3>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs font-black uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-[32px] border border-neutral-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search Claim ID or Worker ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option>All Statuses</option>
            <option value="pending_auto">Pending Auto</option>
            <option value="needs_manual_review">Needs Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
            <option value="appealed">Appealed</option>
          </select>
          <select 
            value={calamityFilter}
            onChange={(e) => setCalamityFilter(e.target.value)}
            className="bg-neutral-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option>All Calamities</option>
            <option value="flood">Flood</option>
            <option value="cyclone">Cyclone</option>
            <option value="heatwave">Heatwave</option>
            <option value="landslide">Landslide</option>
          </select>
          <select 
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-neutral-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option>All Zones</option>
            <option value="Vijayawada">Vijayawada</option>
            <option value="Guntur">Guntur</option>
            <option value="Amaravati">Amaravati</option>
            <option value="Krishna dist">Krishna dist</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_high">Amount: High to Low</option>
          </select>
        </div>
      </div>

      {selectedClaims.length > 0 && (
        <div className="bg-neutral-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-6">
            <span className="text-sm font-black uppercase tracking-widest">{selectedClaims.length} claims selected</span>
            <div className="h-6 w-px bg-white/10" />
            <button 
              onClick={() => handleBulkAction('approved')}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
            >
              Approve All
            </button>
            <button 
              onClick={() => handleBulkAction('rejected')}
              className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
            >
              Reject All
            </button>
          </div>
          <button onClick={() => setSelectedClaims([])} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 text-neutral-400 text-[10px] font-black uppercase tracking-widest border-b border-neutral-100">
                <th className="px-8 py-5">
                  <input 
                    type="checkbox" 
                    checked={selectedClaims.length === filteredClaims.length && filteredClaims.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedClaims(filteredClaims.map(c => c.id!));
                      else setSelectedClaims([]);
                    }}
                    className="rounded-md border-neutral-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                  />
                </th>
                <th className="px-6 py-5">Claim ID</th>
                <th className="px-6 py-5">Worker ID</th>
                <th className="px-6 py-5">Zone</th>
                <th className="px-6 py-5">Calamity</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Checks</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <input 
                      type="checkbox" 
                      checked={selectedClaims.includes(claim.id!)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedClaims(prev => [...prev, claim.id!]);
                        else setSelectedClaims(prev => prev.filter(id => id !== claim.id));
                      }}
                      className="rounded-md border-neutral-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                  </td>
                  <td className="px-6 py-5 font-black text-neutral-900 text-sm tracking-tight">{claim.id?.slice(-8).toUpperCase()}</td>
                  <td className="px-6 py-5 text-neutral-500 text-xs font-bold">{claim.userId}</td>
                  <td className="px-6 py-5 text-neutral-700 text-xs font-bold">{claim.zone}</td>
                  <td className="px-6 py-5 text-neutral-700 text-xs font-black uppercase tracking-widest">{claim.calamityType}</td>
                  <td className="px-6 py-5 text-neutral-500 text-xs font-medium">{new Date(claim.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-5 font-black text-neutral-900 text-sm tracking-tight">₹{claim.amount.toLocaleString()}</td>
                  <td className="px-6 py-5">{getStatusBadge(claim.status)}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getCheckIndicator(claim.eligibilityStatus)} shadow-sm`} title={`Eligibility: ${claim.eligibilityStatus}`} />
                      <div className={`w-2.5 h-2.5 rounded-full ${getCheckIndicator(claim.fraudCheckStatus)} shadow-sm`} title={`Fraud: ${claim.fraudCheckStatus}`} />
                      <div className={`w-2.5 h-2.5 rounded-full ${getCheckIndicator(claim.incomeLossVerified)} shadow-sm`} title={`Income: ${claim.incomeLossVerified ? 'Verified' : 'Unverified'}`} />
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {claim.status === 'needs_manual_review' ? (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(claim.id!, 'approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(claim.id!, 'rejected')}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : claim.status === 'appealed' ? (
                        <button 
                          onClick={() => setAppealModalClaim(claim)}
                          className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all shadow-sm flex items-center gap-2"
                        >
                          <MessageSquare size={14} />
                          Review Appeal
                        </button>
                      ) : (
                        <button 
                          onClick={() => claim.fraudCheckStatus === 'flag' ? setFraudModalClaim(claim) : null}
                          className="p-2 bg-neutral-50 text-neutral-400 rounded-xl hover:bg-neutral-100 hover:text-neutral-900 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fraud Modal */}
      {fraudModalClaim && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Fraud Flag Detected</h3>
            <p className="text-neutral-500 font-medium mb-8 leading-relaxed">
              This claim has been flagged by our automated system for manual verification.
            </p>
            
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl mb-10">
              <p className="text-red-900 font-black text-[10px] uppercase tracking-widest mb-2">Flag Reason:</p>
              <p className="text-red-700 text-sm font-medium italic">
                {[
                  "Duplicate GPS location detected",
                  "Claim filed outside calamity zone radius",
                  "Income history mismatch with platform data"
                ][Math.floor(Math.random() * 3)]}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => {
                  handleUpdateStatus(fraudModalClaim.id!, 'approved');
                  setFraudModalClaim(null);
                }}
                className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Override & Approve
              </button>
              <button 
                onClick={() => {
                  handleUpdateStatus(fraudModalClaim.id!, 'rejected');
                  setFraudModalClaim(null);
                }}
                className="py-4 bg-white border-2 border-neutral-100 text-neutral-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Confirm Reject
              </button>
            </div>
            <button 
              onClick={() => setFraudModalClaim(null)}
              className="w-full mt-6 text-neutral-400 text-[10px] font-black uppercase tracking-widest hover:text-neutral-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Appeal Review Modal */}
      {appealModalClaim && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Review Appeal</h3>
            <p className="text-neutral-500 font-medium mb-8 leading-relaxed">
              Worker has appealed the rejection of claim <span className="font-black text-neutral-900">{appealModalClaim.id?.slice(-8).toUpperCase()}</span>.
            </p>
            
            <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl mb-10">
              <p className="text-purple-900 font-black text-[10px] uppercase tracking-widest mb-2">Worker's Reason:</p>
              <p className="text-purple-700 text-sm font-medium italic leading-relaxed">
                "{appealModalClaim.appealReason}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => {
                  handleUpdateStatus(appealModalClaim.id!, 'approved');
                  setAppealModalClaim(null);
                }}
                className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Accept Appeal & Approve
              </button>
              <button 
                onClick={() => {
                  handleUpdateStatus(appealModalClaim.id!, 'rejected');
                  setAppealModalClaim(null);
                }}
                className="py-4 bg-white border-2 border-neutral-100 text-neutral-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Maintain Rejection
              </button>
            </div>
            <button 
              onClick={() => setAppealModalClaim(null)}
              className="w-full mt-6 text-neutral-400 text-[10px] font-black uppercase tracking-widest hover:text-neutral-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
