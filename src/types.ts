export type UserRole = 'worker' | 'admin';
export type DeliveryCategory = 'food' | 'ecommerce' | 'quick_commerce';
export type CoveredEvent = 
  | 'rains_floods_cyclones' 
  | 'wars' 
  | 'pandemic' 
  | 'strikes' 
  | 'lockdown' 
  | 'aqi' 
  | 'refuge_migration' 
  | 'global_recession' 
  | 'extreme_temperature' 
  | 'curfews_transport_bans';

export interface PolicyTemplate {
  id?: string;
  name: string;
  coverageType: string;
  coveredEvents: CoveredEvent[];
  eventPayouts?: Record<string, number>; // Mapping of event to payout amount
  coverageLimit: number;
  basePremium: number;
  durationDays: number;
  riskCategory: 'low' | 'medium' | 'high';
  description: string;
  termsAndConditions: string[];
  verificationRules: string[];
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  category?: DeliveryCategory;
  subCategory?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  age?: number;
  riskScore?: number;
  weeklyPremium?: number;
  onboarded?: boolean;
  location?: string;
  photoURL?: string;
  createdAt: string;
}

export interface InsurancePolicy {
  id?: string;
  userId: string;
  customerName?: string;
  templateId?: string;
  status: 'active' | 'expired' | 'cancelled' | 'inactive';
  startDate: string;
  endDate: string;
  premiumAmount: number;
  coverageAmount: number;
  termsAndConditions: string[];
  verificationRules: string[];
  paymentStatus: 'paid' | 'pending';
  policyName: string;
  coveredEvents: CoveredEvent[];
  hourlyIncome?: number;
  coveragePercentage?: number;
  renewalReminderSent?: boolean;
}

export interface PremiumPayment {
  id?: string;
  policyId: string;
  userId: string;
  weekNumber: number;
  amount: number;
  status: 'paid' | 'pending';
  dueDate: string;
  paidAt?: string;
}

export interface RiskFactor {
  id?: string;
  type: CoveredEvent;
  value: string | number;
  threshold: string | number;
  isTriggered: boolean;
  timestamp: string;
  source: 'weather_api' | 'aqi_api' | 'gov_alerts';
}

export interface Claim {
  id?: string;
  userId: string;
  policyId: string;
  triggerEvent: string;
  amount: number;
  status: 'pending_auto' | 'needs_manual_review' | 'approved' | 'rejected' | 'processed' | 'appealed';
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  fraudCheckStatus: 'pass' | 'flag' | 'pending';
  eligibilityStatus: 'pass' | 'fail' | 'pending';
  incomeLossVerified: boolean;
  zone: string;
  calamityType: 'flood' | 'cyclone' | 'earthquake' | 'heatwave' | 'landslide';
  daysLost: number;
  dailyWage: number;
  appealReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  refundedAt?: string;
  refundTransactionId?: string;
}

export interface DisruptionEvent {
  id?: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  timestamp: string;
  affectedCount: number;
  status: 'active' | 'resolved';
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  isRisk: boolean;
  riskReason?: string;
  lastUpdated: string;
  aqi?: number;
}
