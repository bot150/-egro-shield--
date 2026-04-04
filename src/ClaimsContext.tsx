import React, { createContext, useContext, useState, useEffect } from 'react';
import { Claim } from './types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, onSnapshot, orderBy, addDoc, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ClaimsContextType {
  claims: Claim[];
  setClaims: React.Dispatch<React.SetStateAction<Claim[]>>;
  triggerDisruption: () => void;
  submitAppeal: (claimId: string, reason: string) => Promise<void>;
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export const ClaimsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      setClaims([]);
      return;
    }

    let q;
    if (profile?.role === 'admin') {
      q = query(collection(db, 'claims'), orderBy('timestamp', 'desc'));
    } else {
      q = query(
        collection(db, 'claims'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setClaims(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Claim)));
    }, (error) => {
      // Only log if it's not a permission error during initial load or if user is actually logged in
      if (user) {
        handleFirestoreError(error, OperationType.GET, 'claims');
      }
    });
    return () => unsub();
  }, [user, profile]);

  const triggerDisruption = async () => {
    const zones = ['Vijayawada', 'Guntur', 'Amaravati', 'Krishna dist'];
    const calamities: ('flood' | 'cyclone' | 'earthquake' | 'heatwave' | 'landslide')[] = ['flood', 'cyclone', 'earthquake', 'heatwave', 'landslide'];
    const workerIds = [user?.uid || 'WRK-001', 'WRK-002', 'WRK-003', 'WRK-004', 'WRK-005'];

    toast.info('Simulating calamity event...');

    for (let i = 0; i < 5; i++) {
      const daysLost = Math.floor(Math.random() * 4) + 1;
      const dailyWage = Math.floor(Math.random() * 501) + 400;
      const eligibilityStatus = Math.random() > 0.3 ? 'pass' : 'fail';
      const fraudCheckStatus = Math.random() > 0.3 ? 'pass' : 'flag';
      const incomeLossVerified = Math.random() > 0.2;
      
      const claim: Omit<Claim, 'id'> = {
        userId: workerIds[Math.floor(Math.random() * workerIds.length)],
        policyId: 'POL-' + Math.floor(Math.random() * 9000 + 1000),
        triggerEvent: 'Calamity Alert',
        amount: daysLost * dailyWage,
        status: 'pending_auto',
        timestamp: new Date().toISOString(),
        zone: zones[Math.floor(Math.random() * zones.length)],
        calamityType: calamities[Math.floor(Math.random() * calamities.length)],
        daysLost,
        dailyWage,
        eligibilityStatus,
        fraudCheckStatus,
        incomeLossVerified,
      };

      try {
        const docRef = await addDoc(collection(db, 'claims'), claim);
        const claimId = docRef.id;

        // Simulate STP (Straight-Through Processing) logic after a short delay
        setTimeout(async () => {
          const isSTP = fraudCheckStatus === 'pass' && eligibilityStatus === 'pass' && incomeLossVerified === true;
          const finalStatus = isSTP ? 'approved' : 'needs_manual_review';
          
          const { doc, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'claims', claimId), { 
            status: finalStatus,
            reviewedBy: isSTP ? 'system_stp' : undefined,
            reviewedAt: isSTP ? new Date().toISOString() : undefined
          });

          if (isSTP) {
            toast.success(`CLM-${claimId.slice(-4).toUpperCase()} auto-approved via STP`, { duration: 3000 });
          } else {
            toast.warning(`CLM-${claimId.slice(-4).toUpperCase()} flagged for manual review`, { duration: 3000 });
          }
        }, 2000 + (i * 500)); // 2s delay as requested, staggered

      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'claims');
      }
    }
  };

  const submitAppeal = async (claimId: string, reason: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'claims', claimId), {
        status: 'appealed',
        appealReason: reason
      });
      toast.success('Appeal submitted successfully');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `claims/${claimId}`);
    }
  };

  return (
    <ClaimsContext.Provider value={{ claims, setClaims, triggerDisruption, submitAppeal }}>
      {children}
    </ClaimsContext.Provider>
  );
};

export const useClaims = () => {
  const context = useContext(ClaimsContext);
  if (context === undefined) {
    throw new Error('useClaims must be used within a ClaimsProvider');
  }
  return context;
};
