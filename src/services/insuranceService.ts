import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { WeatherData, UserProfile, Claim, DisruptionEvent, InsurancePolicy } from "../types";
import { calculateDynamicPremium } from "./riskService";

/**
 * Automated Trigger Service (Zero-Touch Claims)
 * 
 * This service identifies disruptions and automatically files claims for affected users.
 */
export const checkAutomatedTriggers = async (
  userId: string,
  location: string,
  weather: WeatherData,
  policy: InsurancePolicy | null
): Promise<Claim | null> => {
  // CRITICAL: Only process claims for users with an active policy
  if (!policy || policy.status !== 'active') {
    console.log("No active policy found for user, skipping automated triggers.");
    return null;
  }

  // Base payout calculation helper
  const hourlyIncome = policy.hourlyIncome || 90;
  const calculatePayout = (hours: number, coverageFactor: number) => Math.round(hourlyIncome * hours * coverageFactor);

  // Trigger 1: Severe Weather (Rain/Thunderstorm/Extreme Wind)
  if (weather.isRisk && (weather.condition === "Rain" || weather.condition === "Thunderstorm" || weather.windSpeed > 15)) {
    const reason = weather.windSpeed > 15 ? "High Wind Warning" : "Severe Weather Disruption";
    const payout = calculatePayout(3, 0.7); // 3 hours loss, 70% coverage
    return await createAutomatedClaim(userId, policy.id || "AUTO", reason, payout);
  }

  // Trigger 2: Extreme Temperature (Heatwave or Coldwave)
  if (weather.temp > 42 || weather.temp < 5) {
    const reason = weather.temp > 42 ? "Extreme Heatwave Alert" : "Extreme Coldwave Alert";
    const payout = calculatePayout(2, 0.6); // 2 hours loss, 60% coverage
    return await createAutomatedClaim(userId, policy.id || "AUTO", reason, payout);
  }

  // Trigger 3: Severe Humidity/Heat Index (Work Stop Risk)
  if (weather.humidity > 85 && weather.temp > 35) {
    const payout = calculatePayout(2.5, 0.6); // 2.5 hours loss, 60% coverage
    return await createAutomatedClaim(userId, policy.id || "AUTO", "High Heat Index Disruption", payout);
  }

  // Trigger 4: Social Disruptions (Strikes, Lockdowns, Curfews)
  // We simulate a check for active disruptions in the user's location
  const activeDisruptions = await getActiveDisruptions(location);
  if (activeDisruptions.length > 0) {
    const disruption = activeDisruptions[0];
    // Strict location check: ensure the disruption is actually in the user's current city
    if (location.toLowerCase().includes(disruption.location.toLowerCase()) || 
        disruption.location.toLowerCase().includes(location.toLowerCase())) {
      const payout = calculatePayout(4, 0.6); // 4 hours loss, 60% coverage for strikes
      return await createAutomatedClaim(userId, policy.id || "AUTO", `${disruption.type}: ${disruption.location}`, payout);
    }
  }

  // Trigger 5: Mock Platform Disruption (e.g., App Outage in Area)
  const isPlatformDown = Math.random() > 0.998; // Very rare
  if (isPlatformDown) {
    const payout = calculatePayout(4, 1.0); // 4 hours loss, 100% coverage for platform failure
    return await createAutomatedClaim(userId, policy.id || "AUTO", "Platform Service Outage", payout);
  }

  return null;
};

/**
 * Simulates fetching active disruptions from a News/Alert API
 */
const getActiveDisruptions = async (location: string): Promise<DisruptionEvent[]> => {
  // Mock data: In a real app, this would be a fetch() to a backend or news aggregator
  const mockDisruptions: DisruptionEvent[] = [
    {
      id: 'd1',
      type: 'Transport Strike',
      severity: 'high',
      location: 'Mumbai',
      timestamp: new Date().toISOString(),
      affectedCount: 50000,
      status: 'active'
    },
    {
      id: 'd2',
      type: 'Public Protest',
      severity: 'medium',
      location: 'New Delhi',
      timestamp: new Date().toISOString(),
      affectedCount: 12000,
      status: 'active'
    },
    {
      id: 'd3',
      type: 'Local Bandh',
      severity: 'high',
      location: 'Bangalore',
      timestamp: new Date().toISOString(),
      affectedCount: 35000,
      status: 'active'
    }
  ];

  // Filter for disruptions in the user's location
  return mockDisruptions.filter(d => 
    d.status === 'active' && 
    location.toLowerCase().includes(d.location.toLowerCase())
  );
};

const createAutomatedClaim = async (
  userId: string,
  policyId: string,
  reason: string,
  amount: number
): Promise<Claim> => {
  // Check if a similar claim was already filed today to avoid duplicates
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, "claims"),
    where("userId", "==", userId),
    where("triggerEvent", "==", reason),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  try {
    const snap = await getDocs(q);
    if (!snap.empty) {
      const lastClaim = snap.docs[0].data() as Claim;
      if (lastClaim.timestamp.startsWith(today)) {
        console.log("Claim already filed for today:", reason);
        return lastClaim;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'claims');
  }

  const newClaim: Claim = {
    userId,
    policyId,
    triggerEvent: reason,
    amount,
    status: "processed", // Zero-touch: automatically processed
    timestamp: new Date().toISOString(),
    fraudCheckStatus: 'pass',
    eligibilityStatus: 'pass',
    incomeLossVerified: true,
    zone: "Automated System",
    calamityType: 'flood', // Default for automated
    daysLost: 1,
    dailyWage: amount,
    reviewedBy: 'system_auto',
    reviewedAt: new Date().toISOString(),
    refundedAt: new Date().toISOString(),
    refundTransactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };

  try {
    const docRef = await addDoc(collection(db, "claims"), newClaim);
    return { ...newClaim, id: docRef.id };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'claims');
    return newClaim; // Fallback
  }
};
